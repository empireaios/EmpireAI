import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCapitalFactoryCertificationConfiguration,
  type CapitalFactoryCertificationConfiguration,
} from "./configuration.js";
import type { CapitalFactoryCertificationDependencies } from "./integrations.js";
import { CapitalFactoryCertificationManager } from "./certification-manager.js";
import { CapitalFactoryCertificationController } from "./capital-factory-certification-controller.js";
import { resetCapcrtLogsForTesting } from "./capcrt-logging.js";
import { WORKER_CERTIFICATION_STATUSES, CAPITAL_FACTORY_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import { resetCapcrtSequenceForTesting } from "./certification-store.js";
import type {
  CapcrtInput,
  CapitalFactoryCertificationCockpitSnapshot,
  CapitalFactoryCertificationState,
} from "./types.js";

export interface CapitalFactoryCertificationOptions {
  configuration?: Partial<CapitalFactoryCertificationConfiguration>;
  dependencies?: CapitalFactoryCertificationDependencies;
}

/**
 * Authoritative Q9-11 Capital Factory Certification — the final Q9 acceptance
 * gate for the Capital Factory (Q9-01..Q9-10).
 *
 * Certification is evidence-based from repository state + optional runtime
 * probes only. It NEVER fabricates successful tests, NEVER assumes implementation,
 * NEVER implements missing workers, and NEVER overrides governance, approved
 * architecture, Pillow, or Grand King. It NEVER implements Q10 or later.
 */
export class CapitalFactoryCertification {
  private initializedAt: string | null = null;
  private readonly manager: CapitalFactoryCertificationManager;
  private readonly controller: CapitalFactoryCertificationController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CapitalFactoryCertificationOptions = {},
  ) {
    this.manager = new CapitalFactoryCertificationManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new CapitalFactoryCertificationController(
      this.manager,
      buildCapitalFactoryCertificationConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      CAPITAL_FACTORY_CERTIFICATION_SYSTEM_PATH,
    );
    if (!doc?.includes("Capital Factory Certification")) {
      throw new Error(
        `${CAPITAL_FACTORY_CERTIFICATION_SYSTEM_PATH} missing — Q9-11 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: CapitalFactoryCertificationDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): CapitalFactoryCertificationState {
    if (!this.initializedAt) {
      throw new Error("Capital Factory Certification not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CAPCRT-001",
      missionId: "Q9-11",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastCertificationDecision: engineRecord?.lastCertificationDecision ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Capital Factory Certification is the final Q9 acceptance gate: it certifies Q9-01..Q9-10 from observed repository and runtime evidence only, never fabricates results, never implements missing workers, and never overrides Pillow, Grand King, or approved architecture. It never implements Q10 or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  collectEvidence() {
    return this.controller.collectEvidence();
  }

  probeRuntime() {
    return this.controller.probeRuntime();
  }

  auditQ9Workers(input: CapcrtInput = {}) {
    return this.controller.auditQ9Workers(input);
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  runEndToEndWorkflow(input: CapcrtInput = {}) {
    return this.controller.runEndToEndWorkflow(input);
  }

  assessReadiness(input: CapcrtInput = {}) {
    return this.controller.assessReadiness(input);
  }

  verifyGovernanceCompliance() {
    return this.controller.verifyGovernanceCompliance();
  }

  produceCertificationFindings(input: CapcrtInput = {}) {
    return this.controller.produceCertificationFindings(input);
  }

  produceCapitalCertificationReport(input: CapcrtInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: CapcrtInput = {}) {
    return this.controller.produceReport(input);
  }

  certifyCapitalFactory(input: CapcrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: CapcrtInput = {}) {
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

  getWorkerCertificationMatrix() {
    return this.manager.getWorkerCertificationMatrix();
  }

  validate(input: CapcrtInput = {}) {
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
          : Math.round((state.health.lastConfidenceScore ?? 0) * 100) || 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Certification reports: ${state.health.totalReports}`,
        `Last certification decision: ${state.health.lastCertificationDecision ?? "none"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CapitalFactoryCertificationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q9-11",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastCertificationDecision: state.health.lastCertificationDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      workerCertificationStatusOptions: [...WORKER_CERTIFICATION_STATUSES],
      neverFabricateSuccessfulTests: true,
      neverAssumeImplementation: true,
      neverImplementMissingWorkers: true,
      neverModifyFinancialRecords: true,
      neverAutomaticallyFixFailures: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ10OrLater: true,
      finalQ9Gate: true,
    };
  }
}

export function createCapitalFactoryCertification(
  bootstrap: EmpireBootstrapContext,
  options?: CapitalFactoryCertificationOptions,
) {
  return new CapitalFactoryCertification(bootstrap, options);
}

export function resetCapitalFactoryCertificationForTesting() {
  resetCapcrtLogsForTesting();
  resetCapcrtSequenceForTesting();
}
