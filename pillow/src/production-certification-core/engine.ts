import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildProductionCertificationCoreConfiguration,
  type ProductionCertificationCoreConfiguration,
} from "./configuration.js";
import type { ProductionCertificationCoreDependencies } from "./integrations.js";
import { ProductionCertificationCoreManager } from "./certification-manager.js";
import { ProductionCertificationCoreController } from "./production-certification-core-controller.js";
import { resetPccrtLogsForTesting } from "./pccrt-logging.js";
import { CERTIFICATION_STATUSES, PRODUCTION_CERTIFICATION_CORE_SYSTEM_PATH } from "./paths.js";
import { PROGRAMMES } from "./programme-catalog.js";
import { resetPccrtSequenceForTesting } from "./certification-store.js";
import type {
  PccrtInput,
  ProductionCertificationCoreCockpitSnapshot,
  ProductionCertificationCoreState,
} from "./types.js";

export interface ProductionCertificationCoreOptions {
  configuration?: Partial<ProductionCertificationCoreConfiguration>;
  dependencies?: ProductionCertificationCoreDependencies;
}

/**
 * Authoritative Q11-01 Production Certification Core — the first Q11
 * acceptance gate. It registers the fixed Q11 certification programme
 * catalog, discovers factories/workers/runtimes from injected dependencies
 * and repository evidence, aggregates certification evidence, calculates a
 * deterministic production readiness score, and produces a Production
 * Certification Report.
 *
 * Certification is evidence-based from repository state + optional runtime
 * probes only. It NEVER fabricates certification evidence, NEVER certifies
 * missing capabilities, NEVER assumes implementation, NEVER implements
 * missing capabilities, NEVER modifies production logic, NEVER replaces
 * individual audit programmes, and NEVER overrides governance, approved
 * architecture, Pillow, or Grand King. It NEVER implements Q11-02 (Worker
 * Readiness Audit) or later — it only exposes a Q1102ConsumableContract for
 * Q11-02 to consume, and it consumes the Q1101ConsumableContract exposed by
 * Q10-14 (Shared Runtime Certification) when injected.
 */
export class ProductionCertificationCore {
  private initializedAt: string | null = null;
  private readonly manager: ProductionCertificationCoreManager;
  private readonly controller: ProductionCertificationCoreController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ProductionCertificationCoreOptions = {},
  ) {
    this.manager = new ProductionCertificationCoreManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    this.manager.setExecutiveContext(
      bootstrap.executiveReady === true,
      Boolean(bootstrap.executiveBriefing),
    );
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new ProductionCertificationCoreController(
      this.manager,
      buildProductionCertificationCoreConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PRODUCTION_CERTIFICATION_CORE_SYSTEM_PATH,
    );
    if (!doc?.includes("Production Certification Core")) {
      throw new Error(
        `${PRODUCTION_CERTIFICATION_CORE_SYSTEM_PATH} missing — Q11-01 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ProductionCertificationCoreDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): ProductionCertificationCoreState {
    if (!this.initializedAt) {
      throw new Error("Production Certification Core not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PCCRT-001",
      missionId: "Q11-01",
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
          "Production Certification Core is the first Q11 acceptance gate: it registers the Q11 certification programme catalog, discovers factories/workers/runtimes, and certifies production readiness from observed repository and runtime evidence only. It never fabricates results, never implements missing capabilities, and never overrides Pillow, Grand King, or approved architecture. It never implements Q11-02 (Worker Readiness Audit) or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  registerCertificationProgrammes() {
    return this.controller.registerProgrammeCatalog();
  }

  discoverFactories() {
    return this.controller.discoverFactories();
  }

  discoverWorkers() {
    return this.controller.discoverWorkers();
  }

  discoverRuntimes() {
    return this.controller.discoverRuntimes();
  }

  aggregateCertificationEvidence(input: PccrtInput = {}) {
    return this.controller.aggregateCertificationEvidence(input);
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  verifyGovernanceCompliance() {
    return this.controller.verifyGovernanceCompliance();
  }

  verifyReporting() {
    return this.controller.verifyReporting();
  }

  produceCertificationFindings(input: PccrtInput = {}) {
    return this.controller.produceCertificationFindings(input);
  }

  produceProductionCertificationReport(input: PccrtInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: PccrtInput = {}) {
    return this.controller.produceReport(input);
  }

  certifyProductionReadiness(input: PccrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: PccrtInput = {}) {
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

  getCertificationResults() {
    return this.manager.getCertificationResults();
  }

  getQ1102ConsumableContract() {
    return this.controller.getQ1102ConsumableContract();
  }

  validate(input: PccrtInput = {}) {
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

  getCockpitSnapshot(): ProductionCertificationCoreCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-01",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastCertificationDecision: state.health.lastCertificationDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      certificationStatusOptions: [...CERTIFICATION_STATUSES],
      programmeIds: PROGRAMMES.map((p) => p.programmeId),
      neverFabricateCertificationEvidence: true,
      neverCertifyMissingCapabilities: true,
      neverAssumeImplementation: true,
      neverImplementMissingCapabilities: true,
      neverModifyProductionLogic: true,
      neverReplaceIndividualAuditProgrammes: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1102OrLater: true,
      firstQ11Gate: true,
    };
  }
}

export function createProductionCertificationCore(
  bootstrap: EmpireBootstrapContext,
  options?: ProductionCertificationCoreOptions,
) {
  return new ProductionCertificationCore(bootstrap, options);
}

export function resetProductionCertificationCoreForTesting() {
  resetPccrtLogsForTesting();
  resetPccrtSequenceForTesting();
}
