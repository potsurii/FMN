import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RECEIPT_FORMAL_BUCKET,
  RECEIPT_TEMP_BUCKET,
  RECEIPT_TEMP_TTL_MS,
} from "./receipt-buckets";

const SIGNED_URL_TTL_SECONDS = 3600;

function extensionForFile(file: { name: string; type?: string }): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

/** Path must be `{userId}/...` to satisfy storage RLS folder prefix. */
export function assertOwnedReceiptPath(userId: string, objectPath: string): void {
  const trimmed = objectPath.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.startsWith("/")) {
    throw new Error("Invalid receipt object path");
  }
  if (!trimmed.startsWith(`${userId}/`)) {
    throw new Error("Receipt object path is not owned by caller");
  }
}

export function isTempReceiptExpired(
  createdAtMs: number,
  nowMs: number = Date.now(),
): boolean {
  if (!Number.isFinite(createdAtMs)) return true;
  return nowMs - createdAtMs > RECEIPT_TEMP_TTL_MS;
}

export function buildTempReceiptObjectPath(
  userId: string,
  file: { name: string; type?: string },
): string {
  const ext = extensionForFile(file);
  return `${userId}/temp/${crypto.randomUUID()}.${ext}`;
}

export function buildFormalReceiptObjectPath(
  userId: string,
  tempPath: string,
): string {
  assertOwnedReceiptPath(userId, tempPath);
  const fileName = tempPath.split("/").pop();
  if (!fileName) {
    throw new Error("Invalid temp receipt path");
  }
  return `${userId}/formal/${fileName}`;
}

/**
 * Upload a temporary receipt image. Does not create a formal receipts row.
 */
export async function uploadTempReceiptImage(options: {
  supabase: SupabaseClient;
  userId: string;
  file: File;
}): Promise<string> {
  const objectPath = buildTempReceiptObjectPath(options.userId, options.file);

  const { error } = await options.supabase.storage
    .from(RECEIPT_TEMP_BUCKET)
    .upload(objectPath, options.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: options.file.type || undefined,
    });

  if (error) {
    throw new Error(`Temp receipt upload failed: ${error.message}`);
  }

  return objectPath;
}

export async function createSignedReceiptUrl(options: {
  supabase: SupabaseClient;
  kind: "temporary" | "formal";
  path: string | null | undefined;
}): Promise<string | null> {
  if (!options.path) return null;
  const bucket =
    options.kind === "temporary" ? RECEIPT_TEMP_BUCKET : RECEIPT_FORMAL_BUCKET;

  const { data, error } = await options.supabase.storage
    .from(bucket)
    .createSignedUrl(options.path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function deleteTempReceiptObject(options: {
  supabase: SupabaseClient;
  userId: string;
  path: string;
}): Promise<void> {
  assertOwnedReceiptPath(options.userId, options.path);
  const { error } = await options.supabase.storage
    .from(RECEIPT_TEMP_BUCKET)
    .remove([options.path]);
  if (error) {
    throw new Error(`Temp receipt delete failed: ${error.message}`);
  }
}

export async function deleteFormalReceiptObject(options: {
  supabase: SupabaseClient;
  userId: string;
  path: string;
}): Promise<void> {
  assertOwnedReceiptPath(options.userId, options.path);
  const { error } = await options.supabase.storage
    .from(RECEIPT_FORMAL_BUCKET)
    .remove([options.path]);
  if (error) {
    throw new Error(`Formal receipt delete failed: ${error.message}`);
  }
}

/**
 * Copy temp object → formal bucket. Caller deletes temp after successful Confirm.
 * Does not create receipts / receipt_items rows (those belong in I-01 RPC).
 */
export async function promoteTempReceiptToFormal(options: {
  supabase: SupabaseClient;
  userId: string;
  tempPath: string;
}): Promise<string> {
  assertOwnedReceiptPath(options.userId, options.tempPath);
  const formalPath = buildFormalReceiptObjectPath(
    options.userId,
    options.tempPath,
  );

  const { data: blob, error: downloadError } = await options.supabase.storage
    .from(RECEIPT_TEMP_BUCKET)
    .download(options.tempPath);

  if (downloadError || !blob) {
    throw new Error(
      downloadError?.message ?? "Failed to download temp receipt",
    );
  }

  const { error: uploadError } = await options.supabase.storage
    .from(RECEIPT_FORMAL_BUCKET)
    .upload(formalPath, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: blob.type || undefined,
    });

  if (uploadError) {
    throw new Error(`Temp→formal promote failed: ${uploadError.message}`);
  }

  return formalPath;
}

export type CleanupExpiredTempReceiptsResult = {
  scanned: number;
  deleted: number;
  paths: string[];
};

/**
 * Async cleanup: delete caller's temp objects older than RECEIPT_TEMP_TTL_MS (≤7d).
 * Safe to invoke on Companion open / idle; does not touch formal receipts.
 */
export async function cleanupExpiredTempReceipts(options: {
  supabase: SupabaseClient;
  userId: string;
  nowMs?: number;
}): Promise<CleanupExpiredTempReceiptsResult> {
  const nowMs = options.nowMs ?? Date.now();
  const prefix = `${options.userId}/temp`;

  const { data: listed, error: listError } = await options.supabase.storage
    .from(RECEIPT_TEMP_BUCKET)
    .list(prefix, {
      limit: 100,
      sortBy: { column: "created_at", order: "asc" },
    });

  if (listError) {
    throw new Error(`Temp receipt list failed: ${listError.message}`);
  }

  const expiredPaths: string[] = [];
  for (const entry of listed ?? []) {
    if (!entry.name || entry.id === null) continue;
    const createdAtMs = entry.created_at
      ? Date.parse(entry.created_at)
      : Number.NaN;
    if (!isTempReceiptExpired(createdAtMs, nowMs)) continue;
    expiredPaths.push(`${prefix}/${entry.name}`);
  }

  if (expiredPaths.length === 0) {
    return { scanned: listed?.length ?? 0, deleted: 0, paths: [] };
  }

  const { error: removeError } = await options.supabase.storage
    .from(RECEIPT_TEMP_BUCKET)
    .remove(expiredPaths);

  if (removeError) {
    throw new Error(`Temp receipt cleanup failed: ${removeError.message}`);
  }

  return {
    scanned: listed?.length ?? 0,
    deleted: expiredPaths.length,
    paths: expiredPaths,
  };
}
