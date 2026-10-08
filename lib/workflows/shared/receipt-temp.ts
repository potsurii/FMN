"use server";

import {
  cleanupExpiredTempReceipts,
  createSignedReceiptUrl,
  deleteTempReceiptObject,
  uploadTempReceiptImage,
} from "@/lib/storage/receipt-lifecycle";
import { createClient } from "@/lib/supabase/server";

export type UploadTempReceiptResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

export type DeleteTempReceiptResult =
  | { ok: true }
  | { ok: false; error: string };

export type SignedTempReceiptResult =
  | { ok: true; url: string | null }
  | { ok: false; error: string };

export type CleanupExpiredTempReceiptsActionResult =
  | { ok: true; scanned: number; deleted: number }
  | { ok: false; error: string };

/**
 * I-02: upload temporary receipt image (no formal receipts row).
 */
export async function uploadTempReceipt(
  formData: FormData,
): Promise<UploadTempReceiptResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "请先登录后再上传小票" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "请选择小票图片" };
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (file.type && !allowed.includes(file.type)) {
    return { ok: false, error: "仅支持 JPEG / PNG / WebP 小票图片" };
  }

  try {
    const path = await uploadTempReceiptImage({
      supabase,
      userId: user.id,
      file,
    });
    return { ok: true, path };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "小票上传失败",
    };
  }
}

/**
 * I-02: read temp object via signed URL.
 */
export async function getTempReceiptSignedUrl(
  path: string,
): Promise<SignedTempReceiptResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "请先登录" };
  }

  const trimmed = typeof path === "string" ? path.trim() : "";
  if (!trimmed.startsWith(`${user.id}/`)) {
    return { ok: false, error: "无权访问该小票" };
  }

  try {
    const url = await createSignedReceiptUrl({
      supabase,
      kind: "temporary",
      path: trimmed,
    });
    return { ok: true, url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "无法读取小票",
    };
  }
}

/**
 * I-02: delete a specific temp object (Draft Cancel / replace).
 */
export async function cleanupTempReceipt(
  path: string,
): Promise<DeleteTempReceiptResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "请先登录" };
  }

  const trimmed = typeof path === "string" ? path.trim() : "";
  if (!trimmed) {
    return { ok: true };
  }
  if (!trimmed.startsWith(`${user.id}/`)) {
    return { ok: false, error: "无权删除该小票" };
  }

  try {
    await deleteTempReceiptObject({
      supabase,
      userId: user.id,
      path: trimmed,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "小票清理失败",
    };
  }
}

/**
 * I-02: async sweep of caller's temp objects older than 7 days.
 */
export async function sweepExpiredTempReceipts(): Promise<CleanupExpiredTempReceiptsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "请先登录" };
  }

  try {
    const result = await cleanupExpiredTempReceipts({
      supabase,
      userId: user.id,
    });
    return {
      ok: true,
      scanned: result.scanned,
      deleted: result.deleted,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "过期小票清理失败",
    };
  }
}
