/** X3-06 — Supplier Performance Analyzer. */

import type { SupplierScaleEngineConfiguration } from "./configuration.js";
import type { SupplierScaleInput, SupplierScalingRecord } from "./types.js";
import { buildSupplierScalingRecord, computeSupplierSignals } from "./structural-signals.js";

export class SupplierPerformanceAnalyzer {
  assess(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SupplierScalingRecord {
    const signals = computeSupplierSignals("performance", input, config);
    let summary = signals.recommendationSummary;
    if (signals.performanceScore < config.minPerformanceScore) {
      summary = `Performance ${signals.performanceScore} below min ${config.minPerformanceScore} — do not expand`;
    } else if (signals.reliabilityScore < config.minReliabilityScore) {
      summary = `Reliability ${signals.reliabilityScore} below min ${config.minReliabilityScore} — stabilize supplier first`;
    } else {
      summary = `Performance ${signals.performanceScore} · reliability ${signals.reliabilityScore} within validated analytics bounds`;
    }
    return buildSupplierScalingRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
