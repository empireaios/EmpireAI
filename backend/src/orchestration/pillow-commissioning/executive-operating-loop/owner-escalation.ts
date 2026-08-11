/**
 * Proactive Grand King escalation package — not a bare alert.
 */

import type {
  CommercialSituation,
  OwnerEscalationPackage,
  PrioritisedWorkItem,
  StrategicHypothesis,
} from "./types.js";
import type { LogisticsInvestigationResult } from "./logistics-investigation.js";

export function buildOwnerEscalationPackage(input: {
  situation: CommercialSituation;
  hypotheses: StrategicHypothesis[];
  selectedWork: PrioritisedWorkItem | null;
  logistics: LogisticsInvestigationResult;
  disposition: string;
  rationale: string;
}): OwnerEscalationPackage {
  const s = input.situation;
  const spend = s.gatedSpendRequiredUsd;
  const limit = s.spendAuthorityLimitUsd;

  return {
    whatIFound: [
      `${s.productName}`,
      `price=${s.ourPriceUsd ?? "UNKNOWN"} vs competitor=${s.lowestCompetitorUsd ?? "UNKNOWN"}`,
      `premium=${s.pricePremiumPct != null ? `${s.pricePremiumPct.toFixed(1)}%` : "UNKNOWN"}`,
      `demand=${s.demandEvidence}`,
      `delivery=${s.supplierCanMeetDelivery}`,
      `transitDays=${s.fulfilmentProfile.estimatedTransitDays ?? "UNKNOWN"}`,
      `orders=${s.orders}; realisedRevenue=${s.realisedRevenueUsd}`,
      input.logistics.triggered ? `logisticsTrigger=${input.logistics.reason}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    whyItMatters:
      "Material commercial outcome risk — continuing without owner judgment could waste capital, damage margin, or miss a better route.",
    whatIInvestigated: [
      ...input.hypotheses.slice(0, 6).map((h) => h.investigation),
      ...(input.logistics.triggered
        ? input.logistics.alternatives.slice(0, 4).map((a) => a.label)
        : []),
    ],
    options: [
      {
        id: "hold_for_evidence",
        summary: "Hold and gather missing evidence",
        tradeoff: "Delays launch; protects capital",
      },
      {
        id: "authorise_investigation_spend",
        summary: "Authorise bounded investigation/spend within a stated cap",
        tradeoff: spend != null ? `Needs up to $${spend}` : "Needs owner spend authority",
      },
      {
        id: "reprice_or_rework",
        summary: "Reprice / rework logistics / substitute product",
        tradeoff: "May preserve opportunity with lower margin or different route",
      },
      {
        id: "abandon",
        summary: "Abandon this candidate",
        tradeoff: "Opportunity cost if demand was real",
      },
    ],
    recommendation: `${input.disposition}: ${input.rationale}`,
    whatINeedYouToDecide:
      spend != null && limit != null && spend > limit
        ? `Whether to raise spend authority above $${limit} (requested ≈$${spend}) or choose hold/abandon/rework.`
        : "Whether to accept the recommended disposition and any gated next action.",
    whatIWillDoNext: input.selectedWork
      ? `Continue autonomous work on: ${input.selectedWork.title}`
      : "Monitor state deltas and re-enter the operating loop without crossing gated spend.",
    authorityGate:
      spend != null && limit != null && spend > limit
        ? `SPEND_GATE: required $${spend} > limit $${limit}`
        : "OWNER_JUDGMENT_GATE",
  };
}
