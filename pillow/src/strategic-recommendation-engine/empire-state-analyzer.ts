import type { StrategicRecommendationInput, EmpireStateAnalysis, AnalysisDimensionScore } from "./types.js";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

type DimensionDef = {
  dimensionId: string;
  label: string;
  hintKeys: Array<keyof StrategicRecommendationInput>;
  negativePatterns: RegExp;
  positivePatterns: RegExp;
  base: number;
};

const DIMENSIONS: DimensionDef[] = [
  {
    dimensionId: "empire_state",
    label: "EmpireAI State",
    hintKeys: ["empireStateHints"],
    negativePatterns: /degrad|outage|stall|fragment|unstable|drift/i,
    positivePatterns: /stable|healthy|aligned|certified|ready/i,
    base: 72,
  },
  {
    dimensionId: "active_businesses",
    label: "Active Businesses",
    hintKeys: ["activeBusinessHints"],
    negativePatterns: /idle|stalled|under.?perform|dormant|churn/i,
    positivePatterns: /growing|active|pipeline|launch|scale/i,
    base: 70,
  },
  {
    dimensionId: "business_performance",
    label: "Business Performance",
    hintKeys: ["businessPerformanceHints"],
    negativePatterns: /decline|margin.?pressure|loss|under.?target|slow.?growth/i,
    positivePatterns: /revenue|margin|growth|beat|outperform/i,
    base: 68,
  },
  {
    dimensionId: "workforce_performance",
    label: "Workforce Performance",
    hintKeys: ["workforcePerformanceHints"],
    negativePatterns: /bottleneck|backlog|under.?staff|fatigue|idle.?capacity/i,
    positivePatterns: /throughput|utilization|productive|skilled|capacity/i,
    base: 66,
  },
  {
    dimensionId: "infrastructure",
    label: "Infrastructure",
    hintKeys: ["infrastructureHints"],
    negativePatterns: /latency|capacity.?limit|debt|fragile|single.?point/i,
    positivePatterns: /resilient|scalable|redundant|optimized|platform/i,
    base: 65,
  },
  {
    dimensionId: "operational_bottlenecks",
    label: "Operational Bottlenecks",
    hintKeys: ["bottleneckHints"],
    negativePatterns: /queue|delay|blocker|manual|handoff|approval.?lag/i,
    positivePatterns: /cleared|flow|automated|unblocked|streamlined/i,
    base: 62,
  },
];

let analysisSequence = 0;

/** Analyses EmpireAI state signals into a structured executive snapshot. */
export class EmpireStateAnalyzer {
  analyse(input: StrategicRecommendationInput): EmpireStateAnalysis {
    analysisSequence += 1;
    const dimensions = DIMENSIONS.map((def) => scoreDimension(def, input));
    const opportunitiesDetected = detect(
      [
        ...(input.opportunityHints ?? []),
        ...(input.businessPerformanceHints ?? []),
        ...(input.activeBusinessHints ?? []),
      ],
      /grow|expand|automat|upsell|market|efficien|retain|launch/i,
      [
        "Adjacent market expansion signal detected",
        "Automation leverage opportunity across operational bottlenecks",
        "Revenue upside available from under-monetized active businesses",
      ],
    );
    const risksDetected = detect(
      [
        ...(input.riskHints ?? []),
        ...(input.infrastructureHints ?? []),
        ...(input.workforcePerformanceHints ?? []),
        ...(input.empireStateHints ?? []),
      ],
      /risk|expos|vulnerab|compliance|security|outage|churn|debt/i,
      [
        "Strategic risk concentration around execution bottlenecks",
        "Infrastructure fragility may constrain scaled growth",
        "Workforce capacity risk if demand accelerates without optimization",
      ],
    );
    const bottlenecksDetected = detect(
      [...(input.bottleneckHints ?? []), ...(input.workforcePerformanceHints ?? [])],
      /bottleneck|queue|delay|manual|backlog|handoff/i,
      [
        "Manual approval lag constrains throughput",
        "Cross-team handoff friction slows mission completion",
      ],
    );

    const overallHealthScore = clamp(
      dimensions.reduce((sum, d) => sum + d.score, 0) / Math.max(1, dimensions.length),
    );

    return {
      analysisId: `rec-anl-${Date.now()}-${analysisSequence}`,
      timestamp: new Date().toISOString(),
      overallHealthScore,
      dimensions,
      opportunitiesDetected,
      risksDetected,
      bottlenecksDetected,
      summary:
        `EmpireAI health ${overallHealthScore}/100 across ${dimensions.length} dimensions; ` +
        `${opportunitiesDetected.length} opportunities, ${risksDetected.length} risks, ` +
        `${bottlenecksDetected.length} bottlenecks identified for executive recommendation.`,
    };
  }
}

export function resetAnalysisSequenceForTesting() {
  analysisSequence = 0;
}

function scoreDimension(def: DimensionDef, input: StrategicRecommendationInput): AnalysisDimensionScore {
  const hints = def.hintKeys.flatMap((key) => {
    const value = input[key];
    return Array.isArray(value) ? value : [];
  });
  let score = def.base;
  const findings: string[] = [];

  if (hints.length === 0) {
    findings.push(`${def.label}: no live signals supplied — using structural baseline`);
    score -= 4;
  }

  for (const hint of hints) {
    findings.push(`${def.label} signal: ${hint}`);
    if (def.negativePatterns.test(hint)) score -= 8;
    if (def.positivePatterns.test(hint)) score += 6;
  }

  return {
    dimensionId: def.dimensionId,
    label: def.label,
    score: clamp(score),
    findings: findings.slice(0, 6),
  };
}

function detect(sources: string[], pattern: RegExp, defaults: string[]): string[] {
  const matched = sources.map((s) => s.trim()).filter((s) => s && pattern.test(s));
  const combined = [...matched, ...defaults];
  return Array.from(new Set(combined)).slice(0, 6);
}
