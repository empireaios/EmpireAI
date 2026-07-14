/** E5-15 — Cockpit reporting and metrics. */

import type { CockpitExecutiveReport, CockpitMetrics } from "./types.js";

export function buildCockpitExecutiveReport(input: {
  cockpitHealth: string;
  sovereignHealthScore: number;
  governanceChainScore: number;
  unifiedVisibilityScore: number;
}): CockpitExecutiveReport {
  return {
    currentStatus: input.cockpitHealth,
    sovereignHealthScore: input.sovereignHealthScore,
    governanceChainScore: input.governanceChainScore,
    unifiedVisibilityScore: input.unifiedVisibilityScore,
    executiveSummary: `Sovereign health ${input.sovereignHealthScore}/100 · governance chain ${input.governanceChainScore}/100 · unified visibility ${input.unifiedVisibilityScore}/100`,
    generatedAt: new Date().toISOString(),
  };
}

export function buildCockpitMetrics(input: {
  widgets: Array<{ confidence: number }>;
  governanceEnginesActive: number;
  governanceEnginesTotal: number;
  enterpriseHealthScore: number;
  unifiedVisibilityScore: number;
}): CockpitMetrics {
  const avgConfidence =
    input.widgets.length > 0
      ? Math.round(input.widgets.reduce((a, w) => a + w.confidence, 0) / input.widgets.length)
      : 90;
  return {
    totalWidgets: input.widgets.length,
    governanceEnginesActive: input.governanceEnginesActive,
    governanceEnginesTotal: input.governanceEnginesTotal,
    averageWidgetConfidence: avgConfidence,
    enterpriseHealthScore: input.enterpriseHealthScore,
    unifiedVisibilityScore: input.unifiedVisibilityScore,
  };
}
