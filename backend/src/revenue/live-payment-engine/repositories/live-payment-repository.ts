import type { LivePaymentRecord } from "../models/live-payment-record.js";

export interface LivePaymentRepository {
  savePayment(record: LivePaymentRecord): LivePaymentRecord;
  getPaymentById(paymentId: string): LivePaymentRecord | null;
  getByStripeSession(sessionId: string): LivePaymentRecord | null;
  getByStripePaymentIntent(paymentIntentId: string): LivePaymentRecord | null;
  getByStripeEvent(eventId: string): boolean;
  markStripeEventProcessed(eventId: string, paymentId: string): void;
  listPayments(workspaceId: string, companyId?: string): LivePaymentRecord[];
}
