/**
 * Pure parsing for Stripe Checkout Session correlation with quote checkout.
 * See cross_codebase_alignment / starting_point: metadata.quote_request_id is primary.
 */

export type StripeCheckoutSessionLike = {
  payment_intent?: string | { id?: string } | null;
  metadata?: Record<string, string> | null;
  amount_total?: number | null;
};

/** Resolves PaymentIntent id from Checkout Session (string or expanded object). */
export function parseCheckoutSessionPaymentIntentId(session: StripeCheckoutSessionLike): string | undefined {
  const pi = session.payment_intent;
  if (typeof pi === 'string' && pi.length > 0) return pi;
  if (pi && typeof pi === 'object' && typeof pi.id === 'string' && pi.id.length > 0) return pi.id;
  return undefined;
}

export interface ParsedQuoteCheckoutMetadata {
  quote_request_id: string;
  promo_code_id?: string;
  discount_amount?: number;
  rental_fee_cents: number;
  deposit_cents: number;
}

/** Reads quote checkout fields from session.metadata (Stripe sends string values). */
export function parseQuoteCheckoutMetadata(
  metadata: Record<string, string> | null | undefined
): Omit<ParsedQuoteCheckoutMetadata, 'quote_request_id'> & { quote_request_id?: string } {
  const meta = metadata ?? {};
  const qid = typeof meta.quote_request_id === 'string' && meta.quote_request_id.length > 0 ? meta.quote_request_id : undefined;
  let promoCodeIdRaw = meta.promo_code_id;
  let discountAmountRaw = meta.discount_amount;
  const promo_code_id =
    typeof promoCodeIdRaw === 'string' && promoCodeIdRaw.length > 0 ? promoCodeIdRaw : undefined;
  let discount_amount: number | undefined =
    typeof discountAmountRaw === 'string' && discountAmountRaw.length > 0
      ? Number(discountAmountRaw)
      : undefined;
  if (typeof discount_amount === 'number' && Number.isNaN(discount_amount)) {
    discount_amount = undefined;
  }

  const rental_fee_cents =
    typeof meta.rental_fee_cents === 'string' ? parseInt(meta.rental_fee_cents, 10) : 0;
  const deposit_cents = typeof meta.deposit_cents === 'string' ? parseInt(meta.deposit_cents, 10) : 0;

  return {
    ...(qid !== undefined && { quote_request_id: qid }),
    ...(promo_code_id !== undefined && { promo_code_id }),
    ...(discount_amount !== undefined && { discount_amount }),
    rental_fee_cents: Number.isFinite(rental_fee_cents) ? rental_fee_cents : 0,
    deposit_cents: Number.isFinite(deposit_cents) ? deposit_cents : 0,
  };
}

export interface AcceptedOfferSnapshotLike {
  total_amount?: number;
  security_deposit?: number;
}

/**
 * Rental fee dollars for booking snapshot: metadata rental_fee_cents wins when > 0; else accepted_offer.total_amount.
 */
export function computeRentalFeeDollarsFromCheckout(
  rentalFeeCentsRaw: number,
  acceptedOffer: AcceptedOfferSnapshotLike | null | undefined
): number {
  if (Number.isFinite(rentalFeeCentsRaw) && rentalFeeCentsRaw > 0) {
    return rentalFeeCentsRaw / 100;
  }
  const snap = acceptedOffer?.total_amount;
  return typeof snap === 'number' && Number.isFinite(snap) ? snap : 0;
}

/**
 * Deposit dollars: metadata deposit_cents when >= 0 and finite; else accepted_offer.security_deposit.
 */
export function computeDepositDollarsFromCheckout(
  depositCentsRaw: number,
  acceptedOffer: AcceptedOfferSnapshotLike | null | undefined
): number {
  if (Number.isFinite(depositCentsRaw) && depositCentsRaw >= 0) {
    return depositCentsRaw / 100;
  }
  const sd = acceptedOffer?.security_deposit;
  return typeof sd === 'number' && Number.isFinite(sd) ? sd : 0;
}
