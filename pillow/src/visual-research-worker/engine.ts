import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildVisualResearchWorkerConfiguration,
  type VisualResearchWorkerConfiguration,
} from "./configuration.js";
import type { VisualResearchWorkerDependencies } from "./integrations.js";
import { VisualResearchWorkerController } from "./visual-research-worker-controller.js";
import { resetVrwLogsForTesting } from "./vrw-logging.js";
import { VISUAL_RESEARCH_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetVisualSequenceForTesting } from "./visual-builder.js";
import { VisualManager } from "./visual-manager.js";
import type {
  VisualResearchWorkerCockpitSnapshot,
  VisualResearchWorkerInput,
  VisualResearchWorkerState,
} from "./types.js";

export interface VisualResearchWorkerOptions {
  configuration?: Partial<VisualResearchWorkerConfiguration>;
  dependencies?: VisualResearchWorkerDependencies;
}

/** Authoritative Q4-08 Visual Research Worker — visual reference discovery only. */
export class VisualResearchWorker {
  private initializedAt: string | null = null;
  private readonly controller: VisualResearchWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: VisualResearchWorkerOptions = {},
  ) {
    const manager = new VisualManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new VisualResearchWorkerController(
      manager,
      buildVisualResearchWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      VISUAL_RESEARCH_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Visual Research Worker")) {
      throw new Error(
        `${VISUAL_RESEARCH_WORKER_SYSTEM_PATH} missing — Q4-08 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: VisualResearchWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): VisualResearchWorkerState {
    if (!this.initializedAt) {
      throw new Error("Visual Research Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-VRW-001",
      missionId: "Q4-08",
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
        totalVisualResearchReports: engineRecord?.totalVisualResearchReports ?? 0,
        lastVisualResearchId: engineRecord?.lastVisualResearchId ?? null,
        lastScriptId: engineRecord?.lastScriptId ?? null,
        lastContentFormat: engineRecord?.lastContentFormat ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Visual-research-only: does not generate final creative assets, edit images, assemble videos, publish content, override Pillow or Grand King, or implement Q4-09 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedScript(input: VisualResearchWorkerInput = {}) {
    return this.controller.receiveApprovedScript(input);
  }

  breakIntoVisualScenes(input: VisualResearchWorkerInput = {}) {
    return this.controller.breakIntoVisualScenes(input);
  }

  identifyRequiredVisualAssets(input: VisualResearchWorkerInput = {}) {
    return this.controller.identifyRequiredVisualAssets(input);
  }

  searchApprovedStockLibraries(input: VisualResearchWorkerInput = {}) {
    return this.controller.searchApprovedStockLibraries(input);
  }

  searchPublicDomainSources(input: VisualResearchWorkerInput = {}) {
    return this.controller.searchPublicDomainSources(input);
  }

  identifyInternallyGeneratedAssets(input: VisualResearchWorkerInput = {}) {
    return this.controller.identifyInternallyGeneratedAssets(input);
  }

  classifyCopyrightStatus(input: VisualResearchWorkerInput = {}) {
    return this.controller.classifyCopyrightStatus(input);
  }

  matchVisualsToScriptTimeline(input: VisualResearchWorkerInput = {}) {
    return this.controller.matchVisualsToScriptTimeline(input);
  }

  detectMissingVisualCoverage(input: VisualResearchWorkerInput = {}) {
    return this.controller.detectMissingVisualCoverage(input);
  }

  produceVisualResearchReport(input: VisualResearchWorkerInput = {}) {
    return this.controller.produceVisualResearchReport(input);
  }

  submitReport(input: VisualResearchWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: VisualResearchWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getVisualResearchReports() {
    return this.controller.getManager().getVisualResearchReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestVisualResearchId() {
    return this.controller.getManager().getLatestVisualResearchId();
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
        `Visual research reports: ${state.health.totalVisualResearchReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): VisualResearchWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-08",
      status: state.status,
      healthStatus: state.health.status,
      totalVisualResearchReports: state.health.totalVisualResearchReports,
      latestVisualResearchId: this.getLatestVisualResearchId(),
      lastScriptId: state.health.lastScriptId,
      lastContentFormat: state.health.lastContentFormat,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverGenerateFinalCreativeAssets: true,
      neverEditImages: true,
      neverAssembleVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createVisualResearchWorker(
  bootstrap: EmpireBootstrapContext,
  options?: VisualResearchWorkerOptions,
) {
  return new VisualResearchWorker(bootstrap, options);
}

export function resetVisualResearchWorkerForTesting() {
  resetVrwLogsForTesting();
  resetVisualSequenceForTesting();
}
