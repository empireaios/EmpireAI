import type { ExecutiveSurveillanceHeadquarters } from "../models/surveillance-dashboard.js";
import { buildExecutiveHeadquartersDashboard } from "../../executive-council/services/executive-headquarters-service.js";
import { buildSurveillanceDashboard } from "./surveillance-dashboard-service.js";
import { runExecutiveSurveillance } from "./signal-engine-service.js";
import { generateMissionsFromSignals, getTodaysMissions, listSurveillanceMissions } from "./mission-generator-service.js";
import { buildExecutiveBriefings, getCeoMorningBrief } from "./executive-briefing-service.js";
import { initializeWatcherRegistry } from "./watcher-registry-service.js";
import { getRiskSignals, getOpportunitySignals } from "./signal-engine-service.js";

/** ESS-010 — Executive Headquarters default experience (surveillance-first). */
export function buildExecutiveSurveillanceHeadquarters(
  workspaceId: string,
  companyId: string,
): ExecutiveSurveillanceHeadquarters {
  initializeWatcherRegistry(workspaceId, companyId);

  const run = runExecutiveSurveillance(workspaceId, companyId);
  generateMissionsFromSignals(workspaceId, companyId, run.signals);
  const surveillance = buildSurveillanceDashboard(workspaceId, companyId);
  const missions = listSurveillanceMissions(workspaceId, companyId);
  const todaysMissions = getTodaysMissions(missions);
  const briefings = buildExecutiveBriefings(run.signals, missions);
  const ceoMorningBrief = getCeoMorningBrief(briefings);

  const commercialAttention = surveillance.systemAttentionMap.filter((m) =>
    ["commerce-intelligence-studio", "amazon-global-seller", "commerce-runtime"].includes(m.moduleId),
  );
  const expansionAttention = surveillance.systemAttentionMap.filter((m) =>
    ["global-commerce-infrastructure", "global-commerce-intelligence", "amazon-global-seller"].includes(m.moduleId),
  );

  let awaitingKingDecisions: Array<{ source: string; title: string; priority: string }> = [];
  try {
    const ec = buildExecutiveHeadquartersDashboard(workspaceId, companyId);
    awaitingKingDecisions = [
      ...ec.recommendationsAwaitingKing.map((r) => ({
        source: "executive-council",
        title: r.topic,
        priority: r.consensus,
      })),
      ...ec.generatedMissions.slice(0, 5).map((m) => ({
        source: "executive-council",
        title: m.title,
        priority: m.priority,
      })),
    ];
  } catch {
    awaitingKingDecisions = todaysMissions.slice(0, 5).map((m) => ({
      source: "executive-surveillance",
      title: m.title,
      priority: m.priority,
    }));
  }

  const criticalRisks = getRiskSignals(run.signals).filter((s) => s.priority === "CRITICAL" || s.priority === "HIGH");
  const topOpportunities = getOpportunitySignals(run.signals).slice(0, 5);

  const overallScore = run.signals.length
    ? Math.round(100 - (criticalRisks.length / run.signals.length) * 40)
    : 75;

  return {
    moduleId: "executive-surveillance",
    missionId: "ESS-001-ESS-010",
    ceoMorningBrief,
    executiveSurveillance: surveillance,
    todaysMissions,
    topOpportunities,
    criticalRisks,
    commercialAttention,
    expansionAttention,
    empireHealth: {
      overallScore,
      modulesWatched: surveillance.systemAttentionMap.length,
      signalsActive: run.signals.length,
      missionsQueued: missions.length,
    },
    awaitingKingDecisions,
    briefings,
    computedAt: new Date().toISOString(),
  };
}
