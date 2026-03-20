/**
 * Pure guards shared by create-booking-from-accepted-offer across apps.
 */

import { QuoteRequestStatus } from './canonical-enums';

/**
 * Quote must be `responded` before booking-from-payment (conversation-first: accepted offer lives in
 * `accepted_offer` JSON; DB enum is `responded`, not legacy `offer_accepted`).
 */
export function assertQuoteStatusAllowsBookingFromPayment(quoteStatus: string): void {
  if (quoteStatus !== QuoteRequestStatus.responded) {
    throw new BookingPrecheckError(
      `Quote request must be status "${QuoteRequestStatus.responded}" to create booking from payment (current: ${quoteStatus}).`
    );
  }
}

export class BookingPrecheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingPrecheckError';
  }
}

export interface AcceptedOfferShape {
  total_amount: number;
  security_deposit?: number;
  start_date: string | Date;
  end_date: string | Date;
}

/** Validates minimal accepted_offer snapshot shape before DB work. */
export function parseAcceptedOfferCore(snapshot: unknown): AcceptedOfferShape {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new BookingPrecheckError('Quote request has no valid accepted_offer snapshot. Cannot create booking.');
  }
  const s = snapshot as Record<string, unknown>;
  const total = s.total_amount;
  if (typeof total !== 'number' || !Number.isFinite(total) || total < 0) {
    throw new BookingPrecheckError('Accepted offer has invalid total amount. Cannot create booking.');
  }
  if (typeof s.start_date === 'undefined' || typeof s.end_date === 'undefined') {
    throw new BookingPrecheckError('Invalid dates in accepted_offer.');
  }
  return {
    total_amount: total,
    ...(typeof s.security_deposit === 'number' && Number.isFinite(s.security_deposit)
      ? { security_deposit: s.security_deposit }
      : {}),
    start_date: s.start_date as string | Date,
    end_date: s.end_date as string | Date,
  };
}

export function validateAcceptedOfferDateRange(start: Date, end: Date): void {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new BookingPrecheckError('Invalid dates in accepted_offer.');
  }
}
