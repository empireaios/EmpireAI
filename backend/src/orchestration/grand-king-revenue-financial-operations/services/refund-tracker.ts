/**
 * G7-05 — Refund tracker.
 */

import { listFinancialRecordsByDomain } from "./financial-ledger.js";

export function trackRefunds(): {
  refundCount: number;
  refundTotal: number;
  chargebackCount: number;
  chargebackTotal: number;
  refundRate: number;
  chargebackRate: number;
} {
  const refunds = listFinancialRecordsByDomain("refunds");
  const chargebacks = listFinancialRecordsByDomain("chargebacks");
  const refundTotal = refunds.reduce((sum, r) => sum + Math.abs(r.refundAmount || r.netAmount), 0);
  const chargebackTotal = chargebacks.reduce((sum, r) => sum + Math.abs(r.netAmount), 0);

  const revenueBase = listFinancialRecordsByDomain("amazon_revenue").length +
    listFinancialRecordsByDomain("shopify_revenue").length +
    listFinancialRecordsByDomain("stripe_revenue").length || 1;

  return {
    refundCount: refunds.length,
    refundTotal,
    chargebackCount: chargebacks.length,
    chargebackTotal,
    refundRate: Math.round((refunds.length / revenueBase) * 10000) / 100,
    chargebackRate: Math.round((chargebacks.length / revenueBase) * 10000) / 100,
  };
}
