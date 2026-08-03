import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildRequirementsWorkerConfiguration,
  type RequirementsWorkerConfiguration,
} from "./configuration.js";
import type { RequirementsWorkerDependencies } from "./integrations.js";
import { RequirementsWorkerController } from "./requirements-worker-controller.js";
import { resetRqwLogsForTesting } from "./rqw-logging.js";
import { REQUIREMENTS_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetRequirementsSequenceForTesting } from "./requirements-builder.js";
import { RequirementsManager } from "./requirements-manager.js";
import type {
  RequirementsWorkerCockpitSnapshot,
  RequirementsWorkerInput,
  RequirementsWorkerState,
} from "./types.js";

export interface RequirementsWorkerOptions {
  configuration?: Partial<RequirementsWorkerConfiguration>;
  dependencies?: RequirementsWorkerDependencies;
}

/** Authoritative Q6-02 Requirements Worker — requirements (structural signals). */
export class RequirementsWorker {
  private initializedAt: string | null = null;
  private readonly controller: RequirementsWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: RequirementsWorkerOptions = {},
  ) {
    const manager = new RequirementsManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new RequirementsWorkerController(
      manager,
      buildRequirementsWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      REQUIREMENTS_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Requirements Worker")) {
      throw new Error(
        `${REQUIREMENTS_WORKER_SYSTEM_PATH} missing — Q6-02 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: RequirementsWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): RequirementsWorkerState {
    if (!this.initializedAt) {
      throw new Error("Requirements Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-RQW-001",
      missionId: "Q6-02",
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
        totalRequirementsReports: engineRecord?.totalRequirementsReports ?? 0,
        lastRequirementsReportId: engineRecord?.lastRequirementsReportId ?? null,
        lastRequirementType: engineRecord?.lastRequirementType ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Requirements Worker transforms approved business intent into structured requirements only: does not design architecture, write application code, deploy software, invent unsupported requirements, override Pillow or Grand King, or implement Q6-03 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedBusinessIntent(input: RequirementsWorkerInput = {}) {
    return this.controller.receiveApprovedBusinessIntent(input);
  }

  identifyStakeholders(input: RequirementsWorkerInput = {}) {
    return this.controller.identifyStakeholders(input);
  }

  defineBusinessObjectives(input: RequirementsWorkerInput = {}) {
    return this.controller.defineBusinessObjectives(input);
  }

  produceFunctionalRequirements(input: RequirementsWorkerInput = {}) {
    return this.controller.produceFunctionalRequirements(input);
  }

  produceNonFunctionalRequirements(input: RequirementsWorkerInput = {}) {
    return this.controller.produceNonFunctionalRequirements(input);
  }

  generateUserStories(input: RequirementsWorkerInput = {}) {
    return this.controller.generateUserStories(input);
  }

  generateUseCases(input: RequirementsWorkerInput = {}) {
    return this.controller.generateUseCases(input);
  }

  generateAcceptanceCriteria(input: RequirementsWorkerInput = {}) {
    return this.controller.generateAcceptanceCriteria(input);
  }

  identifyAssumptionsRisksAndConstraints(input: RequirementsWorkerInput = {}) {
    return this.controller.identifyAssumptionsRisksAndConstraints(input);
  }

  produceRequirementsReport(input: RequirementsWorkerInput = {}) {
    return this.controller.produceRequirementsReport(input);
  }

  submitReport(input: RequirementsWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: RequirementsWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getRequirementsReports() {
    return this.controller.getManager().getRequirementsReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestRequirementsReportId() {
    return this.controller.getManager().getLatestRequirementsReportId();
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
        `Requirements reports: ${state.health.totalRequirementsReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RequirementsWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q6-02",
      status: state.status,
      healthStatus: state.health.status,
      totalRequirementsReports: state.health.totalRequirementsReports,
      latestRequirementsReportId: this.getLatestRequirementsReportId(),
      lastRequirementType: state.health.lastRequirementType,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverDesignArchitecture: true,
      neverWriteApplicationCode: true,
      neverDeploySoftware: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverInventUnsupportedBusinessRequirements: true,
      neverImplementQ603OrLater: true,
    };
  }
}

export function createRequirementsWorker(
  bootstrap: EmpireBootstrapContext,
  options?: RequirementsWorkerOptions,
) {
  return new RequirementsWorker(bootstrap, options);
}

export function resetRequirementsWorkerForTesting() {
  resetRqwLogsForTesting();
  resetRequirementsSequenceForTesting();
}
