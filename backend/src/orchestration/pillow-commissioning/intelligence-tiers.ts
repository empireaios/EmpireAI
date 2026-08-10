/**
 * Cost-efficient intelligence architecture — tier map + scale optimisation report.
 * 24/7 operation ≠ continuous paid LLM generation.
 */

import { buildSmartViableKpiSnapshot } from "../pillow-commerce-presale/smart-viable-kpi.js";
import { buildScaleCostForecast } from "./cost-control-centre.js";
import { getOneProductCommissioningRecord } from "./one-product-commissioning.js";

export type IntelligenceTier = "TIER_0" | "TIER_1" | "TIER_2" | "TIER_3";

export type TierAssignment = {
  activity: string;
  tier: IntelligenceTier;
  rationale: string;
};

export const INTELLIGENCE_TIER_MAP: TierAssignment[] = [
  {
    activity: "CJ catalogue page fetch / stock / freight / PID dedupe",
    tier: "TIER_0",
    rationale: "Deterministic supplier API + software filters",
  },
  {
    activity: "Amazon restriction / qualification / ASIN presence preflight",
    tier: "TIER_0",
    rationale: "Deterministic marketplace preflight rules + institutional memory gates",
  },
  {
    activity: "Fee / landed cost / break-even / margin threshold rejection",
    tier: "TIER_0",
    rationale: "Arithmetic economics gates before any LLM",
  },
  {
    activity: "Duplicate / cannibalisation / already-mapped skip",
    tier: "TIER_0",
    rationale: "Persistent map + checkpoint resume",
  },
  {
    activity: "Competitive offer count / Featured Offer snapshots",
    tier: "TIER_1",
    rationale: "Low-cost structured marketplace reads when available",
  },
  {
    activity: "Dossier assembly narrative for Grand King",
    tier: "TIER_2",
    rationale: "Pillow executive reasoning on shortlisted candidates only",
  },
  {
    activity: "Executive chat / challenge price / recommendation dialogue",
    tier: "TIER_2",
    rationale: "Interactive Grand King ↔ Pillow reasoning",
  },
  {
    activity: "Birth authorisation / limit increases / irreversible publish-spend",
    tier: "TIER_3",
    rationale: "Grand King strategic authority only",
  },
  {
    activity: "Cursor Ultra build/audit/benchmark",
    tier: "TIER_3",
    rationale: "Development instrument — never runtime operator or product selector",
  },
];

export function buildScaleCostOptimisationReport(workspaceId: string) {
  const kpi = buildSmartViableKpiSnapshot(workspaceId);
  const forecast = buildScaleCostForecast(workspaceId);
  const commission = getOneProductCommissioningRecord(workspaceId);

  return {
    computedAt: new Date().toISOString(),
    preferredHypothesis: "Hybrid Pillow (Tier-0/1 heavy, Tier-2 selective)",
    tierMap: INTELLIGENCE_TIER_MAP,
    unnecessarilyLlmHeavyTasks: [
      "Do not use LLM for stock=0 rejection",
      "Do not use LLM for already-mapped CJ PID skip",
      "Do not use LLM for Anker/Proof-001 brand gate",
      "Do not invent heartbeat 'thoughts' to appear alive",
    ],
    eventDrivenDesign: [
      "Presale automation every 4h + boot tick",
      "Approval-gated publish/spend",
      "Cost Guard HARD STOP interrupts paid autonomous activity",
    ],
    batchingCacheReuse: [
      "CJ page checkpoint/resume",
      "ALREADY_MAPPED dedupe",
      "Institutional memory lessons reused before candidate analysis",
    ],
    separation: {
      telemetry: "health/metrics/heartbeats — not institutional memory",
      ledger: "Flight Recorder meaningful business events",
      memory: "Durable lessons only (bounded, authority-aware)",
    },
    benchmarks: {
      A_aiHeavy: {
        status: "NOT_MEASURED_IN_PRODUCTION",
        note: "Would route most filters through LLM — rejected as default",
      },
      B_hybrid: {
        status: "ACTIVE_ARCHITECTURE",
        note: "Current presale cycle is hybrid: deterministic funnel + selective dossier/chat",
      },
      C_cursorAssisted: {
        status: "BUILD_ONLY",
        note: "Cursor Ultra for build/audit/benchmark; isolated from production selections",
      },
    },
    cursorIsolationProof: {
      cursorSelectedCommissioningProduct: false,
      commissioningSelectionAuthority: commission?.selectionAuthority ?? null,
      cursorSelectedThousandPortfolio: false,
      note: "Real commissioning product and future 1,000 portfolio must be Pillow-generated",
    },
    unitEconomics: {
      evaluated: kpi.candidatesEvaluated,
      smartViable: kpi.smartViable,
      costPerRawCandidateUsd: forecast.costPerRawCandidateUsd,
      costPerSmartViableUsd: forecast.costPerSmartViableUsd,
      oneProductAttributableUsd: commission?.attributableCostUsd ?? null,
      confidence: forecast.confidence,
    },
    projections: forecast.scenarios,
    projectedMonthlyMonitoring1000Usd: forecast.monthlyMonitoring1000Usd,
    billingBlindSpots: [
      "Railway invoice API not wired",
      "Vercel invoice API not wired",
      "Provider max exposure UNKNOWN until owner caps configured",
    ],
    recommendedArchitecture:
      "Keep Hybrid Pillow: enlarge Tier-0 funnel, meter Tier-2, never continuous paid tokens for liveness.",
  };
}
