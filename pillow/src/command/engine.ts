import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ContextBuilder } from "../context/engine.js";
import type { ContinuousDueDiligenceEngine } from "../due-diligence/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { RecoveryManagerEngine } from "../recovery/engine.js";
import type { ExecutiveAuditReviewerEngine } from "../audit-reviewer/engine.js";
import type { RepositorySynchronizerEngine } from "../synchronizer/engine.js";
import type { EmpireAIOrchestrator } from "../orchestrator/engine.js";
import type { LiveRepositoryWatcherEngine } from "../watcher/engine.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import { loadContextAwareness } from "./context-awareness.js";
import {
  composeResponseMessage,
  coordinateCommand,
} from "./coordinator.js";
import { parseCommandIntent } from "./intent-parser.js";
import { buildExecutionPlan } from "./plan-builder.js";
import type {
  CommandEngineOptions,
  CommandEngineState,
  CommandResponse,
  ProcessCommandRequest,
} from "./types.js";

export const COMMAND_CONTRACT_PATH = "PILLOW_ARCHITECTURE_CONTRACT.md";

export interface PillowCommandDeps {
  bootstrap: EmpireBootstrapContext;
  memory: RepositoryMemoryEngine;
  contextBuilder: ContextBuilder;
  planner: MissionPlannerEngine;
  supervisor: CursorSupervisorEngine;
  recovery: RecoveryManagerEngine;
  auditReviewer: ExecutiveAuditReviewerEngine;
  synchronizer: RepositorySynchronizerEngine;
  dueDiligence: ContinuousDueDiligenceEngine;
  orchestrator: EmpireAIOrchestrator;
  watcher: LiveRepositoryWatcherEngine;
}

/**
 * Grand King Command Interface (PILLOW-015).
 * Natural-language executive console — interprets intent, loads repository context, coordinates Pillow read-only.
 */
export class GrandKingCommandInterface {
  private initializedAt: string | null = null;
  private totalCommands = 0;
  private lastCommand: string | null = null;
  private reader: RepositoryReader;

  constructor(
    private deps: PillowCommandDeps,
    private options: CommandEngineOptions = {},
  ) {
    this.reader = new RepositoryReader(deps.bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CommandEngineState> {
    const text = await this.reader.readText(COMMAND_CONTRACT_PATH);
    if (!text?.includes("Grand King")) {
      throw new Error(
        `${COMMAND_CONTRACT_PATH} missing — Command Interface requires Pillow Architecture Contract.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): CommandEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Grand King Command Interface not initialized. Call initialize() first.",
      );
    }
    return {
      engineVersion: "PILLOW-015",
      status: this.deps.orchestrator.getState().grandKingPriorityActive
        ? "grand_king_priority"
        : "ready",
      initializedAt: this.initializedAt,
      contractPath: COMMAND_CONTRACT_PATH,
      totalCommands: this.totalCommands,
      lastCommand: this.lastCommand,
      grandKingPriorityActive:
        this.deps.orchestrator.getState().grandKingPriorityActive,
    };
  }

  async processCommand(request: ProcessCommandRequest): Promise<CommandResponse> {
    const started = performance.now();
    const command = request.command.trim();
    if (!command) {
      throw new Error("Command cannot be empty");
    }

    const { intent, category } = parseCommandIntent(command);

    if (
      !request.skipAutonomousPause &&
      intent !== "resume_autonomous" &&
      intent !== "pause_autonomous"
    ) {
      this.deps.orchestrator.issueGrandKingCommand(command);
    }

    if (intent === "pause_autonomous") {
      this.deps.orchestrator.issueGrandKingCommand(command);
    } else if (intent === "resume_autonomous") {
      this.deps.orchestrator.resumeAfterGrandKingCommand();
    }

    const awareness = loadContextAwareness(this.deps);
    const plan = buildExecutionPlan(intent, category, awareness, this.deps.planner);
    const coordination = await coordinateCommand(intent, plan, awareness, {
      planner: this.deps.planner,
      orchestrator: this.deps.orchestrator,
      watcher: this.deps.watcher,
      dueDiligence: this.deps.dueDiligence,
      contextBuilder: this.deps.contextBuilder,
    });

    this.totalCommands++;
    this.lastCommand = command;

    return {
      responseId: randomUUID(),
      command,
      intent,
      category,
      awareness,
      plan,
      message: composeResponseMessage(plan, coordination, awareness),
      coordinatedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started),
      repositoryIntegrityPreserved: true,
    };
  }
}

export function createGrandKingCommandInterface(
  deps: PillowCommandDeps,
  options?: CommandEngineOptions,
): GrandKingCommandInterface {
  return new GrandKingCommandInterface(deps, options);
}
