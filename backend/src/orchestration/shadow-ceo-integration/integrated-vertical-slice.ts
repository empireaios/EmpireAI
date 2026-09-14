/**
 * Integration-owner vertical slice: control plane + synthetic commerce + authority.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  openShadowCeoRepository,
  runVerticalSliceDemo,
  verifyChainIntegrity,
  type VerticalSliceDemoResult,
} from "../shadow-ceo/index.js";
import {
  attemptExternalActionAndPersist,
  createApprovalRequestAndPersist,
  isApprovalGranted,
  MISSION_DEFAULT_MODE,
} from "../shadow-ceo-authority/index.js";
import {
  computeProfitLedger,
  seedSyntheticAmazonUsCatalog,
  unitEconomicsFromProduct,
  type TrueProfitLedger,
} from "../synthetic-commerce/index.js";
import {
  emptyCeoPerformanceCounters,
  finalizeTaskCompletionRate,
  type CeoPerformanceBaseline,
} from "./ceo-performance-counters.js";

export type IntegratedVerticalSliceResult = {
  controlPlane: VerticalSliceDemoResult;
  chainIntegrityIssues: ReturnType<typeof verifyChainIntegrity>;
  ledger: TrueProfitLedger;
  authority: {
    liveListingBlocked: boolean;
    pendingNotGranted: boolean;
    syntheticRunAllowed: boolean;
    approvalId: string;
  };
  restart: { recordCountStable: boolean; duplicatePrevented: boolean };
  cockpit: Record<string, unknown>;
  baseline: CeoPerformanceBaseline;
  birthStatus: "NOT_BORN";
  wave1: "0/24";
  realCommerceAuthorized: false;
};

export function runIntegratedVerticalSlice(opts?: {
  dbPath?: string;
  authorityDir?: string;
  runKey?: string;
}): IntegratedVerticalSliceResult {
  const tmp =
    opts?.dbPath ??
    path.join(fs.mkdtempSync(path.join(os.tmpdir(), "shadow-ceo-int-")), "slice.db");
  const authorityDir =
    opts?.authorityDir ?? path.join(path.dirname(tmp), "authority");
  const runKey = opts?.runKey ?? `integrated-${Date.now()}`;

  const repo = openShadowCeoRepository({ dbPath: tmp });
  const first = runVerticalSliceDemo({
    repo,
    workspaceId: "ws_shadow_ceo_integrated",
    runKey,
  });
  const count1 = repo.countByObjective(first.objectiveId);

  // Idempotent replay (restart simulation)
  repo.close();
  const repo2 = openShadowCeoRepository({ dbPath: tmp });
  const second = runVerticalSliceDemo({
    repo: repo2,
    workspaceId: "ws_shadow_ceo_integrated",
    runKey,
  });
  const count2 = repo2.countByObjective(second.objectiveId);
  const issues = verifyChainIntegrity(second.chain);

  const catalog = seedSyntheticAmazonUsCatalog();
  const product = catalog.products[0]!;
  const variant = product.variants[0]!;
  const ue = unitEconomicsFromProduct(product);
  const fees = product.amazonReferralFeeUsd + product.fbaOrSellerFeeUsd;
  const usdOpex = catalog.costCentres
    .filter((c) => c.currency === "USD")
    .reduce((a, c) => a + c.amount, 0);
  const ledger = computeProfitLedger(
    [
      {
        entryId: `syn-ledger-${second.objectiveId}`,
        synthetic: true,
        currency: "USD",
        revenue: product.listPriceUsd,
        productCost: variant.unitProductCostUsd,
        shipping: product.shippingEstimateUsd,
        fees,
        ads: product.adsSpendPerUnitUsd,
        refunds: 0,
        returns: 0,
        opex: usdOpex,
        productId: product.productId,
        notes: "SYNTHETIC experiment order — not live EmpireAI sales",
      },
    ],
    { ledgerId: `tpl-${second.objectiveId}`, currency: "USD" },
  );

  const liveAttempt = attemptExternalActionAndPersist(
    {
      kind: "listing",
      mode: MISSION_DEFAULT_MODE,
      approvalStatus: "pending",
      authorized: false,
    },
    authorityDir,
  );
  const approval = createApprovalRequestAndPersist(
    {
      kind: "listing",
      mode: MISSION_DEFAULT_MODE,
      reason: "Real Amazon listing outside SYNTHETIC authority",
      requestedAction: "Publish live Amazon US listing",
      whyRequired: "External marketplace side effect",
      financialExternalConsequence: "Real fees / inventory / customer exposure",
      optionsForGrandKing: ["deny", "defer_until_birth"],
    },
    authorityDir,
  );
  const synAttempt = attemptExternalActionAndPersist(
    {
      kind: "synthetic_experiment_run",
      mode: MISSION_DEFAULT_MODE,
      approvalStatus: "none",
      authorized: true,
    },
    authorityDir,
  );

  const counters = emptyCeoPerformanceCounters();
  counters.tasksAttempted = second.chain.tasks.length;
  counters.tasksCompletedWithEvidence = second.chain.tasks.filter(
    (t) => t.completion.status === "COMPLETED",
  ).length;
  counters.unauthorizedActionAttempts = liveAttempt.decision === "BLOCKED" ? 1 : 0;
  counters.outcomeLessonsCreated = second.chain.lesson ? 1 : 0;
  counters.relevantLessonTransfer = second.chain.brief ? 1 : 0;
  counters.executiveBriefCompleteness = second.chain.brief ? 1 : 0;
  const finalized = finalizeTaskCompletionRate(counters);

  const baseline: CeoPerformanceBaseline = {
    generatedAt: new Date().toISOString(),
    note: "BASELINE_ONLY — Birth residency thresholds not frozen",
    counters: finalized,
    birthStatus: "NOT_BORN",
    wave1: "0/24",
    realCommerceAuthorized: false,
  };

  const cockpit = {
    currentObjective: second.chain.objective,
    operatingMode: second.chain.objective.mode,
    assessment: second.chain.assessment,
    selectedPriorities: second.chain.priorities.map((p) => ({
      id: p.id,
      title: p.title,
      rank: p.rank,
    })),
    activeDecisions: second.chain.decision ? [second.chain.decision] : [],
    pendingApprovals: second.chain.approvals.filter(
      (a) => a.approvalStatus === "PENDING" || a.approvalStatus === "BLOCKED",
    ),
    activeTasks: second.chain.tasks.filter((t) => t.completion.status === "PENDING"),
    blockedTasks: second.chain.actions.filter((a) => a.executionStatus === "BLOCKED"),
    completedTasks: second.chain.tasks.filter((t) => t.completion.status === "COMPLETED"),
    expectedOutcomes: second.chain.outcome ? [second.chain.outcome.expectedResult] : [],
    actualOutcomes: second.chain.outcome ? [second.chain.outcome.actualResult] : [],
    cost: { opexUsd: ledger.totals.opex, source: "synthetic_true_profit_ledger" },
    realisedSyntheticProfitUsd: ledger.totals.realisedNetProfit,
    unitEconomics: ue,
    interventionCount: second.chain.interventions.length,
    lessonsCreated: second.chain.lesson ? [second.chain.lesson] : [],
    lessonsRetrieved: second.chain.brief ? [second.chain.brief.lessonId] : [],
    ceoCapabilityEvidence: baseline,
    unresolvedP0P1: [],
    birthStatus: "NOT_BORN",
    wave1: "0/24",
    externalActionLockStatus: "LOCKED",
    executiveBrief: second.chain.brief,
    authorityApprovalId: approval.approvalId,
    liveListingBlockedReason:
      liveAttempt.decision === "BLOCKED" ? liveAttempt.reason : null,
  };

  repo2.close();

  return {
    controlPlane: second,
    chainIntegrityIssues: issues,
    ledger,
    authority: {
      liveListingBlocked: liveAttempt.decision === "BLOCKED",
      pendingNotGranted: !isApprovalGranted("pending"),
      syntheticRunAllowed: synAttempt.decision === "ALLOWED",
      approvalId: approval.approvalId,
    },
    restart: {
      recordCountStable: count1 === count2,
      duplicatePrevented: count1 === count2 && first.objectiveId === second.objectiveId,
    },
    cockpit,
    baseline,
    birthStatus: "NOT_BORN",
    wave1: "0/24",
    realCommerceAuthorized: false,
  };
}
