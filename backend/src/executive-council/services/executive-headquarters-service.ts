import type { ExecutiveHeadquartersDashboard } from "../models/executive-dashboard.js";
import { EXECUTIVE_COMMERCIAL_WORKFLOW } from "../models/executive-workflow.js";
import { initializeExecutiveRegistry, listRegisteredExecutives, getActiveExecutives } from "./executive-registry-service.js";
import { getLatestDebateSession, listDebateSessions } from "./executive-debate-engine.js";
import { listActiveExecutiveMissions, listExecutiveMissions } from "./executive-mission-generator.js";
import { buildCisMissionControlDashboard } from "../../runtime/commerce-intelligence-studio/services/cis-mission-control-service.js";
import { buildAccessDashboard } from "../../operational-access/services/access-dashboard-service.js";
import { buildSupplierDashboard } from "../../supplier-intelligence/services/supplier-dashboard-service.js";
import { buildExecutiveSupplierBriefing } from "../../supplier-intelligence/services/executive-supplier-briefing-service.js";
import { buildGlobalMarketplaceDistributionDashboard } from "../../runtime/global-marketplace-operations/services/global-marketplace-distribution-dashboard-service.js";

/** EC-005 + EC-010 — Executive Dashboard and Executive Headquarters (primary home screen data). */
export function buildExecutiveHeadquartersDashboard(
  workspaceId: string,
  companyId: string,
): ExecutiveHeadquartersDashboard {
  initializeExecutiveRegistry(workspaceId, companyId);
  const executives = listRegisteredExecutives(workspaceId, companyId);
  const activeExecutives = getActiveExecutives(workspaceId, companyId);
  const latestSession = getLatestDebateSession(workspaceId, companyId);
  const sessions = listDebateSessions(workspaceId, companyId);
  const missions = listExecutiveMissions(workspaceId, companyId);
  const awaitingKing = listActiveExecutiveMissions(workspaceId, companyId);

  let commercialConfidence = 50;
  try {
    const cis = buildCisMissionControlDashboard(workspaceId, companyId);
    commercialConfidence = cis.commercialConfidence;
  } catch {
    // CIS optional
  }

  const allOpinions = sessions.flatMap((s) => s.opinions);
  const highestConfidence = allOpinions.length
    ? [...allOpinions].sort((a, b) => b.confidence - a.confidence)[0]
    : null;

  const activityMap = new Map<string, number>();
  for (const opinion of allOpinions) {
    activityMap.set(opinion.executiveId, (activityMap.get(opinion.executiveId) ?? 0) + 1);
  }
  const mostActiveId = [...activityMap.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostActiveExec = mostActiveId
    ? executives.find((e) => e.executiveId === mostActiveId[0])
    : null;

  const recommendationsAwaitingKing = sessions
    .filter((s) => s.decision?.awaitingSoulApproval && !s.decision.soulApproved)
    .map((s) => ({
      decisionId: s.decision!.decisionId,
      topic: s.topic,
      majorityRecommendation: s.decision!.majorityRecommendation,
      consensus: s.consensus,
    }));

  const disagreements = sessions.flatMap((s) =>
    s.conflicts.map((c) => ({
      conflictId: c.conflictId,
      topic: c.topic,
      opposingExecutives: c.opposingExecutives,
      severity: c.severity,
    })),
  );

  const strategicDecisions = sessions.slice(0, 5).map((s) => ({
    decisionId: s.decision?.decisionId ?? s.sessionId,
    topic: s.topic,
    consensus: s.consensus,
  }));

  const opportunities = missions.filter((m) =>
    ["STRATEGIC_OPPORTUNITY", "MARKETPLACE_OPPORTUNITY", "EXPANSION_RECOMMENDATION"].includes(m.type),
  );
  const risks = missions.filter((m) => m.type === "COMMERCIAL_WARNING" || m.type === "SUPPLIER_CONCERN");
  const expansion = missions.filter((m) => m.type === "EXPANSION_RECOMMENDATION");

  const ceoBriefing = buildCeoBriefing(latestSession, commercialConfidence, awaitingKing.length, activeExecutives.length);

  let operationalAccess: ExecutiveHeadquartersDashboard["operationalAccess"];
  try {
    const oar = buildAccessDashboard(workspaceId, companyId);
    operationalAccess = {
      architectureComplete: oar.architectureComplete,
      totalPlatforms: oar.summary.totalPlatforms,
      connected: oar.summary.connected,
      blocked: oar.summary.blocked,
      ready: oar.summary.ready,
      revenueBlockingGaps: oar.summary.revenueBlockingGaps,
      highestPriorityAction: oar.highestPriorityAccessAction
        ? `${oar.highestPriorityAccessAction.displayName}: ${oar.highestPriorityAccessAction.action}`
        : null,
      requiredAuthorizations: oar.requiredAuthorizations.length,
    };
  } catch {
    operationalAccess = undefined;
  }

  let supplierIntelligence: ExecutiveHeadquartersDashboard["supplierIntelligence"];
  try {
    const sup = buildSupplierDashboard(workspaceId, companyId);
    const briefing = buildExecutiveSupplierBriefing(sup);
    supplierIntelligence = {
      architectureComplete: sup.architectureComplete,
      architecturePercent: sup.architecturePercent,
      productsFound: sup.productsFound,
      productsUnderReview: sup.productsUnderReview,
      supplierRisks: sup.supplierRisks.length,
      cjReadinessPercent: sup.cjReadiness.overallPercent,
      shippingRiskCount: sup.shippingRiskCount,
      topOpportunity: sup.bestOpportunities[0]?.title ?? null,
      supplyChainBrief: briefing.supplyChainChief.summary,
      merchantBrief: briefing.merchantChief.summary,
    };
  } catch {
    supplierIntelligence = undefined;
  }

  let globalMarketplaceOperations: ExecutiveHeadquartersDashboard["globalMarketplaceOperations"];
  try {
    const gmo = buildGlobalMarketplaceDistributionDashboard(workspaceId, companyId);
    globalMarketplaceOperations = {
      architecturePercent: gmo.architecturePercent,
      countriesActive: gmo.worldOverview.countriesActive,
      countriesReady: gmo.worldOverview.countriesReady,
      countriesBlocked: gmo.worldOverview.countriesBlocked,
      marketplacesConnected: gmo.worldOverview.marketplacesConnected,
      productsLive: gmo.worldOverview.productsLive,
      productsAwaitingApproval: gmo.worldOverview.productsAwaitingApproval,
      totalRevenueUsd: gmo.worldOverview.totalRevenueUsd,
      totalProfitUsd: gmo.worldOverview.totalProfitUsd,
      nextRecommendedCountry: gmo.nextRecommendedCountry?.countryName ?? null,
      topOpportunityCountry: gmo.topOpportunityCountries[0]?.countryName ?? null,
    };
  } catch {
    globalMarketplaceOperations = undefined;
  }

  return {
    moduleId: "executive-council",
    missionId: "EC-001-EC-010",
    ceoBriefing,
    executiveCouncil: {
      totalExecutives: executives.length,
      activeExecutives: activeExecutives.length,
      registeredExecutives: executives,
    },
    currentDebate: latestSession
      ? {
          sessionId: latestSession.sessionId,
          topic: latestSession.topic,
          consensus: latestSession.consensus,
          opinionCount: latestSession.opinions.length,
        }
      : null,
    consensus: latestSession?.consensus ?? null,
    disagreements,
    highestConfidenceExecutive: highestConfidence
      ? {
          executiveId: highestConfidence.executiveId,
          title: highestConfidence.executiveTitle,
          confidence: highestConfidence.confidence,
        }
      : null,
    mostActiveExecutive: mostActiveExec
      ? {
          executiveId: mostActiveExec.executiveId,
          title: mostActiveExec.title,
          recommendationCount: activityMap.get(mostActiveExec.executiveId) ?? 0,
        }
      : null,
    recommendationsAwaitingKing,
    commercialConfidence,
    todaysStrategicDecisions: strategicDecisions,
    commercialOpportunities: opportunities.slice(0, 5),
    risks: risks.slice(0, 5),
    expansionRecommendations: expansion.slice(0, 5),
    empireEconomics: {
      commercialConfidence,
      activeDebateCount: sessions.length,
    },
    generatedMissions: awaitingKing.slice(0, 10),
    workflow: EXECUTIVE_COMMERCIAL_WORKFLOW.map((w) => ({
      stage: w.stage,
      label: w.label,
      module: w.module,
    })),
    operationalAccess,
    supplierIntelligence,
    globalMarketplaceOperations,
    computedAt: new Date().toISOString(),
  };
}

function buildCeoBriefing(
  latestSession: ReturnType<typeof getLatestDebateSession>,
  commercialConfidence: number,
  awaitingCount: number,
  activeCount: number,
): string {
  if (!latestSession) {
    return `Executive Council standing by. ${activeCount} active executives ready to advise. Commercial confidence at ${commercialConfidence}%. Awaiting first council debate.`;
  }
  return `Council last debated "${latestSession.topic}" with ${latestSession.consensus.replace(/_/g, " ").toLowerCase()}. ${awaitingCount} recommendation(s) await your Soul approval. Commercial confidence ${commercialConfidence}%. Executives advise — you decide.`;
}

export function buildEsisExecutiveCouncilPayload(workspaceId: string, companyId: string) {
  const dash = buildExecutiveHeadquartersDashboard(workspaceId, companyId);
  return {
    module: "executive-council",
    activeExecutives: dash.executiveCouncil.activeExecutives,
    commercialConfidence: dash.commercialConfidence,
    awaitingKing: dash.recommendationsAwaitingKing.length,
    consensus: dash.consensus,
  };
}
