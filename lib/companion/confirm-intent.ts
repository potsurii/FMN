/**
 * Explicit Confirm intent recognition (D5-04 / F3-01 §12.1).
 *
 * Only clear write-intent phrases count. Vague affirmations do NOT confirm.
 * Formal write must still go through the Confirm Action code path —
 * this helper is for optional natural-language confirmation intent only.
 */

const CONFIRM_INTENT_PATTERNS: RegExp[] = [
  /^帮我保存$/,
  /^确认写入$/,
  /^确认保存$/,
  /^保存这条$/,
  /^写入正式记录$/,
  /^confirm$/i,
  /^save\s*(it|this|now)?$/i,
];

const NON_CONFIRM_EXAMPLES = [
  "好的",
  "嗯",
  "继续",
  "看起来不错",
  "ok",
  "okay",
] as const;

export function isExplicitConfirmIntent(text: string): boolean {
  const normalized = text.trim().replace(/\s+/g, "");
  if (!normalized) return false;

  // Reject known non-confirm phrases even if they contain substrings of confirm words
  const loose = text.trim().toLowerCase();
  for (const phrase of NON_CONFIRM_EXAMPLES) {
    if (loose === phrase.toLowerCase()) return false;
  }

  return CONFIRM_INTENT_PATTERNS.some((re) => re.test(text.trim()));
}

/** Exported for tests — phrases that must never trigger formal write. */
export const NON_CONFIRM_PHRASES_FOR_TEST = NON_CONFIRM_EXAMPLES;
