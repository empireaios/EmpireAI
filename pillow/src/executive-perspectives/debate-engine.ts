import { createHash, randomUUID } from "node:crypto";

import { DEBATE_PERSPECTIVES, SUBJECT_RELEVANCE } from "./perspectives.js";
import type {
  ExecutivePerspectivesInput,
  ExecutivePerspective,
  PerspectiveOpinionRecord,
  PerspectiveStance,
} from "./types.js";

function hashSeed(input: string): number {
  const hex = createHash("sha256").update(input).digest("hex").slice(0, 8);
  return parseInt(hex, 16);
}

function stanceFromSeed(seed: number, relevance: number): PerspectiveStance {
  const score = (seed % 100) + relevance * 25;
  if (score >= 82) return "support";
  if (score >= 62) return "caution";
  if (score >= 38) return "neutral";
  return "oppose";
}

function buildPerspectiveRecommendation(
  stance: PerspectiveStance,
  perspective: ExecutivePerspective,
  topic: string,
): string {
  const focus = perspective.focus[0] ?? "perspective";
  switch (stance) {
    case "support":
      return `Support ${topic} — ${focus} assessment is favorable with guardrails.`;
    case "caution":
      return `Proceed with caution on ${topic} — monitor ${focus} during execution.`;
    case "oppose":
      return `Do not proceed with ${topic} yet — ${focus} concerns exceed current tolerance.`;
    default:
      return `Neutral on ${topic} — ${focus} requires more evidence before commitment.`;
  }
}

function evaluatePerspective(
  perspective: ExecutivePerspective,
  input: ExecutivePerspectivesInput,
  relevance: number,
): PerspectiveOpinionRecord {
  const seed = hashSeed(`${perspective.id}:${input.topic}:${input.proposalSummary}`);
  const stance = stanceFromSeed(seed, relevance);
  const confidence = Math.min(96, Math.max(38, Math.round(relevance * 55 + (seed % 40))));

  const risks =
    stance === "oppose" || stance === "caution"
      ? [
          `${perspective.title} identifies ${perspective.focus[0]} risk on this proposal`,
          "Assumptions may not hold under current Version 1 constraints",
        ]
      : [`Monitor ${perspective.focus[0]} during implementation`];

  const alternatives =
    stance === "oppose"
      ? [`Defer ${input.topic} until ${perspective.focus[0]} readiness improves`]
      : stance === "caution"
        ? ["Smaller scoped pilot before full commitment"]
        : [];

  const challengesAssumptions = [
    stance === "support"
      ? `${perspective.title} respectfully validates assumptions — truth above agreement (Law 1)`
      : `${perspective.title} challenges assumptions where evidence indicates a better decision (Law 1)`,
    ...(stance === "oppose" || stance === "caution"
      ? [`${perspective.title} challenges profit or feasibility assumptions in the proposal`]
      : []),
  ];

  return {
    opinionId: randomUUID(),
    perspectiveId: perspective.id,
    title: perspective.title,
    stance,
    recommendation: buildPerspectiveRecommendation(stance, perspective, input.topic),
    reasoning: `${perspective.title} evaluated "${input.topic}" through ${perspective.focus.join(", ")} (relevance ${Math.round(relevance * 100)}%).`,
    risks,
    alternatives,
    confidence,
    challengesAssumptions,
    rejectedAlternatives: stance === "oppose" ? alternatives : [],
  };
}

/** Internal perspective debate — Grand King is never interrupted by this process. */
export function runExecutivePerspectivesDebate(
  input: ExecutivePerspectivesInput,
): PerspectiveOpinionRecord[] {
  const subjectType = input.subjectType ?? "general";
  const relevanceMap = SUBJECT_RELEVANCE[subjectType] ?? SUBJECT_RELEVANCE.general!;

  return DEBATE_PERSPECTIVES.map((perspective) => {
    const relevance = relevanceMap[perspective.id] ?? 0.55;
    return evaluatePerspective(perspective, input, relevance);
  });
}

export function countStances(
  opinions: PerspectiveOpinionRecord[],
): Record<PerspectiveStance, number> {
  return opinions.reduce(
    (acc, opinion) => {
      acc[opinion.stance] += 1;
      return acc;
    },
    { support: 0, caution: 0, oppose: 0, neutral: 0 } as Record<PerspectiveStance, number>,
  );
}

export function isMinorityOpinion(
  opinion: PerspectiveOpinionRecord,
  opinions: PerspectiveOpinionRecord[],
): boolean {
  const stances = countStances(opinions);
  const majorityStance: PerspectiveStance =
    stances.support >= stances.caution && stances.support >= stances.oppose
      ? "support"
      : stances.caution >= stances.oppose
        ? "caution"
        : "oppose";
  return (
    opinion.stance !== majorityStance &&
    (opinion.stance === "oppose" || opinion.stance === "caution")
  );
}
