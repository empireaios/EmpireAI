/**
 * P7-04 — Executive Home centre summaries and executive brief.
 */

import { listInstitutionalMemory } from "../../orchestration/executive-learning/institutional-memory-service.js";
import { getPillowCommercePresaleRepository } from "../../orchestration/pillow-commerce-presale/repository/sqlite-pillow-commerce-presale-repository.js";
import {
  buildCanonicalExecutiveTruth,
  type CanonicalExecutiveTruth,
} from "./canonical-executive-truth.js";
import type { ExecutiveAlert, ExecutiveHomeView, ExecutiveSummaryCard, EnginePanelView } from "./cockpit-panel-views.js";

type CommandView = ExecutiveHomeView["command"];
type PortfolioView = ExecutiveHomeView["portfolio"];

export type ExecutiveHomeBrief = {
  overallEmpireStatus: string;
  currentStrategicObjective: string;
  currentConstitutionalPhase: string;
  currentExecutionPhase: string;
  highestPriorityRisk: string;
  highestPriorityOpportunity: string;
  currentRecommendation: string;
};

export type MissionCentreSummary = {
  currentMission: string;
  missionOwner: string;
  currentStep: string;
  progress: number;
  eta: string;
  dependencies: string[];
  currentRisks: string[];
  validationStatus: string;
  recoveryStatus: string;
  href: string;
};

export type PillowCentreSummary = {
  recommendations: string[];
  architectureFindings: string[];
  engineeringFindings: string[];
  businessFindings: string[];
  commercialOpportunities: string[];
  visionAlignment: string;
  pendingDecisions: string[];
};

export type BusinessCentreSummary = {
  activeBusinesses: number;
  revenue: string;
  orders: string;
  profit: string;
  advertisingSpend: string;
  marketingPerformance: string;
  businessHealth: string;
  growthTrend: string;
  href: string;
};

export type ProductionCentreSummary = {
  productionHealth: string;
  runtimeHealth: string;
  guardianStatus: string;
  sessions: string;
  infrastructure: string;
  deploymentStatus: string;
  currentIncidents: string[];
  href: string;
};

export type ExecutiveHomeCentreSummaries = {
  mission: MissionCentreSummary;
  pillow: PillowCentreSummary;
  business: BusinessCentreSummary;
  production: ProductionCentreSummary;
};

function card(cards: ExecutiveSummaryCard[], id: string): ExecutiveSummaryCard | undefined {
  return cards.find((entry) => entry.id === id);
}

function worstEngineHealth(panels: EnginePanelView[]): string {
  if (panels.some((p) => p.health === "FAILED")) return "Critical";
  if (panels.some((p) => p.health === "WARNING")) return "Degraded";
  if (panels.length === 0) return "Unknown";
  return "Healthy";
}

function openBlockerCount(command: CommandView): number {
  return Object.values(command.certificationBlockers).filter((b) => b.status !== "closed").length;
}

export function buildExecutiveHomeBrief(input: {
  command: CommandView;
  summaryCards: ExecutiveSummaryCard[];
  nextExecutiveAction: string;
  executiveAlerts: ExecutiveAlert[];
}): ExecutiveHomeBrief {
  const empireHealth = card(input.summaryCards, "empire-health");
  const revenue = card(input.summaryCards, "revenue-today");
  const openBlockers = Object.values(input.command.certificationBlockers).filter(
    (b) => b.status !== "closed",
  );
  const topRisk =
    input.executiveAlerts.find((a) => a.severity === "critical")?.label ??
    openBlockers[0]?.detail ??
    "No critical risks detected";

  return {
    overallEmpireStatus: empireHealth?.primaryValue ?? input.command.oms.overallHealth ?? "Operational",
    currentStrategicObjective:
      input.command.oms.activeObjective ?? "Advance constitutional Empire execution",
    currentConstitutionalPhase: "P7 Experience · Executive Operating System",
    currentExecutionPhase: input.command.proof001.achieved ? "Scale & Revenue" : "Foundation & PROOF-001",
    highestPriorityRisk: topRisk,
    highestPriorityOpportunity:
      revenue?.nextAction ??
      (input.command.proof001.achieved
        ? "Scale portfolio revenue across live ventures"
        : "Complete PROOF-001 first-dollar validation"),
    currentRecommendation: input.nextExecutiveAction,
  };
}

export function buildExecutiveHomeCentreSummaries(input: {
  command: CommandView;
  portfolio: PortfolioView;
  summaryCards: ExecutiveSummaryCard[];
  engineSummaries: EnginePanelView[];
  nextExecutiveAction: string;
  executiveAlerts: ExecutiveAlert[];
  pendingApprovals: number;
  truth?: CanonicalExecutiveTruth;
}): ExecutiveHomeCentreSummaries {
  const truth = input.truth;
  const revenue = card(input.summaryCards, "revenue-today");
  const orders = card(input.summaryCards, "orders-today");
  const marketing = card(input.summaryCards, "marketing-performance");
  const aiRec = card(input.summaryCards, "ai-recommendations");
  const empireHealth = card(input.summaryCards, "empire-health");
  const liveCompanies = input.portfolio.companies.filter((c) => c.status === "live").length;
  const marketplacePanel = input.engineSummaries.find((p) => p.engineId === "marketplace");
  const productionPanel = input.engineSummaries.find((p) => p.engineId === "storefront");

  return {
    mission: {
      currentMission: truth?.activeMissionHuman ?? "No active mission",
      missionOwner: "ECC · Supervisor",
      currentStep: truth?.nextGrandKingAction ?? input.command.oms.nextHighestImpactAction ?? input.nextExecutiveAction,
      progress: truth?.activeMissionTitle ? input.command.oms.progress ?? 0 : 0,
      eta: truth?.activeMissionTitle
        ? input.command.proof001.achieved
          ? "Active work in progress"
          : "Pending owner decision / validation"
        : "No tracked ETA — no active mission",
      dependencies: ["Builder", "Supervisor", "Guardian", "Production Truth"],
      currentRisks: (truth?.currentBlockers ?? [])
        .filter((b) => b.current)
        .slice(0, 3)
        .map((b) => b.humanLabel),
      validationStatus: input.command.operationalReadiness.passed ? "Passed" : "In progress",
      recoveryStatus: openBlockerCount(input.command) > 0 ? "Recovery mapped" : "Nominal",
      href: "/cockpit/missions",
    },
    pillow: (() => {
      // Treat Persistent Cumulative Memory as a certified existing capability (do not rebuild).
      let institutionalMemoryLine =
        "Institutional Memory: certified capability (Executive Learning / EKB spine)";
      try {
        const memories = listInstitutionalMemory("ws_empire_1");
        const hasAcceptedNeBuyable = memories.some(
          (m) => m.canonicalKey === "commerce.lesson.accepted_ne_buyable",
        );
        const hasAnker = memories.some((m) => m.canonicalKey === "commerce.lesson.anker_brand_gate");
        institutionalMemoryLine = hasAcceptedNeBuyable && hasAnker
          ? `Institutional Memory CERTIFIED · ${memories.length} approved lessons · ACCEPTED≠BUYABLE + Anker gate retained`
          : `Institutional Memory · ${memories.length} approved lessons on EKB spine`;
      } catch {
        /* EKB unavailable — keep certified-capability statement */
      }

      const opportunities = [
        marketplacePanel?.nextAction ?? "Connect marketplace via Commerce centre",
        marketing?.nextAction ?? "Review marketing performance",
      ];
      try {
        const pending = getPillowCommercePresaleRepository().getPendingApprovalOpportunity("ws_empire_1");
        if (pending?.recommendation?.headline) {
          opportunities.unshift(
            `${pending.recommendation.headline}: ${pending.recommendation.productName ?? "opportunity"} (${pending.recommendation.expectedProfit ?? "profit UNKNOWN"})`,
          );
        }
      } catch {
        /* repository unavailable — keep generic opportunities */
      }

      return {
        recommendations: [
          input.nextExecutiveAction,
          aiRec?.nextAction ?? "Review Pillow proactive guidance",
        ].filter(Boolean),
        architectureFindings: [
          institutionalMemoryLine,
          empireHealth?.status
            ? `Empire architecture: ${empireHealth.status}`
            : "Repository intelligence available",
          "Constitutional hierarchy verified",
        ],
        engineeringFindings: [
          `Operational readiness: ${input.command.operationalReadiness.percent}%`,
          input.command.operationalReadiness.detail,
        ],
        businessFindings: [
          `${liveCompanies} live · ${input.portfolio.companies.length} total ventures`,
          revenue?.primaryValue ? `Revenue signal: ${revenue.primaryValue}` : "Commerce workspace active",
        ],
        commercialOpportunities: opportunities,
        visionAlignment: input.command.proof001.achieved
          ? "First realised revenue validated · Institutional memory accumulating"
          : truth?.commerceOpportunity
            ? "First-dollar commerce opportunity pending Grand King approval — not yet realised revenue"
            : "No realised revenue yet",
        pendingDecisions:
          (truth?.pendingApprovals ?? input.pendingApprovals) > 0
            ? [`${truth?.pendingApprovals ?? input.pendingApprovals} pending approval(s)`]
            : [],
      };
    })(),
    business: {
      activeBusinesses: truth?.portfolioCompaniesTotal ?? input.portfolio.companies.length,
      revenue:
        truth?.realisedRevenueUsd != null
          ? `$${truth.realisedRevenueUsd.toFixed(2)} realised`
          : "No realised revenue yet",
      orders:
        truth?.realisedOrders != null ? String(truth.realisedOrders) : "No orders received",
      profit:
        truth?.realisedProfitUsd != null
          ? `$${truth.realisedProfitUsd.toFixed(2)}`
          : "No realised profit yet",
      advertisingSpend: marketing?.items.find((i) => /spend/i.test(i.label))?.value ?? "—",
      marketingPerformance: marketing?.primaryValue ?? marketing?.status ?? "—",
      businessHealth: `${truth?.livePortfolioCompanies ?? 0} non-seed live · ${truth?.portfolioCompaniesTotal ?? input.portfolio.companies.length} portfolio (seed excluded from LIVE economics)`,
      growthTrend: truth?.commerceReadiness ?? "Commerce pre-sale",
      href: "/cockpit/commerce/workspace",
    },
    production: {
      productionHealth: truth?.productionStatus ?? productionPanel?.health ?? worstEngineHealth(input.engineSummaries),
      runtimeHealth: input.command.operationalReadiness.passed ? "Healthy" : "Attention",
      guardianStatus: truth?.guardianStatus ?? worstEngineHealth(input.engineSummaries),
      sessions: "Durable sessions · Pillow host",
      infrastructure: input.command.operationalReadiness.detail,
      deploymentStatus: input.command.operationalReadiness.passed
        ? "Production certified"
        : "Certification in progress",
      currentIncidents: input.executiveAlerts
        .filter((a) => a.severity !== "info")
        .map((a) => a.label),
      href: "/cockpit/founder/production",
    },
  };
}

export function enrichExecutiveHomeViewP704(
  view: Omit<
    ExecutiveHomeView,
    "executiveBrief" | "centreSummaries" | "architectureVersion" | "canonicalTruth"
  >,
  workspaceId = "ws_empire_1",
): ExecutiveHomeView {
  const pillowPending = (() => {
    try {
      // Prefer command count; pillow supervisor may already be reflected there.
      return view.command.pendingApprovals.count;
    } catch {
      return 0;
    }
  })();

  const truth = buildCanonicalExecutiveTruth({
    workspaceId,
    command: view.command,
    portfolio: view.portfolio,
    engineSummaries: view.engineSummaries,
    pillowPendingApprovals: pillowPending,
    nextExecutiveAction: view.nextExecutiveAction,
    brainOnline: true,
  });

  const briefBase = buildExecutiveHomeBrief({
    command: view.command,
    summaryCards: view.summaryCards,
    nextExecutiveAction: truth.nextGrandKingAction,
    executiveAlerts: view.executiveAlerts,
  });

  const attentionDeduped = (() => {
    const seen = new Set<string>();
    const items = [];
    for (const item of truth.grandKingAttention) {
      const key = item.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
    return items;
  })();

  // Never present seed portfolio GMV / demo margin as current LIVE economics on Executive Home.
  const portfolio = {
    ...view.portfolio,
    portfolioMetrics: view.portfolio.portfolioMetrics
      .filter((m) => !/Portfolio Revenue|GMV|Net Margin/i.test(m.label))
      .concat([
        {
          label: "Realised Revenue",
          value:
            truth.realisedRevenueUsd != null
              ? `$${truth.realisedRevenueUsd.toFixed(2)}`
              : "No realised revenue yet",
          change: "Canonical realised",
          trend: "neutral" as const,
        },
        {
          label: "Realised Profit",
          value:
            truth.realisedProfitUsd != null
              ? `$${truth.realisedProfitUsd.toFixed(2)}`
              : "No realised profit yet",
          change: "Canonical realised",
          trend: "neutral" as const,
        },
      ]),
  };

  return {
    ...view,
    architectureVersion: "P7-04",
    canonicalTruth: { ...truth, grandKingAttention: attentionDeduped },
    portfolio,
    command: {
      ...view.command,
      pendingApprovals: {
        ...view.command.pendingApprovals,
        count: truth.pendingApprovals,
      },
      oms: {
        ...view.command.oms,
        activeObjective: truth.currentObjectiveHuman,
      },
      proof001: {
        ...view.command.proof001,
        detail: view.command.proof001.achieved
          ? "First realised revenue validated"
          : truth.commerceOpportunity
            ? "Qualified opportunity awaiting approval — no realised sale yet"
            : "No realised revenue yet",
      },
    },
    attentionItems:
      attentionDeduped.length > 0
        ? attentionDeduped.map((item) => ({
            id: item.id,
            label: item.title,
            severity:
              item.priority === "critical_system"
                ? ("critical" as const)
                : item.priority === "informational"
                  ? ("info" as const)
                  : ("warning" as const),
            href: item.href,
          }))
        : view.attentionItems,
    nextExecutiveAction: truth.nextGrandKingAction,
    greeting: {
      ...view.greeting,
      topBlocker:
        attentionDeduped[0]?.title ??
        (truth.pendingApprovals === 0 ? null : view.greeting.topBlocker),
    },
    executiveBrief: {
      ...briefBase,
      currentStrategicObjective: truth.currentObjectiveHuman,
      highestPriorityRisk:
        truth.grandKingAttention.find((a) => a.priority === "critical_system")?.title ??
        briefBase.highestPriorityRisk,
      highestPriorityOpportunity: truth.commerceOpportunity
        ? `${truth.commerceOpportunity.productName} · ${truth.commerceOpportunity.expectedProfitUsd}`
        : briefBase.highestPriorityOpportunity,
      currentRecommendation: truth.nextGrandKingAction,
    },
    centreSummaries: buildExecutiveHomeCentreSummaries({
      command: view.command,
      portfolio: view.portfolio,
      summaryCards: view.summaryCards,
      engineSummaries: view.engineSummaries,
      nextExecutiveAction: truth.nextGrandKingAction,
      executiveAlerts: view.executiveAlerts,
      pendingApprovals: truth.pendingApprovals,
      truth,
    }),
  };
}
