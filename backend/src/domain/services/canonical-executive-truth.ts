/**
 * Canonical Executive Truth — single aggregation for Executive Home + Centres.
 * Seed/demo/portfolio showcase metrics are NEVER presented as realised LIVE commerce.
 */
import { listInstitutionalMemory } from "../../orchestration/executive-learning/institutional-memory-service.js";
import { getBirthRecord } from "../../orchestration/pillow-commissioning/birth.js";
import { buildCostGuardStatus } from "../../orchestration/pillow-commissioning/cost-guard.js";
import { listFlightEvents } from "../../orchestration/pillow-commissioning/flight-recorder.js";
import { getOneProductCommissioningRecord } from "../../orchestration/pillow-commissioning/one-product-commissioning.js";
import { buildPillowOperatingState } from "../../orchestration/pillow-commissioning/operating-state.js";
import { buildSinceLastVisitBrief } from "../../orchestration/pillow-commissioning/since-last-visit.js";
import { getPillowCommercePresaleRepository } from "../../orchestration/pillow-commerce-presale/repository/sqlite-pillow-commerce-presale-repository.js";
import { buildSmartViableKpiSnapshot } from "../../orchestration/pillow-commerce-presale/smart-viable-kpi.js";
import type { EnginePanelView, ExecutiveHomeView } from "./cockpit-panel-views.js";

export type GrandKingAttentionItem = {
  id: string;
  priority: "critical_system" | "money_approval" | "commercial_opportunity" | "important_decision" | "informational";
  title: string;
  detail: string;
  href: string | null;
  engineeringId?: string;
};

export type CanonicalCommerceOpportunity = {
  opportunityId: string;
  asin: string;
  cjPid: string;
  amazonSellerSku: string;
  productName: string;
  expectedProfitUsd: string;
  expectedMarginPct: string;
  offerPrice: string;
  disposition: string;
  approvalId: string | null;
  approvalStatus: string;
  summary: string;
  /** Grand King decision dossier summary when FD-CDD-001 present. */
  dossierSummary: string | null;
  brandRoute: string | null;
  pillowRecommendation: string | null;
  competingOffers: string | null;
  deliveryPromise: string | null;
};

export type CanonicalExecutiveTruth = {
  computedAt: string;
  systemOperational: boolean;
  brainStatus: "online" | "degraded" | "unknown";
  guardianStatus: string;
  productionStatus: string;
  commerceReadiness: string;
  /** Realised commerce economics only — null means not yet measured (never seed GMV). */
  realisedRevenueUsd: number | null;
  realisedOrders: number | null;
  realisedProfitUsd: number | null;
  portfolioCompaniesTotal: number;
  livePortfolioCompanies: number;
  /** Seed showcase companies are excluded from “live commerce businesses”. */
  seedPortfolioExcludedFromLiveEconomics: true;
  activeMissionTitle: string | null;
  activeMissionHuman: string;
  openMissionCount: number;
  pendingApprovals: number;
  pendingApprovalTitles: string[];
  currentObjectiveHuman: string;
  currentBlockers: Array<{ humanLabel: string; engineeringId?: string; current: boolean }>;
  commerceOpportunity: CanonicalCommerceOpportunity | null;
  pillowActivity: {
    institutionalMemoryLessons: number;
    institutionalMemoryCertified: boolean;
    pendingCommerceRecommendation: boolean;
    nextAutonomousAction: string;
  };
  grandKingAttention: GrandKingAttentionItem[];
  nextGrandKingAction: string;
  nextPillowAction: string;
  dataIntegrityNotes: string[];
  /** Mission 004 — honest operating posture (never generic LIVE). */
  pillowOperatingState: {
    state: string;
    humanLabel: string;
    currentFocus: string;
    lastHeartbeatAt: string | null;
    lastOperatingCycleAt: string | null;
    nextScheduledCycleAt: string | null;
    needsGrandKing: boolean;
    needsGrandKingReason: string | null;
    costGuardLevel: string;
    birthStatus: string;
    /** Mission 006 */
    activityMode: string;
    winningPurpose: string;
    winningOperatingQuestion: string;
  } | null;
  sinceLastVisit: {
    lastVisitAt: string | null;
    discovered: number;
    analysed: number;
    rejected: number;
    approvalsRequested: number;
    purchasesMade: number;
    aiApiCostIncurredUsd: number;
    latestMeaningfulActions: Array<{ at: string; type: string; summary: string }>;
    nextWork: string | null;
    needsGrandKing: boolean;
    needsGrandKingReason: string | null;
  } | null;
  costGuard: {
    level: string;
    hardStopActive: boolean;
    unconfiguredLimitKeys: string[];
    actualUsd: number;
    committedUsd: number;
    forecastUsd: number;
  } | null;
  birth: {
    status: string;
    birthTimestamp: string | null;
    technicallyReady: boolean;
    operatingAgeSeconds: number | null;
    gatesPassedCount: number;
    gatesTotal: number;
  } | null;
  oneProductCommissioning: {
    productName: string;
    supplier: string;
    marketplace: string;
    expectedProfit: string;
    pillowRecommendation: string;
    stage: string;
    buyable: false | "UNKNOWN";
    grandKingDecision: string;
    selectionAuthority: "pillow";
    cursorSelected: false;
    visualRoute: string;
  } | null;
  smartViableKpi: {
    smartViable: number;
    target: number;
    distanceToTarget: number;
    evaluated: number;
    rejected: number;
  } | null;
  flightRecorderLatest: Array<{ at: string; type: string; summary: string }>;
};

const SEED_COMPANY_NAME_RE = /^(Meridian Commerce|Vertex SaaS|Lumen Media|Atlas Fintech)$/i;

function humanizeBlocker(id: string, detail: string): string {
  if (/^B6/i.test(id) || /LWA|credential|Amazon/i.test(detail)) {
    return "Amazon US credentials or marketplace integration require attention.";
  }
  if (/^B5/i.test(id)) {
    return "Infrastructure health requires attention.";
  }
  if (/^B7|OAR|CRIR/i.test(id)) {
    return "Operational readiness gates remain open.";
  }
  if (/PROOF-001|first.?revenue/i.test(detail)) {
    return "First realised revenue validation is still open.";
  }
  return detail.replace(/^[A-Z0-9-]+[:\s]+/, "").trim() || detail;
}

function isSeedCompany(name: string): boolean {
  return SEED_COMPANY_NAME_RE.test(name.trim());
}

export function buildCanonicalExecutiveTruth(input: {
  workspaceId: string;
  command: ExecutiveHomeView["command"];
  portfolio: ExecutiveHomeView["portfolio"];
  engineSummaries: EnginePanelView[];
  pillowPendingApprovals: number;
  nextExecutiveAction: string;
  brainOnline?: boolean;
}): CanonicalExecutiveTruth {
  const { command, portfolio } = input;
  // Authoritative runtime health = operational readiness / Brain posture.
  // Engine panels mark FAILED for missing marketplace credentials and open
  // certification gates — that must NOT masquerade as Guardian/Production Critical.
  const readinessHealth = command.operationalReadiness.passed
    ? "Healthy"
    : command.operationalReadiness.percent >= 50
      ? "Degraded"
      : "Attention";
  const guardianStatus = readinessHealth;
  const productionStatus = readinessHealth;

  const livePortfolioCompanies = portfolio.companies.filter(
    (c) => c.status === "live" && !isSeedCompany(c.name),
  ).length;

  // Realised economics: SUCCESS-001 / command profit only — never seed portfolio GMV.
  const realisedProfitUsd =
    typeof command.success001?.currentNetProfitUsd === "number"
      ? command.success001.currentNetProfitUsd
      : null;
  const realisedRevenueUsd = realisedProfitUsd !== null && realisedProfitUsd === 0 ? 0 : null;
  const realisedOrders = realisedProfitUsd === 0 ? 0 : null;

  const omsTitle = (command.oms.activeObjective ?? "").trim();
  const awaitingImpl = /awaiting implementation/i.test(omsTitle);
  const activeMissionTitle =
    !omsTitle || awaitingImpl || /^no active/i.test(omsTitle) ? null : omsTitle;
  const openMissionCount = activeMissionTitle ? 1 : 0;

  let commerceOpportunity: CanonicalCommerceOpportunity | null = null;
  try {
    const pending = getPillowCommercePresaleRepository().getPendingApprovalOpportunity(
      input.workspaceId,
    );
    if (pending) {
      const d = pending.dossier;
      commerceOpportunity = {
        opportunityId: pending.opportunityId,
        asin: pending.mapping.asin,
        cjPid: pending.mapping.cjPid,
        amazonSellerSku: pending.mapping.amazonSellerSku,
        productName: pending.recommendation.productName,
        expectedProfitUsd: pending.recommendation.expectedProfit,
        expectedMarginPct: pending.recommendation.expectedMargin,
        offerPrice: pending.recommendation.proposedSellingPrice,
        disposition: pending.disposition,
        approvalId: pending.approvalId,
        approvalStatus: pending.approvalStatus,
        summary:
          d?.grandKingSummary?.split("\n").slice(0, 12).join(" · ") ??
          pending.recommendation.fullNarrative.split("\n").slice(0, 8).join(" · "),
        dossierSummary: d?.grandKingSummary ?? null,
        brandRoute: d?.eligibilityAndBrand.brandRoute ?? null,
        pillowRecommendation:
          d?.exposureAndAction.pillowRecommendation ?? pending.recommendation.pillowRecommendation,
        competingOffers:
          d?.marketplaceCompetition.competingOfferCount != null
            ? String(d.marketplaceCompetition.competingOfferCount)
            : d
              ? "UNKNOWN"
              : null,
        deliveryPromise: d?.demandFulfilmentRisk.delivery.customerExpectation ?? null,
      };
    }
  } catch {
    /* optional */
  }

  const pillowPending = Math.max(0, input.pillowPendingApprovals);
  const commandPending = Math.max(0, command.pendingApprovals.count);
  // Canonical count: max of gate queues + commerce opportunity (one opportunity = one decision).
  const commercePending = commerceOpportunity ? 1 : 0;
  const pendingApprovals = Math.max(commandPending, pillowPending, commercePending);

  const pendingApprovalTitles: string[] = [];
  if (command.pendingApprovals.top?.title) {
    pendingApprovalTitles.push(command.pendingApprovals.top.title);
  }
  if (commerceOpportunity) {
    pendingApprovalTitles.push(
      `Commerce opportunity ${commerceOpportunity.asin} — approval required`,
    );
  }

  const currentBlockers = Object.values(command.certificationBlockers)
    .filter((b) => b.status !== "closed")
    .map((b) => {
      const idDetail = `${b.id} ${b.detail}`;
      const isFirstRevenueGate = /B8|PROOF-001|first.?revenue/i.test(idDetail);
      const isSoftDispatch = /B7|Dispatch lite/i.test(idDetail);
      // First-revenue / soft dispatch gates are historical certification posture once
      // commerce pre-sale is live — not current production outages.
      const current = !(isFirstRevenueGate || isSoftDispatch);
      return {
        humanLabel: humanizeBlocker(b.id, b.detail),
        engineeringId: b.id,
        current,
      };
    });

  let institutionalMemoryLessons = 0;
  let institutionalMemoryCertified = false;
  try {
    const memories = listInstitutionalMemory(input.workspaceId);
    institutionalMemoryLessons = memories.length;
    institutionalMemoryCertified = memories.some(
      (m) => m.canonicalKey === "commerce.lesson.accepted_ne_buyable",
    );
  } catch {
    /* optional */
  }

  const attention: GrandKingAttentionItem[] = [];

  const seenAttention = new Set<string>();
  for (const blocker of currentBlockers.filter((b) => b.current)) {
    const key = blocker.humanLabel.toLowerCase();
    if (seenAttention.has(key)) continue;
    seenAttention.add(key);
    const amazonRelated = /Amazon|credential|marketplace/i.test(blocker.humanLabel);
    attention.push({
      id: `blocker-${blocker.engineeringId ?? blocker.humanLabel}`,
      priority: amazonRelated ? "important_decision" : "critical_system",
      title: blocker.humanLabel,
      detail: blocker.engineeringId
        ? `Engineering ref: ${blocker.engineeringId}`
        : "Current operational gate",
      href: amazonRelated ? "/cockpit/commerce/store" : "/cockpit/founder/production",
      engineeringId: blocker.engineeringId,
    });
  }

  if (pendingApprovals > 0 && commerceOpportunity) {
    attention.push({
      id: `commerce-${commerceOpportunity.opportunityId}`,
      priority: "money_approval",
      title: "Commerce opportunity requires Grand King approval",
      detail: `${commerceOpportunity.productName} · ASIN ${commerceOpportunity.asin} · ${commerceOpportunity.pillowRecommendation ?? "REVIEW"} · expected profit ${commerceOpportunity.expectedProfitUsd} · brand ${commerceOpportunity.brandRoute ?? "UNKNOWN"} · no publish/spend without approval`,
      href: "/cockpit/commerce/store",
    });
  } else if (pendingApprovals > 0) {
    attention.push({
      id: "pending-approvals",
      priority: "money_approval",
      title: `${pendingApprovals} approval(s) require Grand King decision`,
      detail: pendingApprovalTitles[0] ?? "Review pending approvals",
      href: "/cockpit/development/pillow",
    });
  }

  if (commerceOpportunity && pendingApprovals === 0) {
    attention.push({
      id: `opp-${commerceOpportunity.opportunityId}`,
      priority: "commercial_opportunity",
      title: "Qualified commerce opportunity ready",
      detail: `${commerceOpportunity.productName} · ${commerceOpportunity.expectedProfitUsd} expected profit`,
      href: "/cockpit/commerce/store",
    });
  }

  if (guardianStatus === "Attention" && productionStatus === "Attention") {
    attention.unshift({
      id: "health-attention",
      priority: "critical_system",
      title: "Operational readiness requires attention",
      detail: `Guardian: ${guardianStatus} · Production: ${productionStatus} · ${command.operationalReadiness.detail}`,
      href: "/cockpit/founder/production",
    });
  }

  const priorityRank: Record<GrandKingAttentionItem["priority"], number> = {
    critical_system: 0,
    money_approval: 1,
    commercial_opportunity: 2,
    important_decision: 3,
    informational: 4,
  };

  const dataIntegrityNotes = [
    "Seed portfolio GMV / demo margins are excluded from LIVE realised economics.",
    "Pending approval count includes Pillow gate + commerce opportunity awaiting owner decision.",
    "Mission empty state uses 'No active mission' — never 'Awaiting implementation' as current truth.",
    "Guardian/Production status uses operational readiness — not credential-gap engine FAILED flags.",
    "Pillow operating state never uses generic LIVE when truth is unknown.",
    "Birth timestamp is created only on Grand King authorisation — never invented.",
  ];

  let pillowOperatingState: CanonicalExecutiveTruth["pillowOperatingState"] = null;
  let sinceLastVisit: CanonicalExecutiveTruth["sinceLastVisit"] = null;
  let costGuard: CanonicalExecutiveTruth["costGuard"] = null;
  let birth: CanonicalExecutiveTruth["birth"] = null;
  let oneProductCommissioning: CanonicalExecutiveTruth["oneProductCommissioning"] = null;
  let smartViableKpi: CanonicalExecutiveTruth["smartViableKpi"] = null;
  let flightRecorderLatest: CanonicalExecutiveTruth["flightRecorderLatest"] = [];

  try {
    const op = buildPillowOperatingState(input.workspaceId);
    pillowOperatingState = {
      state: op.state,
      humanLabel: op.humanLabel,
      currentFocus: op.currentFocus,
      lastHeartbeatAt: op.lastHeartbeatAt,
      lastOperatingCycleAt: op.lastOperatingCycleAt,
      nextScheduledCycleAt: op.nextScheduledCycleAt,
      needsGrandKing: op.needsGrandKing,
      needsGrandKingReason: op.needsGrandKingReason,
      costGuardLevel: op.costGuardLevel,
      birthStatus: op.birthStatus,
      activityMode: op.activityMode,
      winningPurpose: op.winningPurpose,
      winningOperatingQuestion: op.winningOperatingQuestion,
    };
  } catch {
    /* optional */
  }

  try {
    const brief = buildSinceLastVisitBrief(input.workspaceId, { recordVisit: false });
    sinceLastVisit = {
      lastVisitAt: brief.lastVisitAt,
      discovered: brief.discovered,
      analysed: brief.analysed,
      rejected: brief.rejected,
      approvalsRequested: brief.approvalsRequested,
      purchasesMade: brief.purchasesMade,
      aiApiCostIncurredUsd: brief.aiApiCostIncurredUsd,
      latestMeaningfulActions: brief.latestMeaningfulActions,
      nextWork: brief.nextWork,
      needsGrandKing: brief.needsGrandKing,
      needsGrandKingReason: brief.needsGrandKingReason,
    };
  } catch {
    /* optional */
  }

  try {
    const cg = buildCostGuardStatus(input.workspaceId);
    costGuard = {
      level: cg.level,
      hardStopActive: cg.hardStopActive,
      unconfiguredLimitKeys: cg.unconfiguredLimitKeys,
      actualUsd:
        cg.spend.dailyAi.actualUsd +
        cg.spend.monthlyOperating.actualUsd +
        cg.spend.autonomousPaid.actualUsd,
      committedUsd:
        cg.spend.dailyAi.committedUsd +
        cg.spend.monthlyOperating.committedUsd +
        cg.spend.autonomousPaid.committedUsd,
      forecastUsd:
        cg.spend.dailyAi.forecastUsd +
        cg.spend.monthlyOperating.forecastUsd +
        cg.spend.autonomousPaid.forecastUsd,
    };
  } catch {
    /* optional */
  }

  try {
    const b = getBirthRecord(input.workspaceId);
    birth = {
      status: b.status,
      birthTimestamp: b.birthTimestamp,
      technicallyReady: b.technicallyReady,
      operatingAgeSeconds: b.operatingAgeSeconds,
      gatesPassedCount: b.gatesPassedCount,
      gatesTotal: b.gatesTotal,
    };
  } catch {
    /* optional */
  }

  try {
    const opc = getOneProductCommissioningRecord(input.workspaceId);
    if (opc) {
      oneProductCommissioning = {
        productName: opc.productName,
        supplier: opc.supplier,
        marketplace: opc.marketplace,
        expectedProfit: opc.expectedProfit,
        pillowRecommendation: opc.pillowRecommendation,
        stage: opc.stage,
        buyable: opc.buyable,
        grandKingDecision: opc.grandKingDecision,
        selectionAuthority: "pillow",
        cursorSelected: false,
        visualRoute: opc.visualAmazonOutput.route,
      };
    }
  } catch {
    /* optional */
  }

  try {
    const kpi = buildSmartViableKpiSnapshot(input.workspaceId);
    smartViableKpi = {
      smartViable: kpi.smartViable,
      target: kpi.kpi.target,
      distanceToTarget: kpi.distanceToTarget,
      evaluated: kpi.candidatesEvaluated,
      rejected: kpi.rejected,
    };
  } catch {
    /* optional */
  }

  try {
    flightRecorderLatest = listFlightEvents(input.workspaceId, { limit: 5 }).map((e) => ({
      at: e.recordedAt,
      type: e.eventType,
      summary: e.result ?? e.objective,
    }));
  } catch {
    flightRecorderLatest = [];
  }

  if (costGuard?.hardStopActive) {
    attention.unshift({
      id: "cost-guard-hard-stop",
      priority: "critical_system",
      title: "Cost Guard HARD STOP active",
      detail: "Paid autonomous activity is blocked until Grand King adjusts limits.",
      href: "/cockpit/finance/costs",
    });
  } else if (costGuard && costGuard.unconfiguredLimitKeys.length > 0) {
    attention.push({
      id: "cost-guard-unconfigured",
      priority: "important_decision",
      title: "Cost Guard limits need Grand King configuration",
      detail: `${costGuard.unconfiguredLimitKeys.length} limit(s) unconfigured — Pillow will not invent budgets.`,
      href: "/cockpit/finance/costs",
    });
  }

  if (birth?.status === "TECHNICALLY_READY_AWAITING_GRAND_KING") {
    attention.push({
      id: "birth-awaiting",
      priority: "important_decision",
      title: "Pillow birth technically ready — awaiting Grand King",
      detail: "No birth timestamp will be created until you authorise continuous operation.",
      href: COCKPIT_HOME_HREF,
    });
  }

  attention.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  return {
    computedAt: new Date().toISOString(),
    systemOperational: command.operationalReadiness.passed || guardianStatus !== "Attention",
    brainStatus: input.brainOnline === false ? "degraded" : "online",
    guardianStatus,
    productionStatus,
    commerceReadiness: command.proof001.achieved
      ? "First-revenue validated"
      : commerceOpportunity
        ? "Qualified opportunity awaiting approval"
        : "Commerce pre-sale active — no realised sale yet",
    realisedRevenueUsd,
    realisedOrders,
    realisedProfitUsd,
    portfolioCompaniesTotal: portfolio.companies.length,
    livePortfolioCompanies,
    seedPortfolioExcludedFromLiveEconomics: true,
    activeMissionTitle,
    activeMissionHuman: activeMissionTitle ?? "No active mission",
    openMissionCount,
    pendingApprovals,
    pendingApprovalTitles: [...new Set(pendingApprovalTitles)],
    currentObjectiveHuman: activeMissionTitle
      ? activeMissionTitle
      : commerceOpportunity
        ? "First-dollar dropshipping — opportunity pending Grand King approval"
        : "No active mission",
    currentBlockers,
    commerceOpportunity,
    pillowActivity: {
      institutionalMemoryLessons,
      institutionalMemoryCertified,
      pendingCommerceRecommendation: Boolean(commerceOpportunity),
      nextAutonomousAction: commerceOpportunity
        ? "Wait for Grand King approval, then continue pre-sale cycle without unauthorized publish/spend."
        : "Continue autonomous commerce discovery and surface the next qualified opportunity.",
    },
    grandKingAttention: attention.slice(0, 8),
    nextGrandKingAction:
      attention[0]?.title ??
      (pendingApprovals === 0 ? "No action required." : input.nextExecutiveAction),
    nextPillowAction: commerceOpportunity
      ? "Hold publication and supplier spend until Grand King decides."
      : "Observe → analyse → discover → validate → recommend.",
    dataIntegrityNotes,
    pillowOperatingState,
    sinceLastVisit,
    costGuard,
    birth,
    oneProductCommissioning,
    smartViableKpi,
    flightRecorderLatest,
  };
}

const COCKPIT_HOME_HREF = "/cockpit";
