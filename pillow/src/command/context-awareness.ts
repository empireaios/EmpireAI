import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { EmpireAIOrchestrator } from "../orchestrator/engine.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { RecoveryManagerEngine } from "../recovery/engine.js";
import type { RepositorySynchronizerEngine } from "../synchronizer/engine.js";
import type { ExecutiveAuditReviewerEngine } from "../audit-reviewer/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import { COMMERCIAL_BLOCKER_MISSIONS } from "../planner/catalog.js";
import type { CommandContextAwareness } from "./types.js";

export function loadContextAwareness(deps: {
  bootstrap: EmpireBootstrapContext;
  memory: RepositoryMemoryEngine;
  planner: MissionPlannerEngine;
  supervisor: CursorSupervisorEngine;
  recovery: RecoveryManagerEngine;
  synchronizer: RepositorySynchronizerEngine;
  auditReviewer: ExecutiveAuditReviewerEngine;
  orchestrator: EmpireAIOrchestrator;
}): CommandContextAwareness {
  deps.memory.ensureFresh();
  const mem = deps.memory.getMemory();
  const plan = deps.planner.getPlan();
  const supervisorState = deps.supervisor.getState();
  const orchestratorState = deps.orchestrator.getState();

  return {
    journeyPosition: deps.bootstrap.journeyPosition ?? null,
    currentMission: deps.bootstrap.currentMission ?? null,
    repositoryHealthScore: mem.domains.repositoryHealth.value.score,
    outstandingMissions: plan.queue.filter((m) => m.readiness !== "ready").length,
    activeEngineeringMissions: supervisorState.registry.activeMission ? 1 : 0,
    recoveryStatus: deps.recovery.getState().status,
    synchronizationStatus: deps.synchronizer.getState().status,
    executiveAuditStatus: deps.auditReviewer.getState().status,
    commercialBlockers: COMMERCIAL_BLOCKER_MISSIONS.map((m) => m.id),
    repositorySynchronized: mem.consistency.synchronized,
    grandKingPriorityActive: orchestratorState.grandKingPriorityActive,
  };
}
