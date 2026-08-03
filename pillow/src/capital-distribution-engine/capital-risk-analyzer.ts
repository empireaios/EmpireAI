/** X2-05 — Capital risk analyzer. */

import { appendCdeLog } from "./cde-logging.js";
import type { CapitalDistributionEngineConfiguration } from "./configuration.js";
import type {
  CapitalAllocationRecord,
  CapitalPoolRecord,
  CapitalRiskSignal,
} from "./types.js";

export class CapitalRiskAnalyzer {
  analyze(input: {
    pool: CapitalPoolRecord | null;
    allocations: CapitalAllocationRecord[];
    config: CapitalDistributionEngineConfiguration;
  }): CapitalRiskSignal[] {
    const signals: CapitalRiskSignal[] = [];
    const pool = input.pool;

    if (!pool || pool.availableUnits <= 0) {
      signals.push({
        riskId: `cde-risk-${Date.now()}-short`,
        timestamp: new Date().toISOString(),
        riskType: "shortage",
        companyReference: null,
        severity: "high",
        rationale: "Enterprise capital pool has no available units",
        structuralSignalOnly: true,
      });
    }

    const totalAllocated = input.allocations.reduce((sum, a) => sum + a.approvedAllocation, 0);
    if (totalAllocated > 0) {
      const byCompany = new Map<string, number>();
      for (const alloc of input.allocations) {
        byCompany.set(
          alloc.companyReference,
          (byCompany.get(alloc.companyReference) ?? 0) + alloc.approvedAllocation,
        );
      }
      for (const [company, amount] of byCompany) {
        const percent = (amount / totalAllocated) * 100;
        if (percent >= input.config.concentrationRiskThresholdPercent) {
          signals.push({
            riskId: `cde-risk-${Date.now()}-conc`,
            timestamp: new Date().toISOString(),
            riskType: "concentration",
            companyReference: company,
            severity: percent >= 60 ? "high" : "medium",
            rationale: `Capital concentration ${Math.round(percent)}% on ${company}`,
            structuralSignalOnly: true,
          });
        }
      }
    }

    for (const alloc of input.allocations) {
      if (alloc.requestedCapital > (pool?.availableUnits ?? 0) + alloc.approvedAllocation) {
        signals.push({
          riskId: `cde-risk-${Date.now()}-over`,
          timestamp: new Date().toISOString(),
          riskType: "over_request",
          companyReference: alloc.companyReference,
          severity: "medium",
          rationale: "Requested capital exceeds available pool capacity",
          structuralSignalOnly: true,
        });
      }
      if (alloc.expectedRoi < input.config.minExpectedRoi) {
        signals.push({
          riskId: `cde-risk-${Date.now()}-roi`,
          timestamp: new Date().toISOString(),
          riskType: "low_roi",
          companyReference: alloc.companyReference,
          severity: "medium",
          rationale: `Expected ROI ${alloc.expectedRoi}% below minimum threshold`,
          structuralSignalOnly: true,
        });
      }
    }

    appendCdeLog({
      event: "risk_analysis",
      level: signals.length > 0 ? "warn" : "info",
      details: `Detected ${signals.length} capital risk signal(s)`,
    });

    return signals;
  }
}
