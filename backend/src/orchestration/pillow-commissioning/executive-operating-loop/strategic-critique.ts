/**
 * Self-generated strategic critique — economically triggered (Tier-0/1).
 * Does not require an LLM call every cycle.
 */

import { randomUUID } from "node:crypto";
import type { CommercialSituation, StrategicHypothesis } from "./types.js";

export type CritiqueTrigger = {
  id: string;
  fired: boolean;
  reason: string;
  escalateToJudgment: boolean;
};

export function evaluateCritiqueTriggers(situation: CommercialSituation): CritiqueTrigger[] {
  const premium = situation.pricePremiumPct;
  const transit = situation.fulfilmentProfile.estimatedTransitDays;
  const spend = situation.gatedSpendRequiredUsd;
  const limit = situation.spendAuthorityLimitUsd;

  return [
    {
      id: "extreme_or_material_premium",
      fired: premium != null && premium >= 25,
      reason:
        premium != null
          ? `Price premium ${premium.toFixed(1)}% vs lowest competitor`
          : "Competitor price unknown",
      escalateToJudgment: premium != null && premium >= 50,
    },
    {
      id: "demand_unknown_with_positive_prior",
      fired:
        situation.demandEvidence !== "PRESENT" &&
        (situation.priorRecommendation === "APPROVE" ||
          (situation.expectedProfitUsd != null && situation.expectedProfitUsd > 0)),
      reason: "Expected profit / prior APPROVE without PRESENT demand evidence",
      escalateToJudgment: true,
    },
    {
      id: "slow_cross_border_fulfilment",
      fired: transit != null && transit >= 12,
      reason: transit != null ? `Estimated transit ${transit} days` : "Transit unknown",
      escalateToJudgment: transit != null && transit >= 18,
    },
    {
      id: "delivery_capability_unknown_or_no",
      fired: situation.supplierCanMeetDelivery !== "YES",
      reason: `supplierCanMeetDelivery=${situation.supplierCanMeetDelivery}`,
      escalateToJudgment: situation.supplierCanMeetDelivery === "NO",
    },
    {
      id: "zero_sales_after_publish",
      fired: situation.published && situation.orders === 0,
      reason: "Published with zero orders — outcome not task-complete",
      escalateToJudgment: situation.buyable === "YES",
    },
    {
      id: "supplier_cost_deterioration",
      fired:
        situation.supplierCostChangePct != null && situation.supplierCostChangePct >= 8,
      reason:
        situation.supplierCostChangePct != null
          ? `Supplier cost +${situation.supplierCostChangePct}%`
          : "No cost change",
      escalateToJudgment: true,
    },
    {
      id: "spend_exceeds_authority",
      fired:
        spend != null &&
        limit != null &&
        Number.isFinite(spend) &&
        Number.isFinite(limit) &&
        spend > limit,
      reason:
        spend != null && limit != null
          ? `Required spend $${spend} exceeds authority $${limit}`
          : "Authority comparison unavailable",
      escalateToJudgment: false,
    },
    {
      id: "state_changed",
      fired: Boolean(
        situation.previousStateFingerprint &&
          situation.previousStateFingerprint !== fingerprintSituation(situation),
      ),
      reason: "Business state fingerprint changed since last cycle",
      escalateToJudgment: false,
    },
  ];
}

export function fingerprintSituation(situation: CommercialSituation): string {
  return [
    situation.productName,
    situation.ourPriceUsd,
    situation.lowestCompetitorUsd,
    situation.demandEvidence,
    situation.supplierCanMeetDelivery,
    situation.fulfilmentProfile.estimatedTransitDays,
    situation.published,
    situation.buyable,
    situation.orders,
    situation.realisedRevenueUsd,
    situation.supplierCostChangePct,
    situation.priorRecommendation,
  ].join("|");
}

/**
 * Generate strategic hypotheses from fired triggers.
 * Questions are structural; answers are NOT pre-filled.
 */
export function generateStrategicHypotheses(
  situation: CommercialSituation,
  triggers: CritiqueTrigger[],
): StrategicHypothesis[] {
  const fired = new Set(triggers.filter((t) => t.fired).map((t) => t.id));
  const out: StrategicHypothesis[] = [];

  const push = (h: Omit<StrategicHypothesis, "id">) => {
    out.push({ id: randomUUID(), ...h });
  };

  if (fired.has("slow_cross_border_fulfilment") || fired.has("delivery_capability_unknown_or_no")) {
    push({
      kind: "logistics_fulfilment",
      question: "What is preventing competitive delivery economics or speed on this corridor?",
      investigation:
        "Investigate fulfilment alternatives: alternate warehouse regions, domestic-stocked substitutes, alternate shipping methods, alternate suppliers, alternate marketplace routes, price/margin adjustment, or abandon if logistics make the opportunity commercially weak.",
      expectedSignal: "Faster and/or cheaper deliverable route OR evidence that current route remains viable",
      estimatedInvestigationCost: "cheap",
      tier: "TIER_0",
      priorityScore: 92,
      requiresOwnerAuthority: false,
    });
    push({
      kind: "warehouse_route",
      question: "Is there a better warehouse or fulfilment route than the current origin?",
      investigation:
        "Compare available warehouse regions and shipping methods for the same/equivalent SKU without assuming any single warehouse is mandatory.",
      expectedSignal: "Documented warehouse/shipping options with cost and transit tradeoffs",
      estimatedInvestigationCost: "cheap",
      tier: "TIER_0",
      priorityScore: 90,
      requiresOwnerAuthority: false,
    });
  }

  if (fired.has("extreme_or_material_premium")) {
    push({
      kind: "pricing_competition",
      question: "What evidence contradicts selling at the current premium?",
      investigation:
        "Reassess competitor landscape, differentiation evidence, reprice options, and whether APPROVE/HOLD/REJECT is justified.",
      expectedSignal: "Competitor coverage + conversion rationale at proposed price, or reprice/hold",
      estimatedInvestigationCost: "cheap",
      tier: "TIER_0",
      priorityScore: 88,
      requiresOwnerAuthority: false,
    });
  }

  if (fired.has("demand_unknown_with_positive_prior")) {
    push({
      kind: "demand_evidence",
      question: "Which assumption may be wrong about customer demand at this price?",
      investigation:
        "Seek demand signals (rank, velocity proxies, category evidence). Challenge prior APPROVE if demand remains UNKNOWN.",
      expectedSignal: "PRESENT demand evidence or disposition change away from APPROVE",
      estimatedInvestigationCost: "moderate",
      tier: "TIER_1",
      priorityScore: 94,
      requiresOwnerAuthority: false,
    });
  }

  if (fired.has("zero_sales_after_publish")) {
    push({
      kind: "other",
      question: "Did we obtain the intended economic result, or only complete a task?",
      investigation:
        "Diagnose BUYABLE, visibility, price, delivery, listing health, exposure time — without hard-coding reprice.",
      expectedSignal: "Outcome diagnosis with next strategy",
      estimatedInvestigationCost: "cheap",
      tier: "TIER_0",
      priorityScore: 96,
      requiresOwnerAuthority: false,
    });
  }

  if (fired.has("supplier_cost_deterioration")) {
    push({
      kind: "margin_economics",
      question: "Do deteriorated supplier costs still support the commercial case?",
      investigation: "Recompute landed cost/margin; investigate alternate supplier or abandon.",
      expectedSignal: "Updated margin with keep/re-source/abandon recommendation",
      estimatedInvestigationCost: "cheap",
      tier: "TIER_0",
      priorityScore: 91,
      requiresOwnerAuthority: false,
    });
    push({
      kind: "supplier_sourcing",
      question: "Is there a better supplier for equivalent product quality and delivery?",
      investigation: "Search alternate suppliers and compare cost, reliability, and delivery.",
      expectedSignal: "Supplier alternatives with comparative economics",
      estimatedInvestigationCost: "moderate",
      tier: "TIER_1",
      priorityScore: 85,
      requiresOwnerAuthority: false,
    });
  }

  if (fired.has("spend_exceeds_authority")) {
    push({
      kind: "owner_authority",
      question: "What genuinely requires Grand King authority before proceeding?",
      investigation:
        "Complete autonomous diagnosis and package escalation; do not cross spend gate.",
      expectedSignal: "Owner escalation package with options and recommendation",
      estimatedInvestigationCost: "cheap",
      tier: "TIER_0",
      priorityScore: 99,
      requiresOwnerAuthority: true,
    });
  }

  // Always ask the winning question when any material trigger fired
  if (out.length > 0) {
    push({
      kind: "other",
      question: "What investigation can I perform autonomously now?",
      investigation: `Autonomous Tier-0/1 work on ${situation.productName} within current authority.`,
      expectedSignal: "At least one actionable investigation without owner spend",
      estimatedInvestigationCost: "cheap",
      tier: "TIER_0",
      priorityScore: 70,
      requiresOwnerAuthority: false,
    });
  }

  return out.sort((a, b) => b.priorityScore - a.priorityScore);
}
