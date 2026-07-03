/**
 * G7-09 — Anomaly analyser.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { ExecutiveAnomaly } from "../contracts/operational-intelligence-types.js";
import {
  deriveIntelligenceSignalFromRef,
  parseDomainFromRef,
  resolveOperationalIntelligenceDependencies,
} from "../registry/operational-intelligence-registry-resolver.js";

function computeSeverity(signal: number): ExecutiveAnomaly["severity"] {
  if (signal >= 0.85) return "critical";
  if (signal >= 0.7) return "high";
  if (signal >= 0.5) return "medium";
  if (signal >= 0.3) return "low";
  return "info";
}

export function analyseAnomalies(context: RegistryLoaderContext = {}): ExecutiveAnomaly[] {
  const deps = resolveOperationalIntelligenceDependencies(context);
  const anomalies: ExecutiveAnomaly[] = [];
  const now = new Date().toISOString();

  for (const ref of deps.anomalyRuleRefs) {
    const signal = deriveIntelligenceSignalFromRef(ref);
    const domainId = parseDomainFromRef(ref) ?? "operational_health";

    anomalies.push({
      anomalyId: randomUUID(),
      domainId,
      summary: `Anomaly detected via ${ref}`,
      ruleReference: ref,
      severity: computeSeverity(signal),
      detectedAt: now,
    });
  }

  for (const ref of deps.riskScoringRefs) {
    const signal = deriveIntelligenceSignalFromRef(ref);
    if (signal >= 0.6) {
      anomalies.push({
        anomalyId: randomUUID(),
        domainId: "business_health",
        summary: `Risk anomaly from ${ref}`,
        ruleReference: ref,
        severity: computeSeverity(signal),
        detectedAt: now,
      });
    }
  }

  return anomalies;
}
