/**
 * Canonical Stripe Identity gate for customer (renter) booking/payment compliance.
 * Mirrors app-local `renter-kyc-gate.ts` in pt-* apps; keep in sync when changing rules.
 */

export function isRenterIdentityVerifiedForBookingGate(
  identityVerified: boolean | null | undefined
): boolean {
  return identityVerified === true;
}
