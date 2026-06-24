export type PaymentMethodRole = "primary" | "backup";
export type WalletType = "empireai" | "advertising";
export type PaymentMethodStatus = "active" | "expired" | "failed" | "pending";

export type PaymentMethodRecord = {
  id: string;
  workspaceId: string;
  role: PaymentMethodRole;
  provider: string;
  status: PaymentMethodStatus;
  lastFour: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PaymentWalletRecord = {
  id: string;
  workspaceId: string;
  walletType: WalletType;
  balanceCents: number;
  currency: string;
  lowBalanceThresholdCents: number;
  updatedAt: string;
};

export type BillingRetryPolicy = {
  maxAttempts: number;
  backoffMs: number[];
  notifyOnFailure: boolean;
};

export type LowBalanceAlert = {
  workspaceId: string;
  walletType: WalletType;
  balanceCents: number;
  thresholdCents: number;
  triggeredAt: string;
};
