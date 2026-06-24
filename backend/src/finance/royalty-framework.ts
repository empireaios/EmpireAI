import { financialLedger } from "./ledger.js";
import type { LedgerEvent } from "./types.js";

const ROYALTY_RATE = 0.1;

export type RoyaltyCalculation = {
  workspaceId: string;
  netProfitCents: number;
  royaltyRate: number;
  royaltyCents: number;
  founderReceivableCents: number;
  period: string;
  calculatedAt: string;
};

/** 10% Net Profit Royalty Framework — calculates and records royalty events in the ledger. */
export class RoyaltyFramework {
  calculate(workspaceId: string, period = "mtd"): RoyaltyCalculation {
    const report = financialLedger.generateReport(workspaceId, period);
    const royaltyCents = Math.max(0, Math.round(report.netProfitCents * ROYALTY_RATE));

    return {
      workspaceId,
      netProfitCents: report.netProfitCents,
      royaltyRate: ROYALTY_RATE,
      royaltyCents,
      founderReceivableCents: Math.max(0, report.netProfitCents - royaltyCents),
      period,
      calculatedAt: new Date().toISOString(),
    };
  }

  /** Record royalty as append-only ledger event if not already recorded for this period. */
  recordRoyalty(workspaceId: string, period = "mtd", source = "royalty-framework"): LedgerEvent | null {
    const calc = this.calculate(workspaceId, period);
    if (calc.royaltyCents <= 0) return null;

    const existing = financialLedger
      .list(workspaceId)
      .find(
        (e) =>
          e.eventType === "royalty" &&
          e.source === source &&
          (e.metadata as { period?: string }).period === period,
      );
    if (existing) return existing;

    return financialLedger.append({
      workspaceId,
      eventType: "royalty",
      amountCents: calc.royaltyCents,
      direction: "debit",
      correlationId: `royalty:${workspaceId}:${period}:${Date.now()}`,
      source,
      description: `EmpireAI 10% net profit royalty (${period})`,
      metadata: {
        period,
        netProfitCents: calc.netProfitCents,
        royaltyRate: calc.royaltyRate,
        reservedCash: true,
      },
    });
  }

  reserveRoyaltyCash(workspaceId: string, period = "mtd"): RoyaltyCalculation {
    this.recordRoyalty(workspaceId, period);
    return this.calculate(workspaceId, period);
  }
}

export const royaltyFramework = new RoyaltyFramework();
