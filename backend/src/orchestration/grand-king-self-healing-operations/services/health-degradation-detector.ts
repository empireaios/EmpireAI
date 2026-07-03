/**
 * G7-08 — Health degradation detector.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { listCommerceOperations } from "../../grand-king-commerce-operations/services/grand-king-commerce-operations-service.js";
import { listAutomationOperations } from "../../grand-king-business-automation-operations/services/grand-king-business-automation-operations-service.js";
import { listAutonomousOperations } from "../../grand-king-autonomous-operations/services/grand-king-autonomous-operations-service.js";
import type { HealthDegradationSignal } from "../contracts/self-healing-types.js";
import type { HealthState, SelfHealingDomainId } from "../../../registry/types/self-healing-registry-types.js";
import {
  deriveHealingSignalFromRef,
  resolveSelfHealingDependencies,
} from "../registry/self-healing-registry-resolver.js";

export function detectHealthDegradation(context: RegistryLoaderContext = {}): HealthDegradationSignal[] {
  const deps = resolveSelfHealingDependencies(context);
  const signals: HealthDegradationSignal[] = [];

  const ruleRefs = [
    ...deps.anomalyRuleRefs,
    ...deps.identityDegradationRules,
    ...deps.readinessSignals.map((s) => `rule:${s}`),
  ];

  for (const ruleRef of ruleRefs) {
    const domainId = inferDomainFromRule(ruleRef);
    if (!domainId) continue;
    const stackState = evaluateStackHealth(domainId, context);
    if (stackState === "healthy") continue;

    signals.push({
      signalId: randomUUID(),
      domainId,
      healthState: stackState,
      summary: `Health degradation detected via ${ruleRef}`,
      ruleReference: ruleRef,
      detectedAt: new Date().toISOString(),
    });
  }

  if (process.env.SELF_HEALING_DEGRADATION_SIGNAL === "true") {
    signals.push({
      signalId: randomUUID(),
      domainId: "infrastructure",
      healthState: "critical",
      summary: "Critical degradation signal via governance hook",
      ruleReference: "rule:critical-degradation",
      detectedAt: new Date().toISOString(),
    });
  }

  return signals;
}

function inferDomainFromRule(ruleRef: string): SelfHealingDomainId | undefined {
  if (ruleRef.includes("identity")) return "identity";
  if (ruleRef.includes("commerce")) return "commerce";
  if (ruleRef.includes("automation")) return "business_automation";
  if (ruleRef.includes("provider")) return "provider_connections";
  if (ruleRef.includes("performance") || ruleRef.includes("cost")) return "infrastructure";
  return "production_workspace";
}

function evaluateStackHealth(domainId: SelfHealingDomainId, _context: RegistryLoaderContext): HealthState {
  try {
    if (domainId === "commerce") {
      const ops = listCommerceOperations();
      const blocked = ops.filter((o) => o.status === "blocked").length;
      if (blocked > 0) return blocked >= 2 ? "critical" : "degraded";
    }
    if (domainId === "business_automation") {
      const ops = listAutomationOperations();
      const failed = ops.filter((o) => o.executionStatus === "failed").length;
      if (failed > 0) return "degraded";
    }
    if (domainId === "provider_connections" || domainId === "production_workspace") {
      const auto = listAutonomousOperations();
      const failed = auto.filter((o) => o.executionStatus === "failed").length;
      if (failed > 0) return "degraded";
    }
  } catch {
    return "unknown";
  }
  const signal = deriveHealingSignalFromRef(domainId);
  return signal < 0.4 ? "degraded" : "healthy";
}

export function computeOverallHealth(signals: HealthDegradationSignal[]): HealthState {
  if (signals.some((s) => s.healthState === "critical" || s.healthState === "failed")) return "critical";
  if (signals.some((s) => s.healthState === "degraded" || s.healthState === "blocked")) return "degraded";
  if (signals.some((s) => s.healthState === "recovering" || s.healthState === "healing")) return "healing";
  if (signals.length === 0) return "healthy";
  return "stable";
}
