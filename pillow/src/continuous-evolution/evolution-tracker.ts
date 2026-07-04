import type {
  ContinuousEvolutionDeps,
  DueDiligenceCoverage,
  EmpireEvolutionMetrics,
  OpportunityDiscoveryReport,
  RiskDetectionReport,
} from "./types.js";

export function trackEmpireEvolution(input: {
  deps: ContinuousEvolutionDeps;
  dueDiligence: DueDiligenceCoverage;
  opportunities: OpportunityDiscoveryReport;
  risks: RiskDetectionReport;
}): EmpireEvolutionMetrics {
  const health = input.deps.intelligence.health.score;
  const subs = input.deps.orchestrator?.getSubsystems() ?? [];
  const readyCount = subs.filter((s) => s.health === "ready").length;
  const totalSubs = subs.length || 1;

  const automationIndex = Math.min(100, 60 + readyCount * 2);
  const qualityIndex = Math.min(100, health);
  const profitabilityIndex = Math.min(
    100,
    50 + (input.opportunities.highValueCount * 5),
  );
  const intelligenceIndex = Math.min(100, 70 + input.opportunities.highValueCount * 3);
  const reliabilityIndex = Math.min(
    100,
    Math.round((readyCount / totalSubs) * 100),
  );
  const maintainabilityIndex = Math.max(0, Math.min(100, health - input.dueDiligence.findings.length * 3));
  const executiveVisibilityIndex = Math.min(100, 75 + (totalSubs > 20 ? 15 : 5));

  const avgIndex = Math.round(
    (automationIndex + qualityIndex + profitabilityIndex + intelligenceIndex +
      reliabilityIndex + maintainabilityIndex + executiveVisibilityIndex) / 7,
  );

  const stagnationRisk: EmpireEvolutionMetrics["stagnationRisk"] =
    avgIndex >= 75 && input.risks.criticalCount === 0 ? "low" :
    avgIndex >= 55 ? "medium" : "high";

  const evolutionTrend: EmpireEvolutionMetrics["evolutionTrend"] =
    input.opportunities.highValueCount >= 5 && stagnationRisk === "low" ? "accelerating" :
    stagnationRisk === "high" ? "stagnating" : "steady";

  return {
    automationIndex,
    qualityIndex,
    profitabilityIndex,
    intelligenceIndex,
    reliabilityIndex,
    maintainabilityIndex,
    executiveVisibilityIndex,
    stagnationRisk,
    evolutionTrend,
  };
}
