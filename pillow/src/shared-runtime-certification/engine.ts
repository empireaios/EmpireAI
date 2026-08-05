import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSharedRuntimeCertificationConfiguration,
  type SharedRuntimeCertificationConfiguration,
} from "./configuration.js";
import type { SharedRuntimeCertificationDependencies } from "./integrations.js";
import { SharedRuntimeCertificationManager } from "./certification-manager.js";
import { SharedRuntimeCertificationController } from "./shared-runtime-certification-controller.js";
import { resetSrcrtLogsForTesting } from "./srcrt-logging.js";
import {
  RUNTIME_CERTIFICATION_STATUSES,
  SHARED_RUNTIME_CERTIFICATION_SYSTEM_PATH,
} from "./paths.js";
import { resetSrcrtSequenceForTesting } from "./certification-store.js";
import type {
  SrcrtInput,
  SharedRuntimeCertificationCockpitSnapshot,
  SharedRuntimeCertificationState,
} from "./types.js";

export interface SharedRuntimeCertificationOptions {
  configuration?: Partial<SharedRuntimeCertificationConfiguration>;
  dependencies?: SharedRuntimeCertificationDependencies;
}

/**
 * Authoritative Q10-14 Shared Runtime Certification — the final Q10 acceptance
 * gate for the Shared Runtime series (Q10-01..Q10-13).
 *
 * Certification is evidence-based from repository state + optional runtime
 * probes only. It NEVER fabricates certification evidence, NEVER certifies
 * missing functionality, NEVER assumes implementation, NEVER implements
 * missing runtimes, NEVER modifies runtime behaviour, and NEVER overrides
 * governance, approved architecture, Pillow, or Grand King. It NEVER
 * implements Q11-01 (Production Certification Core) or later — it only
 * exposes a Q1101ConsumableContract for Q11-01 to consume.
 */
export class SharedRuntimeCertification {
  private initializedAt: string | null = null;
  private readonly manager: SharedRuntimeCertificationManager;
  private readonly controller: SharedRuntimeCertificationController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SharedRuntimeCertificationOptions = {},
  ) {
    this.manager = new SharedRuntimeCertificationManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new SharedRuntimeCertificationController(
      this.manager,
      buildSharedRuntimeCertificationConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SHARED_RUNTIME_CERTIFICATION_SYSTEM_PATH,
    );
    if (!doc?.includes("Shared Runtime Certification")) {
      throw new Error(
        `${SHARED_RUNTIME_CERTIFICATION_SYSTEM_PATH} missing — Q10-14 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: SharedRuntimeCertificationDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): SharedRuntimeCertificationState {
    if (!this.initializedAt) {
      throw new Error("Shared Runtime Certification not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-SRCRT-001",
      missionId: "Q10-14",
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
          "Shared Runtime Certification is the final Q10 acceptance gate: it certifies Q10-01..Q10-13 from observed repository and runtime evidence only, never fabricates results, never implements missing runtimes, and never overrides Pillow, Grand King, or approved architecture. It never implements Q11-01 (Production Certification Core) or later.",
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

  auditQ10Runtimes(input: SrcrtInput = {}) {
    return this.controller.auditQ10Runtimes(input);
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  assessReadiness(input: SrcrtInput = {}) {
    return this.controller.assessReadiness(input);
  }

  verifyGovernanceCompliance() {
    return this.controller.verifyGovernanceCompliance();
  }

  verifyMonitoring() {
    return this.controller.verifyMonitoring();
  }

  verifyRecovery() {
    return this.controller.verifyRecovery();
  }

  verifyAuditability() {
    return this.controller.verifyAuditability();
  }

  verifyReporting() {
    return this.controller.verifyReporting();
  }

  produceCertificationFindings(input: SrcrtInput = {}) {
    return this.controller.produceCertificationFindings(input);
  }

  produceSharedRuntimeCertificationReport(input: SrcrtInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: SrcrtInput = {}) {
    return this.controller.produceReport(input);
  }

  certifySharedRuntime(input: SrcrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: SrcrtInput = {}) {
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

  getRuntimeCertificationMatrix() {
    return this.manager.getRuntimeCertificationMatrix();
  }

  getQ1101ConsumableContract() {
    return this.controller.getQ1101ConsumableContract();
  }

  validate(input: SrcrtInput = {}) {
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

  getCockpitSnapshot(): SharedRuntimeCertificationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q10-14",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastCertificationDecision: state.health.lastCertificationDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      runtimeCertificationStatusOptions: [...RUNTIME_CERTIFICATION_STATUSES],
      neverFabricateCertificationEvidence: true,
      neverCertifyMissingFunctionality: true,
      neverAssumeImplementation: true,
      neverImplementMissingRuntimes: true,
      neverModifyRuntimeBehaviour: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1101OrLater: true,
      finalQ10Gate: true,
    };
  }
}

export function createSharedRuntimeCertification(
  bootstrap: EmpireBootstrapContext,
  options?: SharedRuntimeCertificationOptions,
) {
  return new SharedRuntimeCertification(bootstrap, options);
}

export function resetSharedRuntimeCertificationForTesting() {
  resetSrcrtLogsForTesting();
  resetSrcrtSequenceForTesting();
}
