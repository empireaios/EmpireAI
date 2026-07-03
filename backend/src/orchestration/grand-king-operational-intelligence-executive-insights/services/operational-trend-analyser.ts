/**
 * G7-09 — Operational trend analyser.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { ExecutiveTrend } from "../contracts/operational-intelligence-types.js";
import {
  deriveIntelligenceSignalFromRef,
  parseDomainFromRef,
  resolveOperationalIntelligenceDependencies,
} from "../registry/operational-intelligence-registry-resolver.js";

export function analyseOperationalTrends(context: RegistryLoaderContext = {}): ExecutiveTrend[] {
  const deps = resolveOperationalIntelligenceDependencies(context);
  const trends: ExecutiveTrend[] = [];
  const now = new Date().toISOString();

  for (const ref of deps.kpiMetricRefs) {
    const signal = deriveIntelligenceSignalFromRef(ref);
    const domainId = parseDomainFromRef(ref) ?? "executive_kpis";
    const direction: ExecutiveTrend["direction"] =
      signal >= 0.65 ? "up" : signal >= 0.4 ? "stable" : "down";

    trends.push({
      trendId: randomUUID(),
      domainId,
      summary: `Trend detected for ${ref}`,
      direction,
      ruleReference: ref,
      detectedAt: now,
      signalStrength: signal,
    });
  }

  for (const ref of deps.prioritizationRuleRefs) {
    const signal = deriveIntelligenceSignalFromRef(ref);
    trends.push({
      trendId: randomUUID(),
      domainId: "operational_health",
      summary: `Operational trend from ${ref}`,
      direction: signal >= 0.5 ? "up" : "down",
      ruleReference: ref,
      detectedAt: now,
      signalStrength: signal,
    });
  }

  return trends;
}
