export type TreasuryBucket =
  | "available_cash"
  | "reserved_cash"
  | "safety_reserve"
  | "withdrawable_cash";

export type TreasurySnapshot = {
  workspaceId: string;
  currency: string;
  buckets: Record<TreasuryBucket, number>;
  netProfitCents: number;
  empireaiRoyaltyCents: number;
  subscriptionCents: number;
  pendingRefundsCents: number;
  pendingSupplierPaymentsCents: number;
  pendingAdvertisingCents: number;
  cashAvailableCents: number;
  cashSafeToWithdrawCents: number;
  computedAt: string;
};
