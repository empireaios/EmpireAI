export type LedgerEventType =
  | "sale"
  | "refund"
  | "chargeback"
  | "supplier_cost"
  | "shipping"
  | "advertising"
  | "subscription"
  | "royalty"
  | "reserved_cash"
  | "withdrawable_cash"
  | "manual_adjustment"
  | "tax"
  | "payout";

export type LedgerDirection = "credit" | "debit";

export type LedgerEvent = {
  id: string;
  workspaceId: string;
  companyId: string | null;
  eventType: LedgerEventType;
  amountCents: number;
  currency: string;
  direction: LedgerDirection;
  correlationId: string;
  source: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type LedgerBalanceSummary = {
  workspaceId: string;
  currency: string;
  totalCreditsCents: number;
  totalDebitsCents: number;
  netCents: number;
  eventCount: number;
  byType: Record<LedgerEventType, { credits: number; debits: number; net: number }>;
  computedAt: string;
};

export type FinancialReport = {
  workspaceId: string;
  period: string;
  revenueCents: number;
  expensesCents: number;
  netProfitCents: number;
  empireaiRoyaltyCents: number;
  founderReceivableCents: number;
  pendingRefundsCents: number;
  pendingLiabilitiesCents: number;
  cashAvailableCents: number;
  cashSafeToWithdrawCents: number;
  forecastNote: string;
  generatedAt: string;
};
