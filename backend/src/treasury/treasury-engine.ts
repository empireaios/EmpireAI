import { randomUUID } from "node:crypto";
import { getDatabase } from "../brain/database.js";
import { financialLedger } from "../finance/ledger.js";
import type { TreasurySnapshot } from "./types.js";

const ROYALTY_RATE = 0.1;
const SAFETY_RESERVE_RATE = 0.15;

/** Treasury Engine — derives cash buckets dynamically from the financial ledger. */
export class TreasuryEngine {
  compute(workspaceId: string): TreasurySnapshot {
    const report = financialLedger.generateReport(workspaceId);
    const summary = financialLedger.summarize(workspaceId);

    const pendingSupplierPaymentsCents = summary.byType.supplier_cost.debits;
    const pendingAdvertisingCents = summary.byType.advertising.debits;
    const subscriptionCents = summary.byType.subscription.debits;

    const cashAvailableCents = summary.netCents;
    const safetyReserveCents = Math.round(
      Math.max(0, cashAvailableCents) * SAFETY_RESERVE_RATE,
    );
    const reservedCents =
      report.pendingRefundsCents +
      pendingSupplierPaymentsCents +
      pendingAdvertisingCents +
      report.empireaiRoyaltyCents;

    const withdrawableCents = Math.max(
      0,
      cashAvailableCents - reservedCents - safetyReserveCents,
    );

    return {
      workspaceId,
      currency: "USD",
      buckets: {
        available_cash: cashAvailableCents,
        reserved_cash: reservedCents,
        safety_reserve: safetyReserveCents,
        withdrawable_cash: withdrawableCents,
      },
      netProfitCents: report.netProfitCents,
      empireaiRoyaltyCents: Math.max(
        0,
        Math.round(report.netProfitCents * ROYALTY_RATE),
      ),
      subscriptionCents,
      pendingRefundsCents: report.pendingRefundsCents,
      pendingSupplierPaymentsCents,
      pendingAdvertisingCents,
      cashAvailableCents,
      cashSafeToWithdrawCents: withdrawableCents,
      computedAt: new Date().toISOString(),
    };
  }

  persistSnapshot(snapshot: TreasurySnapshot): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO treasury_snapshots (id, workspace_id, snapshot, created_at)
       VALUES (@id, @workspaceId, @snapshot, @createdAt)`,
    ).run({
      id: randomUUID(),
      workspaceId: snapshot.workspaceId,
      snapshot: JSON.stringify(snapshot),
      createdAt: snapshot.computedAt,
    });
  }
}

export const treasuryEngine = new TreasuryEngine();
