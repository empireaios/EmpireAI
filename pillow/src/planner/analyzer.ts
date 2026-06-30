import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import type { MissionIntelligence } from "./types.js";

export function analyzeMissionIntelligence(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  memory: RepositoryMemoryState,
): MissionIntelligence {
  const completed = memory.domains.completedMissions.value;
  const pending = memory.domains.pendingMissions.value;
  const health = memory.domains.repositoryHealth.value;
  const sync = memory.domains.syncState.value;

  const blockedCount = intelligence.health.issues.filter(
    (i) => i.severity === "error",
  ).length;

  const commercialReady =
    !bootstrap.journeyPosition?.includes("REAL-002B") &&
    !intelligence.health.issues.some((i) =>
      /credential|PROOF-001|live.*pending/i.test(i.message),
    );

  const architectureReady =
    bootstrap.repositoryHealth.healthy &&
    bootstrap.knownArchitecture.pillowContractPath.length > 0;

  const governanceReady =
    bootstrap.knownDecisions.adrCount > 0 &&
    bootstrap.knownExecutiveAudits.length > 0;

  const syncRequired =
    !memory.consistency.synchronized ||
    memory.consistency.driftSignals.length > 0;

  return {
    repositoryPosition: memory.domains.journeyPosition.value,
    currentMission: memory.domains.currentMission.value,
    completedCount: completed.length,
    pendingCount: pending.length,
    blockedCount,
    repositoryHealthScore: health.score,
    architectureReady,
    commercialReady,
    governanceReady,
    syncRequired,
    driftSignals: [
      ...memory.consistency.driftSignals,
      ...memory.consistency.issues,
    ],
  };
}

export function isMissionCompleted(
  missionId: string,
  memory: RepositoryMemoryState,
): boolean {
  return memory.domains.completedMissions.value.some((m) => m.id === missionId);
}

export function classifyMissionCategory(
  missionId: string,
): import("./types.js").MissionCategory {
  if (/^UX-\d{3}$/.test(missionId) || /^UX-ENH-/.test(missionId)) return "ux";
  if (/^REAL-\d/.test(missionId)) return "real";
  if (/^GC-\d{2}$/.test(missionId)) return "global_component";
  if (/^EC-\d{2}$/.test(missionId)) return "executive_component";
  if (/^PILLOW-\d{3}$/.test(missionId)) return "pillow";
  if (/^BL-A$/i.test(missionId)) return "bl_a";
  if (/^BL-B$/i.test(missionId)) return "bl_b";
  if (/^BL-C$/i.test(missionId)) return "bl_c";
  if (/JOURNEY_AUDIT/i.test(missionId)) return "journey_audit";
  if (/JOURNEY/i.test(missionId)) return "journey";
  if (/RECOVERY/i.test(missionId)) return "recovery";
  if (/SYNC/i.test(missionId)) return "repository_synchronization";
  if (/AUDIT/i.test(missionId)) return "executive_review";
  if (/ADR-|ARCHITECTURE/i.test(missionId)) return "architecture";
  if (/GOVERNANCE|BL-C/i.test(missionId)) return "governance";
  return "repository";
}
