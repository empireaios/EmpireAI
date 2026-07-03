/**
 * G7-09 — Executive insight store.
 */

import type { ExecutiveInsight } from "../contracts/operational-intelligence-types.js";

const insights = new Map<string, ExecutiveInsight>();

export function appendExecutiveInsight(insight: ExecutiveInsight): void {
  insights.set(insight.insightId, insight);
}

export function getExecutiveInsight(insightId: string): ExecutiveInsight | undefined {
  return insights.get(insightId);
}

export function listExecutiveInsights(): ExecutiveInsight[] {
  return Array.from(insights.values());
}

export function listInsightsByCategory(category: ExecutiveInsight["category"]): ExecutiveInsight[] {
  return listExecutiveInsights().filter((i) => i.category === category);
}

export function resetInsightStoreForTests(): void {
  insights.clear();
}
