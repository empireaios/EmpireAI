import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCursorSpecificationGeneratorConfiguration,
  type CursorSpecificationGeneratorConfiguration,
} from "./configuration.js";
import type { CursorSpecificationGeneratorDependencies } from "./integrations.js";
import {
  CursorSpecificationGeneratorManager,
  resetCursorSpecificationGeneratorManagerSequencesForTesting,
} from "./cursor-specification-generator-manager.js";
import { CursorSpecificationGeneratorController } from "./cursor-specification-generator-controller.js";
import { resetCsgenLogsForTesting } from "./csgen-logging.js";
import { CURSOR_SPECIFICATION_GENERATOR_SYSTEM_PATH } from "./paths.js";
import { resetCsgenSequenceForTesting } from "./audit-store.js";
import type {
  CursorSpecificationGeneratorCockpitSnapshot,
  CursorSpecificationGeneratorState,
  CsgenInput,
} from "./types.js";

export interface CursorSpecificationGeneratorOptions {
  configuration?: Partial<CursorSpecificationGeneratorConfiguration>;
  dependencies?: CursorSpecificationGeneratorDependencies;
}

/**
 * Authoritative Q13-04 Cursor Specification Generator — specification only; never implements code.
 * Consumes getQ1304ConsumableContract from missionPlanningEngine (MPENG, Q13-03).
 * Consumes RIENG Q1303 and optionally ISENG specifications.
 * Exposes Q1305ConsumableContract for Q13-05 without implementing Q13-05 or later.
 */
export class CursorSpecificationGenerator {
  private initializedAt: string | null = null;
  private readonly manager: CursorSpecificationGeneratorManager;
  private readonly controller: CursorSpecificationGeneratorController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CursorSpecificationGeneratorOptions = {},
  ) {
    this.manager = new CursorSpecificationGeneratorManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new CursorSpecificationGeneratorController(
      this.manager,
      buildCursorSpecificationGeneratorConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      CURSOR_SPECIFICATION_GENERATOR_SYSTEM_PATH,
    );
    if (!doc?.includes("Cursor Specification Generator")) {
      throw new Error(`${CURSOR_SPECIFICATION_GENERATOR_SYSTEM_PATH} missing — Q13-04 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: CursorSpecificationGeneratorDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): CursorSpecificationGeneratorState {
    if (!this.initializedAt) {
      throw new Error("Cursor Specification Generator not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const latestSpecification = this.controller.getLatestSpecification();
    return {
      engineVersion: "PILLOW-CSGEN-001",
      missionId: "Q13-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      latestSpecification,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: Math.round((latestReport?.confidenceScore ?? 0) * 100) || 0,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        totalSpecifications: engineRecord?.totalSpecifications ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastSpecificationId: engineRecord?.lastSpecificationId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Cursor Specification Generator: specification only; never implements code; never executes Cursor missions.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  consumeApprovedRoadmapMission(input: CsgenInput = {}) {
    return this.controller.consumeApprovedRoadmapMission(input);
  }

  consumeRepositoryIntelligence() {
    return this.controller.consumeRepositoryIntelligence();
  }

  consumeMissionPlanning() {
    return this.controller.consumeMissionPlanning();
  }

  consumeImplementationSpecification() {
    return this.controller.consumeImplementationSpecification();
  }

  generateCursorSpecification(input: CsgenInput = {}) {
    return this.controller.generateCursorSpecification(input);
  }

  validateBoundaries() {
    return this.controller.validateBoundaries();
  }

  validateGovernance() {
    return this.controller.validateGovernance();
  }

  validateCompleteness(input: CsgenInput = {}) {
    return this.controller.validateCompleteness(input);
  }

  produceCursorSpecificationReport(input: CsgenInput = {}) {
    return this.controller.produceCursorSpecificationReport(input);
  }

  async produceReport(input: CsgenInput = {}) {
    return this.produceCursorSpecificationReport(input);
  }

  submitReport(input: CsgenInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.manager.getReports();
  }

  getSpecifications() {
    return this.manager.getSpecifications();
  }

  getCatalog() {
    return this.manager.getCatalog();
  }

  getAuditTrail(limit = 100) {
    return this.manager.getAuditTrail(limit);
  }

  getSpecificationHistory(limit = 100) {
    return this.manager.getSpecificationHistory(limit);
  }

  getQ1305ConsumableContract() {
    return this.controller.getQ1305ConsumableContract();
  }

  validate(input: CsgenInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getCockpitSnapshot(): CursorSpecificationGeneratorCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q13-04",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalSpecifications: state.health.totalSpecifications,
      latestReportId: state.health.lastReportId,
      latestSpecificationId: state.health.lastSpecificationId,
      workerId: state.configuration.workerId,
      neverImplementCode: true,
      neverExecuteCursorMissions: true,
      neverImplementQ1305OrLater: true,
      neverSelfApprove: true,
      neverBypassGovernance: true,
    };
  }

  validateForSupervisorSync() {
    const diagnostics = this.runDiagnostics();
    return {
      missionId: "Q13-04" as const,
      readinessScore: diagnostics.readinessScore,
      q1304PrerequisitePresent: diagnostics.q1304PrerequisitePresent,
      reports: diagnostics.reports,
      specifications: diagnostics.specifications,
    };
  }
}

export function createCursorSpecificationGenerator(
  bootstrap: EmpireBootstrapContext,
  options?: CursorSpecificationGeneratorOptions,
) {
  return new CursorSpecificationGenerator(bootstrap, options);
}

export function resetCursorSpecificationGeneratorForTesting() {
  resetCsgenSequenceForTesting();
  resetCsgenLogsForTesting();
  resetCursorSpecificationGeneratorManagerSequencesForTesting();
}
