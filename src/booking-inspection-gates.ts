/**
 * Pure inspection gate rules for booking lifecycle transitions (starting_point.md §6.2).
 * BookingStateService in each app delegates here and wraps errors in ValidationError.
 */

import { BookingStatus, InspectionStatus, InspectionType } from './canonical-enums';

export interface MinimalInspectionRow {
  type?: string;
  status?: string;
  customer_acknowledged_at?: Date | string | null;
}

/**
 * Throws Error with user-facing message if transition violates inspection gates.
 */
export function assertBookingInspectionGatesForTransition(
  fromState: BookingStatus,
  toState: BookingStatus,
  inspections: MinimalInspectionRow[]
): void {
  if (
    (fromState === BookingStatus.confirmed || fromState === BookingStatus.ready_for_pickup) &&
    toState === BookingStatus.active
  ) {
    const pre = inspections.find((r) => r.type === InspectionType.pre_rental);
    if (!pre || pre.status !== InspectionStatus.completed) {
      throw new Error('Cannot activate booking: pre-rental inspection must be completed.');
    }
    if (pre.customer_acknowledged_at == null) {
      throw new Error('Cannot activate booking: customer must acknowledge the pre-rental inspection.');
    }
    return;
  }

  if (fromState === BookingStatus.active && toState === BookingStatus.completed) {
    const post = inspections.find((r) => r.type === InspectionType.post_rental);
    if (!post || post.status !== InspectionStatus.completed) {
      throw new Error('Cannot complete booking: post-rental inspection must be completed.');
    }
  }
}
