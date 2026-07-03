import type {
  DecisionImpactLevel,
  ExecutiveDecisionEvaluation,
  ExecutiveDecisionOption,
} from "./types.js";

const IMPACT_WEIGHT: Record<DecisionImpactLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function evaluateExecutiveDecision(query: string): ExecutiveDecisionEvaluation {
  const options = buildOptionsForQuery(query);
  const ranked = [...options].sort((a, b) => b.compositeScore - a.compositeScore);
  const best = ranked[0]!;

  return {
    query,
    options: ranked,
    bestOptionId: best.id,
    executiveSummary: `Recommended: ${best.label} (score ${best.compositeScore}/100). ${best.rationale}`,
  };
}

function buildOptionsForQuery(query: string): ExecutiveDecisionOption[] {
  const q = query.toLowerCase();

  if (/launch|commerce|product|store/i.test(q)) {
    return [
      option("launch-now", "Launch top winning product immediately", {
        business: "high", technical: "medium", financial: "high", operational: "medium", risk: "medium",
        sustainability: 82,
        recommendation: "recommended",
        rationale: "Commerce intelligence identifies validated products; infrastructure supports deployment",
      }),
      option("launch-staged", "Staged launch — infrastructure hardening first", {
        business: "medium", technical: "low", financial: "medium", operational: "low", risk: "low",
        sustainability: 88,
        recommendation: "acceptable",
        rationale: "Lower risk path when infrastructure signals are degraded",
      }),
      option("defer-launch", "Defer launch until CRIR certification complete", {
        business: "low", technical: "low", financial: "low", operational: "low", risk: "low",
        sustainability: 75,
        recommendation: "defer",
        rationale: "Conservative when readiness uncertain",
      }),
    ];
  }

  if (/engineering|deploy|fix|technical/i.test(q)) {
    return [
      option("cursor-mission", "Dispatch Cursor Bridge engineering mission", {
        business: "medium", technical: "high", financial: "medium", operational: "high", risk: "medium",
        sustainability: 80,
        recommendation: "recommended",
        rationale: "Technical Chief diagnosis + Cursor Bridge validation pipeline",
      }),
      option("infra-first", "Infrastructure Commander recovery before code changes", {
        business: "low", technical: "high", financial: "low", operational: "high", risk: "low",
        sustainability: 85,
        recommendation: "acceptable",
        rationale: "Platform stability before feature work",
      }),
    ];
  }

  return [
    option("balanced", "Balanced cross-domain execution", {
      business: "high", technical: "medium", financial: "high", operational: "medium", risk: "medium",
      sustainability: 86,
      recommendation: "recommended",
      rationale: "Coordinate engineering, commerce, and infrastructure in parallel where safe",
    }),
    option("engineering-focus", "Engineering-first — stabilise platform", {
      business: "medium", technical: "high", financial: "medium", operational: "high", risk: "low",
      sustainability: 84,
      recommendation: "acceptable",
      rationale: "When repository health or infrastructure signals are weak",
    }),
    option("commerce-focus", "Commerce-first — accelerate revenue", {
      business: "high", technical: "low", financial: "high", operational: "medium", risk: "high",
      sustainability: 72,
      recommendation: "acceptable",
      rationale: "When platforms are healthy and winning products validated",
    }),
    option("hold", "Strategic hold — gather more intelligence", {
      business: "low", technical: "low", financial: "low", operational: "low", risk: "low",
      sustainability: 70,
      recommendation: "defer",
      rationale: "When cross-domain signals conflict or risk is elevated",
    }),
  ];
}

function option(
  id: string,
  label: string,
  input: {
    business: DecisionImpactLevel;
    technical: DecisionImpactLevel;
    financial: DecisionImpactLevel;
    operational: DecisionImpactLevel;
    risk: DecisionImpactLevel;
    sustainability: number;
    recommendation: ExecutiveDecisionOption["recommendation"];
    rationale: string;
  },
): ExecutiveDecisionOption {
  const compositeScore = Math.round(
    IMPACT_WEIGHT[input.business] * 8 +
    IMPACT_WEIGHT[input.technical] * 6 +
    IMPACT_WEIGHT[input.financial] * 8 +
    IMPACT_WEIGHT[input.operational] * 5 +
    (5 - IMPACT_WEIGHT[input.risk]) * 4 +
    input.sustainability * 0.35,
  );

  return {
    id,
    label,
    businessImpact: input.business,
    technicalImpact: input.technical,
    financialImpact: input.financial,
    operationalImpact: input.operational,
    riskLevel: input.risk,
    sustainabilityScore: input.sustainability,
    compositeScore: Math.min(100, compositeScore),
    recommendation: input.recommendation,
    rationale: input.rationale,
  };
}
