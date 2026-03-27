/**
 * Single canonical workflow step graph for rental workflows across pt-admin, pt-marketplace, pt-vendor.
 * Import from @pt/rental-shared — do not duplicate unions in apps.
 */

import { BookingStatus } from './canonical-enums';

export type WorkflowStep =
  | 'compliance_check'
  | 'booking_creation'
  | 'payment_processing'
  | 'contract_generation'
  | 'risk_assessment_review'
  | 'approval_required'
  | 'pre_inspection'
  | 'equipment_release'
  | 'active_rental'
  | 'post_inspection'
  | 'final_settlement'
  | 'completed'
  | 'cancelled'
  | 'failed';

/** Every step maps to itself — use for exhaustive checks / no magic strings. */
export const WORKFLOW_STEP: Record<WorkflowStep, WorkflowStep> = {
  compliance_check: 'compliance_check',
  booking_creation: 'booking_creation',
  payment_processing: 'payment_processing',
  contract_generation: 'contract_generation',
  risk_assessment_review: 'risk_assessment_review',
  approval_required: 'approval_required',
  pre_inspection: 'pre_inspection',
  equipment_release: 'equipment_release',
  active_rental: 'active_rental',
  post_inspection: 'post_inspection',
  final_settlement: 'final_settlement',
  completed: 'completed',
  cancelled: 'cancelled',
  failed: 'failed',
};

/**
 * Expected booking.status while the workflow is logically in each step (for validation / UI).
 * Aligns with admin + marketplace; vendor previously diverged — canonical is this map.
 */
export const WORKFLOW_STEP_TO_BOOKING_STATUS: Partial<Record<WorkflowStep, BookingStatus>> = {
  compliance_check: BookingStatus.pending,
  booking_creation: BookingStatus.pending,
  payment_processing: BookingStatus.pending,
  contract_generation: BookingStatus.pending,
  pre_inspection: BookingStatus.confirmed,
  equipment_release: BookingStatus.confirmed,
  active_rental: BookingStatus.active,
  post_inspection: BookingStatus.active,
  final_settlement: BookingStatus.active,
  completed: BookingStatus.completed,
  cancelled: BookingStatus.cancelled,
  failed: BookingStatus.cancelled,
};

/**
 * Contract statuses that mean “manager approval” step is required before continuing.
 * Integrated contract creation may set `pending_signature` (admin) or `draft` (marketplace) — one rule.
 */
export function contractRequiresManagerApproval(contractStatus: string): boolean {
  return contractStatus === 'pending_signature' || contractStatus === 'draft';
}
