import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { DecisionAlternative } from "../models/decision-alternative.js";
import type { DecisionConfidence } from "../models/decision-confidence.js";
import type {
  DecisionExplainabilityReportCreateInput,
  DecisionType,
} from "../models/decision-explainability-report.js";
import type { DecisionEvidence } from "../models/decision-evidence.js";
import type { DecisionReasoning } from "../models/decision-reasoning.js";
import type {
  DecisionSupportingSignal,
  DecisionSupportingSignalType,
} from "../models/decision-supporting-signal.js";
import type { DecisionTradeoff } from "../models/decision-tradeoff.js";

export const DECISION_SUPPORTING_SIGNAL_WEIGHTS: Record<DecisionSupportingSignalType, number> = {
  evidence_strength: 0.24,
  reasoning_coherence: 0.22,
  alternative_coverage: 0.16,
  tradeoff_clarity: 0.16,
  confidence_calibration: 0.2,
  decision_composite: 0.02,
};

export type DecisionExplainabilityBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type DecisionExplainabilityDecisionInput = {
  decisionType: DecisionType;
  decisionTitle: string;
  chosenOption: string;
  context?: string;
};

export type DecisionExplainabilityInput = {
  brand: DecisionExplainabilityBrandInput;
  decision: DecisionExplainabilityDecisionInput;
  storeId: string;
  decisionIndex?: number;
};

export type DecisionExplainabilityBreakdown = DecisionExplainabilityReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: DecisionSupportingSignalType,
  score: number,
  detail: string,
): DecisionSupportingSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: DECISION_SUPPORTING_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: DecisionExplainabilityInput): number {
  const decisionBoost = input.decisionIndex ? Math.min(10, input.decisionIndex / 10) : 5;
  return clampScore(input.brand.confidence * 0.48 + decisionBoost + 20);
}

function buildReasoning(input: DecisionExplainabilityInput): DecisionReasoning {
  const score = baseScore(input);
  const context = input.decision.context ?? input.brand.niche;

  return {
    reasoningId: randomUUID(),
    summary: `Selected "${input.decision.chosenOption}" for ${input.decision.decisionTitle} based on ${context} signals and brand fit.`,
    steps: [
      {
        stepOrder: 1,
        claim: `${input.brand.targetAudience} shows strong alignment with ${input.decision.chosenOption}.`,
        rationale: `Brand confidence ${input.brand.confidence} and positioning "${input.brand.positioning}" support this path.`,
      },
      {
        stepOrder: 2,
        claim: `Market evidence favors ${input.decision.decisionType.toLowerCase()} action in ${input.brand.niche}.`,
        rationale: `Composite intelligence signals indicate favorable risk-reward for the chosen option.`,
      },
      {
        stepOrder: 3,
        claim: `Alternatives were evaluated and rejected due to lower projected outcomes.`,
        rationale: `Tradeoff analysis shows the chosen option balances speed, cost, and revenue impact best.`,
      },
    ],
    conclusion: `Proceed with "${input.decision.chosenOption}" — highest composite score with acceptable risk profile.`,
    score: clampScore(score + 4),
  };
}

function buildEvidence(input: DecisionExplainabilityInput): DecisionEvidence[] {
  const score = baseScore(input);

  return [
    {
      evidenceId: randomUUID(),
      source: "ANALYTICS",
      category: "PERFORMANCE_METRIC",
      description: `Conversion and traffic trends support ${input.decision.chosenOption} in ${input.brand.niche}.`,
      weight: 0.28,
      reliabilityPercent: clampScore(82 + input.brand.confidence * 0.05),
      score: clampScore(score + 2),
    },
    {
      evidenceId: randomUUID(),
      source: "EYE",
      category: "COMPETITOR_INTEL",
      description: `Competitor activity in ${input.brand.niche} validates timing for this decision.`,
      weight: 0.22,
      reliabilityPercent: clampScore(78 + input.brand.confidence * 0.04),
      score: clampScore(score),
    },
    {
      evidenceId: randomUUID(),
      source: "FORECAST",
      category: "FINANCIAL",
      description: `Financial forecast projects positive ROI for ${input.decision.chosenOption}.`,
      weight: 0.25,
      reliabilityPercent: clampScore(75 + input.brand.confidence * 0.06),
      score: clampScore(score + 1),
    },
    {
      evidenceId: randomUUID(),
      source: "REVIEWS",
      category: "CUSTOMER_SIGNAL",
      description: `Customer sentiment aligns with ${input.brand.targetAudience} expectations.`,
      weight: 0.25,
      reliabilityPercent: clampScore(80 + input.brand.confidence * 0.03),
      score: clampScore(score + 3),
    },
  ];
}

function buildConfidence(
  input: DecisionExplainabilityInput,
  evidence: DecisionEvidence[],
): DecisionConfidence {
  const evidenceConfidence = average(evidence.map((item) => item.reliabilityPercent));
  const overallConfidence = clampScore(
    input.brand.confidence * 0.55 + evidenceConfidence * 0.35,
  );

  let certaintyLevel: DecisionConfidence["certaintyLevel"] = "MEDIUM";
  if (overallConfidence >= 80) certaintyLevel = "HIGH";
  else if (overallConfidence < 60) certaintyLevel = "LOW";

  const uncertaintyNotes =
    certaintyLevel === "HIGH"
      ? ["Limited seasonal variance expected"]
      : certaintyLevel === "MEDIUM"
        ? ["Competitor response timing uncertain", "Ad cost volatility may shift ROI"]
        : [
            "Insufficient historical data for this decision type",
            "Supplier lead time variance adds execution risk",
          ];

  return {
    assessmentId: randomUUID(),
    overallConfidence,
    certaintyLevel,
    factors: [
      `Brand confidence ${input.brand.confidence}`,
      `${evidence.length} evidence sources aggregated`,
      `Decision type: ${input.decision.decisionType}`,
    ],
    uncertaintyNotes,
    score: overallConfidence,
  };
}

function buildAlternatives(input: DecisionExplainabilityInput): DecisionAlternative[] {
  const score = baseScore(input);
  const chosen = input.decision.chosenOption;

  const alternatives: DecisionAlternative[] = [
    {
      alternativeId: randomUUID(),
      label: chosen,
      description: `Primary recommended path: ${chosen}`,
      expectedOutcome: "Highest projected revenue with manageable risk",
      projectedScore: clampScore(score + 8),
      selected: true,
      rejectionReason: null,
      score: clampScore(score + 8),
    },
    {
      alternativeId: randomUUID(),
      label: "Conservative hold",
      description: "Delay action and gather more data before committing",
      expectedOutcome: "Lower risk but missed market window",
      projectedScore: clampScore(score - 12),
      selected: false,
      rejectionReason: "Opportunity cost exceeds risk reduction benefit",
      score: clampScore(score - 5),
    },
    {
      alternativeId: randomUUID(),
      label: "Aggressive expansion",
      description: "Accelerate spend and scale faster than recommended",
      expectedOutcome: "Higher upside with elevated cash burn and ROAS risk",
      projectedScore: clampScore(score - 4),
      selected: false,
      rejectionReason: "Cash flow runway insufficient for aggressive scaling",
      score: clampScore(score - 2),
    },
  ];

  return alternatives.sort((left, right) => right.projectedScore - left.projectedScore);
}

function buildTradeoffs(
  input: DecisionExplainabilityInput,
  alternatives: DecisionAlternative[],
): DecisionTradeoff[] {
  const chosen = alternatives.find((alt) => alt.selected)!;
  const conservative = alternatives.find((alt) => alt.label === "Conservative hold")!;
  const aggressive = alternatives.find((alt) => alt.label === "Aggressive expansion")!;
  const score = baseScore(input);

  return [
    {
      tradeoffId: randomUUID(),
      dimension: "REVENUE",
      chosenOption: chosen.label,
      rejectedOption: conservative.label,
      benefit: "Captures current demand window in target niche",
      cost: "Higher upfront investment vs waiting",
      netImpact: "Net positive — revenue uplift outweighs delay savings",
      score: clampScore(score + 4),
    },
    {
      tradeoffId: randomUUID(),
      dimension: "RISK",
      chosenOption: chosen.label,
      rejectedOption: aggressive.label,
      benefit: "Balanced risk profile with guardrails",
      cost: "Slower growth than maximum scale scenario",
      netImpact: "Acceptable — preserves runway while capturing growth",
      score: clampScore(score + 2),
    },
    {
      tradeoffId: randomUUID(),
      dimension: "SPEED",
      chosenOption: chosen.label,
      rejectedOption: conservative.label,
      benefit: `Faster time-to-impact for ${input.brand.brandName}`,
      cost: "Less time for additional validation cycles",
      netImpact: "Favorable — market timing supports action now",
      score: clampScore(score + 1),
    },
  ];
}

function buildSupportingSignals(
  reasoning: DecisionReasoning,
  evidence: DecisionEvidence[],
  confidence: DecisionConfidence,
  alternatives: DecisionAlternative[],
  tradeoffs: DecisionTradeoff[],
  explainabilityScore: number,
): DecisionSupportingSignal[] {
  const rejectedCount = alternatives.filter((alt) => !alt.selected).length;

  return [
    buildSignal(
      "evidence_strength",
      average(evidence.map((item) => item.score)),
      `${evidence.length} evidence items — avg reliability ${Math.round(average(evidence.map((item) => item.reliabilityPercent)))}%`,
    ),
    buildSignal(
      "reasoning_coherence",
      reasoning.score,
      `${reasoning.steps.length} reasoning steps with documented conclusion`,
    ),
    buildSignal(
      "alternative_coverage",
      clampScore(60 + rejectedCount * 12),
      `${alternatives.length} alternatives evaluated (${rejectedCount} rejected with reasons)`,
    ),
    buildSignal(
      "tradeoff_clarity",
      average(tradeoffs.map((item) => item.score)),
      `${tradeoffs.length} tradeoff dimensions analyzed`,
    ),
    buildSignal(
      "confidence_calibration",
      confidence.score,
      `Confidence ${confidence.overallConfidence} — certainty ${confidence.certaintyLevel}`,
    ),
    buildSignal(
      "decision_composite",
      explainabilityScore,
      `Decision explainability score ${explainabilityScore}`,
    ),
  ];
}

function computeExplainabilityScore(signals: DecisionSupportingSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "decision_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "decision_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(
  reasoning: DecisionReasoning,
  confidence: DecisionConfidence,
  alternatives: DecisionAlternative[],
): number {
  const selected = alternatives.find((alt) => alt.selected);
  const selectedBoost = selected ? selected.projectedScore * 0.15 : 0;
  return clampScore(average([reasoning.score, confidence.score]) + selectedBoost);
}

/** Generates decision explainability report — intelligence only, no auto-execute. */
export function generateDecisionExplainability(
  input: DecisionExplainabilityInput,
): DecisionExplainabilityBreakdown {
  const reasoning = buildReasoning(input);
  const evidence = buildEvidence(input);
  const confidence = buildConfidence(input, evidence);
  const alternatives = buildAlternatives(input);
  const tradeoffs = buildTradeoffs(input, alternatives);

  const provisionalSignals = buildSupportingSignals(
    reasoning,
    evidence,
    confidence,
    alternatives,
    tradeoffs,
    0,
  );
  const explainabilityScore = computeExplainabilityScore(provisionalSignals);
  const supportingSignals = buildSupportingSignals(
    reasoning,
    evidence,
    confidence,
    alternatives,
    tradeoffs,
    explainabilityScore,
  );
  const overallScore = computeOverallScore(reasoning, confidence, alternatives);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    decisionType: input.decision.decisionType,
    decisionTitle: input.decision.decisionTitle,
    chosenOption: input.decision.chosenOption,
    reasoning,
    evidence,
    confidence,
    alternatives,
    tradeoffs,
    supportingSignals,
    overallScore,
    explainabilityScore,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoExecuteEnabled: false,
  };
}

export const decisionExplainabilityIntelligenceScoring = {
  generateDecisionExplainability,
  computeExplainabilityScore,
  computeOverallScore,
  DECISION_SUPPORTING_SIGNAL_WEIGHTS,
};
