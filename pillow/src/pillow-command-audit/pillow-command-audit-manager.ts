import { collectWorkerDiscovery } from "./evidence-collector.js";
import { probeCommandDispatch } from "./command-dispatch-probe.js";
import {
  assessWorker,
  classifyAssignment,
  classifyCommunication,
  classifyGovernance,
  classifyProgress,
  classifyResult,
  classifySupervision,
} from "./command-classifier.js";
import { verifyIntegrations as computeIntegrationVerification } from "./integration-verifier.js";
import {
  evaluateAssignmentSummary,
  evaluateCommandReadinessSummary,
  evaluateCommunicationSummary,
  evaluateGovernanceSummary,
  evaluateSupervisionSummary,
} from "./command-evaluator.js";
import { evaluateCommandReadinessGates } from "./command-gates.js";
import { PcartValidator, HealthMonitor, RecoveryManager } from "./audit-validator.js";
import { AuditStore, nextReportId } from "./audit-store.js";
import { buildCatalog, buildOutstandingIssues, buildReport } from "./report-builder.js";
import { IntegrationCoordinator, type PillowCommandAuditDependencies } from "./integrations.js";
import { appendPcartLog } from "./pcart-logging.js";
import {
  INTEGRATION_TARGETS,
  PCART_CAPABILITIES,
  PCART_METADATA_VERSION,
  PILLOW_COMMAND_AUDIT_IDENTITY,
} from "./paths.js";
import type { PillowCommandAuditConfiguration } from "./configuration.js";
import type {
  AssignmentCheckRow,
  CommandDispatchCheckRow,
  CommunicationCheckRow,
  GovernanceCheckRow,
  OperationalState,
  PcartEngineRecord,
  PcartInput,
  PillowCommandAssessment,
  PillowCommandAuditReport,
  Q1104ConsumableContract,
  SupervisionCheckRow,
} from "./types.js";

function methodPresent(handle: object | null | undefined, ...names: string[]): boolean {
  if (!handle) return false;
  const record = handle as Record<string, unknown>;
  return names.some((name) => typeof record[name] === "function");
}

export class PillowCommandAuditManager {
  private repositoryRoot = "";
  private engineRecord: PcartEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new PcartValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: PillowCommandAuditDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: PillowCommandAuditConfiguration) {
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
      PILLOW_COMMAND_AUDIT_IDENTITY.workerId,
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

  connect(config: PillowCommandAuditConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendPcartLog({
      event: "connect",
      details: `Pillow Command Audit connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  /** Discovers every registered worker strictly from the injected Worker Registry. Never invents workers. */
  discoverWorkers(_config: PillowCommandAuditConfiguration) {
    const workerRegistry = this.integrations.getDependencies().workerRegistry;
    const listWorkers = workerRegistry?.listWorkers?.bind(workerRegistry);
    return collectWorkerDiscovery(listWorkers);
  }

  /** Structural, presence-only command dispatch verification per discovered worker. Never invokes invokeWorker. */
  verifyCommandDispatch(config: PillowCommandAuditConfiguration): CommandDispatchCheckRow[] {
    const discovery = this.discoverWorkers(config);
    const orchestration = this.integrations.getDependencies().pillowOrchestrationRuntime;
    return discovery.workers.map((worker) => {
      const dispatch = probeCommandDispatch(worker.workerId, orchestration);
      return {
        workerId: worker.workerId,
        workerName: worker.workerName ?? worker.workerId,
        commandId: dispatch.commandId,
        dispatchStatus: dispatch.dispatchStatus,
        evidence: [dispatch.evidence],
      };
    });
  }

  verifyAssignment(config: PillowCommandAuditConfiguration): AssignmentCheckRow[] {
    const discovery = this.discoverWorkers(config);
    const missionRuntimeBound = !!this.integrations.getDependencies().missionRuntime;
    return discovery.workers.map((worker) => ({
      workerId: worker.workerId,
      workerName: worker.workerName ?? worker.workerId,
      assignmentStatus: classifyAssignment(worker, missionRuntimeBound),
      evidence: [
        `factory=${worker.factory ?? "(missing)"}`,
        `role=${worker.role ?? "(missing)"}`,
        `missionRuntimeBound=${missionRuntimeBound}`,
      ],
    }));
  }

  verifyCommunication(config: PillowCommandAuditConfiguration): CommunicationCheckRow[] {
    const discovery = this.discoverWorkers(config);
    const comm = this.integrations.getDependencies().communicationRuntime;
    const sendBound = methodPresent(comm, "sendMessage");
    const ackBound = methodPresent(comm, "acknowledgeMessage");
    return discovery.workers.map((worker) => ({
      workerId: worker.workerId,
      workerName: worker.workerName ?? worker.workerId,
      communicationStatus: classifyCommunication(sendBound, ackBound),
      evidence: [`sendMessagePresent=${sendBound}`, `acknowledgeMessagePresent=${ackBound}`],
    }));
  }

  verifySupervision(config: PillowCommandAuditConfiguration): SupervisionCheckRow[] {
    const discovery = this.discoverWorkers(config);
    const deps = this.integrations.getDependencies();
    const monitoringBound = !!deps.monitoringRuntime;
    const orchestrationBound = !!deps.pillowOrchestrationRuntime;
    const progressCapable = methodPresent(deps.monitoringRuntime, "produceReport", "list", "getState");
    const resultCapable =
      methodPresent(deps.pillowOrchestrationRuntime, "retrieveReport") ||
      methodPresent(deps.executiveReportingRuntime, "retrieveReport");
    const anyResultBound = !!deps.pillowOrchestrationRuntime || !!deps.executiveReportingRuntime;
    return discovery.workers.map((worker) => ({
      workerId: worker.workerId,
      workerName: worker.workerName ?? worker.workerId,
      supervisionStatus: classifySupervision(monitoringBound, orchestrationBound),
      progressStatus: classifyProgress(progressCapable, monitoringBound),
      resultStatus: classifyResult(resultCapable, resultCapable, anyResultBound),
      evidence: [
        `monitoringRuntimeBound=${monitoringBound}`,
        `orchestrationRuntimeBound=${orchestrationBound}`,
        `progressCapable=${progressCapable}`,
        `resultCapable=${resultCapable}`,
      ],
    }));
  }

  verifyGovernance(config: PillowCommandAuditConfiguration) {
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
    const assessments = this.buildAssessments(config);
    const summary = evaluateGovernanceSummary(this.repositoryRoot, config, assessments);
    return { rows, summary };
  }

  verifyIntegrations() {
    return computeIntegrationVerification(this.integrations.getDependencies());
  }

  private isBoundFor(kind: "mission" | "communicationSend" | "communicationAck" | "monitoring" | "orchestration") {
    const deps = this.integrations.getDependencies();
    switch (kind) {
      case "mission":
        return !!deps.missionRuntime;
      case "communicationSend":
        return methodPresent(deps.communicationRuntime, "sendMessage");
      case "communicationAck":
        return methodPresent(deps.communicationRuntime, "acknowledgeMessage");
      case "monitoring":
        return !!deps.monitoringRuntime;
      case "orchestration":
        return !!deps.pillowOrchestrationRuntime;
      default:
        return false;
    }
  }

  /** Builds the deterministic per-worker Pillow Command Assessment matrix from evidence only. */
  buildAssessments(config: PillowCommandAuditConfiguration): PillowCommandAssessment[] {
    const discovery = this.discoverWorkers(config);
    const deps = this.integrations.getDependencies();
    const missionRuntimeBound = this.isBoundFor("mission");
    const sendBound = this.isBoundFor("communicationSend");
    const ackBound = this.isBoundFor("communicationAck");
    const monitoringBound = this.isBoundFor("monitoring");
    const orchestrationBound = this.isBoundFor("orchestration");
    const progressCapable = methodPresent(deps.monitoringRuntime, "produceReport", "list", "getState");
    const orchestrationResultCapable = methodPresent(deps.pillowOrchestrationRuntime, "retrieveReport");
    const errResultCapable = methodPresent(deps.executiveReportingRuntime, "retrieveReport");
    const anyResultBound = orchestrationBound || !!deps.executiveReportingRuntime;

    return discovery.workers.map((worker) => {
      const dispatch = probeCommandDispatch(worker.workerId, deps.pillowOrchestrationRuntime);
      return assessWorker(
        worker,
        dispatch,
        missionRuntimeBound,
        { send: sendBound, acknowledge: ackBound },
        { monitoring: monitoringBound, orchestration: orchestrationBound },
        { capable: progressCapable, monitoringBound },
        {
          orchestrationCapable: orchestrationResultCapable,
          executiveReportingCapable: errResultCapable,
          anyBound: anyResultBound,
        },
        `worker:${worker.workerId}`,
      );
    });
  }

  produceCommandReadinessFindings(input: PcartInput, config: PillowCommandAuditConfiguration) {
    const matrix = this.buildAssessments(config);
    const commandReadinessSummary = evaluateCommandReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, matrix);
    const integrationVerification = this.verifyIntegrations();
    const q1103 = this.integrations.attemptQ1103ContractHandshake();

    const commandReadinessDecision = evaluateCommandReadinessGates({
      matrix,
      commandReadinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1103Consumed: q1103.consumed,
      q1103Attempted: q1103.attempted,
      input,
    });

    const outstandingIssues = buildOutstandingIssues(
      matrix,
      governanceSummary,
      integrationVerification,
      commandReadinessSummary,
    );

    return {
      commandReadinessDecision,
      commandMatrix: matrix,
      outstandingIssues,
      confidenceScore: commandReadinessSummary.overallReadinessScore,
    };
  }

  produceReport(input: PcartInput, config: PillowCommandAuditConfiguration): PillowCommandAuditReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const discovery = this.discoverWorkers(config);
    const matrix = this.buildAssessments(config);
    const commandReadinessSummary = evaluateCommandReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, matrix);
    const assignmentSummary = evaluateAssignmentSummary(this.integrations.getDependencies(), matrix);
    const communicationSummary = evaluateCommunicationSummary(this.integrations.getDependencies(), matrix);
    const supervisionSummary = evaluateSupervisionSummary(this.integrations.getDependencies(), matrix);
    const integrationVerification = this.verifyIntegrations();
    const q1103ContractConsumed = this.integrations.attemptQ1103ContractHandshake();

    const commandReadinessDecision = evaluateCommandReadinessGates({
      matrix,
      commandReadinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1103Consumed: q1103ContractConsumed.consumed,
      q1103Attempted: q1103ContractConsumed.attempted,
      input,
    });

    const outstandingIssues = buildOutstandingIssues(
      matrix,
      governanceSummary,
      integrationVerification,
      commandReadinessSummary,
    );
    const validation = this.validator.validateInput({ ...input, validated: input.validated ?? true }, started);

    const report = buildReport({
      reportId: input.reportId,
      workerInventory: discovery.workers,
      commandMatrix: matrix,
      governanceSummary,
      assignmentSummary,
      communicationSummary,
      supervisionSummary,
      integrationVerification,
      commandReadinessSummary,
      q1103ContractConsumed,
      commandReadinessDecision,
      outstandingIssues,
      validation,
      workerId: config.workerId,
      consumableByQ1104: true,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendPcartLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.commandReadinessDecision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  submitReport(input: PcartInput, config: PillowCommandAuditConfiguration): PillowCommandAuditReport {
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, Date.now());
    }
    let report =
      (input.reportId?.trim() ? this.store.getReport(input.reportId.trim()) : null) ?? this.store.getLatestReport();
    if (!report) {
      report = this.produceReport(input, config);
      if (report.validation.decision === "fail") return report;
    }
    const submission = this.integrations.submitReport(report);
    const updated: PillowCommandAuditReport = {
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

  validate(input: PcartInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: PillowCommandAuditConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q11-03" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.recovery.failureCount(),
      locks: config,
    };
  }

  getCommandMatrix() {
    return this.store.getLatestReport()?.commandMatrix ?? [];
  }

  getQ1104ConsumableContract(): Q1104ConsumableContract {
    return {
      contractId: `q1104-contract-${PCART_METADATA_VERSION}`,
      contractVersion: PCART_METADATA_VERSION,
      producedBy: "pillow-command-audit",
      missionId: "Q11-03",
      consumerMissionId: "Q11-04",
      exposedFields: [
        "commandMatrix",
        "commandReadinessSummary",
        "commandReadinessDecision",
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
      commandReadinessDecisionCatalog: ["Ready", "Conditionally_Ready", "Not_Ready", "Failed", "Deferred"],
      notes: [
        "Pillow Command Audit Q11-03 certified — stops at Q11-03, exposes Q1104ConsumableContract for Q11-04 (Factory Readiness Audit)",
        "This contract is structural-signal-only; Q11-03 never implements Q11-04 or any later mission itself",
      ],
      neverImplementQ1104OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private rejectedReport(
    input: PcartInput,
    config: PillowCommandAuditConfiguration,
    started: number,
  ): PillowCommandAuditReport {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendPcartLog({ event: "boundary_reject", details: errors.join(";") });
    const now = new Date().toISOString();
    return buildReport({
      reportId: `pcart-rejected-${nextReportId()}`,
      workerInventory: [],
      commandMatrix: [],
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
      assignmentSummary: { assignableWorkerCount: 0, totalWorkers: 0, missionRuntimeBound: false, evidence: [] },
      communicationSummary: {
        communicableWorkerCount: 0,
        totalWorkers: 0,
        communicationRuntimeBound: false,
        evidence: [],
      },
      supervisionSummary: {
        supervisedWorkerCount: 0,
        progressTrackedWorkerCount: 0,
        resultsCollectedWorkerCount: 0,
        totalWorkers: 0,
        monitoringRuntimeBound: false,
        orchestrationRuntimeBound: false,
        evidence: [],
      },
      integrationVerification: { verifiedAt: now, rows: [], totalTargets: 0, boundCount: 0, allBound: false, evidence: [] },
      commandReadinessSummary: {
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
      q1103ContractConsumed: {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Rejected before handshake",
      },
      commandReadinessDecision: "Failed",
      outstandingIssues: errors,
      validation,
      workerId: config.workerId,
      consumableByQ1104: false,
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: PillowCommandAuditConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: PillowCommandAuditReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `pcart-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "pillow-command-audit",
      engineVersion: "PILLOW-PCART-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...PCART_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastCommandReadinessDecision: latestReport?.commandReadinessDecision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: PCART_METADATA_VERSION,
    };
  }
}
