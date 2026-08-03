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
import { AfcrtValidator, HealthMonitor, RecoveryManager } from "./certification-validator.js";
import { CertificationStore, nextReportId } from "./certification-store.js";
import {
  buildCatalog,
  buildDeliverableVerification,
  buildReport,
  buildRisksAndFindings,
  computeConfidenceScore,
} from "./report-builder.js";
import { IntegrationCoordinator, type AffiliateCertificationDependencies } from "./integrations.js";
import { appendAfcrtLog } from "./afcrt-logging.js";
import { Q8_MISSIONS } from "./mission-catalog.js";
import { INTEGRATION_TARGETS, AFCRT_CAPABILITIES, AFCRT_METADATA_VERSION, AFFILIATE_CERTIFICATION_ID } from "./paths.js";
import type { AffiliateCertificationConfiguration } from "./configuration.js";
import type {
  CertificationFindings,
  ComponentStatusRow,
  LbcEngineRecord,
  AfcrtInput,
  AffiliateCertificationReport,
  MissionEvidence,
  OperationalState,
  WorkerProbeResult,
} from "./types.js";

export class AffiliateCertificationManager {
  private repositoryRoot = "";
  private engineRecord: LbcEngineRecord | null = null;
  private readonly store = new CertificationStore();
  private readonly validator = new AfcrtValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: ReturnType<IntegrationCoordinator["getHandshakes"]> = [];
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: AffiliateCertificationDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: AffiliateCertificationConfiguration) {
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
      AFFILIATE_CERTIFICATION_ID,
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

  connect(config: AffiliateCertificationConfiguration) {
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendAfcrtLog({
      event: "connect",
      details: `Affiliate Certification connected; integrations=${this.handshakes.length}`,
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
      Q8_MISSIONS.map(async (mission) => {
        const probe = await probeWorker(mission.dependencyKey, handles.get(mission.missionId));
        return [mission.missionId, probe] as const;
      }),
    );
    return new Map(entries);
  }

  async auditQ8Workers(input: AfcrtInput = {}): Promise<ComponentStatusRow[]> {
    const evidence = this.collectEvidence();
    const probes = await this.probeWorkers();
    return Q8_MISSIONS.map((mission): ComponentStatusRow => {
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

  verifyMissions(input: AfcrtInput = {}) {
    return this.auditQ8Workers(input);
  }

  async verifyDeliverables(input: AfcrtInput = {}) {
    const matrix = await this.auditQ8Workers(input);
    return buildDeliverableVerification(matrix);
  }

  async verifyIntegrations() {
    const probes = await this.probeWorkers();
    return computeIntegrationVerification(this.repositoryRoot, probes);
  }

  async verifyProductionReadiness(input: AfcrtInput = {}) {
    const evidence = this.collectEvidence();
    const matrix = await this.auditQ8Workers(input);
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

  async verifyWorkflowCompleteness(input: AfcrtInput = {}) {
    const matrix = await this.auditQ8Workers(input);
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

  async produceCertificationFindings(input: AfcrtInput = {}): Promise<CertificationFindings> {
    const matrix = await this.auditQ8Workers(input);
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
    input: AfcrtInput,
    config: AffiliateCertificationConfiguration,
  ): Promise<AffiliateCertificationReport> {
    const started = Date.now();
    this.ensureSeeded(config);

    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const matrix = await this.auditQ8Workers(input);
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
      factoryName: input.factoryName?.trim() || "Affiliate Factory",
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
    appendAfcrtLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.certificationDecision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  async submitReport(
    input: AfcrtInput,
    config: AffiliateCertificationConfiguration,
  ): Promise<AffiliateCertificationReport> {
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
    const updated: AffiliateCertificationReport = {
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

  validate(input: AfcrtInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: AffiliateCertificationConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q8-09" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.recovery.failureCount(),
      locks: config,
    };
  }

  private rejectedReport(
    input: AfcrtInput,
    config: AffiliateCertificationConfiguration,
    started: number,
  ): AffiliateCertificationReport {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendAfcrtLog({ event: "boundary_reject", details: errors.join(";") });
    const emptyMatrix = Q8_MISSIONS.map((mission) => ({
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
      reportId: `afcrt-rejected-${nextReportId()}`,
      factoryName: input.factoryName?.trim() || "Affiliate Factory",
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
    config: AffiliateCertificationConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: AffiliateCertificationReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `afcrt-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: AFFILIATE_CERTIFICATION_ID,
      engineVersion: "PILLOW-AFCRT-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...AFCRT_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastCertificationDecision: latestReport?.certificationDecision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: AFCRT_METADATA_VERSION,
    };
  }
}
