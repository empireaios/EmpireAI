/**
 * G7-05 — Payout tracker.
 */

import type { FinancialStatus } from "../contracts/financial-operations-types.js";
import type { PayoutStatusSummary } from "../contracts/financial-operations-types.js";
import { listFinancialRecords } from "./financial-ledger.js";

export function trackPayouts(): PayoutStatusSummary {
  const payouts = listFinancialRecords().filter((r) => r.transactionType === "payout");

  const countByStatus = (status: FinancialStatus) => payouts.filter((p) => p.status === status).length;

  return {
    pendingCount: countByStatus("pending"),
    processingCount: countByStatus("processing"),
    completedCount: countByStatus("completed") + countByStatus("reconciled"),
    payouts: payouts.map((p) => ({
      payoutId: p.financialRecordId,
      providerId: p.providerId,
      amount: p.netAmount,
      status: p.status,
    })),
  };
}
