import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildPerformanceAuditConfiguration, type PerformanceAuditConfiguration } from "./configuration.js";
import type { PerformanceAuditDependencies } from "./integrations.js";
import { PerformanceAuditManager, resetPerformanceAuditManagerSequencesForTesting } from "./performance-audit-manager.js";
import { PerformanceAuditController } from "./performance-audit-controller.js";
import { resetPerfartLogsForTesting } from "./perfart-logging.js";
import { READINESS_CLASSIFICATIONS, PERFORMANCE_AUDIT_SYSTEM_PATH } from "./paths.js";
import { resetPerfartSequenceForTesting } from "./audit-store.js";
import type { PerfartInput, PerformanceAuditCockpitSnapshot, PerformanceAuditState } from "./types.js";

export interface PerformanceAuditOptions {
  configuration?: Partial<PerformanceAuditConfiguration>;
  dependencies?: PerformanceAuditDependencies;
}

/**
 * Authoritative Q11-06 Performance Audit — the sixth Q11 acceptance gate.
 * It discovers every performance benchmark target strictly from injected
 * dependency handles (worker-registry, shared-runtime-core,
 * monitoring-runtime, api-runtime, queue-runtime, scheduling-runtime,
 * audit-runtime, executive-reporting-runtime,
 * production-certification-core, pillow-orchestration-runtime), never
 * inventing targets. It executes REAL timed structural probes — safe,
 * non-mutating, read-only accessor calls (`listWorkers`, `getCatalog`,
 * `getDashboard`, `checkHealth`, `getState`, `query`,
 * `getCertificationResults`) — measuring genuine `Date.now()` deltas for
 * response time, real `Promise.all` concurrency for throughput/
 * scalability, and real `process.memoryUsage()`/`process.cpuUsage()`
 * deltas for resource utilisation. It classifies each component's
 * performance readiness deterministically from this measured evidence
 * against documented configuration thresholds.
 *
 * It NEVER fabricates performance evidence, NEVER certifies untested
 * performance, NEVER optimizes or modifies production systems (audit
 * only), NEVER assumes implementation, NEVER repairs failed performance
 * components, and NEVER overrides governance, approved architecture,
 * Pillow, or Grand King. It NEVER implements Q11-07 (Recovery Audit) or
 * later — it only exposes a Q1107ConsumableContract for Q11-07 to
 * consume, and it consumes the Q1106ConsumableContract exposed by Q11-05
 * (Security Audit) when injected.
 */
export class PerformanceAudit {
  private initializedAt: string | null = null;
  private readonly manager: PerformanceAuditManager;
  private readonly controller: PerformanceAuditController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: PerformanceAuditOptions = {},
  ) {
    this.manager = new PerformanceAuditManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new PerformanceAuditController(
      this.manager,
      buildPerformanceAuditConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(PERFORMANCE_AUDIT_SYSTEM_PATH);
    if (!doc?.includes("Performance Audit")) {
      throw new Error(`${PERFORMANCE_AUDIT_SYSTEM_PATH} missing — Q11-06 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: PerformanceAuditDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): PerformanceAuditState {
    if (!this.initializedAt) {
      throw new Error("Performance Audit not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PERFART-001",
      missionId: "Q11-06",
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
        lastDecision: engineRecord?.lastDecision ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Performance Audit is the sixth Q11 acceptance gate: it discovers every performance benchmark target strictly from injected dependency handles, executes real timed structural probes (never fabricated), measures response time/throughput/resource utilisation/scalability/sustained stability from observed evidence only, and classifies performance readiness deterministically. It never fabricates evidence, never certifies untested performance, never optimizes or modifies production systems, and never overrides Pillow, Grand King, or approved architecture. It never implements Q11-07 (Recovery Audit) or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  discoverPerformanceComponents() {
    return this.controller.discoverPerformanceComponents();
  }

  executeWorkloadBenchmarks() {
    return this.controller.executeWorkloadBenchmarks();
  }

  measureResponseTimes() {
    return this.controller.measureResponseTimes();
  }

  measureThroughput() {
    return this.controller.measureThroughput();
  }

  measureResourceUtilisation() {
    return this.controller.measureResourceUtilisation();
  }

  measureScalability() {
    return this.controller.measureScalability();
  }

  detectBottlenecks() {
    return this.controller.detectBottlenecks();
  }

  verifySustainedStability() {
    return this.controller.verifySustainedStability();
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  classifyPerformanceReadiness() {
    return this.controller.classifyPerformanceReadiness();
  }

  producePerformanceReadinessFindings(input: PerfartInput = {}) {
    return this.controller.producePerformanceReadinessFindings(input);
  }

  producePerformanceAuditReport(input: PerfartInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: PerfartInput = {}) {
    return this.controller.produceReport(input);
  }

  auditPerformance(input: PerfartInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: PerfartInput = {}) {
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

  getBenchmarkHistory(limit = 100) {
    return this.manager.getBenchmarkHistory(limit);
  }

  getPerformanceMatrix() {
    return this.controller.getPerformanceMatrix();
  }

  getQ1107ConsumableContract() {
    return this.controller.getQ1107ConsumableContract();
  }

  validate(input: PerfartInput = {}) {
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
        `Last decision: ${state.health.lastDecision ?? "none"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PerformanceAuditCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-06",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastDecision: state.health.lastDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      readinessClassificationOptions: [...READINESS_CLASSIFICATIONS],
      neverFabricatePerformanceEvidence: true,
      neverCertifyUntestedPerformance: true,
      neverOptimizeOrModifyProductionSystems: true,
      neverAssumeImplementation: true,
      neverModifyPerformanceImplementations: true,
      neverRepairFailedPerformanceComponents: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1107OrLater: true,
      sixthQ11Gate: true,
    };
  }
}

export function createPerformanceAudit(bootstrap: EmpireBootstrapContext, options?: PerformanceAuditOptions) {
  return new PerformanceAudit(bootstrap, options);
}

export function resetPerformanceAuditForTesting() {
  resetPerfartLogsForTesting();
  resetPerfartSequenceForTesting();
  resetPerformanceAuditManagerSequencesForTesting();
}
