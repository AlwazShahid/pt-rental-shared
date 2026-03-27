/**
 * Canonical JSON API envelope for pt-vendor, pt-marketplace, pt-admin.
 * Server handlers must use successResponse / errorResponse (or equivalent) so bodies match this shape.
 * Clients must not parse ad-hoc top-level error strings or redirectUrl — only `error.message` and `error.details`.
 */

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
  timestamp?: Date | string;
  requestId?: string;
};

export type ApiResponseEnvelope<T = unknown> = {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
  meta?: unknown;
};

/** True when body is a failed envelope with `error.code` + `error.message` (strict). */
export function isApiErrorEnvelope(body: unknown): body is ApiResponseEnvelope & { success: false; error: ApiErrorBody } {
  if (body === null || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (b.success !== false) return false;
  const e = b.error;
  if (e === null || typeof e !== 'object') return false;
  const err = e as Record<string, unknown>;
  return typeof err.code === 'string' && typeof err.message === 'string';
}

/**
 * Onboarding 403: only `error.details.redirectUrl` (set by AppError details on the server).
 * No top-level redirectUrl, no legacy shapes.
 */
export function getOnboardingRedirectUrlFromEnvelope(
  body: unknown,
  httpStatus: number
): string | null {
  if (httpStatus !== 403 || !isApiErrorEnvelope(body)) return null;
  const msg = body.error.message;
  if (msg !== 'Onboarding required' && msg !== 'Admin onboarding required') return null;
  const det = body.error.details;
  if (det === null || typeof det !== 'object') return null;
  const url = (det as Record<string, unknown>).redirectUrl;
  return typeof url === 'string' ? url : null;
}

/**
 * Message for failed requests: only from `error.message` when `success === false`.
 */
export function getApiErrorMessageFromEnvelope(
  body: unknown,
  httpStatus: number,
  statusText: string
): string {
  if (isApiErrorEnvelope(body) && typeof body.error.message === 'string' && body.error.message.trim()) {
    return body.error.message.trim();
  }
  return `HTTP ${httpStatus}: ${statusText}`;
}
