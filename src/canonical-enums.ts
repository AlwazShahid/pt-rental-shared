/**
 * Canonical enums for rental flows. Must stay aligned with Prisma schema in each app.
 * Single source for @pt/rental-shared consumers.
 */

export const UserRole = {
  super_admin: 'super_admin',
  admin: 'admin',
  vendor: 'vendor',
  customer: 'customer',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Aligns with Prisma QuoteRequestStatus / apps `types/database`. */
export const QuoteRequestStatus = {
  new: 'new',
  responded: 'responded',
  offer_sent: 'offer_sent',
  offer_accepted: 'offer_accepted',
  closed: 'closed',
  converted_to_booking: 'converted_to_booking',
  rejected: 'rejected',
} as const;
export type QuoteRequestStatus = (typeof QuoteRequestStatus)[keyof typeof QuoteRequestStatus];

/** Must match Prisma RentalTransactionState enum. */
export const RentalTransactionState = {
  request_submitted: 'request_submitted',
  negotiation: 'negotiation',
  offer_sent: 'offer_sent',
  final_quote_sent: 'final_quote_sent',
  offer_accepted: 'offer_accepted',
  contract_generated: 'contract_generated',
  contract_signed: 'contract_signed',
  payment_required: 'payment_required',
  payment_completed: 'payment_completed',
  booking_created: 'booking_created',
  rejected: 'rejected',
  cancelled: 'cancelled',
  expired: 'expired',
} as const;
export type RentalTransactionState =
  (typeof RentalTransactionState)[keyof typeof RentalTransactionState];

/** Aligns with Prisma BookingStatus / apps `types/database`. */
export const BookingStatus = {
  pending: 'pending',
  confirmed: 'confirmed',
  active: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
  ready_for_pickup: 'ready_for_pickup',
  pending_contract: 'pending_contract',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/** Aligns with Prisma InspectionStatus. */
export const InspectionStatus = {
  pending: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;
export type InspectionStatus = (typeof InspectionStatus)[keyof typeof InspectionStatus];

/** Aligns with Prisma InspectionType. */
export const InspectionType = {
  pre_rental: 'pre_rental',
  post_rental: 'post_rental',
} as const;
export type InspectionType = (typeof InspectionType)[keyof typeof InspectionType];
