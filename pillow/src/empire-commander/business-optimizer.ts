import type { BusinessOptimizationReport, CrossDomainSynthesis, OptimizationRecommendation } from "./types.js";

export function buildBusinessOptimization(crossDomain: CrossDomainSynthesis): BusinessOptimizationReport {
  const recommendations: OptimizationRecommendation[] = [];

  for (const signal of crossDomain.domainSignals) {
    if (signal.healthScore >= 85) continue;

    recommendations.push({
      area: signal.domain,
      currentState: signal.summary,
      targetImprovement: signal.opportunities[0] ?? `Raise ${signal.domain} health above 85`,
      expectedBenefit: `+${Math.min(20, 85 - signal.healthScore)} domain health points`,
      priority: 100 - signal.healthScore,
    });
  }

  recommendations.sort((a, b) => b.priority - a.priority);

  return {
    recommendations: recommendations.slice(0, 6),
    profitLevers: [
      "Launch highest-margin winning product first",
      "Preferred CJ supplier tiers reduce return rate and cost",
      "Target SG/SEA hub for favourable logistics economics",
    ],
    efficiencyLevers: [
      "Cursor Bridge prevents duplicate engineering missions",
      "Infrastructure Commander cached scans reduce probe overhead",
      "Mission Planner dependency validation avoids wasted Cursor cycles",
    ],
    automationLevers: [
      "Orchestrator scheduled workflows for due diligence cycles",
      "Commerce Intelligence automated product scoring",
      "Empire Commander unified executive reporting",
    ],
  };
}
