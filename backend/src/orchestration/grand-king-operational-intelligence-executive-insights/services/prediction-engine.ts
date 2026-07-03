/**
 * G7-09 — Prediction engine.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { ExecutivePrediction } from "../contracts/operational-intelligence-types.js";
import {
  deriveIntelligenceSignalFromRef,
  parseDomainFromRef,
  resolveOperationalIntelligenceDependencies,
} from "../registry/operational-intelligence-registry-resolver.js";

export function generatePredictions(context: RegistryLoaderContext = {}): ExecutivePrediction[] {
  const deps = resolveOperationalIntelligenceDependencies(context);
  const predictions: ExecutivePrediction[] = [];
  const now = new Date().toISOString();

  for (const ref of deps.decisionRuleRefs) {
    const signal = deriveIntelligenceSignalFromRef(ref);
    const domainId = parseDomainFromRef(ref) ?? "executive_kpis";

    predictions.push({
      predictionId: randomUUID(),
      domainId,
      summary: `Prediction from decision rule ${ref}`,
      predictedOutcome: signal >= 0.6 ? "Positive trajectory expected" : "Intervention may be required",
      confidenceScore: Math.round(signal * 100),
      ruleReference: ref,
      predictedAt: now,
    });
  }

  for (const ref of deps.kpiMetricRefs.slice(0, 5)) {
    const signal = deriveIntelligenceSignalFromRef(ref);
    const domainId = parseDomainFromRef(ref) ?? "finance";

    predictions.push({
      predictionId: randomUUID(),
      domainId,
      summary: `KPI forecast for ${ref}`,
      predictedOutcome: `Projected ${signal >= 0.5 ? "growth" : "stabilisation"} based on ${ref}`,
      confidenceScore: Math.round(signal * 100),
      ruleReference: ref,
      predictedAt: now,
    });
  }

  return predictions;
}
