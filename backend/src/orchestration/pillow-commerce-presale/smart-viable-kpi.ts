/**
 * SMART viable listing KPI — CJ × Amazon US.
 * 1,000 is the immediate probability surface, not the end goal.
 * ACCEPTED ≠ BUYABLE ≠ SMART VIABLE.
 */

import { getPillowCommercePresaleRepository } from "./repository/sqlite-pillow-commerce-presale-repository.js";

export const SMART_VIABLE_LISTING_KPI = {
  target: 1000,
  supplier: "CJdropshipping",
  marketplace: "Amazon US",
  definition:
    "A listing counts as SMART VIABLE only after supplier stock/freight, Amazon eligibility, brand/IP filters, competitive economics, delivery promise, and dossier completeness pass. Raw CJ availability alone is insufficient.",
  sequence:
    "One-product = commissioning proof → Birth (GK) → continuous operation → build 1,000 SMART viable/listing-ready opportunities → pursue first real dollar across that surface → then 10,000+. First dollar is AFTER 1,000, not a prerequisite.",
  playgroundPrinciple:
    "SUPPLIER UNIVERSE × MARKETPLACE UNIVERSE × PILLOW INTELLIGENCE = probability-of-scale engine. Grand King + ChatGPT choose future integrations; Pillow operates installed corridors; Cursor implements approved additions. CJ×Amazon US is the first corridor, not the final universe.",
  winningNote:
    "Activity/API calls/listing volume alone are not winning. Pillow wins via sustainable realised economic value under governance and cost limits (Mission 006).",
} as const;

export type SmartViableKpiSnapshot = {
  computedAt: string;
  kpi: typeof SMART_VIABLE_LISTING_KPI;
  rawCandidatesDiscovered: number;
  candidatesEvaluated: number;
  rejected: number;
  smartViable: number;
  listingReady: number;
  awaitingApproval: number;
  published: number;
  buyable: number;
  orders: number;
  realisedRevenueUsd: number;
  realisedProfitUsd: number;
  distanceToTarget: number;
  topRejectionReasons: Array<{ reasonCode: string; count: number }>;
  latestCycleOutcome: string | null;
  publicationAttempted: false;
  supplierSpendAttempted: false;
  cursorRequiredForRoutineProgression: false;
  firstRealDollar: "NOT_YET_REALIZED";
  notes: string[];
};

export function buildSmartViableKpiSnapshot(workspaceId: string): SmartViableKpiSnapshot {
  const repo = getPillowCommercePresaleRepository();
  const latest = repo.getLatestCycle(workspaceId);
  const counts = repo.getFunnelCounts(workspaceId);
  const rejections = repo.aggregateRejectionReasons(workspaceId, 40);

  const smartViable = counts.approvalReady + counts.awaitingApproval + counts.approvedPendingPublish;
  const distance = Math.max(0, SMART_VIABLE_LISTING_KPI.target - smartViable);

  return {
    computedAt: new Date().toISOString(),
    kpi: SMART_VIABLE_LISTING_KPI,
    rawCandidatesDiscovered: counts.mappings + (latest?.candidatesRetrieved ?? 0),
    candidatesEvaluated: counts.evaluatedFromCycles,
    rejected: counts.rejectedFromCycles,
    smartViable,
    listingReady: counts.approvalReady,
    awaitingApproval: counts.awaitingApproval,
    published: counts.published,
    buyable: 0,
    orders: 0,
    realisedRevenueUsd: 0,
    realisedProfitUsd: 0,
    distanceToTarget: distance,
    topRejectionReasons: rejections,
    latestCycleOutcome: latest?.outcome ?? null,
    publicationAttempted: false,
    supplierSpendAttempted: false,
    cursorRequiredForRoutineProgression: false,
    firstRealDollar: "NOT_YET_REALIZED",
    notes: [
      "SMART viable counts use persisted approval-ready / awaiting-approval opportunities and maps — not raw CJ catalogue size.",
      "No publish/spend in discovery batch mode.",
      SMART_VIABLE_LISTING_KPI.sequence,
      SMART_VIABLE_LISTING_KPI.playgroundPrinciple,
      SMART_VIABLE_LISTING_KPI.winningNote,
    ],
  };
}
