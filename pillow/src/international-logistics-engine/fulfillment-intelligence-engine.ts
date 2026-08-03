/** X4-08 — Fulfillment Intelligence Engine. */

import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";
import {
  buildLogisticsRecord,
  computeStructuralLogisticsSignals,
} from "./structural-signals.js";
import type { LogisticsAnalysisInput, LogisticsRecord } from "./types.js";

export class FulfillmentIntelligenceEngine {
  monitorFulfillmentCapacity(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsRecord {
    const signals = computeStructuralLogisticsSignals(
      { ...input, logisticsCategory: "fulfillment_capacity" },
      config,
    );
    return buildLogisticsRecord({
      ...signals,
      recommendationSummary: `Monitor fulfillment capacity ${signals.originRegion}->${signals.destinationRegion} status=${signals.fulfillmentStatus}`,
    });
  }

  detectBottlenecks(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsRecord {
    const signals = computeStructuralLogisticsSignals(
      {
        ...input,
        logisticsCategory: "bottleneck",
        bottleneckHint: input.bottleneckHint ?? true,
      },
      config,
    );
    return buildLogisticsRecord(
      {
        ...signals,
        bottleneckDetected: true,
        recommendationSummary: `Bottleneck detected ${signals.originRegion}->${signals.destinationRegion}`,
      },
      "partial",
    );
  }

  detectFulfillmentRisks(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsRecord {
    const signals = computeStructuralLogisticsSignals(
      {
        ...input,
        logisticsCategory: "fulfillment_risk",
        fulfillmentRiskHint: input.fulfillmentRiskHint ?? true,
        riskHint: input.riskHint ?? 78,
      },
      config,
    );
    return buildLogisticsRecord(
      {
        ...signals,
        fulfillmentRiskDetected: true,
        recommendationSummary: `Fulfillment risk ${signals.riskLevel} on ${signals.originRegion}->${signals.destinationRegion}`,
      },
      signals.riskScore >= 70 ? "partial" : "passed",
    );
  }

  bottleneckCount(records: LogisticsRecord[]): number {
    return records.filter((r) => r.bottleneckDetected).length;
  }

  fulfillmentRiskCount(records: LogisticsRecord[]): number {
    return records.filter((r) => r.fulfillmentRiskDetected).length;
  }
}
