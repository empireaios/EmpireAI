import { randomUUID } from "node:crypto";

import type { ExecutiveSignal } from "../models/surveillance-core.js";
import type { ExecutiveSurveillanceMission, SurveillanceMissionCategory } from "../models/surveillance-core.js";
import { getExecutiveSurveillanceRepository } from "../repositories/sqlite-ess-repository.js";
import { rankSignals } from "./priority-engine-service.js";

const CATEGORY_MAP: Partial<Record<string, SurveillanceMissionCategory>> = {
  RISK: "ESCALATION",
  WARNING: "INVESTIGATION",
  ANOMALY: "INVESTIGATION",
  OPPORTUNITY: "TODAY",
  GROWTH_OPPORTUNITY: "WEEKLY",
  EXPANSION_OPPORTUNITY: "STRATEGIC",
  COST_SAVING: "QUICK_WIN",
  TREND: "WEEKLY",
  CUSTOMER_CONCERN: "TODAY",
  SUPPLIER_CONCERN: "INVESTIGATION",
  MARKETPLACE_CONCERN: "TODAY",
};

/** ESS-004 — Mission Generator from signals. */
export function generateMissionsFromSignals(
  workspaceId: string,
  companyId: string,
  signals: ExecutiveSignal[],
): ExecutiveSurveillanceMission[] {
  const repo = getExecutiveSurveillanceRepository();
  const missions: ExecutiveSurveillanceMission[] = [];

  for (const signal of rankSignals(signals).slice(0, 25)) {
    const category = CATEGORY_MAP[signal.signalType] ?? "TODAY";
    const mission: ExecutiveSurveillanceMission = {
      missionId: randomUUID(),
      signalId: signal.signalId,
      watcherId: signal.watcherId,
      category,
      title: `Mission: ${signal.title}`,
      description: signal.summary,
      businessValue: signal.commercialValue,
      timeRequiredHours: category === "QUICK_WIN" ? 1 : category === "STRATEGIC" ? 8 : category === "ESCALATION" ? 4 : 2,
      expectedImpact: `${signal.signalType.replace(/_/g, " ").toLowerCase()} — ${signal.expectedRoi ?? signal.commercialValue}% expected ROI`,
      confidence: signal.confidence,
      priority: signal.priority,
      generatedAt: new Date().toISOString(),
    };
    repo.saveMission(mission, workspaceId, companyId);
    missions.push(mission);
  }

  return missions;
}

export function listSurveillanceMissions(workspaceId: string, companyId: string): ExecutiveSurveillanceMission[] {
  return getExecutiveSurveillanceRepository().listMissions(workspaceId, companyId);
}

export function getTodaysMissions(missions: ExecutiveSurveillanceMission[]): ExecutiveSurveillanceMission[] {
  return missions.filter((m) => m.category === "TODAY" || m.category === "QUICK_WIN" || m.category === "ESCALATION");
}

export function getStrategicMissions(missions: ExecutiveSurveillanceMission[]): ExecutiveSurveillanceMission[] {
  return missions.filter((m) => m.category === "STRATEGIC" || m.category === "WEEKLY");
}
