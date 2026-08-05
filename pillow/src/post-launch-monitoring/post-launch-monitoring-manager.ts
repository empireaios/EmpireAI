import { PlmrtValidator, GateManager, HealthMonitor } from "./audit-validator.js";
import { AuditStore, nextHistoryEntryId, resetPostLaunchMonitoringManagerSequencesForTesting } from "./audit-store.js";
import type { PostLaunchMonitoringConfiguration } from "./configuration.js";
import {
  buildOutstandingRisks,
  computeConfidenceScore,
  detectAbnormalWorkerBehaviour,
  detectIncidents,
  generateAlerts,
  monitorApiIntegrations,
  monitorFactories,
  monitorRuntimeServices,
  monitorWorkers,
  monitorWorkflows,
  produceProductionHealthSummary,
  startMonitoringSession,
  verifyGrandKingAcceptanceGranted,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type PostLaunchMonitoringDependencies,
} from "./integrations.js";
import { appendPlmrtLog } from "./plmrt-logging.js";
import { buildCatalog, buildReport } from "./report-builder.js";
import {
  INTEGRATION_TARGETS,
  PLMRT_CAPABILITIES,
  PLMRT_METADATA_VERSION,
  POST_LAUNCH_MONITORING_IDENTITY,
} from "./paths.js";
import type {
  GrandKingAcceptanceVerification,
  MonitoringHistoryEntry,
  MonitoringSession,
  OperationalState,
  PlmrtEngineRecord,
  PlmrtInput,
  PostLaunchMonitoringReport,
  Q1112ConsumableContract,
} from "./types.js";

export { resetPostLaunchMonitoringManagerSequencesForTesting };

export class PostLaunchMonitoringManager {
  private repositoryRoot = "";
  private engineRecord: PlmrtEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new PlmrtValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;
  private currentSession: MonitoringSession | null = null;
  private currentVerification: GrandKingAcceptanceVerification | null = null;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: PostLaunchMonitoringDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: PostLaunchMonitoringConfiguration) {
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

  getCatalog() {
    return buildCatalog(
      POST_LAUNCH_MONITORING_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
    );
  }

  getMonitoringHistory(limit = 100) {
    return this.store.getMonitoringHistory(limit);
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  getCurrentVerification() {
    return this.currentVerification;
  }

  getCurrentSession() {
    return this.currentSession;
  }

  connect(config: PostLaunchMonitoringConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendPlmrtLog({ event: "connect", details: `Post-Launch Monitoring connected; integrations=${handshakes.length}` });
    return handshakes;
  }

  verifyGrandKingAcceptanceGranted() {
    const q1111 = this.integrations.attemptQ1111ContractHandshake();
    const verification = verifyGrandKingAcceptanceGranted(this.integrations.getDependencies(), q1111);
    this.currentVerification = verification;
    return verification;
  }

  startMonitoringSession(config: PostLaunchMonitoringConfiguration) {
    const verification = this.verifyGrandKingAcceptanceGranted();
    this.currentSession = startMonitoringSession(verification.productionActiveMonitoring);
    this.ensureRecord(verification.productionActiveMonitoring ? "active" : "standby", config);
    appendPlmrtLog({
      event: "start_session",
      details: `session=${this.currentSession.sessionId} productionActive=${verification.productionActiveMonitoring}`,
    });
    return this.currentSession;
  }

  monitorWorkers(config: PostLaunchMonitoringConfiguration) {
    const verification = this.currentVerification ?? this.verifyGrandKingAcceptanceGranted();
    return monitorWorkers(this.integrations.getDependencies(), verification.productionActiveMonitoring);
  }

  monitorFactories(config: PostLaunchMonitoringConfiguration) {
    const verification = this.currentVerification ?? this.verifyGrandKingAcceptanceGranted();
    return monitorFactories(this.integrations.getDependencies(), verification.productionActiveMonitoring);
  }

  monitorWorkflows(config: PostLaunchMonitoringConfiguration) {
    const verification = this.currentVerification ?? this.verifyGrandKingAcceptanceGranted();
    return monitorWorkflows(this.integrations.getDependencies(), verification.productionActiveMonitoring);
  }

  monitorRuntimeServices(config: PostLaunchMonitoringConfiguration) {
    const verification = this.currentVerification ?? this.verifyGrandKingAcceptanceGranted();
    return monitorRuntimeServices(this.integrations.getDependencies(), verification.productionActiveMonitoring);
  }

  monitorApiIntegrations(config: PostLaunchMonitoringConfiguration) {
    const verification = this.currentVerification ?? this.verifyGrandKingAcceptanceGranted();
    return monitorApiIntegrations(this.integrations.getDependencies(), verification.productionActiveMonitoring);
  }

  detectIncidents() {
    return detectIncidents(this.integrations.getDependencies());
  }

  detectAbnormalWorkerBehaviour(config: PostLaunchMonitoringConfiguration) {
    const workerSummary = this.monitorWorkers(config);
    return detectAbnormalWorkerBehaviour(workerSummary);
  }

  generateAlerts(config: PostLaunchMonitoringConfiguration) {
    const verification = this.currentVerification ?? this.verifyGrandKingAcceptanceGranted();
    const incidents = this.detectIncidents();
    return generateAlerts(this.integrations.getDependencies(), incidents, verification.productionActiveMonitoring);
  }

  produceProductionHealthSummary(config: PostLaunchMonitoringConfiguration) {
    const verification = this.currentVerification ?? this.verifyGrandKingAcceptanceGranted();
    const workerSummary = this.monitorWorkers(config);
    const factorySummary = this.monitorFactories(config);
    const incidents = this.detectIncidents();
    const alerts = generateAlerts(this.integrations.getDependencies(), incidents, verification.productionActiveMonitoring);
    return produceProductionHealthSummary(
      verification.productionActiveMonitoring,
      workerSummary,
      factorySummary,
      incidents,
      alerts,
    );
  }

  async producePostLaunchMonitoringReport(
    input: PlmrtInput,
    config: PostLaunchMonitoringConfiguration,
    started = Date.now(),
  ): Promise<PostLaunchMonitoringReport> {
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const validation = this.validator.validateInput(input, started);
    const q1111ContractConsumed = this.integrations.attemptQ1111ContractHandshake();
    const verification = verifyGrandKingAcceptanceGranted(this.integrations.getDependencies(), q1111ContractConsumed);
    this.currentVerification = verification;
    const productionActive = verification.productionActiveMonitoring;

    const workerSummary = monitorWorkers(this.integrations.getDependencies(), productionActive);
    const factorySummary = monitorFactories(this.integrations.getDependencies(), productionActive);
    const workflowSummary = monitorWorkflows(this.integrations.getDependencies(), productionActive);
    const runtimeSummary = monitorRuntimeServices(this.integrations.getDependencies(), productionActive);
    const apiSummary = monitorApiIntegrations(this.integrations.getDependencies(), productionActive);
    const incidentSummary = detectIncidents(this.integrations.getDependencies());
    const alertSummary = generateAlerts(this.integrations.getDependencies(), incidentSummary, productionActive);
    const abnormalWorkers = detectAbnormalWorkerBehaviour(workerSummary);
    const productionHealthSummary = produceProductionHealthSummary(
      productionActive,
      workerSummary,
      factorySummary,
      incidentSummary,
      alertSummary,
    );

    const supportingEvidence = [
      ...verification.evidence,
      ...workerSummary.evidence,
      ...factorySummary.evidence,
      ...incidentSummary.evidence,
      q1111ContractConsumed.evidence,
    ];
    const outstandingRisks = buildOutstandingRisks(verification, incidentSummary, productionHealthSummary);
    const confidenceScore = computeConfidenceScore(verification, productionHealthSummary, q1111ContractConsumed.consumed);

    const report = buildReport({
      reportId: input.reportId,
      workerId: config.workerId,
      verification,
      productionHealthSummary,
      workerSummary,
      factorySummary,
      runtimeSummary,
      apiSummary,
      workflowSummary,
      incidentSummary,
      alertSummary,
      abnormalWorkers,
      supportingEvidence,
      outstandingRisks,
      confidenceScore,
      validation,
      q1111ContractConsumed: {
        attempted: q1111ContractConsumed.attempted,
        consumed: q1111ContractConsumed.consumed,
        contractVersion: q1111ContractConsumed.contractVersion,
        fields: q1111ContractConsumed.fields,
        evidence: q1111ContractConsumed.evidence,
      },
    });

    this.store.saveReport(report);
    this.store.saveHistory(this.buildHistoryEntry(report));
    this.ensureRecord(productionActive ? "active" : "standby", config, validation.decision === "fail" ? "failed" : "passed");
    appendPlmrtLog({ event: "produce_report", details: report.reportId });
    return report;
  }

  async auditPostLaunch(input: PlmrtInput, config: PostLaunchMonitoringConfiguration) {
    return this.producePostLaunchMonitoringReport(input, config);
  }

  async submitReport(input: PlmrtInput, config: PostLaunchMonitoringConfiguration) {
    const report = await this.producePostLaunchMonitoringReport(input, config);
    if (report.validation.decision === "fail") return report;
    const submission = this.integrations.submitReport(report);
    return {
      ...report,
      submittedToExecutiveReporting: submission.submitted,
      executiveReportId: submission.executiveReportId,
    };
  }

  list() {
    return this.store.listReports();
  }

  validate(input: PlmrtInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: PostLaunchMonitoringConfiguration) {
    this.ensureSeeded(config);
    const verification = this.currentVerification ?? this.verifyGrandKingAcceptanceGranted();
    return {
      missionId: "Q11-11" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.gateManager.failureCount(),
      grandKingAcceptanceGranted: verification.grandKingAcceptanceGranted,
      productionActiveMonitoring: verification.productionActiveMonitoring,
      integrations: verifyIntegrations(this.integrations.getDependencies()),
      locks: config,
    };
  }

  getQ1112ConsumableContract(): Q1112ConsumableContract {
    return {
      contractId: `q1112-contract-${PLMRT_METADATA_VERSION}`,
      contractVersion: PLMRT_METADATA_VERSION,
      producedBy: "post-launch-monitoring",
      missionId: "Q11-11",
      consumerMissionId: "Q11-12",
      exposedFields: [
        "productionHealthSummary",
        "workerSummary",
        "factorySummary",
        "runtimeSummary",
        "apiSummary",
        "workflowSummary",
        "incidentSummary",
        "alertSummary",
        "businessImpactSummary",
        "assessments",
        "grandKingAcceptanceGranted",
        "productionActiveMonitoring",
        "outstandingRisks",
        "confidenceScore",
      ],
      productionStatusCatalog: ["active", "blocked", "standby", "degraded", "unknown"],
      alertStatusCatalog: ["none", "warning", "critical", "unknown"],
      notes: [
        "Post-Launch Monitoring Q11-11 certified — stops at Q11-11, exposes Q1112ConsumableContract for Q11-12 Q Series Certified",
        "This contract is structural-signal-only; Q11-11 never implements Q11-12 or any later mission itself",
        "Production-active monitoring evidence only when Grand King approve + deployment authorised",
      ],
      neverImplementQ1112OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private buildHistoryEntry(report: PostLaunchMonitoringReport): MonitoringHistoryEntry {
    return {
      entryId: nextHistoryEntryId(),
      timestamp: report.timestamp,
      sessionId: this.currentSession?.sessionId ?? null,
      reportId: report.reportId,
      productionActiveMonitoring: report.productionActiveMonitoring,
      evidence: report.supportingEvidence.slice(0, 5),
    };
  }

  private async rejectedReport(
    input: PlmrtInput,
    config: PostLaunchMonitoringConfiguration,
    started: number,
  ): Promise<PostLaunchMonitoringReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendPlmrtLog({ event: "boundary_reject", details: errors.join(";") });

    const q1111ContractConsumed = this.integrations.attemptQ1111ContractHandshake();
    const verification = verifyGrandKingAcceptanceGranted(this.integrations.getDependencies(), q1111ContractConsumed);
    const emptyWorker = monitorWorkers(this.integrations.getDependencies(), false);
    const emptyFactory = monitorFactories(this.integrations.getDependencies(), false);
    const emptyWorkflow = monitorWorkflows(this.integrations.getDependencies(), false);
    const emptyRuntime = monitorRuntimeServices(this.integrations.getDependencies(), false);
    const emptyApi = monitorApiIntegrations(this.integrations.getDependencies(), false);
    const emptyIncidents = detectIncidents(this.integrations.getDependencies());
    const emptyAlerts = generateAlerts(this.integrations.getDependencies(), emptyIncidents, false);
    const healthSummary = produceProductionHealthSummary(false, emptyWorker, emptyFactory, emptyIncidents, emptyAlerts);

    const report = buildReport({
      reportId: input.reportId,
      workerId: config.workerId,
      verification: { ...verification, productionActiveMonitoring: false, grandKingAcceptanceGranted: false },
      productionHealthSummary: healthSummary,
      workerSummary: emptyWorker,
      factorySummary: emptyFactory,
      runtimeSummary: emptyRuntime,
      apiSummary: emptyApi,
      workflowSummary: emptyWorkflow,
      incidentSummary: emptyIncidents,
      alertSummary: emptyAlerts,
      abnormalWorkers: [],
      supportingEvidence: [...errors, ...verification.evidence],
      outstandingRisks: [...errors, "boundary violation — report rejected"],
      confidenceScore: 0,
      validation,
      q1111ContractConsumed: {
        attempted: q1111ContractConsumed.attempted,
        consumed: q1111ContractConsumed.consumed,
        contractVersion: q1111ContractConsumed.contractVersion,
        fields: q1111ContractConsumed.fields,
        evidence: q1111ContractConsumed.evidence,
      },
    });
    report.consumableByQ1112 = false;
    this.store.saveReport(report);
    return report;
  }

  private ensureRecord(
    operational: OperationalState,
    config: PostLaunchMonitoringConfiguration,
    validation: "pending" | "passed" | "partial" | "failed" = "pending",
  ) {
    const latest = this.store.getLatestReport();
    this.engineRecord = {
      engineRecordId: `plmrt-engine-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "PILLOW-PLMRT-001",
      engineVersion: "PILLOW-PLMRT-001",
      currentOperationalState: operational,
      healthStatus:
        operational === "failed" ? "failed" : operational === "standby" || operational === "blocked" ? "standby" : "healthy",
      validationStatus: validation === "passed" ? "passed" : validation === "failed" ? "failed" : validation === "partial" ? "partial" : "pending",
      supportedCapabilities: [...PLMRT_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latest?.reportId ?? null,
      lastProductionActiveMonitoring: latest?.productionActiveMonitoring ?? this.currentVerification?.productionActiveMonitoring ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: PLMRT_METADATA_VERSION,
    };
  }
}
