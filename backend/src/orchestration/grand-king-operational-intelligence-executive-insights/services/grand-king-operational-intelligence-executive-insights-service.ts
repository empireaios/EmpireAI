/**
 * G7-09 — Grand King Operational Intelligence & Executive Insights service.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import type { ExecutiveInsight, OperationalIntelligenceOverview } from "../contracts/operational-intelligence-types.js";
import {
  GRAND_KING_OPERATIONAL_INTELLIGENCE_VERSION,
  INTELLIGENCE_DOMAIN_IDS,
} from "../contracts/operational-intelligence-types.js";
import { recordOperationalIntelligenceEklsObservation } from "../ekls/operational-intelligence-ekls-integration.js";
import { resolveOperationalIntelligenceDependencies } from "../registry/operational-intelligence-registry-resolver.js";
import { generateExecutiveInsights, listExecutiveInsights } from "./executive-insight-engine.js";
import { analyseOperationalTrends } from "./operational-trend-analyser.js";
import { analyseAnomalies } from "./anomaly-analyser.js";
import { computeEmpireHealthScore } from "./executive-kpi-intelligence.js";
import { getExecutiveInsight } from "./insight-store.js";

let initialized = false;

export function resetOperationalIntelligenceStateForTests(): void {
  initialized = false;
}

export function initializeOperationalIntelligence(context: RegistryLoaderContext = {}): {
  insights: ExecutiveInsight[];
  overview: OperationalIntelligenceOverview;
} {
  if (initialized) {
    return { insights: listExecutiveInsights(), overview: getOperationalIntelligenceOverview(context) };
  }

  const insights = generateExecutiveInsights(context);

  for (const insight of insights.slice(0, 10)) {
    recordOperationalIntelligenceEklsObservation({
      actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      insightId: insight.insightId,
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      kind: "executive_insight_generated",
      summary: insight.recommendedAction,
      pillowGovernance: true,
    });
  }

  const trends = analyseOperationalTrends(context);
  for (const trend of trends.slice(0, 3)) {
    recordOperationalIntelligenceEklsObservation({
      actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      insightId: trend.trendId,
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      kind: "trend_detected",
      summary: trend.summary,
      pillowGovernance: true,
    });
  }

  const anomalies = analyseAnomalies(context);
  for (const anomaly of anomalies.slice(0, 3)) {
    recordOperationalIntelligenceEklsObservation({
      actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      insightId: anomaly.anomalyId,
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      kind: "anomaly_detected",
      summary: anomaly.summary,
      pillowGovernance: true,
    });
  }

  const recommendations = insights.filter((i) => i.category === "recommendation");
  for (const rec of recommendations.slice(0, 3)) {
    recordOperationalIntelligenceEklsObservation({
      actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      insightId: rec.insightId,
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      kind: "recommendation_generated",
      summary: rec.recommendedAction,
      pillowGovernance: true,
    });
  }

  const predictions = insights.filter((i) => i.category === "prediction");
  for (const pred of predictions.slice(0, 2)) {
    recordOperationalIntelligenceEklsObservation({
      actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      insightId: pred.insightId,
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      kind: "executive_prediction_recorded",
      summary: pred.predictedOutcome,
      pillowGovernance: true,
    });
  }

  recordOperationalIntelligenceEklsObservation({
    actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    insightId: "learning",
    ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
    kind: "executive_learning_recorded",
    summary: "Executive intelligence learning baseline recorded",
    pillowGovernance: true,
  });

  initialized = true;
  return { insights: listExecutiveInsights(), overview: getOperationalIntelligenceOverview(context) };
}

export function getOperationalIntelligenceOverview(context: RegistryLoaderContext = {}): OperationalIntelligenceOverview {
  const insights = listExecutiveInsights();
  const empireHealth = computeEmpireHealthScore(context);
  return {
    frameworkVersion: GRAND_KING_OPERATIONAL_INTELLIGENCE_VERSION,
    domainCount: INTELLIGENCE_DOMAIN_IDS.length,
    activeInsights: insights.length,
    predictionsCount: insights.filter((i) => i.category === "prediction").length,
    recommendationsCount: insights.filter((i) => i.category === "recommendation").length,
    empireHealthScore: empireHealth.score,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    accountHolderId: GRAND_KING_ACCOUNT_HOLDER_ID,
    generatedAt: new Date().toISOString(),
  };
}

export function getOperationalIntelligenceStatus(context: RegistryLoaderContext = {}) {
  return {
    frameworkVersion: GRAND_KING_OPERATIONAL_INTELLIGENCE_VERSION,
    initialized,
    overview: getOperationalIntelligenceOverview(context),
    registryIds: resolveOperationalIntelligenceDependencies(context),
    programmeStatus: "operational-intelligence-executive-insights-established",
  };
}

export { getExecutiveInsight, listExecutiveInsights };
