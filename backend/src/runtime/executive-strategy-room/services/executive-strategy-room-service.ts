import type { DebateContextInput } from "../../../executive-council/models/executive-core.js";
import { buildAiChiefOfCommerce } from "../../ai-chief-of-commerce/services/ai-chief-of-commerce-service.js";
import { buildAiChiefOfCustomer } from "../../ai-chief-of-customer/services/ai-chief-of-customer-service.js";
import { buildAiChiefOfGrowth } from "../../ai-chief-of-growth/services/ai-chief-of-growth-service.js";
import { buildExecutiveVisualDebate } from "../../executive-visual-debate/services/executive-visual-debate-service.js";
import type { ExecutiveStrategyRoom } from "../models/executive-strategy-room.js";

type StrategyItem = ExecutiveStrategyRoom["items"][number];

const STRATEGY_TOPICS: Array<{ topicId: string; label: string; context: DebateContextInput }> = [
  { topicId: "commercial", label: "Commercial strategy", context: { topic: "Commercial margin and pricing path to USD 100K", subjectType: "general", summary: "CCO commercial strategy" } },
  { topicId: "technology", label: "Technology strategy", context: { topic: "Technology infrastructure for live commerce", subjectType: "general", summary: "CTO technology readiness" } },
  { topicId: "finance", label: "Finance strategy", context: { topic: "Cash flow and capital allocation toward SUCCESS-001", subjectType: "general", summary: "CFO financial guardrails" } },
  { topicId: "operations", label: "Operations strategy", context: { topic: "Operational execution and fulfillment SLAs", subjectType: "general", summary: "CSCO operations path" } },
  { topicId: "growth", label: "Growth strategy", context: { topic: "Country and marketplace growth rollout", subjectType: "expansion", summary: "Growth expansion priorities" } },
  { topicId: "legal", label: "Legal strategy", context: { topic: "Marketplace ToS and regulatory compliance", subjectType: "general", summary: "CLO legal compliance" } },
  { topicId: "marketplace", label: "Marketplace strategy", context: { topic: "Amazon and multi-marketplace distribution", subjectType: "marketplace", summary: "CMO-Marketplace channel strategy" } },
  { topicId: "customer", label: "Customer strategy", context: { topic: "Customer trust, retention, and refund risk", subjectType: "general", summary: "CXO customer experience" } },
  { topicId: "supplier", label: "Supplier strategy", context: { topic: "Supplier selection and fulfillment attach", subjectType: "supplier", summary: "CSCO supplier fulfillment" } },
  { topicId: "risk", label: "Risk strategy", context: { topic: "Commercial and operational risk toward SUCCESS-001", subjectType: "general", summary: "CRO risk mitigation" } },
  { topicId: "ceo", label: "CEO strategy", context: { topic: "Empire-wide strategic priorities for USD 100K net profit", subjectType: "general", summary: "CEO empire direction" } },
  { topicId: "soul", label: "Soul synthesis", context: { topic: "Soul unified recommendation — recommend only", subjectType: "general", summary: "DOCTRINE-005 Soul synthesis" } },
  { topicId: "grand-king", label: "Grand King decision", context: { topic: "Grand King final authority on SUCCESS-001 path", subjectType: "general", summary: "Grand King decides — Soul recommends" } },
];

function strategyWhy(topic: string, profitUsd: number, stance: string): string {
  return `${topic} council stance ${stance} — $${profitUsd} expected contribution toward SUCCESS-001 net profit`;
}

/** REAL-085 — Executive strategy room (visual debate + AI chiefs). */
export function buildExecutiveStrategyRoom(
  workspaceId: string,
  companyId: string,
): ExecutiveStrategyRoom {
  const commerce = buildAiChiefOfCommerce(workspaceId, companyId);
  const growth = buildAiChiefOfGrowth(workspaceId, companyId);
  const customer = buildAiChiefOfCustomer(workspaceId, companyId);

  const items: StrategyItem[] = [];

  for (const { topicId, label, context } of STRATEGY_TOPICS) {
    const debate = buildExecutiveVisualDebate(workspaceId, companyId, context);
    const proceedCount = debate.chiefCards.filter((c) =>
      c.stance === "PROCEED" || c.stance === "PROCEED_WITH_CAUTION",
    ).length;
    const avgConfidence = Math.round(
      debate.chiefCards.reduce((s, c) => s + c.confidence, 0) / Math.max(debate.chiefCards.length, 1),
    );
    const status: StrategyItem["status"] = proceedCount >= 8 ? "READY"
      : proceedCount >= 5 ? "PENDING"
      : "BLOCKED";

    let chiefInsight = debate.soulRecommendation.unifiedRecommendation;
    if (topicId === "commercial") {
      chiefInsight = commerce.executiveRecommendations[0]?.title ?? chiefInsight;
    } else if (topicId === "growth") {
      chiefInsight = growth.growthRecommendations[0]?.title ?? chiefInsight;
    } else if (topicId === "customer") {
      chiefInsight = customer.customerRecommendations[0]?.title ?? chiefInsight;
    } else if (topicId === "soul") {
      chiefInsight = debate.soulRecommendation.summary;
    } else if (topicId === "grand-king") {
      chiefInsight = `Grand King decision: ${debate.grandKingDecision.decision ?? "PENDING"} — DOCTRINE-005`;
    }

    items.push({
      itemId: `strategy-${topicId}`,
      label,
      score: avgConfidence,
      status,
      recommendation: chiefInsight.slice(0, 200),
      evidence: `${proceedCount}/${debate.chiefCards.length} chiefs proceed · confidence ${avgConfidence}% · debate ${debate.debateId.slice(0, 8)}`,
      why: strategyWhy(label, debate.soulRecommendation.expectedProfitUsd, proceedCount >= 5 ? "PROCEED" : "DEFER"),
    });
  }

  const readyCount = items.filter((i) => i.status === "READY").length;
  const summary = `REAL-085 · Executive strategy room · ${readyCount}/${items.length} topics council-ready · visual debate only · Grand King decides`;

  return {
    moduleId: "executive-strategy-room",
    missionId: "REAL-085",
    workspaceId,
    companyId,
    summary,
    items,
    reusedModules: [
      "executive-visual-debate",
      "ai-chief-of-commerce",
      "ai-chief-of-growth",
      "ai-chief-of-customer",
      "executive-council",
    ],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
