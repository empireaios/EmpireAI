/**
 * Mission 007 — post-launch commercial deviation detection (exception-driven).
 *
 * Surfaces material weak/zero-sales conditions for Pillow judgment.
 * Does NOT hard-code commercial conclusions (e.g. "lower the price").
 * Pillow must assess BUYABLE, visibility, competitor price, margin, demand,
 * delivery, listing health, exposure time, orders/returns — then recommend.
 */

import { buildSmartViableKpiSnapshot } from "../pillow-commerce-presale/smart-viable-kpi.js";
import type {
  AggregatedPortfolioException,
  PortfolioExceptionCode,
} from "./portfolio-exception-types.js";

export type { AggregatedPortfolioException, PortfolioExceptionCode };

export type PostLaunchDeviationAssessment = {
  computedAt: string;
  publishedListings: number;
  buyableListings: number;
  orders: number;
  realisedRevenueUsd: number;
  deviations: AggregatedPortfolioException[];
  pillowJudgmentRequired: boolean;
  forbiddenHardCodedAdvice: string[];
  diagnosisChecklist: string[];
  allowedOutcomes: string[];
  notes: string[];
};

export function assessPostLaunchCommercialDeviations(
  workspaceId: string,
): PostLaunchDeviationAssessment {
  const kpi = buildSmartViableKpiSnapshot(workspaceId);
  const now = new Date().toISOString();
  const deviations: AggregatedPortfolioException[] = [];

  // Only meaningful after publications exist. Pre-publish: no fake zero-sales crisis.
  if (kpi.published > 0 && kpi.orders === 0 && kpi.realisedRevenueUsd === 0) {
    deviations.push({
      code: "ZERO_SALES_REVIEW",
      title: "Published offers have no realised sales yet",
      affectedCount: kpi.published,
      corridor: "CJdropshipping × Amazon US",
      firstDetectedAt: kpi.computedAt,
      economicExposureUsd: null,
      confidence: kpi.buyable > 0 ? "medium" : "low",
      recommendedPriority: 900,
      autoResolvable: false,
      pillowJudgmentRequired: true,
    });
  }

  if (kpi.published > 0 && kpi.buyable === 0) {
    deviations.push({
      code: "BUYABLE_FAILURE",
      title: "Published offers are not yet confirmed buyable on Amazon",
      affectedCount: kpi.published,
      corridor: "CJdropshipping × Amazon US",
      firstDetectedAt: kpi.computedAt,
      economicExposureUsd: null,
      confidence: "medium",
      recommendedPriority: 950,
      autoResolvable: false,
      pillowJudgmentRequired: true,
    });
  }

  deviations.sort((a, b) => b.recommendedPriority - a.recommendedPriority);

  return {
    computedAt: now,
    publishedListings: kpi.published,
    buyableListings: kpi.buyable,
    orders: kpi.orders,
    realisedRevenueUsd: kpi.realisedRevenueUsd,
    deviations,
    pillowJudgmentRequired: deviations.some((d) => d.pillowJudgmentRequired),
    forbiddenHardCodedAdvice: [
      "Do not instruct Pillow to lower price solely because there are no sales.",
      "Do not hard-code abandon/reprice/pause as the only allowed conclusion.",
    ],
    diagnosisChecklist: [
      "BUYABLE status",
      "offer visibility",
      "competitor price and price difference",
      "delivery promise",
      "expected vs realised margin",
      "demand evidence",
      "supplier status",
      "listing health",
      "time exposed",
      "orders/sales",
      "returns where relevant",
    ],
    allowedOutcomes: [
      "continue observing",
      "reprice",
      "pause",
      "investigate",
      "replace",
      "abandon",
      "escalate to Grand King",
      "another justified strategy",
    ],
    notes: [
      "Detection is deterministic; commercial conclusion belongs to Pillow judgment.",
      "Cursor Ultra may run offline simulation — Cursor is not the live operator.",
      kpi.published === 0
        ? "No published listings yet — zero-sales review is not applicable."
        : "Published surface exists — weak performance escalates as exception, not as a scripted price cut.",
    ],
  };
}
