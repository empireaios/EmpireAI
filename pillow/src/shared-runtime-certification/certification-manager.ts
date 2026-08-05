import { collectRepositoryEvidence } from "./evidence-collector.js";
import { classifyComponent, classifyMissionDeferred } from "./component-classifier.js";
import { probeWorker } from "./worker-probe.js";
import { verifyIntegrations as computeIntegrationVerification } from "./integration-verifier.js";
import {
  buildRepositoryAudit,
  buildRuntimeAudit,
  buildRuntimeInventory,
  evaluateCertificationSummary,
  evaluateGovernanceResults,
  evaluateMonitoringVerification,
  evaluateRecoveryVerification,
  evaluateAuditabilityVerification,
  evaluateReportingVerification,
} from "./readiness-evaluator.js";
import { evaluateCertificationGates } from "./certification-gates.js";
import { SrcrtValidator, HealthMonitor, RecoveryManager } from "./certification-validator.js";
import { CertificationStore, nextReportId } from "./certification-store.js";
import { buildCatalog, buildReport, buildRisksAndFindings } from "./report-builder.js";
import {
  IntegrationCoordinator,
  type SharedRuntimeCertificationDependencies,
} from "./integrations.js";
import { appendSrcrtLog } from "./srcrt-logging.js";
import { Q10_RUNTIMES } from "./runtime-catalog.js";
import {
  INTEGRATION_TARGETS,
  SRCRT_CAPABILITIES,
  SRCRT_METADATA_VERSION,
  SHARED_RUNTIME_CERTIFICATION_IDENTITY,
} from "./paths.js";
import type { SharedRuntimeCertificationConfiguration } from "./configuration.js";
import type {
  CertificationFindings,
  CertificationResult,
  SrcrtEngineRecord,
  SrcrtInput,
  SharedRuntimeCertificationReport,
  RuntimeEvidence,
  WorkerProbeResult,
  OperationalState,
  Q1101ConsumableContract,
} from "./types.js";

export class SharedRuntimeCertificationManager {
  private repositoryRoot = "";
  private engineRecord: SrcrtEngineRecord | null = null;
  private readonly store = new CertificationStore();
  private readonly validator = new SrcrtValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: SharedRuntimeCertificationDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: SharedRuntimeCertificationConfiguration) {
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
      SHARED_RUNTIME_CERTIFICATION_IDENTITY.workerId,
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

  connect(config: SharedRuntimeCertificationConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendSrcrtLog({
      event: "connect",
      details: `Shared Runtime Certification connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  collectEvidence(): Map<string, RuntimeEvidence> {
    return collectRepositoryEvidence(this.repositoryRoot);
  }

  async probeWorkers(): Promise<Map<string, WorkerProbeResult>> {
    const handles = this.integrations.getAllWorkerHandles();
    const entries = await Promise.all(
      Q10_RUNTIMES.map(async (runtime) => {
        const probe = await probeWorker(runtime.dependencyKey, handles.get(runtime.missionId));
        return [runtime.missionId, probe] as const;
      }),
    );
    return new Map(entries);
  }

  async auditQ10Runtimes(input: SrcrtInput = {}): Promise<CertificationResult[]> {
    const evidence = this.collectEvidence();
    const probes = await this.probeWorkers();
    const governance = this.evaluateGovernanceForMatrix(evidence);
    const now = new Date().toISOString();
    return Q10_RUNTIMES.map((runtime): CertificationResult => {
      const runtimeEvidence = evidence.get(runtime.missionId)!;
      const probe = probes.get(runtime.missionId)!;
      const deferred =
        runtimeEvidence.deferred || classifyMissionDeferred(runtime, input.deferredMissionIds);
      const classification = classifyComponent(runtimeEvidence, probe, deferred);
      const governanceCompliant = governance.get(runtime.missionId) ?? false;
      return {
        certificationId: `srcrt-cert-${runtime.missionId}`,
        runtimeComponent: runtime.runtimeName,
        missionId: runtime.missionId,
        certificationStatus: classification.status,
        verificationResult: classification.reason,
        integrationStatus: probe.reachable ? "bound" : runtimeEvidence.registryReferenced ? "ready" : "unavailable",
        governanceStatus: governanceCompliant ? "compliant" : "non_compliant",
        reportingStatus: probe.reachable ? "capable" : "unavailable",
        runtimeHealth: classification.status === "Certified" ? "healthy" : classification.status === "Blocked" || classification.status === "Failed Certification" ? "failed" : classification.status === "Partially Certified" ? "degraded" : "unknown",
        supportingEvidence: [
          `engine.ts ${runtimeEvidence.engineExists ? "found" : "missing"} at ${runtime.enginePath}`,
          `config ${runtimeEvidence.configExists ? "present" : "missing"} at ${runtime.configPath}`,
          `governance ${runtimeEvidence.governanceExists ? "present" : "missing"} at ${runtime.governancePath}`,
          `bridge ${runtimeEvidence.bridgeExists ? "present" : "missing"} at ${runtime.bridgePath}`,
          `certified evidence ${runtimeEvidence.certified ? "observed" : "not observed"} (${runtimeEvidence.certifiedSource})`,
          `session.ts reference ${runtimeEvidence.sessionReferenced ? "observed" : "not observed"}`,
          `subsystem registry reference ${runtimeEvidence.registryReferenced ? "observed" : "not observed"}`,
          runtime.missionId === "Q10-13"
            ? `Q1014ConsumableContract ${runtimeEvidence.q1014ContractPresent ? "observed" : "not observed"}`
            : "consumable contract not applicable to this row",
          `runtime probe: ${probe.evidence}`,
        ],
        testResults: `test ${runtimeEvidence.testExists ? "present" : "missing"} at ${runtime.testPath}`,
        auditReference: runtime.auditPath,
        certificationTimestamp: now,
      };
    });
  }

  private evaluateGovernanceForMatrix(evidence: Map<string, RuntimeEvidence>): Map<string, boolean> {
    const result = new Map<string, boolean>();
    for (const runtime of Q10_RUNTIMES) {
      result.set(runtime.missionId, Boolean(evidence.get(runtime.missionId)?.governanceExists));
    }
    return result;
  }

  async verifyIntegrations() {
    const probes = await this.probeWorkers();
    return computeIntegrationVerification(this.repositoryRoot, probes);
  }

  async verifyProductionReadiness(input: SrcrtInput = {}) {
    const matrix = await this.auditQ10Runtimes(input);
    return evaluateCertificationSummary(matrix);
  }

  verifyGovernanceCompliance() {
    const evidence = this.collectEvidence();
    return evaluateGovernanceResults(this.repositoryRoot, evidence);
  }

  async verifyMonitoring() {
    const probes = await this.probeWorkers();
    return evaluateMonitoringVerification(probes, this.integrations.getDependencies().monitoringRuntime);
  }

  async verifyRecovery() {
    const probes = await this.probeWorkers();
    return evaluateRecoveryVerification(probes, this.integrations.getDependencies().recoveryRuntime);
  }

  async verifyAuditability() {
    const probes = await this.probeWorkers();
    return evaluateAuditabilityVerification(probes, this.integrations.getDependencies().auditRuntime);
  }

  async verifyReporting() {
    const probes = await this.probeWorkers();
    return evaluateReportingVerification(
      probes,
      this.integrations.getAllWorkerHandles(),
      Boolean(this.integrations.getDependencies().executiveReportingRuntime),
    );
  }

  async produceCertificationFindings(input: SrcrtInput = {}): Promise<CertificationFindings> {
    const matrix = await this.auditQ10Runtimes(input);
    const integration = await this.verifyIntegrations();
    const certificationSummary = await this.verifyProductionReadiness(input);
    const governanceResults = this.verifyGovernanceCompliance();
    const monitoringVerification = await this.verifyMonitoring();
    const recoveryVerification = await this.verifyRecovery();
    const auditabilityVerification = await this.verifyAuditability();
    const reportingVerification = await this.verifyReporting();

    const certificationDecision = evaluateCertificationGates({
      matrix,
      integrationsAllBound: integration.allBound,
      certificationSummary,
      governanceResults,
      monitoringVerified: monitoringVerification.verified,
      recoveryVerified: recoveryVerification.verified,
      auditabilityVerified: auditabilityVerification.verified,
      reportingVerified: reportingVerification.verified,
      input,
      runtimeDeferred: false,
    });

    const { risks, outstandingIssues } = buildRisksAndFindings(
      matrix,
      integration,
      certificationSummary,
      governanceResults,
      monitoringVerification,
      recoveryVerification,
      auditabilityVerification,
      reportingVerification,
    );

    return {
      certificationDecision,
      runtimeCertificationMatrix: matrix,
      risks,
      outstandingIssues,
      confidenceScore: matrix.filter((r) => r.certificationStatus === "Certified").length / matrix.length,
    };
  }

  async produceReport(
    input: SrcrtInput,
    config: SharedRuntimeCertificationConfiguration,
  ): Promise<SharedRuntimeCertificationReport> {
    const started = Date.now();
    this.ensureSeeded(config);

    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const evidence = this.collectEvidence();
    const probes = await this.probeWorkers();
    const matrix = await this.auditQ10Runtimes(input);
    const integration = await this.verifyIntegrations();
    const repositoryAudit = buildRepositoryAudit(evidence);
    const runtimeAudit = buildRuntimeAudit(probes);
    const runtimeInventory = buildRuntimeInventory(evidence, this.integrations.getInjectedDependencyKeys());
    const certificationSummary = evaluateCertificationSummary(matrix);
    const governanceResults = evaluateGovernanceResults(this.repositoryRoot, evidence);
    const monitoringVerification = evaluateMonitoringVerification(
      probes,
      this.integrations.getDependencies().monitoringRuntime,
    );
    const recoveryVerification = evaluateRecoveryVerification(
      probes,
      this.integrations.getDependencies().recoveryRuntime,
    );
    const auditabilityVerification = evaluateAuditabilityVerification(
      probes,
      this.integrations.getDependencies().auditRuntime,
    );
    const reportingVerification = evaluateReportingVerification(
      probes,
      this.integrations.getAllWorkerHandles(),
      Boolean(this.integrations.getDependencies().executiveReportingRuntime),
    );
    const q1014ContractConsumed = this.integrations.attemptQ1014ContractHandshake();

    const certificationDecision = evaluateCertificationGates({
      matrix,
      integrationsAllBound: integration.allBound,
      certificationSummary,
      governanceResults,
      monitoringVerified: monitoringVerification.verified,
      recoveryVerified: recoveryVerification.verified,
      auditabilityVerified: auditabilityVerification.verified,
      reportingVerified: reportingVerification.verified,
      input,
      runtimeDeferred: false,
    });

    const { risks, outstandingIssues } = buildRisksAndFindings(
      matrix,
      integration,
      certificationSummary,
      governanceResults,
      monitoringVerification,
      recoveryVerification,
      auditabilityVerification,
      reportingVerification,
    );

    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );

    const report = buildReport({
      reportId: input.reportId,
      repositoryAudit,
      runtimeAudit,
      runtimeInventory,
      runtimeCertificationMatrix: matrix,
      integrationSummary: integration,
      certificationSummary,
      governanceResults,
      monitoringVerification,
      recoveryVerification,
      auditabilityVerification,
      reportingVerification,
      q1014ContractConsumed,
      certificationDecision,
      risks,
      outstandingIssues,
      validation,
      workerId: config.workerId,
      consumableByQ1101: true,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendSrcrtLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.certificationDecision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  async submitReport(
    input: SrcrtInput,
    config: SharedRuntimeCertificationConfiguration,
  ): Promise<SharedRuntimeCertificationReport> {
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
    const updated: SharedRuntimeCertificationReport = {
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

  validate(input: SrcrtInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: SharedRuntimeCertificationConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q10-14" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.recovery.failureCount(),
      locks: config,
    };
  }

  getRuntimeCertificationMatrix() {
    return this.store.getLatestReport()?.runtimeCertificationMatrix ?? [];
  }

  getQ1101ConsumableContract(): Q1101ConsumableContract {
    return {
      contractId: `q1101-contract-${SRCRT_METADATA_VERSION}`,
      contractVersion: SRCRT_METADATA_VERSION,
      producedBy: "shared-runtime-certification",
      missionId: "Q10-14",
      consumerMissionId: "Q11-01",
      exposedFields: [
        "runtimeCertificationMatrix",
        "certificationSummary",
        "certificationDecision",
        "passedComponents",
        "failedComponents",
        "missingComponents",
        "outstandingIssues",
        "confidenceScore",
      ],
      runtimeCertificationCatalog: Q10_RUNTIMES.map((r) => r.missionId),
      certificationDecisionCatalog: [
        "Certified",
        "Conditionally_Certified",
        "Not_Certified",
        "Failed",
        "Deferred",
      ],
      notes: [
        "Shared Runtime Certification Q10-14 certified — stops at Q10-14, exposes Q1101ConsumableContract for Q11-01",
        "This contract is structural-signal-only; Q10-14 never implements Q11-01 or any later mission itself",
      ],
      neverImplementQ1101OrLater: true,
    };
  }

  private rejectedReport(
    input: SrcrtInput,
    config: SharedRuntimeCertificationConfiguration,
    started: number,
  ): SharedRuntimeCertificationReport {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendSrcrtLog({ event: "boundary_reject", details: errors.join(";") });
    const now = new Date().toISOString();
    const emptyMatrix: CertificationResult[] = Q10_RUNTIMES.map((runtime) => ({
      certificationId: `srcrt-cert-${runtime.missionId}`,
      runtimeComponent: runtime.runtimeName,
      missionId: runtime.missionId,
      certificationStatus: "Failed Certification",
      verificationResult: "Rejected before evidence collection due to forbidden boundary input",
      integrationStatus: "unavailable",
      governanceStatus: "non_compliant",
      reportingStatus: "unavailable",
      runtimeHealth: "unknown",
      supportingEvidence: ["not evaluated — request rejected"],
      testResults: "not evaluated — request rejected",
      auditReference: runtime.auditPath,
      certificationTimestamp: now,
    }));
    return buildReport({
      reportId: `srcrt-rejected-${nextReportId()}`,
      repositoryAudit: {
        auditedAt: now,
        runtimesScanned: 0,
        evidenceComplete: 0,
        evidence: [],
      },
      runtimeAudit: {
        auditedAt: now,
        probesAttempted: 0,
        probesReachable: 0,
        probes: [],
        notes: ["Rejected before evidence collection"],
      },
      runtimeInventory: {
        inventoriedAt: now,
        totalRuntimes: 0,
        modulesPresent: 0,
        injectedCount: 0,
        items: [],
      },
      runtimeCertificationMatrix: emptyMatrix,
      integrationSummary: {
        verifiedAt: now,
        rows: [],
        allBound: false,
        evidence: [],
      },
      certificationSummary: {
        computedAt: now,
        totalRuntimes: 0,
        certifiedCount: 0,
        partiallyCertifiedCount: 0,
        failedCount: 0,
        blockedCount: 0,
        deferredCount: 0,
        ready: false,
        notes: ["Rejected before evidence collection"],
        evidence: [],
      },
      governanceResults: {
        compliant: false,
        grandKingApprovalRequired: true,
        pillowCommandRequired: true,
        checks: [],
        missingDocs: [],
        evidence: [],
      },
      monitoringVerification: {
        verified: false,
        monitoringRuntimeInjected: false,
        monitoringRuntimeReachable: false,
        contractExposed: false,
        evidence: ["Rejected before evidence collection"],
      },
      recoveryVerification: {
        verified: false,
        recoveryRuntimeInjected: false,
        recoveryRuntimeReachable: false,
        contractExposed: false,
        evidence: ["Rejected before evidence collection"],
      },
      auditabilityVerification: {
        verified: false,
        auditRuntimeInjected: false,
        auditRuntimeReachable: false,
        contractExposed: false,
        evidence: ["Rejected before evidence collection"],
      },
      reportingVerification: {
        verified: false,
        executiveReportingAvailable: false,
        runtimesWithReportingAccess: 0,
        totalRuntimes: 0,
        evidence: ["Rejected before evidence collection"],
      },
      q1014ContractConsumed: {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Rejected before handshake",
      },
      certificationDecision: "Failed",
      risks: errors,
      outstandingIssues: errors,
      validation,
      workerId: config.workerId,
      consumableByQ1101: false,
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: SharedRuntimeCertificationConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: SharedRuntimeCertificationReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `srcrt-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "shared-runtime-certification",
      engineVersion: "PILLOW-SRCRT-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...SRCRT_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastCertificationDecision: latestReport?.certificationDecision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: SRCRT_METADATA_VERSION,
    };
  }
}
