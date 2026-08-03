import type { EmpireBootstrapContext } from "../bootstrap/types.js";

import { RepositoryReader } from "../bootstrap/repository-reader.js";

import {

  buildEditorInChiefWorkerConfiguration,

  type EditorInChiefWorkerConfiguration,

} from "./configuration.js";

import type { EditorInChiefWorkerDependencies } from "./integrations.js";

import { EditorInChiefWorkerController } from "./editor-in-chief-worker-controller.js";

import { resetEcwLogsForTesting } from "./ecw-logging.js";

import { EDITOR_IN_CHIEF_WORKER_SYSTEM_PATH } from "./paths.js";

import { resetEditorialSequenceForTesting } from "./editorial-builder.js";

import { EditorialManager } from "./editorial-manager.js";

import type {

  EditorInChiefWorkerCockpitSnapshot,

  EditorInChiefWorkerInput,

  EditorInChiefWorkerState,

} from "./types.js";



export interface EditorInChiefWorkerOptions {

  configuration?: Partial<EditorInChiefWorkerConfiguration>;

  dependencies?: EditorInChiefWorkerDependencies;

}



/** Authoritative Q4-02 Editor-in-Chief Worker — editorial direction only. */

export class EditorInChiefWorker {

  private initializedAt: string | null = null;

  private readonly controller: EditorInChiefWorkerController;



  constructor(

    private readonly bootstrap: EmpireBootstrapContext,

    options: EditorInChiefWorkerOptions = {},

  ) {

    const manager = new EditorialManager();

    if (options.dependencies) manager.bindIntegrations(options.dependencies);

    this.controller = new EditorInChiefWorkerController(

      manager,

      buildEditorInChiefWorkerConfiguration(

        bootstrap.repositoryRoot,

        options.configuration,

      ),

    );

  }



  async initialize() {

    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(

      EDITOR_IN_CHIEF_WORKER_SYSTEM_PATH,

    );

    if (!doc?.includes("Editor-in-Chief Worker")) {

      throw new Error(

        `${EDITOR_IN_CHIEF_WORKER_SYSTEM_PATH} missing — Q4-02 system doc required.`,

      );

    }

    this.controller.initialize();

    this.initializedAt = new Date().toISOString();

    return this.getState();

  }



  bindIntegrations(deps: EditorInChiefWorkerDependencies = {}) {

    this.controller.bindIntegrations(deps);

  }



  getState(): EditorInChiefWorkerState {

    if (!this.initializedAt) {

      throw new Error("Editor-in-Chief Worker not initialized. Call initialize() first.");

    }

    const configuration = this.controller.getConfiguration();

    const engineRecord = this.controller.getManager().getEngineRecord();

    const latestReport = this.controller.getLatestReport();

    return {

      engineVersion: "PILLOW-ECW-001",

      missionId: "Q4-02",

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

        totalEditorialReports: engineRecord?.totalEditorialReports ?? 0,

        lastEditorialReportId: engineRecord?.lastEditorialReportId ?? null,

        lastReviewOutcome: engineRecord?.lastReviewOutcome ?? null,

        lastApprovalStatus: engineRecord?.lastApprovalStatus ?? null,

        lastBrandConsistencyStatus: engineRecord?.lastBrandConsistencyStatus ?? null,

        notes: [

          "Editorial direction only: does not write scripts, create thumbnails, assemble videos, publish content, bypass Pillow governance, override Pillow, or override Grand King.",

        ],

      },

    };

  }



  connect(input: Record<string, unknown> = {}) {

    return this.controller.connect(input);

  }



  manageEditorialDirection(input: EditorInChiefWorkerInput = {}) {

    return this.controller.manageEditorialDirection(input);

  }



  defineChannelIdentity(input: EditorInChiefWorkerInput = {}) {

    return this.controller.defineChannelIdentity(input);

  }



  defineTargetAudience(input: EditorInChiefWorkerInput = {}) {

    return this.controller.defineTargetAudience(input);

  }



  defineEditorialTone(input: EditorInChiefWorkerInput = {}) {

    return this.controller.defineEditorialTone(input);

  }



  defineContentStandards(input: EditorInChiefWorkerInput = {}) {

    return this.controller.defineContentStandards(input);

  }



  definePublishingPriorities(input: EditorInChiefWorkerInput = {}) {

    return this.controller.definePublishingPriorities(input);

  }



  reviewContentQuality(input: EditorInChiefWorkerInput = {}) {

    return this.controller.reviewContentQuality(input);

  }



  ensureBrandConsistency(input: EditorInChiefWorkerInput = {}) {

    return this.controller.ensureBrandConsistency(input);

  }



  maintainLongTermStrategy(input: EditorInChiefWorkerInput = {}) {

    return this.controller.maintainLongTermStrategy(input);

  }



  approveEditorialDecisions(input: EditorInChiefWorkerInput = {}) {

    return this.controller.approveEditorialDecisions(input);

  }



  produceEditorialReport(input: EditorInChiefWorkerInput = {}) {

    return this.controller.produceReport(input);

  }



  submitReport(input: EditorInChiefWorkerInput = {}) {

    return this.controller.submitReport(input);

  }



  listEditorialReports() {

    return this.controller.list();

  }



  validateEditorInChiefWorker(input: EditorInChiefWorkerInput = {}) {

    return this.controller.validate(input);

  }



  runDiagnostics() {

    return this.controller.diagnostics();

  }



  getEditorialReports() {

    return this.controller.getManager().getEditorialReports();

  }



  getCatalog() {

    return this.controller.getManager().getCatalog();

  }



  getEngineRecord() {

    return this.controller.getManager().getEngineRecord();

  }



  getLatestEditorialReportId() {

    return this.controller.getManager().getLatestEditorialReportId();

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

        `Editorial reports: ${state.health.totalEditorialReports}`,

        ...state.health.notes,

      ],

    };

  }



  getCockpitSnapshot(): EditorInChiefWorkerCockpitSnapshot {

    const state = this.getState();

    return {

      missionId: "Q4-02",

      status: state.status,

      healthStatus: state.health.status,

      totalEditorialReports: state.health.totalEditorialReports,

      latestEditorialReportId: this.getLatestEditorialReportId(),

      lastReviewOutcome: state.health.lastReviewOutcome,

      lastApprovalStatus: state.health.lastApprovalStatus,

      lastBrandConsistencyStatus: state.health.lastBrandConsistencyStatus,

      workerId: state.configuration.workerId,

      neverWriteScripts: true,

      neverCreateThumbnails: true,

      neverAssembleVideos: true,

      neverPublishContent: true,

      neverBypassPillowGovernance: true,

      neverOverridePillow: true,

      neverOverrideGrandKing: true,

    };

  }

}



export function createEditorInChiefWorker(

  bootstrap: EmpireBootstrapContext,

  options?: EditorInChiefWorkerOptions,

) {

  return new EditorInChiefWorker(bootstrap, options);

}



export function resetEditorInChiefWorkerForTesting() {

  resetEcwLogsForTesting();

  resetEditorialSequenceForTesting();

}


