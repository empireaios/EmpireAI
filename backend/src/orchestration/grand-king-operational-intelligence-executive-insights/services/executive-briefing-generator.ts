/**
 * G7-09 — Executive briefing generator.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { ExecutiveBriefing } from "../contracts/operational-intelligence-types.js";
import { listExecutiveInsights, listInsightsByCategory } from "./insight-store.js";
import { computeEmpireHealthScore } from "./executive-kpi-intelligence.js";

export function generateExecutiveBriefing(context: RegistryLoaderContext = {}): ExecutiveBriefing {
  const insights = listExecutiveInsights();
  const empireHealth = computeEmpireHealthScore(context);
  const recommendations = listInsightsByCategory("recommendation");
  const risks = listInsightsByCategory("risk");
  const now = new Date().toISOString();

  const keyInsights = insights
    .filter((i) => i.priority === "critical" || i.priority === "high" || i.priority === "strategic")
    .slice(0, 5)
    .map((i) => i.recommendedAction);

  const topRecommendations = recommendations.slice(0, 5).map((r) => r.recommendedAction);
  const riskHighlights = risks.slice(0, 3).map((r) => r.recommendedAction);

  return {
    briefingId: randomUUID(),
    title: "Grand King Executive Operational Intelligence Briefing",
    summary: `Empire health score: ${empireHealth.score} (${empireHealth.grade}). ${insights.length} insights generated across production operations.`,
    keyInsights,
    topRecommendations,
    riskHighlights,
    empireHealthScore: empireHealth.score,
    generatedAt: now,
  };
}

export function getExecutiveIntelligenceSummary(context: RegistryLoaderContext = {}): string {
  const briefing = generateExecutiveBriefing(context);
  return briefing.summary;
}
