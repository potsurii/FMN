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

export type ProviderFailure = {
  ok: false;
  code: ProviderFailureCode;
  error: string;
};

export type ProviderResult<T> = { ok: true; value: T } | ProviderFailure;

export function providerFailure(
  code: ProviderFailureCode,
  error: string,
): ProviderFailure {
  return { ok: false, code, error };
}