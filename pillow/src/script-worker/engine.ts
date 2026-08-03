import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildScriptWorkerConfiguration,
  type ScriptWorkerConfiguration,
} from "./configuration.js";
import type { ScriptWorkerDependencies } from "./integrations.js";
import { ScriptWorkerController } from "./script-worker-controller.js";
import { resetScwLogsForTesting } from "./scw-logging.js";
import { SCRIPT_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetScriptSequenceForTesting } from "./script-builder.js";
import { ScriptManager } from "./script-manager.js";
import type {
  ScriptWorkerCockpitSnapshot,
  ScriptWorkerInput,
  ScriptWorkerState,
} from "./types.js";

export interface ScriptWorkerOptions {
  configuration?: Partial<ScriptWorkerConfiguration>;
  dependencies?: ScriptWorkerDependencies;
}

/** Authoritative Q4-05 Script Worker — script creation only. */
export class ScriptWorker {
  private initializedAt: string | null = null;
  private readonly controller: ScriptWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ScriptWorkerOptions = {},
  ) {
    const manager = new ScriptManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ScriptWorkerController(
      manager,
      buildScriptWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SCRIPT_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Script Worker")) {
      throw new Error(
        `${SCRIPT_WORKER_SYSTEM_PATH} missing — Q4-05 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ScriptWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ScriptWorkerState {
    if (!this.initializedAt) {
      throw new Error("Script Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-SCW-001",
      missionId: "Q4-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalScripts: engineRecord?.totalScripts ?? 0,
        lastScriptId: engineRecord?.lastScriptId ?? null,
        lastContentFormat: engineRecord?.lastContentFormat ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Script-only: does not generate visuals, voiceovers, assemble videos, publish content, override Pillow or Grand King, or implement Q4-06 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedTopicPlan(input: ScriptWorkerInput = {}) {
    return this.controller.receiveApprovedTopicPlan(input);
  }

  receiveEditorialStrategy(input: ScriptWorkerInput = {}) {
    return this.controller.receiveEditorialStrategy(input);
  }

  determineContentFormat(input: ScriptWorkerInput = {}) {
    return this.controller.determineContentFormat(input);
  }

  generateCompleteScript(input: ScriptWorkerInput = {}) {
    return this.controller.generateCompleteScript(input);
  }

  adaptWritingStyle(input: ScriptWorkerInput = {}) {
    return this.controller.adaptWritingStyle(input);
  }

  structureScriptSections(input: ScriptWorkerInput = {}) {
    return this.controller.structureScriptSections(input);
  }

  generateNarrationReadyOutput(input: ScriptWorkerInput = {}) {
    return this.controller.generateNarrationReadyOutput(input);
  }

  selfReviewScript(input: ScriptWorkerInput = {}) {
    return this.controller.selfReviewScript(input);
  }

  produceScriptReport(input: ScriptWorkerInput = {}) {
    return this.controller.produceScriptReport(input);
  }

  submitReport(input: ScriptWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: ScriptWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getScripts() {
    return this.controller.getManager().getScripts();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestScriptId() {
    return this.controller.getManager().getLatestScriptId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Scripts: ${state.health.totalScripts}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ScriptWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-05",
      status: state.status,
      healthStatus: state.health.status,
      totalScripts: state.health.totalScripts,
      latestScriptId: this.getLatestScriptId(),
      lastContentFormat: state.health.lastContentFormat,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverGenerateVisuals: true,
      neverGenerateVoiceovers: true,
      neverAssembleVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createScriptWorker(
  bootstrap: EmpireBootstrapContext,
  options?: ScriptWorkerOptions,
) {
  return new ScriptWorker(bootstrap, options);
}

export function resetScriptWorkerForTesting() {
  resetScwLogsForTesting();
  resetScriptSequenceForTesting();
}
