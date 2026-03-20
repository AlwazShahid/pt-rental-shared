/**
 * Rental Transaction State Machine
 *
 * Single source of truth for the full rental lifecycle. State lives on rental_transactions.state.
 * Drives allowed_actions(state, actor) so UI and API gates derive from one place.
 */

import {
  QuoteRequestStatus,
  RentalTransactionState as State,
  UserRole,
  type RentalTransactionState,
} from './canonical-enums';

/** Actor role for transaction actions. */
export type RentalTransactionActorRole = UserRole | 'system';

export const RENTAL_TRANSACTION_ACTION = {
  accept_offer: 'accept_offer',
  send_offer: 'send_offer',
  revise_offer: 'revise_offer',
  reject_quote: 'reject_quote',
  close_quote: 'close_quote',
  request_inspection: 'request_inspection',
  accept_estimated_price: 'accept_estimated_price',
  complete_pre_quote_inspection: 'complete_pre_quote_inspection',
  send_final_offer: 'send_final_offer',
  request_revision: 'request_revision',
  sign_contract: 'sign_contract',
  submit_inspection: 'submit_inspection',
  approve_inspection: 'approve_inspection',
  acknowledge_inspection: 'acknowledge_inspection',
  checkout: 'checkout',
  view_contract: 'view_contract',
  view_inspection: 'view_inspection',
  view_booking: 'view_booking',
} as const;

export type RentalTransactionActionId =
  (typeof RENTAL_TRANSACTION_ACTION)[keyof typeof RENTAL_TRANSACTION_ACTION];

export const DEFAULT_TRANSACTION_STATE: RentalTransactionState = State.request_submitted;

export const TERMINAL_STATES: ReadonlySet<RentalTransactionState> = new Set([
  State.rejected,
  State.cancelled,
  State.expired,
  State.booking_created,
]);

type StateActionRolesMap = ReadonlyMap<
  RentalTransactionState,
  ReadonlyMap<RentalTransactionActionId, ReadonlySet<RentalTransactionActorRole>>
>;

const STATE_ACTION_ROLES: StateActionRolesMap = new Map([
  [State.request_submitted, new Map([
    [RENTAL_TRANSACTION_ACTION.send_offer, new Set<RentalTransactionActorRole>([UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.request_inspection, new Set<RentalTransactionActorRole>([UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.accept_estimated_price, new Set<RentalTransactionActorRole>([UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.reject_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
    [RENTAL_TRANSACTION_ACTION.close_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
  ])],
  [State.negotiation, new Map([
    [RENTAL_TRANSACTION_ACTION.send_offer, new Set<RentalTransactionActorRole>([UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.send_final_offer, new Set<RentalTransactionActorRole>([UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.revise_offer, new Set<RentalTransactionActorRole>([UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.reject_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
    [RENTAL_TRANSACTION_ACTION.close_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
  ])],
  [State.offer_sent, new Map([
    [RENTAL_TRANSACTION_ACTION.accept_offer, new Set<RentalTransactionActorRole>([UserRole.customer])],
    [RENTAL_TRANSACTION_ACTION.request_revision, new Set<RentalTransactionActorRole>([UserRole.customer])],
    [RENTAL_TRANSACTION_ACTION.reject_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
    [RENTAL_TRANSACTION_ACTION.close_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
    [RENTAL_TRANSACTION_ACTION.view_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_inspection, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
  ])],
  [State.final_quote_sent, new Map([
    [RENTAL_TRANSACTION_ACTION.accept_offer, new Set<RentalTransactionActorRole>([UserRole.customer])],
    [RENTAL_TRANSACTION_ACTION.reject_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
    [RENTAL_TRANSACTION_ACTION.close_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
    [RENTAL_TRANSACTION_ACTION.view_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_inspection, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
  ])],
  [State.offer_accepted, new Map([
    [RENTAL_TRANSACTION_ACTION.sign_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_inspection, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.close_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
  ])],
  [State.contract_generated, new Map([
    [RENTAL_TRANSACTION_ACTION.sign_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_inspection, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.close_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
  ])],
  [State.contract_signed, new Map([
    [RENTAL_TRANSACTION_ACTION.sign_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.checkout, new Set<RentalTransactionActorRole>([UserRole.customer])],
    [RENTAL_TRANSACTION_ACTION.view_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_inspection, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.close_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
  ])],
  [State.payment_required, new Map([
    [RENTAL_TRANSACTION_ACTION.checkout, new Set<RentalTransactionActorRole>([UserRole.customer])],
    [RENTAL_TRANSACTION_ACTION.view_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_inspection, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.close_quote, new Set<RentalTransactionActorRole>([UserRole.vendor, 'system'])],
  ])],
  [State.payment_completed, new Map([
    [RENTAL_TRANSACTION_ACTION.view_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_inspection, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
  ])],
  [State.booking_created, new Map([
    [RENTAL_TRANSACTION_ACTION.view_booking, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor, UserRole.admin])],
    [RENTAL_TRANSACTION_ACTION.view_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_inspection, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
  ])],
  [State.rejected, new Map([
    [RENTAL_TRANSACTION_ACTION.view_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_inspection, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
  ])],
  [State.cancelled, new Map([
    [RENTAL_TRANSACTION_ACTION.view_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_inspection, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
  ])],
  [State.expired, new Map([
    [RENTAL_TRANSACTION_ACTION.view_contract, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
    [RENTAL_TRANSACTION_ACTION.view_inspection, new Set<RentalTransactionActorRole>([UserRole.customer, UserRole.vendor])],
  ])],
] as [RentalTransactionState, ReadonlyMap<RentalTransactionActionId, ReadonlySet<RentalTransactionActorRole>>][]);

const TRANSITIONS: ReadonlyMap<
  RentalTransactionState,
  ReadonlyMap<RentalTransactionActionId, RentalTransactionState>
> = new Map([
  [State.request_submitted, new Map([
    [RENTAL_TRANSACTION_ACTION.send_offer, State.offer_sent],
    [RENTAL_TRANSACTION_ACTION.request_inspection, State.request_submitted],
    [RENTAL_TRANSACTION_ACTION.accept_estimated_price, State.offer_sent],
    [RENTAL_TRANSACTION_ACTION.reject_quote, State.rejected],
    [RENTAL_TRANSACTION_ACTION.close_quote, State.cancelled],
  ])],
  [State.negotiation, new Map([
    [RENTAL_TRANSACTION_ACTION.send_offer, State.offer_sent],
    [RENTAL_TRANSACTION_ACTION.send_final_offer, State.final_quote_sent],
    [RENTAL_TRANSACTION_ACTION.revise_offer, State.offer_sent],
    [RENTAL_TRANSACTION_ACTION.reject_quote, State.rejected],
    [RENTAL_TRANSACTION_ACTION.close_quote, State.cancelled],
  ])],
  [State.offer_sent, new Map([
    [RENTAL_TRANSACTION_ACTION.accept_offer, State.offer_accepted],
    [RENTAL_TRANSACTION_ACTION.request_revision, State.negotiation],
    [RENTAL_TRANSACTION_ACTION.reject_quote, State.rejected],
    [RENTAL_TRANSACTION_ACTION.close_quote, State.cancelled],
  ])],
  [State.final_quote_sent, new Map([
    [RENTAL_TRANSACTION_ACTION.accept_offer, State.offer_accepted],
    [RENTAL_TRANSACTION_ACTION.reject_quote, State.rejected],
    [RENTAL_TRANSACTION_ACTION.close_quote, State.cancelled],
  ])],
  [State.offer_accepted, new Map([
    [RENTAL_TRANSACTION_ACTION.sign_contract, State.contract_signed],
    [RENTAL_TRANSACTION_ACTION.close_quote, State.cancelled],
  ])],
  [State.contract_generated, new Map([
    [RENTAL_TRANSACTION_ACTION.sign_contract, State.contract_signed],
    [RENTAL_TRANSACTION_ACTION.close_quote, State.cancelled],
  ])],
  [State.contract_signed, new Map([
    [RENTAL_TRANSACTION_ACTION.sign_contract, State.contract_signed],
    [RENTAL_TRANSACTION_ACTION.checkout, State.payment_required],
    [RENTAL_TRANSACTION_ACTION.close_quote, State.cancelled],
  ])],
  [State.payment_required, new Map([
    [RENTAL_TRANSACTION_ACTION.checkout, State.payment_required],
    [RENTAL_TRANSACTION_ACTION.close_quote, State.cancelled],
  ])],
  [State.payment_completed, new Map([])],
  [State.booking_created, new Map([])],
  [State.rejected, new Map([])],
  [State.cancelled, new Map([])],
  [State.expired, new Map([])],
] as [RentalTransactionState, ReadonlyMap<RentalTransactionActionId, RentalTransactionState>][]);

export function allowed_actions(
  state: RentalTransactionState,
  actorRole: RentalTransactionActorRole
): ReadonlySet<RentalTransactionActionId> {
  const actionMap = STATE_ACTION_ROLES.get(state);
  if (!actionMap) return new Set();

  const allowed = new Set<RentalTransactionActionId>();
  for (const [action, roles] of actionMap) {
    if (roles.has(actorRole)) allowed.add(action);
  }
  return allowed;
}

export function isActionAllowed(
  state: RentalTransactionState,
  action: RentalTransactionActionId,
  actorRole: RentalTransactionActorRole
): boolean {
  return allowed_actions(state, actorRole).has(action);
}

export function canTransition(
  fromState: RentalTransactionState,
  action: RentalTransactionActionId,
  actorRole: RentalTransactionActorRole
): boolean {
  if (TERMINAL_STATES.has(fromState)) return false;
  if (!isActionAllowed(fromState, action, actorRole)) return false;
  const next = TRANSITIONS.get(fromState)?.get(action);
  return next !== undefined;
}

export function getNextState(
  fromState: RentalTransactionState,
  action: RentalTransactionActionId
): RentalTransactionState | undefined {
  if (TERMINAL_STATES.has(fromState)) return undefined;
  return TRANSITIONS.get(fromState)?.get(action);
}

export const RENTAL_TRANSACTION_PHASE = {
  quote_new: 'quote_new',
  quote_responded: 'quote_responded',
  quote_offer_sent: 'quote_offer_sent',
  quote_offer_accepted: 'quote_offer_accepted',
  contract_signing: 'contract_signing',
  inspection_pending: 'inspection_pending',
  inspection_acknowledged: 'inspection_acknowledged',
  payment_ready: 'payment_ready',
  converted_to_booking: 'converted_to_booking',
  quote_rejected: 'quote_rejected',
  quote_closed: 'quote_closed',
} as const;

export type RentalTransactionPhase =
  (typeof RENTAL_TRANSACTION_PHASE)[keyof typeof RENTAL_TRANSACTION_PHASE];

export function phaseToState(phase: RentalTransactionPhase): RentalTransactionState {
  const map: Record<RentalTransactionPhase, RentalTransactionState> = {
    [RENTAL_TRANSACTION_PHASE.quote_new]: State.request_submitted,
    [RENTAL_TRANSACTION_PHASE.quote_responded]: State.negotiation,
    [RENTAL_TRANSACTION_PHASE.quote_offer_sent]: State.offer_sent,
    [RENTAL_TRANSACTION_PHASE.quote_offer_accepted]: State.offer_accepted,
    [RENTAL_TRANSACTION_PHASE.contract_signing]: State.contract_signed,
    [RENTAL_TRANSACTION_PHASE.inspection_pending]: State.payment_required,
    [RENTAL_TRANSACTION_PHASE.inspection_acknowledged]: State.payment_required,
    [RENTAL_TRANSACTION_PHASE.payment_ready]: State.payment_required,
    [RENTAL_TRANSACTION_PHASE.converted_to_booking]: State.booking_created,
    [RENTAL_TRANSACTION_PHASE.quote_rejected]: State.rejected,
    [RENTAL_TRANSACTION_PHASE.quote_closed]: State.cancelled,
  };
  return map[phase] ?? State.negotiation;
}

export function getRentalTransactionPhase(context: {
  quoteStatus: QuoteRequestStatus;
  contractExists: boolean;
  contractCustomerSigned: boolean;
  inspectionExists: boolean;
  inspectionAcknowledged: boolean;
}): RentalTransactionPhase {
  const { quoteStatus, contractExists, contractCustomerSigned } = context;

  if (quoteStatus === QuoteRequestStatus.rejected) return RENTAL_TRANSACTION_PHASE.quote_rejected;
  if (quoteStatus === QuoteRequestStatus.closed) return RENTAL_TRANSACTION_PHASE.quote_closed;
  if (quoteStatus === QuoteRequestStatus.converted_to_booking) return RENTAL_TRANSACTION_PHASE.converted_to_booking;
  if (quoteStatus === QuoteRequestStatus.new) return RENTAL_TRANSACTION_PHASE.quote_new;
  if (quoteStatus === QuoteRequestStatus.responded) {
    const contractDone = contractExists && contractCustomerSigned;
    if (contractDone) return RENTAL_TRANSACTION_PHASE.payment_ready;
    if (contractExists && !contractCustomerSigned) return RENTAL_TRANSACTION_PHASE.contract_signing;
    return RENTAL_TRANSACTION_PHASE.quote_responded;
  }
  return RENTAL_TRANSACTION_PHASE.quote_responded;
}

export function stateToPhase(state: RentalTransactionState): RentalTransactionPhase {
  const map: Record<RentalTransactionState, RentalTransactionPhase> = {
    [State.request_submitted]: RENTAL_TRANSACTION_PHASE.quote_new,
    [State.negotiation]: RENTAL_TRANSACTION_PHASE.quote_responded,
    [State.offer_sent]: RENTAL_TRANSACTION_PHASE.quote_offer_sent,
    [State.final_quote_sent]: RENTAL_TRANSACTION_PHASE.quote_offer_sent,
    [State.offer_accepted]: RENTAL_TRANSACTION_PHASE.quote_offer_accepted,
    [State.contract_generated]: RENTAL_TRANSACTION_PHASE.contract_signing,
    [State.contract_signed]: RENTAL_TRANSACTION_PHASE.contract_signing,
    [State.payment_required]: RENTAL_TRANSACTION_PHASE.payment_ready,
    [State.payment_completed]: RENTAL_TRANSACTION_PHASE.payment_ready,
    [State.booking_created]: RENTAL_TRANSACTION_PHASE.converted_to_booking,
    [State.rejected]: RENTAL_TRANSACTION_PHASE.quote_rejected,
    [State.cancelled]: RENTAL_TRANSACTION_PHASE.quote_closed,
    [State.expired]: RENTAL_TRANSACTION_PHASE.quote_closed,
  };
  return map[state] ?? RENTAL_TRANSACTION_PHASE.quote_responded;
}

export function stateToQuoteStatus(state: RentalTransactionState): QuoteRequestStatus {
  const map: Record<RentalTransactionState, QuoteRequestStatus> = {
    [State.request_submitted]: QuoteRequestStatus.new,
    [State.negotiation]: QuoteRequestStatus.responded,
    [State.offer_sent]: QuoteRequestStatus.responded,
    [State.final_quote_sent]: QuoteRequestStatus.responded,
    [State.offer_accepted]: QuoteRequestStatus.responded,
    [State.contract_generated]: QuoteRequestStatus.responded,
    [State.contract_signed]: QuoteRequestStatus.responded,
    [State.payment_required]: QuoteRequestStatus.responded,
    [State.payment_completed]: QuoteRequestStatus.responded,
    [State.booking_created]: QuoteRequestStatus.converted_to_booking,
    [State.rejected]: QuoteRequestStatus.rejected,
    [State.cancelled]: QuoteRequestStatus.closed,
    [State.expired]: QuoteRequestStatus.closed,
  };
  return map[state] ?? QuoteRequestStatus.responded;
}
