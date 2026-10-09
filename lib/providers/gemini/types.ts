export type ProviderFailureCode =
  | "not_configured"
  | "consent_required"
  | "unauthorized"
  | "timeout"
  | "network"
  | "empty"
  | "invalid"
  | "unsupported"
  | "provider";

export type ProviderResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: ProviderFailureCode; error: string };

export function providerFailure(
  code: ProviderFailureCode,
  error: string,
): ProviderResult<never> {
  return { ok: false, code, error };
}
