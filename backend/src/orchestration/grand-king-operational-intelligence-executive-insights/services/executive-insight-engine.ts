/**
 * G7-09 — Executive insight engine (orchestrates all insight generation).
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
import { appendExecutiveInsight, listExecutiveInsights } from "./insight-store.js";
import { analyseOperationalTrends } from "./operational-trend-analyser.js";
import { analyseAnomalies } from "./anomaly-analyser.js";
import { analyseOpportunities } from "./opportunity-analyser.js";
import { generatePredictions } from "./prediction-engine.js";
import { generateExecutiveRecommendations } from "./executive-recommendation-engine.js";
import { correlateCrossSystemSignals } from "./cross-system-correlation-engine.js";

function buildInsight(input: {
  category: ExecutiveInsight["category"];
  domainId: ExecutiveInsight["domainId"];
  summary: string;
  ref: string;
  signal: number;
  correlationId: string;
  now: string;
  recommendedAction: string;
  predictedOutcome: string;
}): ExecutiveInsight {
  const severity: ExecutiveInsight["severity"] =
    input.signal >= 0.85 ? "critical" : input.signal >= 0.7 ? "high" : input.signal >= 0.5 ? "medium" : "low";
  const priority: ExecutiveInsight["priority"] =
    input.signal >= 0.85 ? "critical" : input.signal >= 0.7 ? "high" : input.signal >= 0.5 ? "medium" : "low";

  return {
    insightId: randomUUID(),
    workspaceId: GRAND_KING_WORKSPACE_ID,
    category: input.category,
    severity,
    priority,
    sourceSubsystems: [mapDomainToSubsystem(input.domainId)],
    domainId: input.domainId,
    confidenceScore: Math.round(input.signal * 100),
    businessImpact: Math.round(input.signal * 100),
    financialImpact: Math.round(input.signal * 500) / 10,
    recommendedAction: input.recommendedAction,
    predictedOutcome: input.predictedOutcome,
    supportingEvidence: [{ evidenceId: randomUUID(), kind: "reference", summary: input.summary, ref: input.ref }],
    createdAt: input.now,
    updatedAt: input.now,
    correlationId: input.correlationId,
    governanceState: "pillow-governed",
  };
}

export function generateExecutiveInsights(context: RegistryLoaderContext = {}): ExecutiveInsight[] {
  const correlationId = randomUUID();
  const now = new Date().toISOString();
  const insights: ExecutiveInsight[] = [];

  const trends = analyseOperationalTrends(context);
  for (const trend of trends) {
    const insight = buildInsight({
      category: "trend",
      domainId: trend.domainId,
      summary: trend.summary,
      ref: trend.ruleReference,
      signal: trend.signalStrength,
      correlationId,
      now,
      recommendedAction: `Monitor trend: ${trend.direction}`,
      predictedOutcome: `Trend direction: ${trend.direction}`,
    });
    appendExecutiveInsight(insight);
    insights.push(insight);
  }

  const anomalies = analyseAnomalies(context);
  for (const anomaly of anomalies) {
    const signal = deriveIntelligenceSignalFromRef(anomaly.ruleReference);
    const insight = buildInsight({
      category: "anomaly",
      domainId: anomaly.domainId,
      summary: anomaly.summary,
      ref: anomaly.ruleReference,
      signal,
      correlationId,
      now,
      recommendedAction: `Investigate anomaly: ${anomaly.summary}`,
      predictedOutcome: "Early intervention prevents escalation",
    });
    appendExecutiveInsight(insight);
    insights.push(insight);
  }

  const opportunities = analyseOpportunities(context);
  for (const opp of opportunities) {
    const signal = deriveIntelligenceSignalFromRef(opp.ruleReference);
    const insight = buildInsight({
      category: "opportunity",
      domainId: opp.domainId,
      summary: opp.summary,
      ref: opp.ruleReference,
      signal,
      correlationId,
      now,
      recommendedAction: `Evaluate opportunity: ${opp.summary}`,
      predictedOutcome: `Estimated value: ${opp.estimatedValue}`,
    });
    appendExecutiveInsight(insight);
    insights.push(insight);
  }

  const deps = resolveOperationalIntelligenceDependencies(context);
  for (const ref of deps.riskScoringRefs) {
    const signal = deriveIntelligenceSignalFromRef(ref);
    const domainId = parseDomainFromRef(ref) ?? "business_health";
    const insight = buildInsight({
      category: "risk",
      domainId,
      summary: `Risk signal from ${ref}`,
      ref,
      signal,
      correlationId,
      now,
      recommendedAction: `Mitigate risk: ${ref}`,
      predictedOutcome: signal >= 0.6 ? "Risk manageable with intervention" : "Risk within tolerance",
    });
    appendExecutiveInsight(insight);
    insights.push(insight);
  }

  const predictions = generatePredictions(context);
  for (const pred of predictions) {
    const signal = pred.confidenceScore / 100;
    const insight = buildInsight({
      category: "prediction",
      domainId: pred.domainId,
      summary: pred.summary,
      ref: pred.ruleReference,
      signal,
      correlationId,
      now,
      recommendedAction: `Prepare for: ${pred.predictedOutcome}`,
      predictedOutcome: pred.predictedOutcome,
    });
    appendExecutiveInsight(insight);
    insights.push(insight);
  }

  const correlations = correlateCrossSystemSignals(context);
  for (const corr of correlations) {
    const insight = buildInsight({
      category: "strategic_signal",
      domainId: "executive_kpis",
      summary: corr.summary,
      ref: corr.ruleReference,
      signal: corr.strength,
      correlationId,
      now,
      recommendedAction: "Review cross-system correlation",
      predictedOutcome: "Coordinated action across subsystems",
    });
    insight.sourceSubsystems = corr.sourceSubsystems;
    appendExecutiveInsight(insight);
    insights.push(insight);
  }

  generateExecutiveRecommendations(context);

  return listExecutiveInsights();
}

export { listExecutiveInsights };
