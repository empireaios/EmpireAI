import { collectRepositoryEvidence } from "./evidence-collector.js";
import { classifyComponent, classifyMissionDeferred } from "./component-classifier.js";
import { probeWorker } from "./worker-probe.js";
import { verifyIntegrations as computeIntegrationVerification } from "./integration-verifier.js";
import {
  evaluateGovernanceCompliance,
  evaluateOperationalReadiness,
  evaluateProductionReadiness,
  evaluateReportingCapability,
  evaluateWorkflowCompleteness,
} from "./readiness-evaluator.js";
import { evaluateCertificationGates } from "./certification-gates.js";
import { LbcValidator, HealthMonitor, RecoveryManager } from "./certification-validator.js";
import { CertificationStore, nextReportId } from "./certification-store.js";
import {
  buildCatalog,
  buildDeliverableVerification,
  buildReport,
  buildRisksAndFindings,
  computeConfidenceScore,
} from "./report-builder.js";
import { IntegrationCoordinator, type LocalBusinessCertificationDependencies } from "./integrations.js";
import { appendLbcLog } from "./lbc-logging.js";
import { Q7_MISSIONS } from "./mission-catalog.js";
import { INTEGRATION_TARGETS, LBC_CAPABILITIES, LBC_METADATA_VERSION, LOCAL_BUSINESS_CERTIFICATION_ID } from "./paths.js";
import type { LocalBusinessCertificationConfiguration } from "./configuration.js";
import type {
  CertificationFindings,
  ComponentStatusRow,
  LbcEngineRecord,
  LbcInput,
  LocalBusinessCertificationReport,
  MissionEvidence,
  OperationalState,
  WorkerProbeResult,
} from "./types.js";

export class LocalBusinessCertificationManager {
  private repositoryRoot = "";
  private engineRecord: LbcEngineRecord | null = null;
  private readonly store = new CertificationStore();
  private readonly validator = new LbcValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: ReturnType<IntegrationCoordinator["getHandshakes"]> = [];
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: LocalBusinessCertificationDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: LocalBusinessCertificationConfiguration) {
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
      LOCAL_BUSINESS_CERTIFICATION_ID,
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

  connect(config: LocalBusinessCertificationConfiguration) {
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendLbcLog({
      event: "connect",
      details: `Local Business Certification connected; integrations=${this.handshakes.length}`,
    });
    return this.handshakes;
  }

  /* ---------------------------------------------------------------------- */
  /* Evidence + probes — recomputed fresh on every verification call.       */
  /* ---------------------------------------------------------------------- */

  collectEvidence(): Map<string, MissionEvidence> {
    return collectRepositoryEvidence(this.repositoryRoot);
  }

  async probeWorkers(): Promise<Map<string, WorkerProbeResult>> {
    const handles = this.integrations.getAllWorkerHandles();
    const entries = await Promise.all(
      Q7_MISSIONS.map(async (mission) => {
        const probe = await probeWorker(mission.dependencyKey, handles.get(mission.missionId));
        return [mission.missionId, probe] as const;
      }),
    );
    return new Map(entries);
  }

  async auditQ7Workers(input: LbcInput = {}): Promise<ComponentStatusRow[]> {
    const evidence = this.collectEvidence();
    const probes = await this.probeWorkers();
    return Q7_MISSIONS.map((mission): ComponentStatusRow => {
      const missionEvidence = evidence.get(mission.missionId)!;
      const probe = probes.get(mission.missionId)!;
      const deferred =
        missionEvidence.deferred || classifyMissionDeferred(mission, input.deferredMissionIds);
      const classification = classifyComponent(missionEvidence, probe, deferred);
      return {
        missionId: mission.missionId,
        missionName: mission.missionName,
        subsystemId: mission.subsystemId,
        modulePath: mission.modulePath,
        expectedDeliverable: mission.expectedDeliverable,
        status: classification.status,
        reason: classification.reason,
        moduleEvidence: `module ${missionEvidence.moduleExists ? "found" : "not found"} at ${mission.modulePath}`,
        finalPassEvidence: `FINAL PASS ${missionEvidence.finalPass ? "observed" : "not observed"} (${missionEvidence.finalPassSource})`,
        sessionEvidence: `session.ts reference ${missionEvidence.sessionReferenced ? "observed" : "not observed"}`,
        registryEvidence: `subsystem registry reference ${missionEvidence.registryReferenced ? "observed" : "not observed"}`,
        runtimeEvidence: probe.evidence,
        governanceEvidence: `governance doc ${missionEvidence.governanceExists ? "present" : "missing"} at ${mission.governancePath}`,
        configEvidence: `config file ${missionEvidence.configExists ? "present" : "missing"} at ${mission.configPath}`,
      };
    });
  }

  verifyMissions(input: LbcInput = {}) {
    return this.auditQ7Workers(input);
  }

  async verifyDeliverables(input: LbcInput = {}) {
    const matrix = await this.auditQ7Workers(input);
    return buildDeliverableVerification(matrix);
  }

  async verifyIntegrations() {
    const probes = await this.probeWorkers();
    return computeIntegrationVerification(this.repositoryRoot, probes);
  }

  async verifyProductionReadiness(input: LbcInput = {}) {
    const evidence = this.collectEvidence();
    const matrix = await this.auditQ7Workers(input);
    return evaluateProductionReadiness(evidence, matrix);
  }

  verifyGovernanceCompliance() {
    const evidence = this.collectEvidence();
    return evaluateGovernanceCompliance(this.repositoryRoot, evidence);
  }

  async verifyOperationalReadiness() {
    const probes = await this.probeWorkers();
    return evaluateOperationalReadiness(probes);
  }

  async verifyWorkflowCompleteness(input: LbcInput = {}) {
    const matrix = await this.auditQ7Workers(input);
    const integration = await this.verifyIntegrations();
    return evaluateWorkflowCompleteness(matrix, integration);
  }

  async verifyReportingCapability() {
    const probes = await this.probeWorkers();
    const handles = this.integrations.getAllWorkerHandles();
    return evaluateReportingCapability(
      probes,
      handles,
      Boolean(this.integrations.getDependencies().executiveReportingRuntime),
    );
  }

  async produceCertificationFindings(input: LbcInput = {}): Promise<CertificationFindings> {
    const matrix = await this.auditQ7Workers(input);
    const integration = await this.verifyIntegrations();
    const productionReadiness = await this.verifyProductionReadiness(input);
    const governanceCompliance = this.verifyGovernanceCompliance();
    const operationalReadiness = await this.verifyOperationalReadiness();
    const workflowCompleteness = await this.verifyWorkflowCompleteness(input);

    const certificationDecision = evaluateCertificationGates({
      matrix,
      integrationsAllBound: integration.allBound,
      productionReadiness,
      governanceCompliance,
      operationalReadiness,
      workflowComplete: workflowCompleteness.complete,
      factoryDeferred: false,
    });

    const { risks, outstandingFindings } = buildRisksAndFindings(
      matrix,
      integration,
      productionReadiness,
      governanceCompliance,
      operationalReadiness,
      workflowCompleteness,
    );

    return {
      certificationDecision,
      componentStatusMatrix: matrix,
      risks,
      outstandingFindings,
      confidenceScore: computeConfidenceScore(matrix),
    };
  }

  async produceReport(
    input: LbcInput,
    config: LocalBusinessCertificationConfiguration,
  ): Promise<LocalBusinessCertificationReport> {
    const started = Date.now();
    this.ensureSeeded(config);

    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const matrix = await this.auditQ7Workers(input);
    const integration = await this.verifyIntegrations();
    const deliverableVerification = buildDeliverableVerification(matrix);
    const productionReadiness = await this.verifyProductionReadiness(input);
    const governanceCompliance = this.verifyGovernanceCompliance();
    const operationalReadiness = await this.verifyOperationalReadiness();
    const workflowCompleteness = await this.verifyWorkflowCompleteness(input);
    const reportingCapability = await this.verifyReportingCapability();
    const launchPackContractConsumed = this.integrations.attemptLaunchPackContractHandshake();

    const certificationDecision = evaluateCertificationGates({
      matrix,
      integrationsAllBound: integration.allBound,
      productionReadiness,
      governanceCompliance,
      operationalReadiness,
      workflowComplete: workflowCompleteness.complete,
      factoryDeferred: false,
    });

    const { risks, outstandingFindings } = buildRisksAndFindings(
      matrix,
      integration,
      productionReadiness,
      governanceCompliance,
      operationalReadiness,
      workflowCompleteness,
    );

    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );

    const report = buildReport({
      reportId: input.reportId,
      factoryName: input.factoryName?.trim() || "Local Business Factory",
      componentStatusMatrix: matrix,
      deliverableVerification,
      integrationVerification: integration,
      productionReadiness,
      governanceCompliance,
      operationalReadiness,
      workflowCompleteness,
      reportingCapability,
      launchPackContractConsumed,
      certificationDecision,
      risks,
      outstandingFindings,
      validation,
      workerId: config.workerId,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendLbcLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.certificationDecision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  async submitReport(
    input: LbcInput,
    config: LocalBusinessCertificationConfiguration,
  ): Promise<LocalBusinessCertificationReport> {
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, Date.now());
    }
    let report =
      (input.reportId?.trim() ? this.store.getReport(input.reportId.trim()) : null) ??
      this.store.getLatestReport();
    if (!report) {
      report = await this.produceReport(input, config);
      if (report.validation.decision === "fail") return report;
    }
    const submission = this.integrations.submitReport(report);
    const updated: LocalBusinessCertificationReport = {
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

  validate(input: LbcInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: LocalBusinessCertificationConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q7-11" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.recovery.failureCount(),
      locks: config,
    };
  }

  private rejectedReport(
    input: LbcInput,
    config: LocalBusinessCertificationConfiguration,
    started: number,
  ): LocalBusinessCertificationReport {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendLbcLog({ event: "boundary_reject", details: errors.join(";") });
    const emptyMatrix = Q7_MISSIONS.map((mission) => ({
      missionId: mission.missionId,
      missionName: mission.missionName,
      subsystemId: mission.subsystemId,
      modulePath: mission.modulePath,
      expectedDeliverable: mission.expectedDeliverable,
      status: "Broken / Deviating" as const,
      reason: "Rejected before evidence collection due to forbidden boundary input",
      moduleEvidence: "not evaluated — request rejected",
      finalPassEvidence: "not evaluated — request rejected",
      sessionEvidence: "not evaluated — request rejected",
      registryEvidence: "not evaluated — request rejected",
      runtimeEvidence: "not evaluated — request rejected",
      governanceEvidence: "not evaluated — request rejected",
      configEvidence: "not evaluated — request rejected",
    }));
    const deliverableVerification = buildDeliverableVerification([]);
    return buildReport({
      reportId: `lbc-rejected-${nextReportId()}`,
      factoryName: input.factoryName?.trim() || "Local Business Factory",
      componentStatusMatrix: emptyMatrix,
      deliverableVerification,
      integrationVerification: { verifiedAt: new Date().toISOString(), rows: [], allBound: false, evidence: [] },
      productionReadiness: {
        ready: false,
        modulesPresent: 0,
        modulesTotal: 0,
        finalPassCount: 0,
        finalPassTotal: 0,
        notes: ["Rejected before evidence collection"],
        evidence: [],
      },
      governanceCompliance: { compliant: false, checks: [], missingDocs: [], evidence: [] },
      operationalReadiness: { ready: false, reachableCount: 0, totalCount: 0, probes: [], notes: [] },
      workflowCompleteness: { complete: false, stages: [], evidence: [] },
      reportingCapability: {
        capable: false,
        workersWithReportingAccess: 0,
        totalWorkers: 0,
        executiveReportingAvailable: false,
        evidence: [],
      },
      launchPackContractConsumed: {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Rejected before handshake",
      },
      certificationDecision: "Failed",
      risks: errors,
      outstandingFindings: errors,
      validation,
      workerId: config.workerId,
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: LocalBusinessCertificationConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: LocalBusinessCertificationReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `lbc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: LOCAL_BUSINESS_CERTIFICATION_ID,
      engineVersion: "PILLOW-LBC-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...LBC_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastCertificationDecision: latestReport?.certificationDecision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: LBC_METADATA_VERSION,
    };
  }
}
