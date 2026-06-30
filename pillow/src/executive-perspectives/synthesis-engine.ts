import { randomUUID } from "node:crypto";

import {
  countStances,
  isMinorityOpinion,
  runExecutivePerspectivesDebate,
} from "./debate-engine.js";
import type {
  ExecutivePerspectivesInput,
  ObjectiveAlignment,
  PerspectiveDissentRecord,
  PerspectiveOpinionRecord,
  PillowExecutiveDebateSession,
  PillowExecutivePerspectivesResult,
  PillowExecutiveRecommendation,
} from "./types.js";

function deriveObjectiveAlignment(
  input: ExecutivePerspectivesInput,
  opinions: PerspectiveOpinionRecord[],
): ObjectiveAlignment {
  if (!input.currentObjective) return "partial";
  const objectiveMentioned = input.proposalSummary
    .toLowerCase()
    .includes(input.currentObjective.toLowerCase().slice(0, 12));
  const supportCount = opinions.filter((o) => o.stance === "support").length;
  if (objectiveMentioned && supportCount >= 4) return "aligned";
  if (supportCount >= 2) return "partial";
  return "misaligned";
}

/** Pillow performs final synthesis — there is no separate CEO entity. */
function synthesizePillowRecommendation(
  input: ExecutivePerspectivesInput,
  opinions: PerspectiveOpinionRecord[],
): PillowExecutiveRecommendation {
  const stances = countStances(opinions);
  const supportWeight = stances.support + stances.caution * 0.5;
  const opposeWeight = stances.oppose + stances.neutral * 0.25;

  const opposeCount = stances.oppose + stances.caution;
  let recommendation: string;
  if (supportWeight >= opposeWeight + 2 && opposeCount > 0) {
    recommendation = `Proceed with ${input.topic} only after addressing challenged assumptions — Pillow does not agree blindly (Law 1).`;
  } else if (supportWeight >= opposeWeight + 2) {
    recommendation = `Proceed with ${input.topic} under Builder Mode and Grand King approval gates.`;
  } else if (supportWeight >= opposeWeight) {
    recommendation = `Proceed with a scoped pilot for ${input.topic} — validate profit and risk before full commitment.`;
  } else if (stances.oppose >= 3) {
    recommendation = `Defer ${input.topic} — internal perspectives identify material risk or misalignment with current objective.`;
  } else {
    recommendation = `Request further investigation on ${input.topic} before implementation commitment.`;
  }

  const financial = opinions.find((o) => o.perspectiveId === "FINANCIAL");
  const technology = opinions.find((o) => o.perspectiveId === "TECHNOLOGY");
  const risk = opinions.find((o) => o.perspectiveId === "RISK");
  const strategy = opinions.find((o) => o.perspectiveId === "STRATEGY");

  const avgConfidence = Math.round(
    opinions.reduce((sum, o) => sum + o.confidence, 0) / Math.max(1, opinions.length),
  );

  const evidence = opinions.flatMap((o) => o.challengesAssumptions).slice(0, 4);
  const assumptions = opinions.map((o) => `${o.title}: ${o.reasoning}`).slice(0, 4);
  const alternatives = opinions.flatMap((o) => o.alternatives).slice(0, 4);
  const rejectedAlternatives = opinions.flatMap((o) => o.rejectedAlternatives ?? []).slice(0, 4);

  return {
    recommendationId: randomUUID(),
    topic: input.topic,
    currentObjective: input.currentObjective,
    recommendation,
    reason: `Pillow synthesized ${opinions.length} executive perspectives into one recommendation. ${strategy?.reasoning ?? "Strategic alignment reviewed."} ${financial?.reasoning ?? ""}`.trim(),
    expectedProfitImpact:
      financial?.stance === "support"
        ? "Positive contribution to long-term net profit if executed with governance."
        : financial?.stance === "oppose"
          ? "Profit impact uncertain — defer until commercial validation improves."
          : "Moderate profit potential — monitor margin and ROI during pilot.",
    expectedEngineeringCost:
      technology?.stance === "oppose"
        ? "High — architecture and technical debt concerns require scoped approach."
        : technology?.stance === "support"
          ? "Acceptable within current engineering capacity."
          : "Moderate — factor maintainability and integration cost.",
    expectedRisk:
      risk?.risks[0] ??
      "Standard operational risk — mitigated by Grand King approval and Cursor sovereignty.",
    confidence: avgConfidence,
    evidence:
      evidence.length > 0
        ? evidence
        : ["Executive perspectives debate completed — evidence recorded internally"],
    assumptions,
    alternatives: alternatives.length > 0 ? alternatives : ["Defer until additional evidence is available"],
    rejectedAlternatives,
    objectiveAlignment: deriveObjectiveAlignment(input, opinions),
    status: "awaiting_grand_king",
    synthesizedAt: new Date().toISOString(),
    synthesizedBy: "pillow",
  };
}

function extractDissents(opinions: PerspectiveOpinionRecord[]): PerspectiveDissentRecord[] {
  return opinions
    .filter((opinion) => isMinorityOpinion(opinion, opinions))
    .map((opinion) => ({
      dissentId: randomUUID(),
      perspectiveId: opinion.perspectiveId,
      title: opinion.title,
      minorityOpinion: opinion.recommendation,
      reason: opinion.reasoning,
      confidence: opinion.confidence,
      tradeOff: opinion.risks[0],
    }));
}

/**
 * Grand King → Pillow → Executive Perspectives → Pillow Synthesis → Executive Recommendation
 */
export function runExecutivePerspectives(
  input: ExecutivePerspectivesInput,
): PillowExecutivePerspectivesResult {
  const opinions = runExecutivePerspectivesDebate(input);
  const dissents = extractDissents(opinions);
  const pillowRecommendation = synthesizePillowRecommendation(input, opinions);

  const debate: PillowExecutiveDebateSession = {
    debateId: randomUUID(),
    topic: input.topic,
    proposalSummary: input.proposalSummary,
    opinions,
    dissents,
    pillowRecommendation,
    debateCompletedAt: new Date().toISOString(),
    confidentiality: "internal_only",
  };

  return {
    debate,
    publicRecommendation: { ...pillowRecommendation },
    debateAvailable: true,
  };
}

export function formatExecutiveRecommendationForLlm(
  recommendation: PillowExecutiveRecommendation,
): string {
  return [
    "=== PILLOW EXECUTIVE RECOMMENDATION (Pillow synthesis — internal) ===",
    "There is ONE Pillow intelligence. Do not expose individual Executive Perspectives in the response.",
    "Grand King sees ONE recommendation only unless they explicitly request View Executive Debate.",
    "",
    `Recommendation: ${recommendation.recommendation}`,
    `Reason: ${recommendation.reason}`,
    `Confidence: ${recommendation.confidence}%`,
    `Objective alignment: ${recommendation.objectiveAlignment}`,
    `Expected profit impact: ${recommendation.expectedProfitImpact}`,
    `Expected engineering cost: ${recommendation.expectedEngineeringCost}`,
    `Expected risk: ${recommendation.expectedRisk}`,
    "",
    "Speak as Pillow with natural dialogue. Present the recommendation clearly when appropriate.",
    "Executive Perspectives never communicate with Cursor — only Grand King may approve execution.",
  ].join("\n");
}
