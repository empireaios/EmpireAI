import { randomUUID } from "node:crypto";
import { getDatabase } from "../brain/database.js";
import type {
  BillingRetryPolicy,
  LowBalanceAlert,
  PaymentMethodRecord,
  PaymentMethodRole,
  PaymentWalletRecord,
  WalletType,
} from "./types.js";

const DEFAULT_RETRY: BillingRetryPolicy = {
  maxAttempts: 3,
  backoffMs: [60_000, 300_000, 900_000],
  notifyOnFailure: true,
};

/** Payment framework — method registration, wallets, billing retries (prepared). */
export class PaymentFramework {
  readonly retryPolicy: BillingRetryPolicy = DEFAULT_RETRY;

  registerMethod(input: {
    workspaceId: string;
    role: PaymentMethodRole;
    provider: string;
    lastFour?: string;
    metadata?: Record<string, unknown>;
  }): PaymentMethodRecord {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = randomUUID();

    db.prepare(`DELETE FROM payment_methods WHERE workspace_id = @workspaceId AND role = @role`).run({
      workspaceId: input.workspaceId,
      role: input.role,
    });

    db.prepare(
      `INSERT INTO payment_methods
        (id, workspace_id, role, provider, status, last_four, metadata, created_at, updated_at)
       VALUES (@id, @workspaceId, @role, @provider, 'active', @lastFour, @metadata, @createdAt, @updatedAt)`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      role: input.role,
      provider: input.provider,
      lastFour: input.lastFour ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      workspaceId: input.workspaceId,
      role: input.role,
      provider: input.provider,
      status: "active",
      lastFour: input.lastFour ?? null,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
  }

  getMethods(workspaceId: string): PaymentMethodRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM payment_methods WHERE workspace_id = @workspaceId`)
      .all({ workspaceId }) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: String(row.id),
      workspaceId: String(row.workspace_id),
      role: row.role as PaymentMethodRole,
      provider: String(row.provider),
      status: row.status as PaymentMethodRecord["status"],
      lastFour: row.last_four ? String(row.last_four) : null,
      metadata: JSON.parse(String(row.metadata)) as Record<string, unknown>,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  }

  ensureWallet(workspaceId: string, walletType: WalletType): PaymentWalletRecord {
    const db = getDatabase();
    const existing = db
      .prepare(
        `SELECT * FROM payment_wallets WHERE workspace_id = @workspaceId AND wallet_type = @walletType`,
      )
      .get({ workspaceId, walletType }) as Record<string, unknown> | undefined;

    if (existing) {
      return mapWallet(existing);
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO payment_wallets
        (id, workspace_id, wallet_type, balance_cents, currency, low_balance_threshold_cents, updated_at)
       VALUES (@id, @workspaceId, @walletType, 0, 'USD', @threshold, @updatedAt)`,
    ).run({
      id,
      workspaceId,
      walletType,
      threshold: walletType === "advertising" ? 10_000 : 0,
      updatedAt: now,
    });

    return {
      id,
      workspaceId,
      walletType,
      balanceCents: 0,
      currency: "USD",
      lowBalanceThresholdCents: walletType === "advertising" ? 10_000 : 0,
      updatedAt: now,
    };
  }

  checkLowBalance(workspaceId: string): LowBalanceAlert[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM payment_wallets WHERE workspace_id = @workspaceId`)
      .all({ workspaceId }) as Array<Record<string, unknown>>;

    const alerts: LowBalanceAlert[] = [];
    for (const row of rows) {
      const wallet = mapWallet(row);
      if (wallet.balanceCents <= wallet.lowBalanceThresholdCents) {
        alerts.push({
          workspaceId,
          walletType: wallet.walletType,
          balanceCents: wallet.balanceCents,
          thresholdCents: wallet.lowBalanceThresholdCents,
          triggeredAt: new Date().toISOString(),
        });
      }
    }
    return alerts;
  }

  /** Framework hook for automatic billing retries — execution deferred to job queue. */
  planBillingRetry(input: {
    workspaceId: string;
    invoiceId: string;
    attempt: number;
  }): { scheduled: boolean; nextAttemptMs?: number; reason?: string } {
    if (input.attempt >= this.retryPolicy.maxAttempts) {
      return { scheduled: false, reason: "Max retry attempts reached" };
    }
    return {
      scheduled: true,
      nextAttemptMs: this.retryPolicy.backoffMs[input.attempt] ?? 900_000,
    };
  }
}

function mapWallet(row: Record<string, unknown>): PaymentWalletRecord {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    walletType: row.wallet_type as WalletType,
    balanceCents: Number(row.balance_cents),
    currency: String(row.currency),
    lowBalanceThresholdCents: Number(row.low_balance_threshold_cents),
    updatedAt: String(row.updated_at),
  };
}

export const paymentFramework = new PaymentFramework();
