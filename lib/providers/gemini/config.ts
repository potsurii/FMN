/**
 * Server-only Gemini settings.
 * Read GEMINI_API_KEY only in server code. Do not prefix it for the browser.
 */

export const GEMINI_API_KEY_ENV = "GEMINI_API_KEY";
export const GEMINI_MODEL = "gemini-3.5-flash";
export const GEMINI_TIMEOUT_MS = 20_000;
export const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

export function readGeminiApiKey(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const value = env[GEMINI_API_KEY_ENV];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function geminiGenerateUrl(model: string = GEMINI_MODEL): string {
  return `${GEMINI_ENDPOINT}/models/${encodeURIComponent(model)}:generateContent`;
}
