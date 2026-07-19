/** R3-02 — Gateway registry. */

import { appendPgLog } from "./pg-logging.js";
import type { PaymentRecord, RegisterGatewayInput } from "./types.js";

export class GatewayRegistry {
  private providers = new Set<string>();
  private payments = new Map<string, PaymentRecord>();
  private orderIndex = new Map<string, string>();

  registerProvider(input: RegisterGatewayInput): void {
    this.providers.add(input.providerIdentifier);
    appendPgLog({
      event: "gateway_registration",
      level: "info",
      details: `Registered gateway provider ${input.providerIdentifier}`,
    });
  }

  hasProvider(providerIdentifier: string): boolean {
    return this.providers.has(providerIdentifier);
  }

  listProviders(): string[] {
    return [...this.providers];
  }

  storePayment(record: PaymentRecord): void {
    this.payments.set(record.paymentId, record);
    this.orderIndex.set(`${record.orderReference}:${record.paymentAmount}`, record.paymentId);
  }

  getPayment(paymentId: string): PaymentRecord | null {
    return this.payments.get(paymentId) ?? null;
  }

  findByOrder(orderReference: string, paymentAmount: number): PaymentRecord | null {
    const id = this.orderIndex.get(`${orderReference}:${paymentAmount}`);
    return id ? this.payments.get(id) ?? null : null;
  }

  listPayments(): PaymentRecord[] {
    return [...this.payments.values()];
  }

  updatePayment(paymentId: string, patch: Partial<PaymentRecord>): PaymentRecord | null {
    const existing = this.payments.get(paymentId);
    if (!existing) return null;
    const updated = { ...existing, ...patch, timestamp: new Date().toISOString() };
    this.payments.set(paymentId, updated);
    return updated;
  }

  resetForTesting(): void {
    this.providers.clear();
    this.payments.clear();
    this.orderIndex.clear();
  }
}
