import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildImplementationSpecificationEngineConfiguration,
  type ImplementationSpecificationEngineConfiguration,
} from "./configuration.js";
import type { ImplementationSpecificationEngineDependencies } from "./integrations.js";
import {
  ImplementationSpecificationEngineManager,
  resetImplementationSpecificationEngineManagerSequencesForTesting,
} from "./implementation-specification-engine-manager.js";
import { ImplementationSpecificationEngineController } from "./implementation-specification-engine-controller.js";
import { resetIsengLogsForTesting } from "./iseng-logging.js";
import { IMPLEMENTATION_SPECIFICATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import { resetIsengSequenceForTesting } from "./audit-store.js";
import type {
  IsengInput,
  ImplementationSpecificationEngineCockpitSnapshot,
  ImplementationSpecificationEngineState,
} from "./types.js";

export interface ImplementationSpecificationEngineOptions {
  configuration?: Partial<ImplementationSpecificationEngineConfiguration>;
  dependencies?: ImplementationSpecificationEngineDependencies;
}

/**
 * Authoritative Q13-01 Implementation Specification Engine — architecture-aware
 * implementation specifications only; never executes implementations.
 *
 * Consumes Q1301ConsumableContract from injected aiInnovationFactory.
 * Exposes Q1302ConsumableContract for Q13-02 without implementing Q13-02.
 *
 * NEVER fabricates repository state, NEVER overwrites verified implementations,
 * NEVER executes implementations, NEVER auto-deploys, NEVER bypasses governance.
 */
export class ImplementationSpecificationEngine {
  private initializedAt: string | null = null;
  private readonly manager: ImplementationSpecificationEngineManager;
  private readonly controller: ImplementationSpecificationEngineController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ImplementationSpecificationEngineOptions = {},
  ) {
    this.manager = new ImplementationSpecificationEngineManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new ImplementationSpecificationEngineController(
      this.manager,
      buildImplementationSpecificationEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      IMPLEMENTATION_SPECIFICATION_ENGINE_SYSTEM_PATH,
    );
    if (!doc?.includes("Implementation Specification Engine")) {
      throw new Error(`${IMPLEMENTATION_SPECIFICATION_ENGINE_SYSTEM_PATH} missing — Q13-01 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ImplementationSpecificationEngineDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): ImplementationSpecificationEngineState {
    if (!this.initializedAt) {
      throw new Error("Implementation Specification Engine not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-ISENG-001",
      missionId: "Q13-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
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
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Implementation Specification Engine: specification only; never executes implementations; never auto-deploy.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  parseApprovedRoadmapMission(input: IsengInput = {}) {
    return this.controller.parseApprovedRoadmapMission(input);
  }

  analyseRepositoryArchitecture(input: IsengInput = {}) {
    return this.controller.analyseRepositoryArchitecture(input);
  }

  discoverImplementationDependencies(input: IsengInput = {}) {
    return this.controller.discoverImplementationDependencies(input);
  }

  detectExistingImplementationsToPreserve(input: IsengInput = {}) {
    return this.controller.detectExistingImplementationsToPreserve(input);
  }

  generateImplementationSpecification(input: IsengInput = {}) {
    return this.controller.generateImplementationSpecification(input);
  }

  produceSpecificationReport(input: IsengInput = {}) {
    return this.controller.produceSpecificationReport(input);
  }

  async produceReport(input: IsengInput = {}) {
    return this.produceSpecificationReport(input);
  }

  submitReport(input: IsengInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.manager.getReports();
  }

  getCatalog() {
    return this.manager.getCatalog();
  }

  getAuditTrail(limit = 100) {
    return this.manager.getAuditTrail(limit);
  }

  getQ1302ConsumableContract() {
    return this.controller.getQ1302ConsumableContract();
  }

  getSpecificationHistory(limit = 100) {
    return this.controller.getSpecificationHistory(limit);
  }

  validate(input: IsengInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getIntegrations() {
    return this.manager.getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : Math.round((state.health.lastConfidenceScore ?? 0) * 100) || 50;
    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Specification reports: ${state.health.totalReports}`,
        `Specifications: ${state.health.totalSpecifications}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ImplementationSpecificationEngineCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q13-01",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalSpecifications: state.health.totalSpecifications,
      latestReportId: state.health.lastReportId,
      workerId: state.configuration.workerId,
      neverFabricateRepositoryState: true,
      neverExecuteImplementations: true,
      neverAutoDeploy: true,
      neverBypassGovernance: true,
      neverImplementQ1302OrLater: true,
    };
  }
}

export function createImplementationSpecificationEngine(
  bootstrap: EmpireBootstrapContext,
  options?: ImplementationSpecificationEngineOptions,
) {
  return new ImplementationSpecificationEngine(bootstrap, options);
}

export function resetImplementationSpecificationEngineForTesting() {
  resetIsengLogsForTesting();
  resetIsengSequenceForTesting();
  resetImplementationSpecificationEngineManagerSequencesForTesting();
}
