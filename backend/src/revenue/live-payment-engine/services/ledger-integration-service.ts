import { financialLedger } from "../../../finance/ledger.js";
import { paymentFramework } from "../../../payments/payment-framework.js";
import type { LivePaymentRecord } from "../models/live-payment-record.js";
import { estimateStripeFeeCents } from "./stripe-payment-service.js";

export type LedgerPaymentResult = {
  saleEventId: string;
  feeEventId: string | null;
};

/** Records a real sale and Stripe fee in the financial ledger. */
export function recordSaleInLedger(input: {
  workspaceId: string;
  companyId: string;
  amountCents: number;
  currency: string;
  correlationId: string;
  description: string;
  metadata?: Record<string, unknown>;
}): LedgerPaymentResult {
  paymentFramework.registerMethod({
    workspaceId: input.workspaceId,
    role: "primary",
    provider: "stripe",
    metadata: { lastSaleCorrelationId: input.correlationId },
  });

  paymentFramework.ensureWallet(input.workspaceId, "empireai");

  const saleEvent = financialLedger.append({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    eventType: "sale",
    amountCents: input.amountCents,
    currency: input.currency,
    direction: "credit",
    correlationId: input.correlationId,
    source: "live_payment_engine",
    description: input.description,
    metadata: input.metadata,
  });

  const feeCents = estimateStripeFeeCents(input.amountCents);
  let feeEventId: string | null = null;

  if (feeCents > 0) {
    const feeEvent = financialLedger.append({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      eventType: "tax",
      amountCents: feeCents,
      currency: input.currency,
      direction: "debit",
      correlationId: `${input.correlationId}:fee`,
      source: "stripe_fee",
      description: "Stripe processing fee",
    });
    feeEventId = feeEvent.id;
  }

  return { saleEventId: saleEvent.id, feeEventId };
}

/** Records a refund in the financial ledger. */
export function recordRefundInLedger(input: {
  workspaceId: string;
  companyId: string;
  amountCents: number;
  currency: string;
  correlationId: string;
  description: string;
}): string {
  const refundEvent = financialLedger.append({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    eventType: "refund",
    amountCents: input.amountCents,
    currency: input.currency,
    direction: "debit",
    correlationId: input.correlationId,
    source: "live_payment_engine",
    description: input.description,
  });
  return refundEvent.id;
}

export function computeRevenueFromPayments(payments: LivePaymentRecord[]) {
  const succeeded = payments.filter((payment) => payment.status === "SUCCEEDED");
  const totalRevenueCents = succeeded.reduce((sum, payment) => sum + payment.amountCents, 0);
  const currency = succeeded[0]?.currency ?? "USD";

  return {
    totalRevenueCents,
    totalPayments: payments.length,
    succeededPayments: succeeded.length,
    currency,
    ledgerSaleCount: succeeded.filter((payment) => payment.ledgerSaleEventId).length,
  };
}

export function getLedgerRevenue(workspaceId: string) {
  const summary = financialLedger.summarize(workspaceId);
  const sales = summary.byType.sale?.net ?? 0;
  const refunds = summary.byType.refund?.debits ?? 0;
  return {
    ledgerRevenueCents: sales - refunds,
    grossSalesCents: sales,
    refundsCents: refunds,
    currency: "USD",
  };
}
