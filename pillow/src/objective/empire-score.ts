import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { ActiveObjective } from "./types.js";

export interface EmpireScoreComponent {
  id: string;
  label: string;
  score: number;
  weight: number;
}

/** LAW 7 — internal executive reasoning score; never overrides Grand King authority. */
export interface PillowEmpireScore {
  overall: number;
  components: EmpireScoreComponent[];
  computedAt: string;
  /** Constitutional: guides prioritization only — Grand King authority is supreme. */
  guidesPrioritizationOnly: true;
}

const COMPONENT_WEIGHTS = {
  objectiveProgress: 0.25,
  profitReadiness: 0.2,
  operationalReadiness: 0.2,
  commercialReadiness: 0.15,
  repositoryHealth: 0.1,
  strategicRisk: 0.1,
} as const;

function criterionScore(objective: ActiveObjective, ids: string[]): number {
  const matched = objective.successCriteria.filter((c) => ids.includes(c.id));
  if (matched.length === 0) return 0;
  const done = matched.filter((c) => c.complete).length;
  return Math.round((done / matched.length) * 100);
}

function repositoryHealthScore(bootstrap: EmpireBootstrapContext): number {
  const health = bootstrap.repositoryHealth;
  if (!health || health.mandatoryTotal === 0) return 50;
  const mandatoryRatio = health.mandatoryPresent / health.mandatoryTotal;
  const optionalRatio =
    health.optionalTotal > 0 ? health.optionalPresent / health.optionalTotal : 1;
  return Math.round((mandatoryRatio * 0.75 + optionalRatio * 0.25) * 100);
}

function strategicRiskScore(objective: ActiveObjective): number {
  const blockerPenalty = Math.min(80, objective.blockers.length * 12);
  return Math.max(0, 100 - blockerPenalty);
}

export function computePillowEmpireScore(
  objective: ActiveObjective,
  bootstrap: EmpireBootstrapContext,
): PillowEmpireScore {
  const components: EmpireScoreComponent[] = [
    {
      id: "objective_progress",
      label: "Objective Progress",
      score: objective.progressPercent,
      weight: COMPONENT_WEIGHTS.objectiveProgress,
    },
    {
      id: "profit_readiness",
      label: "Profit Readiness",
      score: criterionScore(objective, ["proof-001", "gk-golive"]),
      weight: COMPONENT_WEIGHTS.profitReadiness,
    },
    {
      id: "operational_readiness",
      label: "Operational Readiness",
      score: criterionScore(objective, ["pillow-017", "pillow-018", "pillow-019", "gc-03", "gc-05"]),
      weight: COMPONENT_WEIGHTS.operationalReadiness,
    },
    {
      id: "commercial_readiness",
      label: "Commercial Readiness",
      score: criterionScore(objective, ["real-002b"]),
      weight: COMPONENT_WEIGHTS.commercialReadiness,
    },
    {
      id: "repository_health",
      label: "Repository Health",
      score: repositoryHealthScore(bootstrap),
      weight: COMPONENT_WEIGHTS.repositoryHealth,
    },
    {
      id: "strategic_risk",
      label: "Strategic Risk",
      score: strategicRiskScore(objective),
      weight: COMPONENT_WEIGHTS.strategicRisk,
    },
  ];

  const overall = Math.round(
    components.reduce((sum, component) => sum + component.score * component.weight, 0),
  );

  return {
    overall,
    components,
    computedAt: new Date().toISOString(),
    guidesPrioritizationOnly: true,
  };
}
