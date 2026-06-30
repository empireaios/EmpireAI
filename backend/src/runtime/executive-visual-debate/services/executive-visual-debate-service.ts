import { randomUUID } from "node:crypto";

import { runExecutiveDebate } from "../../../executive-council/services/executive-debate-engine.js";
import type { DebateContextInput } from "../../../executive-council/models/executive-core.js";
import {
  CHIEF_TITLES,
  VISUAL_DEBATE_CHIEF_IDS,
  type ChiefCard,
  type ExecutiveVisualDebate,
} from "../models/executive-visual-debate.js";

const CHIEF_IMPACT: Record<string, { profit: number; days: number; risk: string }> = {
  ceo: { profit: 5000, days: 30, risk: "Strategic misalignment delays USD 100K mission" },
  cco: { profit: 8000, days: 21, risk: "Commercial margin erosion" },
  cfo: { profit: 6000, days: 45, risk: "Cash flow timing mismatch" },
  csco: { profit: 4000, days: 14, risk: "Fulfillment SLA breach" },
  "cmo-marketplace": { profit: 7000, days: 21, risk: "Listing policy violation" },
  "cmo-marketing": { profit: 5500, days: 28, risk: "CAC exceeds margin" },
  cxo: { profit: 3500, days: 35, risk: "Refund rate elevation" },
  cro: { profit: 2000, days: 60, risk: "Compliance exposure" },
  cto: { profit: 1500, days: 14, risk: "Integration failure" },
  cko: { profit: 1000, days: 90, risk: "Repeated mistakes without learning" },
  cao: { profit: 2500, days: 7, risk: "Manual founder bottleneck" },
  clo: { profit: 1000, days: 45, risk: "Regulatory non-compliance" },
};

function stanceFromOpinion(recommendation: string): ChiefCard["stance"] {
  if (recommendation.toLowerCase().includes("do not proceed")) return "REJECT";
  if (recommendation.toLowerCase().includes("defer")) return "DEFER";
  if (recommendation.toLowerCase().includes("guardrails") || recommendation.toLowerCase().includes("caution")) {
    return "PROCEED_WITH_CAUTION";
  }
  return "PROCEED";
}

/** REAL-007 — Visual executive debate with Soul synthesis (DOCTRINE-004/005/006). */
export function buildExecutiveVisualDebate(
  workspaceId: string,
  companyId: string,
  context: DebateContextInput,
): ExecutiveVisualDebate {
  const session = runExecutiveDebate(workspaceId, companyId, context);

  const chiefCards: ChiefCard[] = VISUAL_DEBATE_CHIEF_IDS.map((executiveId) => {
    const opinion = session.opinions.find((o) => o.executiveId === executiveId);
    const impact = CHIEF_IMPACT[executiveId] ?? { profit: 1000, days: 30, risk: "Unknown risk" };
    const title = CHIEF_TITLES[executiveId] ?? executiveId;

    if (opinion) {
      return {
        executiveId,
        title,
        recommendation: opinion.recommendation,
        confidence: opinion.confidence,
        evidence: opinion.supportingEvidence,
        businessImpact: `${impact.profit >= 5000 ? "High" : "Moderate"} revenue potential toward USD 100K`,
        risk: impact.risk,
        expectedProfitUsd: impact.profit,
        expectedTimeDays: impact.days,
        stance: stanceFromOpinion(opinion.recommendation),
      };
    }

    return {
      executiveId,
      title,
      recommendation: `No strong view on ${context.topic} — defer to council consensus.`,
      confidence: 45,
      evidence: ["Insufficient context for this chief"],
      businessImpact: "Neutral pending further data",
      risk: impact.risk,
      expectedProfitUsd: impact.profit,
      expectedTimeDays: impact.days,
      stance: "DEFER",
    };
  });

  const proceedCount = chiefCards.filter((c) => c.stance === "PROCEED" || c.stance === "PROCEED_WITH_CAUTION").length;
  const avgConfidence = Math.round(chiefCards.reduce((s, c) => s + c.confidence, 0) / chiefCards.length);
  const totalProfit = chiefCards.reduce((s, c) => s + c.expectedProfitUsd, 0);

  const unifiedRecommendation =
    proceedCount >= 8
      ? `PROCEED: Council supports ${context.topic} with guardrails. Expected contribution $${totalProfit.toLocaleString()} toward SUCCESS-001.`
      : proceedCount >= 5
        ? `PROCEED WITH CAUTION: ${context.topic} viable but requires King review of top risks.`
        : `DEFER: Council lacks consensus — Grand King should request further investigation.`;

  const dissent = session.conflicts.map((c) => `${c.topic}: ${c.opposingExecutives.join(" vs ")}`);

  return {
    debateId: session.sessionId,
    workspaceId,
    companyId,
    topic: context.topic,
    subjectType: context.subjectType,
    chiefCards,
    soulRecommendation: {
      summary: `Soul synthesizes ${chiefCards.length} chief perspectives. DOCTRINE-005: recommend only — Grand King decides.`,
      unifiedRecommendation,
      confidence: avgConfidence,
      expectedProfitUsd: totalProfit,
      expectedTimeDays: Math.round(chiefCards.reduce((s, c) => s + c.expectedTimeDays, 0) / chiefCards.length),
      dissent,
    },
    grandKingDecision: {
      decision: session.decision?.soulApproved ? "APPROVE" : "PENDING",
      decidedAt: session.decision?.soulApproved ? session.completedAt ?? null : null,
      rationale: session.decision?.majorityRecommendation,
    },
    missionId: "REAL-007",
    computedAt: new Date().toISOString(),
  };
}

export function recordGrandKingDecision(
  debate: ExecutiveVisualDebate,
  decision: "APPROVE" | "REJECT" | "REQUEST_FURTHER_INVESTIGATION",
  rationale?: string,
): ExecutiveVisualDebate {
  return {
    ...debate,
    grandKingDecision: {
      decision,
      decidedAt: new Date().toISOString(),
      rationale,
    },
  };
}
