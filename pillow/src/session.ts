import { ExecutiveDirectionContext } from "./bootstrap/executive-reasoning-context.js";
import { runBootstrap } from "./bootstrap/engine.js";
import {
  isBootstrapReady,
  type EmpireBootstrapContext,
  type ExecutiveReasoningComposition,
} from "./bootstrap/types.js";
import { formatFailureReport } from "./bootstrap/failure.js";
import { ContextBuilder } from "./context/engine.js";
import type { ContextBuildRequest, OperationalContext } from "./context/types.js";
import { runRepositoryIntelligence } from "./intelligence/engine.js";
import type { RepositoryIntelligenceContext } from "./intelligence/types.js";
import { RepositoryMemoryEngine } from "./memory/engine.js";
import type { RepositoryMemoryState } from "./memory/types.js";
import { MissionPlannerEngine } from "./planner/engine.js";
import type { CursorMissionDocument, MissionPlan } from "./planner/types.js";
import { CursorSupervisorEngine } from "./supervisor/engine.js";
import type { CursorSupervisorState, SupervisedMission } from "./supervisor/types.js";
import { RecoveryManagerEngine } from "./recovery/engine.js";
import type { RecoveryManagerState } from "./recovery/types.js";
import { ExecutiveAuditReviewerEngine } from "./audit-reviewer/engine.js";
import type { ExecutiveAuditReviewerState } from "./audit-reviewer/types.js";
import { RepositorySynchronizerEngine } from "./synchronizer/engine.js";
import type { RepositorySynchronizerState } from "./synchronizer/types.js";
import { ContinuousDueDiligenceEngine } from "./due-diligence/engine.js";
import type { DueDiligenceEngineState } from "./due-diligence/types.js";
import { AutonomousImprovementEngine } from "./improvement/engine.js";
import type { ImprovementEngineState } from "./improvement/types.js";
import { EmpireAIOrchestrator } from "./orchestrator/engine.js";
import type { OrchestratorEngineState } from "./orchestrator/types.js";
import { LiveRepositoryWatcherEngine } from "./watcher/engine.js";
import type { WatcherEngineState } from "./watcher/types.js";
import { GrandKingCommandInterface } from "./command/engine.js";
import type { CommandEngineState } from "./command/types.js";
import { ObjectiveEngine } from "./objective/engine.js";
import {
  AutonomousRuntimeOrchestrator,
  createAutonomousRuntimeOrchestrator,
} from "./objective/autonomous-runtime-orchestrator.js";
import type { ObjectiveEngineState } from "./objective/types.js";

let bootstrapContext: EmpireBootstrapContext | null = null;
let intelligenceContext: RepositoryIntelligenceContext | null = null;
let contextBuilder: ContextBuilder | null = null;
let memoryEngine: RepositoryMemoryEngine | null = null;
let missionPlanner: MissionPlannerEngine | null = null;
let cursorSupervisor: CursorSupervisorEngine | null = null;
let recoveryManager: RecoveryManagerEngine | null = null;
let auditReviewer: ExecutiveAuditReviewerEngine | null = null;
let repositorySynchronizer: RepositorySynchronizerEngine | null = null;
let dueDiligenceEngine: ContinuousDueDiligenceEngine | null = null;
let improvementEngine: AutonomousImprovementEngine | null = null;
let orchestrator: EmpireAIOrchestrator | null = null;
let repositoryWatcher: LiveRepositoryWatcherEngine | null = null;
let commandInterface: GrandKingCommandInterface | null = null;
let objectiveEngine: ObjectiveEngine | null = null;
let autonomousRuntime: AutonomousRuntimeOrchestrator | null = null;

let executiveDirectionContext: ExecutiveDirectionContext | null = null;

export interface PillowSession {
  bootstrap: EmpireBootstrapContext;
  executiveDirection: ExecutiveDirectionContext;
  intelligence: RepositoryIntelligenceContext;
  contextBuilder: ContextBuilder;
  memory: RepositoryMemoryEngine;
  planner: MissionPlannerEngine;
  supervisor: CursorSupervisorEngine;
  recovery: RecoveryManagerEngine;
  auditReviewer: ExecutiveAuditReviewerEngine;
  synchronizer: RepositorySynchronizerEngine;
  dueDiligence: ContinuousDueDiligenceEngine;
  improvement: AutonomousImprovementEngine;
  orchestrator: EmpireAIOrchestrator;
  watcher: LiveRepositoryWatcherEngine;
  command: GrandKingCommandInterface;
  objective: ObjectiveEngine;
  autonomousRuntime: AutonomousRuntimeOrchestrator;
}

/** Mandatory session init: PILLOW-002 → … → PILLOW-015. */
export async function startPillow(options?: {
  repositoryRoot?: string;
  dryRunRecoveryValidation?: boolean;
  dryRunSyncExecution?: boolean;
}): Promise<PillowSession> {
  const result = await runBootstrap(options);

  if (!isBootstrapReady(result)) {
    throw new BootstrapFailureError(result.failure, result);
  }

  bootstrapContext = result;
  executiveDirectionContext = ExecutiveDirectionContext.fromBootstrap(result);
  intelligenceContext = await runRepositoryIntelligence({ bootstrap: result });
  contextBuilder = new ContextBuilder(result, intelligenceContext);
  memoryEngine = new RepositoryMemoryEngine(result, intelligenceContext, {
    contextBuilder,
  });
  memoryEngine.initialize();
  missionPlanner = new MissionPlannerEngine(
    result,
    intelligenceContext,
    memoryEngine,
  );
  missionPlanner.initialize();
  recoveryManager = new RecoveryManagerEngine(result, {
    dryRunValidation: options?.dryRunRecoveryValidation ?? true,
  });
  await recoveryManager.initialize();
  auditReviewer = new ExecutiveAuditReviewerEngine(result);
  await auditReviewer.initialize();
  repositorySynchronizer = new RepositorySynchronizerEngine(
    result,
    memoryEngine,
    { dryRunExecution: options?.dryRunSyncExecution ?? true },
  );
  await repositorySynchronizer.initialize();
  cursorSupervisor = new CursorSupervisorEngine(
    result,
    memoryEngine,
    missionPlanner,
    { recoveryManager, auditReviewer },
  );
  await cursorSupervisor.initialize();
  dueDiligenceEngine = new ContinuousDueDiligenceEngine(
    result,
    intelligenceContext,
    memoryEngine,
    { planner: missionPlanner, supervisor: cursorSupervisor },
  );
  await dueDiligenceEngine.initialize();
  improvementEngine = new AutonomousImprovementEngine(
    result,
    intelligenceContext,
    memoryEngine,
    dueDiligenceEngine,
    { planner: missionPlanner },
  );
  await improvementEngine.initialize();

  objectiveEngine = new ObjectiveEngine(result);
  await objectiveEngine.initialize();
  autonomousRuntime = createAutonomousRuntimeOrchestrator(objectiveEngine);

  repositoryWatcher = new LiveRepositoryWatcherEngine(
    result,
    intelligenceContext,
    memoryEngine,
  );
  await repositoryWatcher.initialize();

  repositoryWatcher.registerSubscriber({
    id: "executive_direction",
    label: "Executive Direction Context",
    onEvents: (batch) => executiveDirectionContext?.handleWatcherBatch(batch),
  });

  orchestrator = new EmpireAIOrchestrator(result, {
    bootstrap: result,
    intelligence: intelligenceContext,
    contextBuilder,
    memory: memoryEngine,
    planner: missionPlanner,
    supervisor: cursorSupervisor,
    recovery: recoveryManager,
    auditReviewer,
    synchronizer: repositorySynchronizer,
    dueDiligence: dueDiligenceEngine,
    improvement: improvementEngine,
    watcher: repositoryWatcher,
    objective: objectiveEngine,
    autonomousRuntime,
  });
  await orchestrator.initialize();

  commandInterface = new GrandKingCommandInterface({
    bootstrap: result,
    memory: memoryEngine,
    contextBuilder,
    planner: missionPlanner,
    supervisor: cursorSupervisor,
    recovery: recoveryManager,
    auditReviewer,
    synchronizer: repositorySynchronizer,
    dueDiligence: dueDiligenceEngine,
    orchestrator,
    watcher: repositoryWatcher,
  });
  await commandInterface.initialize();
  orchestrator.registerCommandInterface(commandInterface);

  return {
    bootstrap: result,
    executiveDirection: executiveDirectionContext,
    intelligence: intelligenceContext,
    contextBuilder,
    memory: memoryEngine,
    planner: missionPlanner,
    supervisor: cursorSupervisor,
    recovery: recoveryManager,
    auditReviewer,
    synchronizer: repositorySynchronizer,
    dueDiligence: dueDiligenceEngine,
    improvement: improvementEngine,
    orchestrator,
    watcher: repositoryWatcher,
    command: commandInterface,
    objective: objectiveEngine,
    autonomousRuntime,
  };
}

export async function buildPillowContext(
  request: ContextBuildRequest = {},
): Promise<OperationalContext> {
  requirePillowMemory().ensureFresh();
  const operationalContext = await requirePillowContextBuilder().build(request);
  if (request.userMessage && executiveDirectionContext) {
    const composition = executiveDirectionContext.composeReasoningCycle(
      request.userMessage,
    );
    return { ...operationalContext, executiveReasoning: composition };
  }
  return operationalContext;
}

export function composeExecutiveReasoning(userMessage: string): ExecutiveReasoningComposition {
  return requireExecutiveDirectionContext().composeReasoningCycle(userMessage);
}

export function getExecutiveDirectionContext(): ExecutiveDirectionContext | null {
  return executiveDirectionContext;
}

export function requireExecutiveDirectionContext(): ExecutiveDirectionContext {
  if (!executiveDirectionContext) {
    throw new PillowNotBootstrappedError(
      "Executive Direction Context not ready. Call startPillow() first.",
    );
  }
  return executiveDirectionContext;
}

export async function refreshExecutiveDirection(trigger: string): Promise<void> {
  await requireExecutiveDirectionContext().refreshDirection(trigger);
}

export function getPillowMemoryState(): RepositoryMemoryState | null {
  return memoryEngine?.getMemory() ?? null;
}

export function getPillowContext(): EmpireBootstrapContext | null {
  return bootstrapContext;
}

export function getPillowIntelligence(): RepositoryIntelligenceContext | null {
  return intelligenceContext;
}

export function getPillowContextBuilder(): ContextBuilder | null {
  return contextBuilder;
}

export function getPillowMemory(): RepositoryMemoryEngine | null {
  return memoryEngine;
}

export function getPillowMissionPlanner(): MissionPlannerEngine | null {
  return missionPlanner;
}

export function getPillowMissionPlan(): MissionPlan | null {
  return missionPlanner?.getPlan() ?? null;
}

export function requirePillowMissionPlanner(): MissionPlannerEngine {
  if (!missionPlanner) {
    throw new PillowNotBootstrappedError(
      "Pillow Mission Planner not ready. Call startPillow() first.",
    );
  }
  return missionPlanner;
}

export function planNextPillowMission(): MissionPlan["nextMission"] {
  return requirePillowMissionPlanner().determineNextMission();
}

export function generateNextPillowMission(): CursorMissionDocument | null {
  return requirePillowMissionPlanner().generateNextMission();
}

export function getPillowSupervisor(): CursorSupervisorEngine | null {
  return cursorSupervisor;
}

export function getPillowSupervisorState(): CursorSupervisorState | null {
  if (!cursorSupervisor) return null;
  try {
    return cursorSupervisor.getState();
  } catch {
    return null;
  }
}

export function requirePillowSupervisor(): CursorSupervisorEngine {
  if (!cursorSupervisor) {
    throw new PillowNotBootstrappedError(
      "Cursor Supervisor not ready. Call startPillow() first.",
    );
  }
  return cursorSupervisor;
}

export function getPillowRecovery(): RecoveryManagerEngine | null {
  return recoveryManager;
}

export function getPillowRecoveryState(): RecoveryManagerState | null {
  if (!recoveryManager) return null;
  try {
    return recoveryManager.getState();
  } catch {
    return null;
  }
}

export function requirePillowRecovery(): RecoveryManagerEngine {
  if (!recoveryManager) {
    throw new PillowNotBootstrappedError(
      "Recovery Manager not ready. Call startPillow() first.",
    );
  }
  return recoveryManager;
}

export function getPillowAuditReviewer(): ExecutiveAuditReviewerEngine | null {
  return auditReviewer;
}

export function getPillowAuditReviewerState(): ExecutiveAuditReviewerState | null {
  if (!auditReviewer) return null;
  try {
    return auditReviewer.getState();
  } catch {
    return null;
  }
}

export function requirePillowAuditReviewer(): ExecutiveAuditReviewerEngine {
  if (!auditReviewer) {
    throw new PillowNotBootstrappedError(
      "Executive Audit Reviewer not ready. Call startPillow() first.",
    );
  }
  return auditReviewer;
}

export function getPillowSynchronizer(): RepositorySynchronizerEngine | null {
  return repositorySynchronizer;
}

export function getPillowSynchronizerState(): RepositorySynchronizerState | null {
  if (!repositorySynchronizer) return null;
  try {
    return repositorySynchronizer.getState();
  } catch {
    return null;
  }
}

export function requirePillowSynchronizer(): RepositorySynchronizerEngine {
  if (!repositorySynchronizer) {
    throw new PillowNotBootstrappedError(
      "Repository Synchronizer not ready. Call startPillow() first.",
    );
  }
  return repositorySynchronizer;
}

export function getPillowDueDiligence(): ContinuousDueDiligenceEngine | null {
  return dueDiligenceEngine;
}

export function getPillowDueDiligenceState(): DueDiligenceEngineState | null {
  if (!dueDiligenceEngine) return null;
  try {
    return dueDiligenceEngine.getState();
  } catch {
    return null;
  }
}

export function requirePillowDueDiligence(): ContinuousDueDiligenceEngine {
  if (!dueDiligenceEngine) {
    throw new PillowNotBootstrappedError(
      "Continuous Due Diligence Engine not ready. Call startPillow() first.",
    );
  }
  return dueDiligenceEngine;
}

export function getPillowImprovement(): AutonomousImprovementEngine | null {
  return improvementEngine;
}

export function getPillowImprovementState(): ImprovementEngineState | null {
  if (!improvementEngine) return null;
  try {
    return improvementEngine.getState();
  } catch {
    return null;
  }
}

export function requirePillowImprovement(): AutonomousImprovementEngine {
  if (!improvementEngine) {
    throw new PillowNotBootstrappedError(
      "Autonomous Improvement Engine not ready. Call startPillow() first.",
    );
  }
  return improvementEngine;
}

export function getPillowOrchestrator(): EmpireAIOrchestrator | null {
  return orchestrator;
}

export function getPillowOrchestratorState(): OrchestratorEngineState | null {
  if (!orchestrator) return null;
  try {
    return orchestrator.getState();
  } catch {
    return null;
  }
}

export function requirePillowOrchestrator(): EmpireAIOrchestrator {
  if (!orchestrator) {
    throw new PillowNotBootstrappedError(
      "EmpireAI Orchestrator not ready. Call startPillow() first.",
    );
  }
  return orchestrator;
}

export function getPillowWatcher(): LiveRepositoryWatcherEngine | null {
  return repositoryWatcher;
}

export function getPillowWatcherState(): WatcherEngineState | null {
  if (!repositoryWatcher) return null;
  try {
    return repositoryWatcher.getState();
  } catch {
    return null;
  }
}

export function requirePillowWatcher(): LiveRepositoryWatcherEngine {
  if (!repositoryWatcher) {
    throw new PillowNotBootstrappedError(
      "Live Repository Watcher not ready. Call startPillow() first.",
    );
  }
  return repositoryWatcher;
}

export function getPillowCommand(): GrandKingCommandInterface | null {
  return commandInterface;
}

export function getPillowCommandState(): CommandEngineState | null {
  if (!commandInterface) return null;
  try {
    return commandInterface.getState();
  } catch {
    return null;
  }
}

export function requirePillowCommand(): GrandKingCommandInterface {
  if (!commandInterface) {
    throw new PillowNotBootstrappedError(
      "Grand King Command Interface not ready. Call startPillow() first.",
    );
  }
  return commandInterface;
}

export function getPillowObjective(): ObjectiveEngine | null {
  return objectiveEngine;
}

export function getPillowObjectiveState(): ObjectiveEngineState | null {
  if (!objectiveEngine) return null;
  try {
    return objectiveEngine.getState();
  } catch {
    return null;
  }
}

export function requirePillowObjective(): ObjectiveEngine {
  if (!objectiveEngine) {
    throw new PillowNotBootstrappedError(
      "Objective Engine not ready. Call startPillow() first.",
    );
  }
  return objectiveEngine;
}

export function getPillowAutonomousRuntime(): AutonomousRuntimeOrchestrator | null {
  return autonomousRuntime;
}

export function requirePillowAutonomousRuntime(): AutonomousRuntimeOrchestrator {
  if (!autonomousRuntime) {
    throw new PillowNotBootstrappedError(
      "Autonomous Runtime Orchestrator not ready. Call startPillow() first.",
    );
  }
  return autonomousRuntime;
}

export function requirePillowContext(): EmpireBootstrapContext {
  if (!bootstrapContext) {
    throw new PillowNotBootstrappedError();
  }
  return bootstrapContext;
}

export function requirePillowIntelligence(): RepositoryIntelligenceContext {
  if (!intelligenceContext) {
    throw new PillowNotBootstrappedError(
      "Pillow intelligence not ready. Call startPillow() first.",
    );
  }
  return intelligenceContext;
}

export function requirePillowContextBuilder(): ContextBuilder {
  if (!contextBuilder) {
    throw new PillowNotBootstrappedError(
      "Pillow Context Builder not ready. Call startPillow() first.",
    );
  }
  return contextBuilder;
}

export function requirePillowMemory(): RepositoryMemoryEngine {
  if (!memoryEngine) {
    throw new PillowNotBootstrappedError(
      "Pillow Repository Memory not ready. Call startPillow() first.",
    );
  }
  return memoryEngine;
}

export function resetPillowSession(): void {
  bootstrapContext = null;
  executiveDirectionContext = null;
  intelligenceContext = null;
  contextBuilder = null;
  memoryEngine = null;
  missionPlanner = null;
  cursorSupervisor = null;
  recoveryManager = null;
  auditReviewer = null;
  repositorySynchronizer = null;
  dueDiligenceEngine = null;
  improvementEngine = null;
  orchestrator = null;
  repositoryWatcher = null;
  commandInterface = null;
  objectiveEngine = null;
  autonomousRuntime = null;
}

export class BootstrapFailureError extends Error {
  readonly failure: import("./bootstrap/types.js").BootstrapFailure;
  readonly bootstrapResult: import("./bootstrap/types.js").BootstrapFailureResult;

  constructor(
    failure: import("./bootstrap/types.js").BootstrapFailure,
    bootstrapResult: import("./bootstrap/types.js").BootstrapFailureResult,
  ) {
    super(formatFailureReport(failure));
    this.name = "BootstrapFailureError";
    this.failure = failure;
    this.bootstrapResult = bootstrapResult;
  }
}

export class PillowNotBootstrappedError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "Pillow is not bootstrapped. Call startPillow() before operational reasoning.",
    );
    this.name = "PillowNotBootstrappedError";
  }
}
