/**
 * G7-09 — Executive recommendation engine.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { ExecutiveInsight } from "../contracts/operational-intelligence-types.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import {
  deriveIntelligenceSignalFromRef,
  mapDomainToSubsystem,
  parseDomainFromRef,
  resolveOperationalIntelligenceDependencies,
} from "../registry/operational-intelligence-registry-resolver.js";
import { appendExecutiveInsight } from "./insight-store.js";
import { analyseAnomalies } from "./anomaly-analyser.js";
import { analyseOpportunities } from "./opportunity-analyser.js";

function computePriority(signal: number): ExecutiveInsight["priority"] {
  if (signal >= 0.85) return "critical";
  if (signal >= 0.7) return "high";
  if (signal >= 0.5) return "medium";
  return "low";
}

function computeSeverity(signal: number): ExecutiveInsight["severity"] {
  if (signal >= 0.85) return "critical";
  if (signal >= 0.7) return "high";
  if (signal >= 0.5) return "medium";
  if (signal >= 0.3) return "low";
  return "info";
}

export function generateExecutiveRecommendations(context: RegistryLoaderContext = {}): ExecutiveInsight[] {
  const deps = resolveOperationalIntelligenceDependencies(context);
  const recommendations: ExecutiveInsight[] = [];
  const correlationId = randomUUID();
  const now = new Date().toISOString();

  for (const ref of deps.decisionRuleRefs) {
    const signal = deriveIntelligenceSignalFromRef(ref);
    const domainId = parseDomainFromRef(ref) ?? "executive_kpis";

    const insight: ExecutiveInsight = {
      insightId: randomUUID(),
      workspaceId: GRAND_KING_WORKSPACE_ID,
      category: "recommendation",
      severity: computeSeverity(signal),
      priority: computePriority(signal),
      sourceSubsystems: [mapDomainToSubsystem(domainId)],
      domainId,
      confidenceScore: Math.round(signal * 100),
      businessImpact: Math.round(signal * 100),
      financialImpact: Math.round(signal * 500) / 10,
      recommendedAction: `Execute decision rule: ${ref}`,
      predictedOutcome: signal >= 0.6 ? "Improved operational performance" : "Risk mitigation required",
      supportingEvidence: [{ evidenceId: randomUUID(), kind: "reference", summary: ref, ref }],
      createdAt: now,
      updatedAt: now,
      correlationId,
      governanceState: "pillow-governed",
    };
    appendExecutiveInsight(insight);
    recommendations.push(insight);
  }

  const opportunities = analyseOpportunities(context);
  for (const opp of opportunities) {
    const signal = deriveIntelligenceSignalFromRef(opp.ruleReference);
    const insight: ExecutiveInsight = {
      insightId: randomUUID(),
      workspaceId: GRAND_KING_WORKSPACE_ID,
      category: "recommendation",
      severity: "medium",
      priority: computePriority(signal),
      sourceSubsystems: [mapDomainToSubsystem(opp.domainId)],
      domainId: opp.domainId,
      confidenceScore: Math.round(signal * 100),
      businessImpact: Math.round(opp.estimatedValue / 10),
      financialImpact: opp.estimatedValue,
      recommendedAction: `Pursue opportunity: ${opp.summary}`,
      predictedOutcome: `Estimated value: ${opp.estimatedValue}`,
      supportingEvidence: [{ evidenceId: randomUUID(), kind: "signal", summary: opp.summary, ref: opp.ruleReference }],
      createdAt: now,
      updatedAt: now,
      correlationId,
      governanceState: "pillow-governed",
    };
    appendExecutiveInsight(insight);
    recommendations.push(insight);
  }

  const anomalies = analyseAnomalies(context);
  for (const anomaly of anomalies.filter((a) => a.severity === "high" || a.severity === "critical")) {
    const signal = deriveIntelligenceSignalFromRef(anomaly.ruleReference);
    const insight: ExecutiveInsight = {
      insightId: randomUUID(),
      workspaceId: GRAND_KING_WORKSPACE_ID,
      category: "recommendation",
      severity: anomaly.severity,
      priority: anomaly.severity === "critical" ? "critical" : "high",
      sourceSubsystems: [mapDomainToSubsystem(anomaly.domainId)],
      domainId: anomaly.domainId,
      confidenceScore: Math.round(signal * 100),
      businessImpact: Math.round(signal * 80),
      financialImpact: Math.round(signal * 300) / 10,
      recommendedAction: `Address anomaly: ${anomaly.summary}`,
      predictedOutcome: "Risk reduction and operational stability",
      supportingEvidence: [{ evidenceId: randomUUID(), kind: "signal", summary: anomaly.summary, ref: anomaly.ruleReference }],
      createdAt: now,
      updatedAt: now,
      correlationId,
      governanceState: "pillow-governed",
    };
    appendExecutiveInsight(insight);
    recommendations.push(insight);
  }

  return recommendations;
}
