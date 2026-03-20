/**
 * Canonical transaction context shape for gating (payment, checkout, etc.).
 * Apps may extend locally (e.g. marketplace display phase); keep gate fields aligned here.
 */
import type { QuoteRequestStatus, RentalTransactionState } from './canonical-enums';
import type { RentalTransactionPhase } from './rental-transaction.machine';

export interface RentalTransactionContext {
  quoteRequestId: string;
  transactionId?: string;
  state?: RentalTransactionState;
  quoteStatus: QuoteRequestStatus;
  contractExists: boolean;
  /** True when the customer has signed; vendor may be pre-signed at contract creation. */
  contractCustomerSigned: boolean;
  inspectionExists: boolean;
  inspectionAcknowledged: boolean;
  phase: RentalTransactionPhase;
}
