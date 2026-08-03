import type { EmpireBootstrapContext } from "../bootstrap/types.js";

import { RepositoryReader } from "../bootstrap/repository-reader.js";

import {

  buildArchitectureWorkerConfiguration,

  type ArchitectureWorkerConfiguration,

} from "./configuration.js";

import type { ArchitectureWorkerDependencies } from "./integrations.js";

import { ArchitectureWorkerController } from "./architecture-worker-controller.js";

import { resetArwLogsForTesting } from "./arw-logging.js";

import { ARCHITECTURE_WORKER_SYSTEM_PATH } from "./paths.js";

import { resetArchitectureSequenceForTesting } from "./architecture-builder.js";

import { ArchitectureManager } from "./architecture-manager.js";

import type {

  ArchitectureWorkerCockpitSnapshot,

  ArchitectureWorkerInput,

  ArchitectureWorkerState,

} from "./types.js";



export interface ArchitectureWorkerOptions {

  configuration?: Partial<ArchitectureWorkerConfiguration>;

  dependencies?: ArchitectureWorkerDependencies;

}



/** Authoritative Q6-03 Architecture Worker — architecture (structural signals). */

export class ArchitectureWorker {

  private initializedAt: string | null = null;

  private readonly controller: ArchitectureWorkerController;



  constructor(

    private readonly bootstrap: EmpireBootstrapContext,

    options: ArchitectureWorkerOptions = {},

  ) {

    const manager = new ArchitectureManager();

    if (options.dependencies) manager.bindIntegrations(options.dependencies);

    this.controller = new ArchitectureWorkerController(

      manager,

      buildArchitectureWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),

    );

  }



  async initialize() {

    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(

      ARCHITECTURE_WORKER_SYSTEM_PATH,

    );

    if (!doc?.includes("Architecture Worker")) {

      throw new Error(

        `${ARCHITECTURE_WORKER_SYSTEM_PATH} missing — Q6-03 system doc required.`,

      );

    }

    this.controller.initialize();

    this.initializedAt = new Date().toISOString();

    return this.getState();

  }



  bindIntegrations(deps: ArchitectureWorkerDependencies = {}) {

    this.controller.bindIntegrations(deps);

  }



  getState(): ArchitectureWorkerState {

    if (!this.initializedAt) {

      throw new Error("Architecture Worker not initialized. Call initialize() first.");

    }

    const configuration = this.controller.getConfiguration();

    const engineRecord = this.controller.getManager().getEngineRecord();

    const latestReport = this.controller.getLatestReport();

    return {

      engineVersion: "PILLOW-ARW-001",

      missionId: "Q6-03",

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

        totalArchitectureReports: engineRecord?.totalArchitectureReports ?? 0,

        lastArchitectureReportId: engineRecord?.lastArchitectureReportId ?? null,

        lastArchitectureDomain: engineRecord?.lastArchitectureDomain ?? null,

        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,

        notes: [

          "Architecture Worker transforms approved requirements into production-ready technical architecture only: does not write frontend/backend code, deploy applications, implement application logic, override Pillow or Grand King, or implement Q6-04 or later.",

        ],

      },

    };

  }



  connect(input: Record<string, unknown> = {}) {

    return this.controller.connect(input);

  }



  receiveApprovedRequirementsReports(input: ArchitectureWorkerInput = {}) {

    return this.controller.receiveApprovedRequirementsReports(input);

  }



  receiveApprovedRequirementsReport(input: ArchitectureWorkerInput = {}) {

    return this.controller.receiveApprovedRequirementsReport(input);

  }



  designOverallSystemArchitecture(input: ArchitectureWorkerInput = {}) {

    return this.controller.designOverallSystemArchitecture(input);

  }



  defineApplicationModules(input: ArchitectureWorkerInput = {}) {

    return this.controller.defineApplicationModules(input);

  }



  designInternalAndExternalApis(input: ArchitectureWorkerInput = {}) {

    return this.controller.designInternalAndExternalApis(input);

  }



  designServiceBoundaries(input: ArchitectureWorkerInput = {}) {

    return this.controller.designServiceBoundaries(input);

  }



  designDataFlowArchitecture(input: ArchitectureWorkerInput = {}) {

    return this.controller.designDataFlowArchitecture(input);

  }



  designDeploymentTopology(input: ArchitectureWorkerInput = {}) {

    return this.controller.designDeploymentTopology(input);

  }



  identifyArchitecturalDependencies(input: ArchitectureWorkerInput = {}) {

    return this.controller.identifyArchitecturalDependencies(input);

  }



  evaluateScalabilitySecurityAndMaintainability(input: ArchitectureWorkerInput = {}) {

    return this.controller.evaluateScalabilitySecurityAndMaintainability(input);

  }



  produceArchitectureReport(input: ArchitectureWorkerInput = {}) {

    return this.controller.produceArchitectureReport(input);

  }



  submitReport(input: ArchitectureWorkerInput = {}) {

    return this.controller.submitReport(input);

  }



  list() {

    return this.controller.list();

  }



  validate(input: ArchitectureWorkerInput = {}) {

    return this.controller.validate(input);

  }



  diagnostics() {

    return this.controller.diagnostics();

  }



  getArchitectureReports() {

    return this.controller.getManager().getArchitectureReports();

  }



  getCatalog() {

    return this.controller.getManager().getCatalog();

  }



  getEngineRecord() {

    return this.controller.getManager().getEngineRecord();

  }



  getLatestArchitectureReportId() {

    return this.controller.getManager().getLatestArchitectureReportId();

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

        `Architecture reports: ${state.health.totalArchitectureReports}`,

        ...state.health.notes,

      ],

    };

  }



  getCockpitSnapshot(): ArchitectureWorkerCockpitSnapshot {

    const state = this.getState();

    return {

      missionId: "Q6-03",

      status: state.status,

      healthStatus: state.health.status,

      totalArchitectureReports: state.health.totalArchitectureReports,

      latestArchitectureReportId: this.getLatestArchitectureReportId(),

      lastArchitectureDomain: state.health.lastArchitectureDomain,

      lastConfidenceScore: state.health.lastConfidenceScore,

      workerId: state.configuration.workerId,

      neverWriteFrontendCode: true,

      neverWriteBackendCode: true,

      neverDeployApplications: true,

      neverOverridePillow: true,

      neverOverrideGrandKing: true,

      neverImplementApplicationLogic: true,

      neverImplementQ604OrLater: true,

    };

  }

}



export function createArchitectureWorker(

  bootstrap: EmpireBootstrapContext,

  options?: ArchitectureWorkerOptions,

) {

  return new ArchitectureWorker(bootstrap, options);

}



export function resetArchitectureWorkerForTesting() {

  resetArwLogsForTesting();

  resetArchitectureSequenceForTesting();

}


