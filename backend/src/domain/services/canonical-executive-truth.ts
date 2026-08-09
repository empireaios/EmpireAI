/**
 * Canonical Executive Truth — single aggregation for Executive Home + Centres.
 * Seed/demo/portfolio showcase metrics are NEVER presented as realised LIVE commerce.
 */
import { listInstitutionalMemory } from "../../orchestration/executive-learning/institutional-memory-service.js";
import { getPillowCommercePresaleRepository } from "../../orchestration/pillow-commerce-presale/repository/sqlite-pillow-commerce-presale-repository.js";
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
  attention.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  const nextGrandKingAction =
    attention[0]?.title ??
    (pendingApprovals === 0 ? "No action required." : input.nextExecutiveAction);

  const dataIntegrityNotes = [
    "Seed portfolio GMV / demo margins are excluded from LIVE realised economics.",
    "Pending approval count includes Pillow gate + commerce opportunity awaiting owner decision.",
    "Mission empty state uses 'No active mission' — never 'Awaiting implementation' as current truth.",
    "Guardian/Production status uses operational readiness — not credential-gap engine FAILED flags.",
  ];

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
    grandKingAttention: attention.slice(0, 6),
    nextGrandKingAction,
    nextPillowAction: commerceOpportunity
      ? "Hold publication and supplier spend until Grand King decides."
      : "Observe → analyse → discover → validate → recommend.",
    dataIntegrityNotes,
  };
}
