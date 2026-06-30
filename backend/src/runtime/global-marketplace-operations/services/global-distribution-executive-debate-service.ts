import { buildExecutiveVisualDebate } from "../../executive-visual-debate/services/executive-visual-debate-service.js";
import type { GlobalDistributionPlan, GlobalDistributionDebate, DistributionClassification } from "../models/global-distribution-plan.js";

function classificationFromStance(stance: string, plan: GlobalDistributionPlan): DistributionClassification {
  if (stance === "REJECT") return "REJECT";
  if (plan.classification === "HIGH_CONFIDENCE" && stance === "PROCEED") return "HIGH_CONFIDENCE";
  if (stance === "PROCEED" || stance === "PROCEED_WITH_CAUTION") return plan.classification;
  return "WATCHLIST";
}

/** REAL-012 — Executive recommendation layer for global distribution. */
export function buildGlobalDistributionExecutiveDebate(
  workspaceId: string,
  companyId: string,
  plan: GlobalDistributionPlan,
): GlobalDistributionDebate {
  const debate = buildExecutiveVisualDebate(workspaceId, companyId, {
    topic: `Global distribution: ${plan.productTitle}`,
    subjectType: "expansion",
    subjectId: plan.productId,
    summary: `Should ${plan.productTitle} launch globally? Countries first: ${plan.countriesFirst.join(", ")}. Expected profit $${plan.totalExpectedProfitUsd.toLocaleString()}. Classification: ${plan.classification}.`,
    tags: ["REAL-012", "global-distribution", plan.classification],
  });

  const chiefCards = debate.chiefCards.map((chief) => ({
    ...chief,
    launchClassification: classificationFromStance(chief.stance, plan),
  }));

  const proceedChiefs = chiefCards.filter((c) => c.stance === "PROCEED" || c.stance === "PROCEED_WITH_CAUTION");
  const launchClassification: DistributionClassification =
    proceedChiefs.length >= 8 && plan.classification !== "REJECT"
      ? plan.classification
      : proceedChiefs.length >= 5
        ? "EXPERIMENT"
        : proceedChiefs.length >= 3
          ? "WATCHLIST"
          : "REJECT";

  return {
    debateId: debate.debateId,
    planId: plan.planId,
    topic: debate.topic,
    chiefCards,
    soulRecommendation: {
      summary: debate.soulRecommendation.summary,
      unifiedRecommendation: `${debate.soulRecommendation.unifiedRecommendation} Launch classification: ${launchClassification}.`,
      confidence: debate.soulRecommendation.confidence,
      expectedProfitUsd: plan.totalExpectedProfitUsd,
      expectedTimeDays: debate.soulRecommendation.expectedTimeDays,
      dissent: debate.soulRecommendation.dissent,
      launchClassification,
      countriesFirst: plan.countriesFirst,
      marketplacesFirst: plan.marketplacesFirst,
    },
    grandKingDecision: {
      decision: debate.grandKingDecision.decision ?? "PENDING",
      decidedAt: debate.grandKingDecision.decidedAt,
      rationale: debate.grandKingDecision.rationale,
    },
    missionId: "REAL-012",
    computedAt: new Date().toISOString(),
  };
}

export function recordGlobalDistributionKingDecision(
  debate: GlobalDistributionDebate,
  decision: "APPROVE" | "REJECT" | "REQUEST_FURTHER_INVESTIGATION",
  rationale?: string,
): GlobalDistributionDebate {
  return {
    ...debate,
    grandKingDecision: {
      decision,
      decidedAt: new Date().toISOString(),
      rationale,
    },
  };
}
