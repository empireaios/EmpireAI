import { buildMissionCommandEngine } from "../../runtime/mission-command-engine/services/mission-command-engine-service.js";

/** GC-05 — One-click governed mission generation. */
export function generateAssistantMissions(workspaceId: string, companyId: string) {
  const engine = buildMissionCommandEngine(workspaceId, companyId);
  return {
    missionId: "GC-05",
    sourceModule: "mission-command-engine",
    sourceReal: "REAL-057",
    missions: engine.missions,
    missionCount: engine.missionCount,
    requiredApproval: true,
    computedAt: new Date().toISOString(),
  };
}
