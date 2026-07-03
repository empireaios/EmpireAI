import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { TechnicalChiefEngine } from "../technical-chief/engine.js";
import type { UxDesignerEngine } from "../ux-designer/engine.js";
import { routeBridgeInstruction } from "./intent-router.js";
import { assembleEngineeringMission } from "./mission-assembler.js";
import { dispatchToCursor, isSdkAvailable, resolveDispatchMode } from "./sdk-dispatcher.js";
import { runValidationPipeline } from "./validation-pipeline.js";
import {
  buildExecutiveBridgeReport,
  formatExecutiveBridgeReport,
} from "./executive-reporter.js";
import type {
  BridgeInstruction,
  BridgeProcessResult,
  AutonomousEngineeringMission,
  CursorBridgeState,
  DispatchMode,
  DispatchResult,
  LogSource,
} from "./types.js";

export const CURSOR_BRIDGE_CONTRACT_PATH = "PILLOW_ARCHITECTURE_CONTRACT.md";

/**
 * Autonomous Cursor Bridge (PILLOW-CB-001 / Phase 5).
 * Engineering Chief — NL instruction → mission → Cursor dispatch → validation → executive report.
 */
export class CursorBridgeEngine {
  private initializedAt: string | null = null;
  private totalMissions = 0;
  private totalDispatches = 0;
  private defaultDispatchMode: DispatchMode = "artifact";

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    private readonly planner: MissionPlannerEngine,
    private readonly supervisor: CursorSupervisorEngine,
    private readonly technicalChief: TechnicalChiefEngine,
    private readonly uxDesigner: UxDesignerEngine,
  ) {}

  async initialize(): Promise<CursorBridgeState> {
    this.defaultDispatchMode = resolveDispatchMode(process.env.CURSOR_API_KEY);
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): CursorBridgeState {
    if (!this.initializedAt) {
      throw new Error("Cursor Bridge not initialized. Call initialize() first.");
    }
    return {
      bridgeVersion: "PILLOW-CB-001",
      status: "ready",
      initializedAt: this.initializedAt,
      totalMissions: this.totalMissions,
      totalDispatches: this.totalDispatches,
      sdkAvailable: isSdkAvailable(),
      defaultDispatchMode: this.defaultDispatchMode,
    };
  }

  /** Full pipeline: route → assemble → dispatch → optional validate → executive brief. */
  processInstruction(
    instruction: string,
    options?: {
      autoDispatch?: boolean;
      changedFiles?: string[];
      logs?: Array<{ source: LogSource; text: string }>;
      diffSummary?: string;
    },
  ): BridgeProcessResult {
    const started = performance.now();
    const routed = routeBridgeInstruction(instruction);

    const mission = assembleEngineeringMission({
      instruction: routed,
      bootstrap: this.bootstrap,
      planner: this.planner,
      technicalChief: this.technicalChief,
      uxDesigner: this.uxDesigner,
    });

    this.totalMissions += 1;

    let dispatch: DispatchResult = {
      bridgeMissionId: mission.bridgeMissionId,
      mode: "artifact",
      dispatched: false,
      supervisorMissionId: null,
      artifactPath: mission.artifactPath,
      sdkRunId: null,
      message: "Mission assembled — dispatch skipped",
    };

    if (options?.autoDispatch !== false) {
      dispatch = dispatchToCursor({
        mission,
        supervisor: this.supervisor,
        mode: this.defaultDispatchMode,
      });
      this.totalDispatches += 1;
    }

    let validation = null;
    let report = null;

    if (options?.changedFiles || options?.logs) {
      const pipeline = runValidationPipeline({
        mission,
        changedFiles: options.changedFiles ?? [],
        logs: options.logs ?? [],
        technicalChief: this.technicalChief,
        uxDesigner: this.uxDesigner,
        diffSummary: options.diffSummary,
      });
      validation = pipeline.validation;
      report = buildExecutiveBridgeReport({
        mission,
        dispatchMode: dispatch.mode,
        validation: pipeline.validation,
        logSummaries: pipeline.interpretations,
      });
    }

    const executiveBrief = report
      ? formatExecutiveBridgeReport(report)
      : formatProcessBrief(routed, mission, dispatch);

    return {
      bridgeMissionId: mission.bridgeMissionId,
      analyzedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started),
      instruction: routed,
      mission,
      dispatch,
      validation,
      report,
      executiveBrief,
    };
  }

  /** Validate completed Cursor work and produce executive report. */
  validateEngineeringWork(input: {
    instruction: string;
    changedFiles: string[];
    logs: Array<{ source: LogSource; text: string }>;
    diffSummary?: string;
  }): BridgeProcessResult {
    return this.processInstruction(input.instruction, {
      autoDispatch: false,
      changedFiles: input.changedFiles,
      logs: input.logs,
      diffSummary: input.diffSummary,
    });
  }
}

function formatProcessBrief(
  instruction: BridgeInstruction,
  mission: AutonomousEngineeringMission,
  dispatch: DispatchResult,
): string {
  return [
    "--- Autonomous Cursor Bridge (PILLOW-CB-001) ---",
    `Instruction (${instruction.kind}): ${instruction.rawInstruction}`,
    `Mission: ${mission.title}`,
    `Tasks: ${mission.tasks.length}`,
    `Files: ${mission.requiredFiles.slice(0, 4).join(", ") || "TBD"}`,
    `Risk: ${mission.riskSummary}`,
    `Dispatch: ${dispatch.mode} — ${dispatch.message}`,
    "",
    "### Acceptance Criteria",
    ...mission.acceptanceCriteria.slice(0, 4).map((a) => `- ${a}`),
    "",
    "### Cursor Prompt (excerpt)",
    mission.cursorPrompt.split("\n").slice(0, 6).join("\n"),
  ].join("\n");
}

export function createCursorBridgeEngine(
  bootstrap: EmpireBootstrapContext,
  planner: MissionPlannerEngine,
  supervisor: CursorSupervisorEngine,
  technicalChief: TechnicalChiefEngine,
  uxDesigner: UxDesignerEngine,
): CursorBridgeEngine {
  return new CursorBridgeEngine(
    bootstrap,
    planner,
    supervisor,
    technicalChief,
    uxDesigner,
  );
}
