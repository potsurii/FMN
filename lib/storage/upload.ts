import type { SupabaseClient } from "@supabase/supabase-js";

const SIGNED_URL_TTL_SECONDS = 3600;

function extensionForFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/svg+xml") return "svg";
  return "jpg";
}

export async function uploadUserImage(options: {
  supabase: SupabaseClient;
  userId: string;
  bucket: "trip-images" | "item-images";
  file: File;
}): Promise<string> {
  const ext = extensionForFile(options.file);
  const objectPath = `${options.userId}/uploads/${crypto.randomUUID()}.${ext}`;

  const { error } = await options.supabase.storage
    .from(options.bucket)
    .upload(objectPath, options.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: options.file.type || undefined,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  return objectPath;
}

export async function createSignedImageUrl(options: {
  supabase: SupabaseClient;
  bucket: "trip-images" | "item-images";
  path: string | null | undefined;
}): Promise<string | null> {
  if (!options.path) return null;

  const { data, error } = await options.supabase.storage
    .from(options.bucket)
    .createSignedUrl(options.path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
