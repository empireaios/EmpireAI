import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkerReadinessAuditConfiguration,
  type WorkerReadinessAuditConfiguration,
} from "./configuration.js";
import type { WorkerReadinessAuditDependencies } from "./integrations.js";
import { WorkerReadinessAuditManager } from "./readiness-audit-manager.js";
import { WorkerReadinessAuditController } from "./worker-readiness-audit-controller.js";
import { resetWrartLogsForTesting } from "./wrart-logging.js";
import { READINESS_CLASSIFICATIONS, WORKER_READINESS_AUDIT_SYSTEM_PATH } from "./paths.js";
import { resetWrartSequenceForTesting } from "./audit-store.js";
import type {
  WrartInput,
  WorkerReadinessAuditCockpitSnapshot,
  WorkerReadinessAuditState,
} from "./types.js";

export interface WorkerReadinessAuditOptions {
  configuration?: Partial<WorkerReadinessAuditConfiguration>;
  dependencies?: WorkerReadinessAuditDependencies;
}

/**
 * Authoritative Q11-02 Worker Readiness Audit — the second Q11 acceptance
 * gate. It discovers every registered worker strictly from an injected
 * Worker Registry (never inventing workers), verifies registration,
 * reachability, configuration, governance, permissions, runtime
 * connectivity, and operational capability from observed evidence only,
 * classifies each worker's readiness deterministically, and produces a
 * machine-readable Worker Readiness Audit Report.
 *
 * It NEVER fabricates audit evidence, NEVER certifies missing workers,
 * NEVER certifies unreachable workers, NEVER assumes implementation, NEVER
 * modifies worker implementations, NEVER repairs failed workers, and NEVER
 * overrides governance, approved architecture, Pillow, or Grand King. It
 * NEVER implements Q11-03 (Pillow Command Audit) or later — it only
 * exposes a Q1103ConsumableContract for Q11-03 to consume, and it consumes
 * the Q1102ConsumableContract exposed by Q11-01 (Production Certification
 * Core) when injected.
 */
export class WorkerReadinessAudit {
  private initializedAt: string | null = null;
  private readonly manager: WorkerReadinessAuditManager;
  private readonly controller: WorkerReadinessAuditController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkerReadinessAuditOptions = {},
  ) {
    this.manager = new WorkerReadinessAuditManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new WorkerReadinessAuditController(
      this.manager,
      buildWorkerReadinessAuditConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKER_READINESS_AUDIT_SYSTEM_PATH,
    );
    if (!doc?.includes("Worker Readiness Audit")) {
      throw new Error(`${WORKER_READINESS_AUDIT_SYSTEM_PATH} missing — Q11-02 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: WorkerReadinessAuditDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): WorkerReadinessAuditState {
    if (!this.initializedAt) {
      throw new Error("Worker Readiness Audit not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WRART-001",
      missionId: "Q11-02",
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
        lastReadinessDecision: engineRecord?.lastReadinessDecision ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Worker Readiness Audit is the second Q11 acceptance gate: it discovers every registered worker strictly from the injected Worker Registry, verifies registration/reachability/configuration/governance/permissions/runtime connectivity/operational capability from observed evidence only, and classifies worker readiness deterministically. It never fabricates evidence, never certifies missing or unreachable workers, and never overrides Pillow, Grand King, or approved architecture. It never implements Q11-03 (Pillow Command Audit) or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  discoverWorkers() {
    return this.controller.discoverWorkers();
  }

  verifyRegistration() {
    return this.controller.verifyRegistration();
  }

  verifyReachability() {
    return this.controller.verifyReachability();
  }

  verifyConfiguration() {
    return this.controller.verifyConfiguration();
  }

  verifyGovernance() {
    return this.controller.verifyGovernance();
  }

  verifyPermissions() {
    return this.controller.verifyPermissions();
  }

  verifyRuntimeConnectivity() {
    return this.controller.verifyRuntimeConnectivity();
  }

  verifyOperationalCapability() {
    return this.controller.verifyOperationalCapability();
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  classifyReadiness() {
    return this.controller.classifyReadiness();
  }

  produceReadinessFindings(input: WrartInput = {}) {
    return this.controller.produceReadinessFindings(input);
  }

  produceWorkerReadinessAuditReport(input: WrartInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: WrartInput = {}) {
    return this.controller.produceReport(input);
  }

  auditWorkerReadiness(input: WrartInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: WrartInput = {}) {
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

  getReadinessMatrix() {
    return this.controller.getReadinessMatrix();
  }

  getQ1103ConsumableContract() {
    return this.controller.getQ1103ConsumableContract();
  }

  validate(input: WrartInput = {}) {
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
        `Audit reports: ${state.health.totalReports}`,
        `Last readiness decision: ${state.health.lastReadinessDecision ?? "none"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkerReadinessAuditCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-02",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastReadinessDecision: state.health.lastReadinessDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      readinessClassificationOptions: [...READINESS_CLASSIFICATIONS],
      neverFabricateAuditEvidence: true,
      neverCertifyMissingWorkers: true,
      neverCertifyUnreachableWorkers: true,
      neverAssumeImplementation: true,
      neverModifyWorkerImplementations: true,
      neverRepairFailedWorkers: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1103OrLater: true,
      secondQ11Gate: true,
    };
  }
}

export function createWorkerReadinessAudit(
  bootstrap: EmpireBootstrapContext,
  options?: WorkerReadinessAuditOptions,
) {
  return new WorkerReadinessAudit(bootstrap, options);
}

export function resetWorkerReadinessAuditForTesting() {
  resetWrartLogsForTesting();
  resetWrartSequenceForTesting();
}
