import { randomUUID } from "node:crypto";

import type { ExecutiveGeneratedMission, ExecutiveMissionType } from "../models/executive-mission.js";
import type { ExecutivePriority } from "../models/executive-core.js";
import { getExecutiveCouncilRepository } from "../repositories/sqlite-executive-council-repository.js";
import { listRegisteredExecutives } from "./executive-registry-service.js";
import { listDebateSessions } from "./executive-debate-engine.js";
import { buildCisMissionControlDashboard } from "../../runtime/commerce-intelligence-studio/services/cis-mission-control-service.js";

const MISSION_TEMPLATES: Array<{
  type: ExecutiveMissionType;
  executiveId: string;
  titleFn: (ctx: string) => string;
  descriptionFn: (ctx: string) => string;
  priority: ExecutivePriority;
}> = [
  {
    type: "STRATEGIC_OPPORTUNITY",
    executiveId: "ceo",
    titleFn: () => "Review top strategic commercial opportunity",
    descriptionFn: (ctx) => `CEO recommends prioritizing: ${ctx}`,
    priority: "HIGH",
  },
  {
    type: "COMMERCIAL_WARNING",
    executiveId: "cro",
    titleFn: () => "Address commercial risk signal",
    descriptionFn: (ctx) => `Risk Officer flagged: ${ctx}`,
    priority: "CRITICAL",
  },
  {
    type: "EXPANSION_RECOMMENDATION",
    executiveId: "cxo-expansion",
    titleFn: () => "Evaluate expansion market entry",
    descriptionFn: (ctx) => `Expansion Officer recommends: ${ctx}`,
    priority: "HIGH",
  },
  {
    type: "COST_REDUCTION",
    executiveId: "cfo",
    titleFn: () => "Optimize unit economics",
    descriptionFn: (ctx) => `CFO identifies cost opportunity: ${ctx}`,
    priority: "MEDIUM",
  },
  {
    type: "SUPPLIER_CONCERN",
    executiveId: "csco",
    titleFn: () => "Review supplier reliability",
    descriptionFn: (ctx) => `Supply Chain concern: ${ctx}`,
    priority: "HIGH",
  },
  {
    type: "MARKETPLACE_OPPORTUNITY",
    executiveId: "cmo-marketplace",
    titleFn: () => "Capture marketplace listing opportunity",
    descriptionFn: (ctx) => `Marketplace Officer: ${ctx}`,
    priority: "HIGH",
  },
  {
    type: "CUSTOMER_EXPERIENCE",
    executiveId: "cxo",
    titleFn: () => "Improve customer experience touchpoint",
    descriptionFn: (ctx) => `Customer Officer: ${ctx}`,
    priority: "MEDIUM",
  },
];

/** EC-009 — Executives generate King's daily missions. */
export function generateExecutiveMissions(workspaceId: string, companyId: string): ExecutiveGeneratedMission[] {
  const repo = getExecutiveCouncilRepository();
  const executives = listRegisteredExecutives(workspaceId, companyId);
  const sessions = listDebateSessions(workspaceId, companyId);
  const missions: ExecutiveGeneratedMission[] = [];

  let cisConfidence = 0;
  try {
    const cis = buildCisMissionControlDashboard(workspaceId, companyId);
    cisConfidence = cis.commercialConfidence;
  } catch {
    cisConfidence = 50;
  }

  for (const template of MISSION_TEMPLATES) {
    const exec = executives.find((e) => e.executiveId === template.executiveId);
    if (!exec || (exec.certificationStatus !== "ACTIVE" && exec.certificationStatus !== "EXPERIMENTAL")) continue;

    const contextHint =
      sessions[0]?.topic ??
      (cisConfidence >= 60 ? "commercial pipeline shows strong signals" : "commercial readiness needs attention");

    const mission: ExecutiveGeneratedMission = {
      missionId: randomUUID(),
      workspaceId,
      companyId,
      executiveId: exec.executiveId,
      executiveTitle: exec.title,
      type: template.type,
      title: template.titleFn(contextHint),
      description: template.descriptionFn(contextHint),
      priority: template.priority,
      confidence: Math.min(90, Math.max(45, cisConfidence + (exec.successRate ?? 50) / 5)),
      expectedImpact: `Advance ${exec.domain} objectives for Grand King approval`,
      awaitingKingApproval: true,
      generatedAt: new Date().toISOString(),
    };
    repo.saveMission(mission);
    missions.push(mission);
  }

  const latestSession = sessions[0];
  if (latestSession && latestSession.consensus === "ESCALATION_REQUIRED") {
    const ceo = executives.find((e) => e.executiveId === "ceo");
    if (ceo) {
      const escalationMission: ExecutiveGeneratedMission = {
        missionId: randomUUID(),
        workspaceId,
        companyId,
        executiveId: ceo.executiveId,
        executiveTitle: ceo.title,
        type: "COMMERCIAL_WARNING",
        title: `Resolve executive conflict: ${latestSession.topic}`,
        description: `Council escalation required — ${latestSession.conflicts.length} conflict(s) detected`,
        priority: "CRITICAL",
        confidence: 85,
        expectedImpact: "Soul decision required before commercial execution",
        awaitingKingApproval: true,
        generatedAt: new Date().toISOString(),
      };
      repo.saveMission(escalationMission);
      missions.push(escalationMission);
    }
  }

  return missions;
}

export function listExecutiveMissions(workspaceId: string, companyId: string): ExecutiveGeneratedMission[] {
  return getExecutiveCouncilRepository().listMissions(workspaceId, companyId);
}

export function listActiveExecutiveMissions(workspaceId: string, companyId: string): ExecutiveGeneratedMission[] {
  return listExecutiveMissions(workspaceId, companyId).filter((m) => m.awaitingKingApproval);
}
