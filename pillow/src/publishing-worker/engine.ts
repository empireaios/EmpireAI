import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { resetPublishSequenceForTesting } from "./publish-builder.js";
import { PublishManager } from "./publish-manager.js";
import {
  buildPublishingWorkerConfiguration,
  type PublishingWorkerConfiguration,
} from "./configuration.js";
import type { PublishingWorkerDependencies } from "./integrations.js";
import { PublishingWorkerController } from "./publishing-worker-controller.js";
import { resetPbwLogsForTesting } from "./pbw-logging.js";
import { PUBLISHING_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  PublishingWorkerCockpitSnapshot,
  PublishingWorkerInput,
  PublishingWorkerState,
} from "./types.js";

export interface PublishingWorkerOptions {
  configuration?: Partial<PublishingWorkerConfiguration>;
  dependencies?: PublishingWorkerDependencies;
}

/** Authoritative Q4-14 Publishing Worker — platform packages, never auto-publish. */
export class PublishingWorker {
  private initializedAt: string | null = null;
  private readonly controller: PublishingWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: PublishingWorkerOptions = {},
  ) {
    const manager = new PublishManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new PublishingWorkerController(
      manager,
      buildPublishingWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PUBLISHING_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Publishing Worker")) {
      throw new Error(
        `${PUBLISHING_WORKER_SYSTEM_PATH} missing — Q4-14 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: PublishingWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): PublishingWorkerState {
    if (!this.initializedAt) {
      throw new Error("Publishing Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PBW-001",
      missionId: "Q4-14",
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
        totalPublishingReports: engineRecord?.totalPublishingReports ?? 0,
        lastPublishingReportId: engineRecord?.lastPublishingReportId ?? null,
        lastMediaId: engineRecord?.lastMediaId ?? null,
        lastTargetPlatform: engineRecord?.lastTargetPlatform ?? null,
        lastReadinessStatus: engineRecord?.lastReadinessStatus ?? null,
        lastApprovalStatus: engineRecord?.lastApprovalStatus ?? null,
        notes: [
          "Publishing packages only: does not automatically publish content, modify approved media assets, override approval workflows, override Pillow or Grand King, or implement Q4-15 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveCompletedMediaAssets(input: PublishingWorkerInput = {}) {
    return this.controller.receiveCompletedMediaAssets(input);
  }

  generateOptimizedVideoTitles(input: PublishingWorkerInput = {}) {
    return this.controller.generateOptimizedVideoTitles(input);
  }

  generatePlatformDescriptions(input: PublishingWorkerInput = {}) {
    return this.controller.generatePlatformDescriptions(input);
  }

  generateTagsAndKeywords(input: PublishingWorkerInput = {}) {
    return this.controller.generateTagsAndKeywords(input);
  }

  selectApprovedThumbnails(input: PublishingWorkerInput = {}) {
    return this.controller.selectApprovedThumbnails(input);
  }

  generatePlaylists(input: PublishingWorkerInput = {}) {
    return this.controller.generatePlaylists(input);
  }

  generatePublishingSchedules(input: PublishingWorkerInput = {}) {
    return this.controller.generatePublishingSchedules(input);
  }

  preparePlatformUploadPackages(input: PublishingWorkerInput = {}) {
    return this.controller.preparePlatformUploadPackages(input);
  }

  validatePublishingReadiness(input: PublishingWorkerInput = {}) {
    return this.controller.validatePublishingReadiness(input);
  }

  producePublishingReport(input: PublishingWorkerInput = {}) {
    return this.controller.producePublishingReport(input);
  }

  submitReport(input: PublishingWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: PublishingWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getPublishingReports() {
    return this.controller.getManager().getPublishingReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestPublishingReportId() {
    return this.controller.getManager().getLatestPublishingReportId();
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
        `Publishing reports: ${state.health.totalPublishingReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PublishingWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-14",
      status: state.status,
      healthStatus: state.health.status,
      totalPublishingReports: state.health.totalPublishingReports,
      latestPublishingReportId: this.getLatestPublishingReportId(),
      lastMediaId: state.health.lastMediaId,
      lastTargetPlatform: state.health.lastTargetPlatform,
      lastReadinessStatus: state.health.lastReadinessStatus,
      lastApprovalStatus: state.health.lastApprovalStatus,
      workerId: state.configuration.workerId,
      neverAutomaticallyPublishContent: true,
      neverModifyApprovedMediaAssets: true,
      neverOverrideApprovalWorkflows: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ415OrLater: true,
    };
  }
}

export function createPublishingWorker(
  bootstrap: EmpireBootstrapContext,
  options?: PublishingWorkerOptions,
) {
  return new PublishingWorker(bootstrap, options);
}

export function resetPublishingWorkerForTesting() {
  resetPbwLogsForTesting();
  resetPublishSequenceForTesting();
}
