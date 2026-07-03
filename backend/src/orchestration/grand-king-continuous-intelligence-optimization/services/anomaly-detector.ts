/**
 * G7-06 — Anomaly detector (registry-driven rules).
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { OptimizationAnomaly, OptimizationPriority } from "../contracts/continuous-intelligence-types.js";
import {
  deriveSignalFromRuleRef,
  parseDomainFromRef,
  resolveOptimizationDependencies,
} from "../registry/continuous-intelligence-registry-resolver.js";

export function detectOptimizationAnomalies(context: RegistryLoaderContext = {}): OptimizationAnomaly[] {
  const deps = resolveOptimizationDependencies(context);
  const anomalies: OptimizationAnomaly[] = [];

  for (const ruleRef of deps.anomalyRuleRefs) {
    const domainId = parseDomainFromRef(ruleRef) ?? inferAnomalyDomain(ruleRef);
    if (!domainId) continue;

    const signal = deriveSignalFromRuleRef(ruleRef);
    const severity = computeSeverity(signal);

    if (process.env.OPTIMIZATION_ANOMALY_SIGNAL === "true" && ruleRef.includes("performance")) {
      anomalies.push({
        anomalyId: randomUUID(),
        domainId: "performance",
        summary: "Performance anomaly signal detected via governance hook",
        ruleReference: ruleRef,
        severity: "critical",
        detectedAt: new Date().toISOString(),
      });
      continue;
    }

    if (signal >= 0.5) {
      anomalies.push({
        anomalyId: randomUUID(),
        domainId,
        summary: `Anomaly detected via ${ruleRef}`,
        ruleReference: ruleRef,
        severity,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return anomalies;
}

function inferAnomalyDomain(ruleRef: string): OptimizationAnomaly["domainId"] | undefined {
  if (ruleRef.includes("performance")) return "performance";
  if (ruleRef.includes("cost")) return "financial_operations";
  if (ruleRef.includes("automation")) return "automation";
  if (ruleRef.includes("financial")) return "financial_operations";
  return "infrastructure";
}

function computeSeverity(signal: number): OptimizationPriority {
  if (signal >= 0.85) return "critical";
  if (signal >= 0.7) return "high";
  if (signal >= 0.55) return "medium";
  return "low";
}
