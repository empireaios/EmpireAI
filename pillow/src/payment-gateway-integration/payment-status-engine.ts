/** R3-02 — Payment status engine. */

import { appendPgLog } from "./pg-logging.js";
import type { GatewayRegistry } from "./gateway-registry.js";
import type { SyncPaymentStatusInput, PaymentRecord } from "./types.js";

export class PaymentStatusEngine {
  constructor(private readonly registry: GatewayRegistry) {}

  syncStatus(input: SyncPaymentStatusInput): PaymentRecord | null {
    let payment: PaymentRecord | null = null;

    if (input.paymentId) {
      payment = this.registry.getPayment(input.paymentId);
    } else if (input.transactionId) {
      payment =
        this.registry.listPayments().find((p) => p.transactionId === input.transactionId) ?? null;
    }

    if (!payment) return null;

    const synced = this.registry.updatePayment(payment.paymentId, {
      validationStatus: "passed",
      timestamp: new Date().toISOString(),
    });

    appendPgLog({
      event: "payment_status_update",
      level: "info",
      details: `Synced status for ${payment.paymentId} · status=${payment.paymentStatus}`,
    });

    return synced;
  }
}
