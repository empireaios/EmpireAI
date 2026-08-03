/** X2-03 — Company performance measurement engine. */

import { appendPpeLog } from "./ppe-logging.js";
import { PPE_METADATA_VERSION } from "./paths.js";
import type { MetricBundle, PortfolioPerformanceRecord } from "./types.js";

export class CompanyPerformanceEngine {
  private records = new Map<string, PortfolioPerformanceRecord>();

  list(): PortfolioPerformanceRecord[] {
    return [...this.records.values()];
  }

  get(companyReference: string): PortfolioPerformanceRecord | null {
    return this.records.get(companyReference) ?? null;
  }

  measure(companyReference: string, metrics: MetricBundle): PortfolioPerformanceRecord {
    const overallPerformanceScore = Math.round(
      metrics.revenueIndex * 0.25 +
        metrics.profitabilityIndex * 0.25 +
        metrics.operationalEfficiencyIndex * 0.2 +
        metrics.customerPerformanceIndex * 0.15 +
        metrics.growthIndex * 0.15,
    );

    const record: PortfolioPerformanceRecord = {
      portfolioPerformanceId: `ppe-${companyReference}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      companyReference,
      revenueMetrics: { revenueIndex: metrics.revenueIndex },
      profitabilityMetrics: { profitabilityIndex: metrics.profitabilityIndex },
      operationalMetrics: {
        operationalEfficiencyIndex: metrics.operationalEfficiencyIndex,
      },
      growthMetrics: {
        growthIndex: metrics.growthIndex,
        customerPerformanceIndex: metrics.customerPerformanceIndex,
      },
      overallPerformanceScore,
      validationStatus: "passed",
      metadataVersion: PPE_METADATA_VERSION,
      structuralSignalOnly: true,
      manipulatedMetrics: false,
      ranking: null,
    };

    this.records.set(companyReference, record);
    appendPpeLog({
      event: "company_performance_analysis",
      level: "info",
      details: `Measured ${companyReference} · score=${overallPerformanceScore}`,
    });
    return record;
  }

  applyRankings(ranked: PortfolioPerformanceRecord[]): void {
    for (const record of ranked) {
      const current = this.records.get(record.companyReference);
      if (!current) continue;
      current.ranking = record.ranking;
      current.timestamp = new Date().toISOString();
      this.records.set(record.companyReference, current);
    }
  }

  averageScore(): number {
    const list = this.list();
    if (list.length === 0) return 0;
    return Math.round(
      list.reduce((sum, r) => sum + r.overallPerformanceScore, 0) / list.length,
    );
  }

  resetForTesting(): void {
    this.records.clear();
  }
}
