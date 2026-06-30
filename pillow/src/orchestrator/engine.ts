import type { GrandKingCommandInterface } from "../command/engine.js";
import type { AutonomousRuntimeOrchestrator } from "../objective/autonomous-runtime-orchestrator.js";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { coordinateFailure } from "./failure-coordinator.js";
import {
  collectRuntimeAwareness,
  scheduleWork,
} from "./scheduler.js";
import {
  discoverSubsystems,
  type PillowSubsystemBundle,
} from "./subsystem-registry.js";
import type {
  CoordinateWorkflowRequest,
  FailureEvent,
  FailureCoordinationResult,
  GrandKingCommand,
  OrchestratorEngineOptions,
  OrchestratorEngineState,
  OrchestratorExecutionResult,
  RuntimeAwareness,
  ScheduledWorkItem,
  SchedulingResult,
  SubsystemEntry,
  WorkerEntry,
  WorkflowCoordinationResult,
  WorkflowId,
} from "./types.js";
import { buildWorkerRegistry } from "./worker-registry.js";
import { listWorkflows } from "./workflows.js";
import {
  buildCoordinationResult,
  coordinateWorkflowSteps,
} from "./workflow-coordinator.js";

export const ORCHESTRATOR_CONTRACT_PATH = "PILLOW_ARCHITECTURE_CONTRACT.md";

/**
 * EmpireAI Orchestrator (PILLOW-013).
 * Central coordination layer — coordinates subsystems and workers; never executes engineering work.
 */
export class EmpireAIOrchestrator {
  private initializedAt: string | null = null;
  private subsystems: SubsystemEntry[] = [];
  private workers: WorkerEntry[] = [];
  private grandKingPriorityActive = false;
  private lastCommand: GrandKingCommand | null = null;
  private reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private bundle: PillowSubsystemBundle,
    private options: OrchestratorEngineOptions = {},
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<OrchestratorEngineState> {
    const text = await this.reader.readText(ORCHESTRATOR_CONTRACT_PATH);
    if (!text?.includes("PILLOW Architecture Contract")) {
      throw new Error(
        `${ORCHESTRATOR_CONTRACT_PATH} missing — Orchestrator requires Pillow Architecture Contract.`,
      );
    }
    this.subsystems = discoverSubsystems(this.bundle);
    this.workers = buildWorkerRegistry(this.bundle.supervisor);
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): OrchestratorEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "EmpireAI Orchestrator not initialized. Call initialize() first.",
      );
    }
    return {
      engineVersion: "PILLOW-013",
      status: this.grandKingPriorityActive
        ? "grand_king_priority"
        : "ready",
      initializedAt: this.initializedAt,
      contractPath: ORCHESTRATOR_CONTRACT_PATH,
      subsystemCount: this.subsystems.length,
      workerCount: this.workers.length,
      workflowCount: listWorkflows().length,
      grandKingPriorityActive: this.grandKingPriorityActive,
      lastCommand: this.lastCommand,
    };
  }

  refreshDiscovery(): { subsystems: SubsystemEntry[]; workers: WorkerEntry[] } {
    this.subsystems = discoverSubsystems(this.bundle);
    this.workers = buildWorkerRegistry(this.bundle.supervisor);
    return { subsystems: this.subsystems, workers: this.workers };
  }

  registerCommandInterface(command: GrandKingCommandInterface): void {
    this.bundle.command = command;
    this.refreshDiscovery();
  }

  getSubsystems(): SubsystemEntry[] {
    return [...this.subsystems];
  }

  getWorkers(): WorkerEntry[] {
    return [...this.workers];
  }

  getWorkflows() {
    return listWorkflows();
  }

  getRuntimeAwareness(): RuntimeAwareness {
    this.refreshDiscovery();
    return collectRuntimeAwareness(
      this.bundle,
      this.subsystems,
      this.workers,
      this.grandKingPriorityActive,
    );
  }

  schedule(): SchedulingResult {
    this.refreshDiscovery();
    return scheduleWork(this.bundle, this.subsystems, this.workers, {
      grandKingOverride: this.grandKingPriorityActive,
      maxItems: this.options.maxScheduledItems,
    });
  }

  coordinateWorkflow(
    request: CoordinateWorkflowRequest = {},
  ): WorkflowCoordinationResult {
    const started = performance.now();
    this.refreshDiscovery();
    const workflowId: WorkflowId = request.workflowId ?? "engineering";
    const steps = coordinateWorkflowSteps(
      workflowId,
      this.subsystems,
      this.bundle,
    );
    return buildCoordinationResult(workflowId, steps, started);
  }

  /** Full coordination cycle: workflow + scheduling + awareness (read-only). */
  coordinate(request: CoordinateWorkflowRequest = {}): OrchestratorExecutionResult {
    const coordination = this.coordinateWorkflow(request);
    const scheduling = this.schedule();

    if (this.bundle.autonomousRuntime) {
      scheduling.queue = scheduling.queue.filter((item) => {
        const { proceed } = this.bundle.autonomousRuntime!.prepareForExecution({
          title: item.label,
          summary: item.reason,
          tags: [item.workflowId],
        });
        return proceed;
      });
    }

    const awareness = this.getRuntimeAwareness();
    return { coordination, scheduling, awareness };
  }

  handleFailure(event: FailureEvent): FailureCoordinationResult {
    return coordinateFailure(event);
  }

  /** Grand King commands override autonomous workflows. */
  issueGrandKingCommand(command: string): {
    command: GrandKingCommand;
    paused: string[];
    recommendation: string;
  } {
    const cmd: GrandKingCommand = {
      command,
      issuedAt: new Date().toISOString(),
      priority: "grand_king",
    };
    this.lastCommand = cmd;
    this.grandKingPriorityActive = true;

    const paused: string[] = [];
    this.bundle.dueDiligence.interrupt(command);
    paused.push("continuous_due_diligence");
    this.refreshDiscovery();

    return {
      command: cmd,
      paused,
      recommendation:
        "Grand King priority active — autonomous workflows paused; requested work is highest priority",
    };
  }

  resumeAfterGrandKingCommand(): void {
    this.grandKingPriorityActive = false;
    this.bundle.dueDiligence.resumeAfterInterrupt();
    this.refreshDiscovery();
  }
}

export function createEmpireAIOrchestrator(
  bootstrap: EmpireBootstrapContext,
  bundle: PillowSubsystemBundle,
  options?: OrchestratorEngineOptions,
): EmpireAIOrchestrator {
  return new EmpireAIOrchestrator(bootstrap, bundle, options);
}
