import type { SurveillanceDashboard, SystemAttentionMapEntry } from "../models/surveillance-dashboard.js";
import type { ExecutiveSignal } from "../models/surveillance-core.js";
import { runExecutiveSurveillance, getRiskSignals, getOpportunitySignals, getExpansionSignals, listActiveSignals } from "./signal-engine-service.js";
import { generateMissionsFromSignals, listSurveillanceMissions } from "./mission-generator-service.js";

function buildAttentionMap(signals: ExecutiveSignal[]): SystemAttentionMapEntry[] {
  const moduleObs = new Map<string, { count: number; label: string; maxPriority: number }>();

  for (const signal of signals) {
    for (const mod of signal.affectedModules) {
      const existing = moduleObs.get(mod) ?? { count: 0, label: mod, maxPriority: 0 };
      existing.count += 1;
      const prioScore = signal.priority === "CRITICAL" ? 4 : signal.priority === "HIGH" ? 3 : signal.priority === "MEDIUM" ? 2 : 1;
      existing.maxPriority = Math.max(existing.maxPriority, prioScore);
      moduleObs.set(mod, existing);
    }
  }

  return [...moduleObs.entries()].map(([moduleId, data]) => ({
    moduleId,
    label: data.label.replace(/-/g, " "),
    attentionLevel: data.maxPriority >= 4 ? "CRITICAL" as const : data.maxPriority >= 3 ? "HIGH" as const : data.maxPriority >= 2 ? "MEDIUM" as const : data.count > 0 ? "LOW" as const : "NONE" as const,
    signalCount: data.count,
    summary: `${data.count} signal(s) from surveillance`,
  }));
}

/** ESS-006 — Surveillance Dashboard. */
export function buildSurveillanceDashboard(workspaceId: string, companyId: string): SurveillanceDashboard {
  let signals = listActiveSignals(workspaceId, companyId);
  if (signals.length === 0) {
    const run = runExecutiveSurveillance(workspaceId, companyId);
    signals = run.signals;
    generateMissionsFromSignals(workspaceId, companyId, signals);
  }

  const missions = listSurveillanceMissions(workspaceId, companyId);

  return {
    moduleId: "executive-surveillance",
    missionId: "ESS-001-ESS-010",
    signals,
    activeRisks: getRiskSignals(signals),
    commercialOpportunities: getOpportunitySignals(signals),
    expansionOpportunities: getExpansionSignals(signals),
    executiveMissions: missions,
    systemAttentionMap: buildAttentionMap(signals),
    computedAt: new Date().toISOString(),
  };
}

export function buildEsisSurveillancePayload(workspaceId: string, companyId: string) {
  const dash = buildSurveillanceDashboard(workspaceId, companyId);
  return {
    module: "executive-surveillance",
    signals: dash.signals.length,
    activeRisks: dash.activeRisks.length,
    missions: dash.executiveMissions.length,
  };
}
