import { collectWorkerDiscovery } from "./evidence-collector.js";
import {
  assessWorker,
  classifyCapability,
  classifyConfiguration,
  classifyGovernance,
  classifyPermissions,
  classifyReachability,
  classifyRegistration,
  classifyRuntimeConnectivity,
} from "./readiness-classifier.js";
import { probeWorker } from "./worker-probe.js";
import { verifyIntegrations as computeIntegrationVerification } from "./integration-verifier.js";
import {
  evaluateCapabilitySummary,
  evaluateGovernanceSummary,
  evaluateReadinessSummary,
  evaluateRuntimeSummary,
} from "./readiness-evaluator.js";
import { evaluateReadinessGates } from "./readiness-gates.js";
import { WrartValidator, HealthMonitor, RecoveryManager } from "./audit-validator.js";
import { AuditStore, nextReportId } from "./audit-store.js";
import { buildCatalog, buildOutstandingIssues, buildReport } from "./report-builder.js";
import { IntegrationCoordinator, type WorkerReadinessAuditDependencies } from "./integrations.js";
import { appendWrartLog } from "./wrart-logging.js";
import { INTEGRATION_TARGETS, WRART_CAPABILITIES, WRART_METADATA_VERSION, WORKER_READINESS_AUDIT_IDENTITY } from "./paths.js";
import type { WorkerReadinessAuditConfiguration } from "./configuration.js";
import type {
  CapabilityCheckRow,
  ConfigurationCheckRow,
  GovernanceCheckRow,
  OperationalState,
  PermissionCheckRow,
  Q1103ConsumableContract,
  ReachabilityCheckRow,
  RegistrationCheckRow,
  RuntimeConnectivityCheckRow,
  WrartEngineRecord,
  WrartInput,
  WorkerReadinessAuditReport,
  WorkerReadinessAssessment,
} from "./types.js";

export class WorkerReadinessAuditManager {
  private repositoryRoot = "";
  private engineRecord: WrartEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new WrartValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: WorkerReadinessAuditDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: WorkerReadinessAuditConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getLatestReport() {
    return this.store.getLatestReport();
  }

  getLatestReportId() {
    return this.store.getLatestReportId();
  }

  getCatalog() {
    return buildCatalog(
      WORKER_READINESS_AUDIT_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
    );
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  connect(config: WorkerReadinessAuditConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendWrartLog({
      event: "connect",
      details: `Worker Readiness Audit connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  /** Discovers every registered worker strictly from the injected Worker Registry. Never invents workers. */
  discoverWorkers(_config: WorkerReadinessAuditConfiguration) {
    const workerRegistry = this.integrations.getDependencies().workerRegistry;
    const listWorkers = workerRegistry?.listWorkers?.bind(workerRegistry);
    return collectWorkerDiscovery(listWorkers);
  }

  /** Probes injected per-worker runtime handles when available. Never fabricates reachability. */
  async probeWorkers(workerIds: string[]) {
    const entries = await Promise.all(
      workerIds.map(async (workerId) => {
        const handle = this.integrations.getWorkerHandle(workerId);
        if (!handle) return [workerId, undefined] as const;
        const probe = await probeWorker(workerId, handle);
        return [workerId, probe] as const;
      }),
    );
    return new Map(entries.filter(([, probe]) => probe !== undefined));
  }

  private isRuntimeBound(): boolean {
    const deps = this.integrations.getDependencies();
    return Boolean(deps.sharedRuntimeCore) || Boolean(deps.pillowOrchestrationRuntime);
  }

  async buildAssessments(config: WorkerReadinessAuditConfiguration): Promise<WorkerReadinessAssessment[]> {
    const discovery = this.discoverWorkers(config);
    const probes = await this.probeWorkers(discovery.workers.map((w) => w.workerId));
    const runtimeBound = this.isRuntimeBound();
    return discovery.workers.map((worker) =>
      assessWorker(worker, probes.get(worker.workerId), runtimeBound, `worker:${worker.workerId}`),
    );
  }

  async verifyRegistration(config: WorkerReadinessAuditConfiguration): Promise<RegistrationCheckRow[]> {
    const discovery = this.discoverWorkers(config);
    return discovery.workers.map((worker) => {
      const registrationStatus = classifyRegistration(worker);
      return {
        workerId: worker.workerId,
        workerName: worker.workerName ?? worker.workerId,
        registrationStatus,
        evidence: [
          `factory=${worker.factory ?? "(missing)"}`,
          `role=${worker.role ?? "(missing)"}`,
          `department=${worker.department ?? "(missing)"}`,
        ],
      };
    });
  }

  async verifyReachability(config: WorkerReadinessAuditConfiguration): Promise<ReachabilityCheckRow[]> {
    const discovery = this.discoverWorkers(config);
    const probes = await this.probeWorkers(discovery.workers.map((w) => w.workerId));
    return discovery.workers.map((worker) => {
      const probe = probes.get(worker.workerId);
      const reachabilityStatus = classifyReachability(worker, probe);
      return {
        workerId: worker.workerId,
        workerName: worker.workerName ?? worker.workerId,
        reachabilityStatus,
        probed: Boolean(probe),
        evidence: [
          probe ? probe.evidence : `operationalStatus=${worker.operationalStatus ?? "(missing)"} (structural)`,
        ],
      };
    });
  }

  async verifyConfiguration(config: WorkerReadinessAuditConfiguration): Promise<ConfigurationCheckRow[]> {
    const discovery = this.discoverWorkers(config);
    return discovery.workers.map((worker) => ({
      workerId: worker.workerId,
      workerName: worker.workerName ?? worker.workerId,
      dependencyStatus: classifyConfiguration(worker),
      evidence: [
        `skillProfile(${worker.skillProfile.length})`,
        `approvedTools(${worker.approvedTools.length})`,
        `authorityLevel=${worker.authorityLevel ?? "(missing)"}`,
      ],
    }));
  }

  async verifyGovernance(config: WorkerReadinessAuditConfiguration) {
    const discovery = this.discoverWorkers(config);
    const rows: GovernanceCheckRow[] = discovery.workers.map((worker) => ({
      workerId: worker.workerId,
      workerName: worker.workerName ?? worker.workerId,
      governanceStatus: classifyGovernance(worker),
      evidence: [
        `certificationStatus=${worker.certificationStatus ?? "(missing)"}`,
        `governingAuthority=${worker.governingAuthority ?? "(missing)"}`,
        `reportsToPillow=${worker.reportingLine.includes("pillow")}`,
      ],
    }));
    const assessments = await this.buildAssessments(config);
    const summary = evaluateGovernanceSummary(this.repositoryRoot, config, assessments);
    return { rows, summary };
  }

  async verifyPermissions(config: WorkerReadinessAuditConfiguration): Promise<PermissionCheckRow[]> {
    const discovery = this.discoverWorkers(config);
    return discovery.workers.map((worker) => ({
      workerId: worker.workerId,
      workerName: worker.workerName ?? worker.workerId,
      permissionStatus: classifyPermissions(worker),
      evidence: [
        `authorityLevel=${worker.authorityLevel ?? "(missing)"}`,
        `approvedTools(${worker.approvedTools.length})`,
      ],
    }));
  }

  async verifyRuntimeConnectivity(config: WorkerReadinessAuditConfiguration) {
    const discovery = this.discoverWorkers(config);
    const runtimeBound = this.isRuntimeBound();
    const rows: RuntimeConnectivityCheckRow[] = discovery.workers.map((worker) => ({
      workerId: worker.workerId,
      workerName: worker.workerName ?? worker.workerId,
      runtimeStatus: classifyRuntimeConnectivity(worker, runtimeBound),
      evidence: [`factory=${worker.factory ?? "(missing)"}`, `runtimeBound=${runtimeBound}`],
    }));
    const assessments = await this.buildAssessments(config);
    const summary = evaluateRuntimeSummary(this.integrations.getDependencies(), assessments);
    return { rows, summary };
  }

  async verifyOperationalCapability(config: WorkerReadinessAuditConfiguration) {
    const discovery = this.discoverWorkers(config);
    const rows: CapabilityCheckRow[] = discovery.workers.map((worker) => ({
      workerId: worker.workerId,
      workerName: worker.workerName ?? worker.workerId,
      capabilityStatus: classifyCapability(worker),
      evidence: [
        `operationalStatus=${worker.operationalStatus ?? "(missing)"}`,
        `skillProfile(${worker.skillProfile.length})`,
      ],
    }));
    const assessments = await this.buildAssessments(config);
    const summary = evaluateCapabilitySummary(assessments);
    return { rows, summary };
  }

  verifyIntegrations() {
    return computeIntegrationVerification(this.integrations.getDependencies());
  }

  async produceReadinessFindings(input: WrartInput, config: WorkerReadinessAuditConfiguration) {
    const matrix = await this.buildAssessments(config);
    const readinessSummary = evaluateReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, matrix);
    const integrationVerification = this.verifyIntegrations();
    const q1102 = this.integrations.attemptQ1102ContractHandshake();

    const readinessDecision = evaluateReadinessGates({
      matrix,
      readinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1102Consumed: q1102.consumed,
      q1102Attempted: q1102.attempted,
      input,
    });

    const outstandingIssues = buildOutstandingIssues(matrix, governanceSummary, integrationVerification, readinessSummary);

    return {
      readinessDecision,
      readinessMatrix: matrix,
      outstandingIssues,
      confidenceScore: readinessSummary.overallReadinessScore,
    };
  }

  async produceReport(
    input: WrartInput,
    config: WorkerReadinessAuditConfiguration,
  ): Promise<WorkerReadinessAuditReport> {
    const started = Date.now();
    this.ensureSeeded(config);

    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const discovery = this.discoverWorkers(config);
    const matrix = await this.buildAssessments(config);
    const readinessSummary = evaluateReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, matrix);
    const runtimeSummary = evaluateRuntimeSummary(this.integrations.getDependencies(), matrix);
    const capabilitySummary = evaluateCapabilitySummary(matrix);
    const integrationVerification = this.verifyIntegrations();
    const q1102ContractConsumed = this.integrations.attemptQ1102ContractHandshake();

    const readinessDecision = evaluateReadinessGates({
      matrix,
      readinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1102Consumed: q1102ContractConsumed.consumed,
      q1102Attempted: q1102ContractConsumed.attempted,
      input,
    });

    const outstandingIssues = buildOutstandingIssues(matrix, governanceSummary, integrationVerification, readinessSummary);
    const validation = this.validator.validateInput({ ...input, validated: input.validated ?? true }, started);

    const report = buildReport({
      reportId: input.reportId,
      workerInventory: discovery.workers,
      readinessMatrix: matrix,
      governanceSummary,
      runtimeSummary,
      capabilitySummary,
      integrationVerification,
      readinessSummary,
      q1102ContractConsumed,
      readinessDecision,
      outstandingIssues,
      validation,
      workerId: config.workerId,
      consumableByQ1103: true,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendWrartLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.readinessDecision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  async submitReport(
    input: WrartInput,
    config: WorkerReadinessAuditConfiguration,
  ): Promise<WorkerReadinessAuditReport> {
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, Date.now());
    }
    let report =
      (input.reportId?.trim() ? this.store.getReport(input.reportId.trim()) : null) ?? this.store.getLatestReport();
    if (!report) {
      report = await this.produceReport(input, config);
      if (report.validation.decision === "fail") return report;
    }
    const submission = this.integrations.submitReport(report);
    const updated: WorkerReadinessAuditReport = {
      ...report,
      submittedToExecutiveReporting: submission.submitted,
      executiveReportId: submission.executiveReportId,
      auditStatus: submission.submitted ? "submitted" : report.auditStatus,
    };
    const saved = this.store.saveReport(updated, "submit_report");
    this.ensureRecord("active", config, "passed", saved);
    return saved;
  }

  list() {
    return this.store.listReports();
  }

  validate(input: WrartInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: WorkerReadinessAuditConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q11-02" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.recovery.failureCount(),
      locks: config,
    };
  }

  getReadinessMatrix() {
    return this.store.getLatestReport()?.readinessMatrix ?? [];
  }

  getQ1103ConsumableContract(): Q1103ConsumableContract {
    return {
      contractId: `q1103-contract-${WRART_METADATA_VERSION}`,
      contractVersion: WRART_METADATA_VERSION,
      producedBy: "worker-readiness-audit",
      missionId: "Q11-02",
      consumerMissionId: "Q11-03",
      exposedFields: [
        "readinessMatrix",
        "readinessSummary",
        "readinessDecision",
        "workerInventory",
        "outstandingIssues",
        "confidenceScore",
      ],
      readinessClassificationCatalog: [
        "Ready",
        "Partially Ready",
        "Failed",
        "Missing",
        "Blocked",
        "Deferred",
      ],
      readinessDecisionCatalog: ["Ready", "Conditionally_Ready", "Not_Ready", "Failed", "Deferred"],
      notes: [
        "Worker Readiness Audit Q11-02 certified — stops at Q11-02, exposes Q1103ConsumableContract for Q11-03 (Pillow Command Audit)",
        "This contract is structural-signal-only; Q11-02 never implements Q11-03 or any later mission itself",
      ],
      neverImplementQ1103OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private rejectedReport(
    input: WrartInput,
    config: WorkerReadinessAuditConfiguration,
    started: number,
  ): WorkerReadinessAuditReport {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendWrartLog({ event: "boundary_reject", details: errors.join(";") });
    const now = new Date().toISOString();
    return buildReport({
      reportId: `wrart-rejected-${nextReportId()}`,
      workerInventory: [],
      readinessMatrix: [],
      governanceSummary: {
        compliant: false,
        grandKingApprovalRequired: true,
        pillowCommandRequired: true,
        selfDocPresent: false,
        selfDocPath: "",
        boundaryLocksHonoured: false,
        governedWorkerCount: 0,
        totalWorkers: 0,
        evidence: [],
      },
      runtimeSummary: {
        sharedRuntimeCoreBound: false,
        pillowOrchestrationRuntimeBound: false,
        reachableWorkerCount: 0,
        totalWorkers: 0,
        evidence: [],
      },
      capabilitySummary: { capableWorkerCount: 0, totalWorkers: 0, evidence: [] },
      integrationVerification: { verifiedAt: now, rows: [], totalTargets: 0, boundCount: 0, allBound: false, evidence: [] },
      readinessSummary: {
        computedAt: now,
        totalWorkers: 0,
        readyCount: 0,
        partiallyReadyCount: 0,
        failedCount: 0,
        missingCount: 0,
        blockedCount: 0,
        deferredCount: 0,
        overallReadinessScore: 0,
        ready: false,
        notes: ["Rejected before evidence collection"],
        evidence: [],
      },
      q1102ContractConsumed: {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Rejected before handshake",
      },
      readinessDecision: "Failed",
      outstandingIssues: errors,
      validation,
      workerId: config.workerId,
      consumableByQ1103: false,
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkerReadinessAuditConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: WorkerReadinessAuditReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wrart-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "worker-readiness-audit",
      engineVersion: "PILLOW-WRART-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...WRART_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastReadinessDecision: latestReport?.readinessDecision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: WRART_METADATA_VERSION,
    };
  }
}
