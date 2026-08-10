/**
 * Mission 007 — Portfolio Control Plane (exception-driven).
 * Reuses SMART funnel / flight events. Does NOT invent live Amazon listing truth.
 * Cursor is not the runtime operator.
 */

import { buildSmartViableKpiSnapshot } from "../pillow-commerce-presale/smart-viable-kpi.js";
import { listFlightEvents } from "./flight-recorder.js";
import { assessPostLaunchCommercialDeviations } from "./post-launch-commercial-deviation.js";
import type {
  AggregatedPortfolioException,
  MonitoringTier,
  PortfolioExceptionCode,
} from "./portfolio-exception-types.js";

export type {
  AggregatedPortfolioException,
  MonitoringTier,
  PortfolioExceptionCode,
} from "./portfolio-exception-types.js";

export type PortfolioControlPlaneSnapshot = {
  computedAt: string;
  architecture: "EXCEPTION_DRIVEN_CONTROL_PLANE";
  corridor: { supplier: string; marketplace: string };
  smartViable: number;
  target: number;
  evaluated: number;
  rejected: number;
  published: number;
  buyable: number;
  realisedRevenueUsd: number;
  realisedProfitUsd: number;
  monitoringTiers: Record<MonitoringTier, string>;
  aggregatedExceptions: AggregatedPortfolioException[];
  economicPriorityQueueHead: AggregatedPortfolioException | null;
  staleDataPolicy: string;
  costMeasurement: {
    status: "UNKNOWN" | "PARTIAL" | "ESTIMATED";
    note: string;
  };
  notes: string[];
};

export function buildPortfolioControlPlaneSnapshot(
  workspaceId: string,
): PortfolioControlPlaneSnapshot {
  const kpi = buildSmartViableKpiSnapshot(workspaceId);
  const flights = listFlightEvents(workspaceId, { limit: 40 });
  const postLaunch = assessPostLaunchCommercialDeviations(workspaceId);
  const now = new Date().toISOString();

  const aggregated: AggregatedPortfolioException[] = kpi.topRejectionReasons.map((r, idx) => {
    const code: PortfolioExceptionCode =
      r.reasonCode === "NO_AMAZON_ASIN"
        ? "NO_AMAZON_ASIN"
        : r.reasonCode === "QUALIFICATION_REQUIRED"
          ? "QUALIFICATION_GAP"
          : "POLICY_RISK";
    return {
      code,
      title:
        code === "NO_AMAZON_ASIN"
          ? "Products lack a confirmed Amazon catalogue match"
          : code === "QUALIFICATION_GAP"
            ? "Amazon eligibility could not be confirmed"
            : r.reasonCode.replace(/_/g, " ").toLowerCase(),
      affectedCount: r.count,
      corridor: "CJdropshipping × Amazon US",
      firstDetectedAt: flights[0]?.recordedAt ?? null,
      economicExposureUsd: null,
      confidence: "medium",
      recommendedPriority: 1000 - idx * 10 - Math.min(200, r.count),
      autoResolvable: false,
      pillowJudgmentRequired: true,
    };
  });

  for (const d of postLaunch.deviations) {
    if (!aggregated.some((a) => a.code === d.code && a.title === d.title)) {
      aggregated.push(d);
    }
  }
  aggregated.sort((a, b) => b.recommendedPriority - a.recommendedPriority);

  return {
    computedAt: now,
    architecture: "EXCEPTION_DRIVEN_CONTROL_PLANE",
    corridor: { supplier: "CJdropshipping", marketplace: "Amazon US" },
    smartViable: kpi.smartViable,
    target: kpi.kpi.target,
    evaluated: kpi.candidatesEvaluated,
    rejected: kpi.rejected,
    published: kpi.published,
    buyable: kpi.buyable,
    realisedRevenueUsd: kpi.realisedRevenueUsd,
    realisedProfitUsd: kpi.realisedProfitUsd,
    monitoringTiers: {
      HOT: "High exposure / high risk — frequent verification",
      ACTIVE: "Ordinary performing listings — normal cadence",
      COLD: "Stable low activity — less frequent",
      WATCH: "Temporary elevated monitoring after anomaly",
      UNKNOWN: "Freshness failure / connector problem — never appear healthy",
    },
    aggregatedExceptions: aggregated,
    economicPriorityQueueHead: aggregated[0] ?? null,
    staleDataPolicy:
      "Stale marketplace/supplier state must never be labelled healthy. Surface MONITORING UNKNOWN with last fresh timestamp.",
    costMeasurement: {
      status: "UNKNOWN",
      note: "Cost per 1,000 monitored listings requires measured provider + compute attribution — do not fabricate LIVE.",
    },
    notes: [
      "Live Amazon listing-state store is not fully populated until post-publish BUYABLE monitoring runs.",
      "Most monitoring must remain deterministic; Pillow judges material exceptions only.",
      "Cursor Ultra may analyse offline/rules; Cursor is not the cloud commerce operator.",
      ...kpi.notes,
    ],
  };
}
