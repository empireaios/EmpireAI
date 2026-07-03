/**
 * G7-05 — Financial operations registry type schemas.
 */

export const FINANCIAL_OPERATIONS_REGISTRY_VERSION = "g7-05-v1" as const;

export const FINANCIAL_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "reconciled",
  "requires_review",
  "blocked",
  "cancelled",
] as const;

export type FinancialStatus = (typeof FINANCIAL_STATUSES)[number];

export const FINANCIAL_DOMAIN_IDS = [
  "amazon_revenue",
  "shopify_revenue",
  "stripe_revenue",
  "subscription_revenue",
  "advertising_spend",
  "supplier_cost",
  "refunds",
  "chargebacks",
  "shipping_cost",
  "operational_cost",
  "net_profit",
  "cash_position",
  "projected_profit",
] as const;

export type FinancialDomainId = (typeof FINANCIAL_DOMAIN_IDS)[number];

export const FINANCIAL_TRANSACTION_TYPES = [
  "revenue",
  "expense",
  "refund",
  "chargeback",
  "payout",
  "subscription",
  "advertising",
  "fee",
  "tax",
  "adjustment",
] as const;

export type FinancialTransactionType = (typeof FINANCIAL_TRANSACTION_TYPES)[number];

export const RECONCILIATION_STATUSES = [
  "unreconciled",
  "pending_reconciliation",
  "reconciled",
  "disputed",
] as const;

export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];
