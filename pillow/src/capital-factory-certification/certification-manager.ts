import { collectRepositoryEvidence } from "./evidence-collector.js";
import { classifyComponent, classifyMissionDeferred } from "./component-classifier.js";
import { probeWorker } from "./worker-probe.js";
import { verifyIntegrations as computeIntegrationVerification } from "./integration-verifier.js";
import {
  buildRepositoryAudit,
  buildRuntimeAudit,
  buildWorkerInventory,
  evaluateProductionReadiness,
  evaluateGovernanceResults,
  evaluateFinancialTraceability,
  evaluateExecutiveReporting,
  evaluateEndToEndWorkflow,
} from "./readiness-evaluator.js";
import { evaluateCertificationGates } from "./certification-gates.js";
import { CapcrtValidator, HealthMonitor, RecoveryManager } from "./certification-validator.js";
import { CertificationStore, nextReportId } from "./certification-store.js";
import { buildCatalog, buildReport, buildRisksAndFindings } from "./report-builder.js";
import {
  IntegrationCoordinator,
  type CapitalFactoryCertificationDependencies,
} from "./integrations.js";
import { appendCapcrtLog } from "./capcrt-logging.js";
import { Q9_MISSIONS } from "./mission-catalog.js";
import {
  INTEGRATION_TARGETS,
  CAPCRT_CAPABILITIES,
  CAPCRT_METADATA_VERSION,
  CAPITAL_FACTORY_CERTIFICATION_IDENTITY,
} from "./paths.js";
import type { CapitalFactoryCertificationConfiguration } from "./configuration.js";
import type {
  CertificationFindings,
  WorkerCertificationRow,
  CapcrtEngineRecord,
  CapcrtInput,
  CapitalCertificationReport,
  MissionEvidence,
  WorkerProbeResult,
  OperationalState,
} from "./types.js";

export class CapitalFactoryCertificationManager {
  private repositoryRoot = "";
  private engineRecord: CapcrtEngineRecord | null = null;
  private readonly store = new CertificationStore();
  private readonly validator = new CapcrtValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: CapitalFactoryCertificationDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: CapitalFactoryCertificationConfiguration) {
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
      CAPITAL_FACTORY_CERTIFICATION_IDENTITY.workerId,
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

  connect(config: CapitalFactoryCertificationConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendCapcrtLog({
      event: "connect",
      details: `Capital Factory Certification connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  collectEvidence(): Map<string, MissionEvidence> {
    return collectRepositoryEvidence(this.repositoryRoot);
  }

  async probeWorkers(): Promise<Map<string, WorkerProbeResult>> {
    const handles = this.integrations.getAllWorkerHandles();
    const entries = await Promise.all(
      Q9_MISSIONS.map(async (mission) => {
        const probe = await probeWorker(mission.dependencyKey, handles.get(mission.missionId));
        return [mission.missionId, probe] as const;
      }),
    );
    return new Map(entries);
  }

  async auditQ9Workers(input: CapcrtInput = {}): Promise<WorkerCertificationRow[]> {
    const evidence = this.collectEvidence();
    const probes = await this.probeWorkers();
    return Q9_MISSIONS.map((mission): WorkerCertificationRow => {
      const missionEvidence = evidence.get(mission.missionId)!;
      const probe = probes.get(mission.missionId)!;
      const deferred =
        missionEvidence.deferred || classifyMissionDeferred(mission, input.deferredMissionIds);
      const classification = classifyComponent(missionEvidence, probe, deferred);
      return {
        missionId: mission.missionId,
        missionName: mission.missionName,
        subsystemId: mission.subsystemId,
        engineVersion: mission.engineVersion,
        modulePath: mission.modulePath,
        expectedDeliverable: mission.expectedDeliverable,
        status: classification.status,
        reason: classification.reason,
        engineEvidence: `engine.ts ${missionEvidence.engineExists ? "found" : "missing"} at ${mission.enginePath}`,
        configEvidence: `config ${missionEvidence.configExists ? "present" : "missing"} at ${mission.configPath}`,
        governanceEvidence: `governance ${missionEvidence.governanceExists ? "present" : "missing"} at ${mission.governancePath}`,
        bridgeEvidence: `bridge ${missionEvidence.bridgeExists ? "present" : "missing"} at ${mission.bridgePath}`,
        testEvidence: `test ${missionEvidence.testExists ? "present" : "missing"} at ${mission.testPath}`,
        sessionEvidence: `session.ts reference ${missionEvidence.sessionReferenced ? "observed" : "not observed"}`,
        registryEvidence: `subsystem registry reference ${missionEvidence.registryReferenced ? "observed" : "not observed"}`,
        runtimeEvidence: probe.evidence,
        q911ContractEvidence:
          mission.missionId === "Q9-10"
            ? `Q911ConsumableContract ${missionEvidence.q911ContractPresent ? "observed" : "not observed"}`
            : "not applicable",
      };
    });
  }

  async verifyIntegrations() {
    const probes = await this.probeWorkers();
    return computeIntegrationVerification(this.repositoryRoot, probes);
  }

  async verifyProductionReadiness(input: CapcrtInput = {}) {
    const evidence = this.collectEvidence();
    const matrix = await this.auditQ9Workers(input);
    return evaluateProductionReadiness(evidence, matrix);
  }

  verifyGovernanceCompliance() {
    const evidence = this.collectEvidence();
    return evaluateGovernanceResults(this.repositoryRoot, evidence);
  }

  async verifyOperationalReadiness() {
    const probes = await this.probeWorkers();
    const values = [...probes.values()];
    return {
      ready: values.length > 0 && values.every((p) => p.reachable),
      reachableCount: values.filter((p) => p.reachable).length,
      totalCount: values.length,
      probes: values,
    };
  }

  async runEndToEndWorkflow(input: CapcrtInput = {}) {
    const matrix = await this.auditQ9Workers(input);
    const integration = await this.verifyIntegrations();
    const financialTraceability = evaluateFinancialTraceability(
      { financialTraceabilityRequired: true, currencyPrecisionRequired: true } as CapitalFactoryCertificationConfiguration,
      this.collectEvidence(),
      matrix,
    );
    const executiveReporting = evaluateExecutiveReporting(
      await this.probeWorkers(),
      this.integrations.getAllWorkerHandles(),
      Boolean(this.integrations.getDependencies().executiveReportingRuntime),
    );
    return evaluateEndToEndWorkflow(
      matrix,
      integration,
      { currencyPrecisionRequired: true, financialTraceabilityRequired: true } as CapitalFactoryCertificationConfiguration,
      financialTraceability,
      executiveReporting,
      input.pillowCommandConfirmed !== false,
      input.grandKingApproved !== false,
    );
  }

  async produceCertificationFindings(input: CapcrtInput = {}): Promise<CertificationFindings> {
    const matrix = await this.auditQ9Workers(input);
    const integration = await this.verifyIntegrations();
    const productionReadiness = await this.verifyProductionReadiness(input);
    const governanceResults = this.verifyGovernanceCompliance();
    const workflowResults = await this.runEndToEndWorkflow(input);

    const certificationDecision = evaluateCertificationGates({
      matrix,
      integrationsAllBound: integration.allBound,
      productionReadiness,
      governanceResults,
      workflowResults,
      input,
      factoryDeferred: false,
    });

    const { risks, openIssues } = buildRisksAndFindings(
      matrix,
      integration,
      productionReadiness,
      governanceResults,
      workflowResults,
    );

    return {
      certificationDecision,
      workerCertificationMatrix: matrix,
      risks,
      openIssues,
      confidenceScore: matrix.filter((r) => r.status === "Certified").length / matrix.length,
    };
  }

  async produceReport(
    input: CapcrtInput,
    config: CapitalFactoryCertificationConfiguration,
  ): Promise<CapitalCertificationReport> {
    const started = Date.now();
    this.ensureSeeded(config);

    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const evidence = this.collectEvidence();
    const probes = await this.probeWorkers();
    const matrix = await this.auditQ9Workers(input);
    const integration = await this.verifyIntegrations();
    const repositoryAudit = buildRepositoryAudit(evidence);
    const runtimeAudit = buildRuntimeAudit(probes);
    const workerInventory = buildWorkerInventory(evidence, this.integrations.getInjectedDependencyKeys());
    const productionReadiness = evaluateProductionReadiness(evidence, matrix);
    const governanceResults = evaluateGovernanceResults(this.repositoryRoot, evidence);
    const financialTraceability = evaluateFinancialTraceability(config, evidence, matrix);
    const executiveReporting = evaluateExecutiveReporting(
      probes,
      this.integrations.getAllWorkerHandles(),
      Boolean(this.integrations.getDependencies().executiveReportingRuntime),
    );
    const endToEndWorkflowResults = evaluateEndToEndWorkflow(
      matrix,
      integration,
      config,
      financialTraceability,
      executiveReporting,
      input.pillowCommandConfirmed !== false,
      input.grandKingApproved !== false,
    );
    const q911ContractConsumed = this.integrations.attemptQ911ContractHandshake();

    const certificationDecision = evaluateCertificationGates({
      matrix,
      integrationsAllBound: integration.allBound,
      productionReadiness,
      governanceResults,
      workflowResults: endToEndWorkflowResults,
      input,
      factoryDeferred: false,
    });

    const { risks, openIssues } = buildRisksAndFindings(
      matrix,
      integration,
      productionReadiness,
      governanceResults,
      endToEndWorkflowResults,
    );

    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );

    const report = buildReport({
      reportId: input.reportId,
      factoryName: input.factoryName?.trim() || "Capital Factory",
      repositoryAudit,
      runtimeAudit,
      workerInventory,
      workerCertificationMatrix: matrix,
      integrationResults: integration,
      endToEndWorkflowResults,
      executiveReportingResults: executiveReporting,
      governanceResults,
      financialTraceabilityResults: financialTraceability,
      productionReadinessAssessment: productionReadiness,
      q911ContractConsumed,
      certificationDecision,
      risks,
      openIssues,
      validation,
      workerId: config.workerId,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendCapcrtLog({
      event: "produce_report",
      details: `report=${saved.certificationId} decision=${saved.certificationDecision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  async submitReport(
    input: CapcrtInput,
    config: CapitalFactoryCertificationConfiguration,
  ): Promise<CapitalCertificationReport> {
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
    const updated: CapitalCertificationReport = {
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

  validate(input: CapcrtInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: CapitalFactoryCertificationConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q9-11" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.recovery.failureCount(),
      locks: config,
    };
  }

  getWorkerCertificationMatrix() {
    return this.store.getLatestReport()?.workerCertificationMatrix ?? [];
  }

  private rejectedReport(
    input: CapcrtInput,
    config: CapitalFactoryCertificationConfiguration,
    started: number,
  ): CapitalCertificationReport {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendCapcrtLog({ event: "boundary_reject", details: errors.join(";") });
    const emptyMatrix = Q9_MISSIONS.map((mission) => ({
      missionId: mission.missionId,
      missionName: mission.missionName,
      subsystemId: mission.subsystemId,
      engineVersion: mission.engineVersion,
      modulePath: mission.modulePath,
      expectedDeliverable: mission.expectedDeliverable,
      status: "Failed Certification" as const,
      reason: "Rejected before evidence collection due to forbidden boundary input",
      engineEvidence: "not evaluated — request rejected",
      configEvidence: "not evaluated — request rejected",
      governanceEvidence: "not evaluated — request rejected",
      bridgeEvidence: "not evaluated — request rejected",
      testEvidence: "not evaluated — request rejected",
      sessionEvidence: "not evaluated — request rejected",
      registryEvidence: "not evaluated — request rejected",
      runtimeEvidence: "not evaluated — request rejected",
      q911ContractEvidence: "not evaluated — request rejected",
    }));
    return buildReport({
      reportId: `capcrt-rejected-${nextReportId()}`,
      factoryName: input.factoryName?.trim() || "Capital Factory",
      repositoryAudit: {
        auditedAt: new Date().toISOString(),
        missionsScanned: 0,
        evidenceComplete: 0,
        evidence: [],
      },
      runtimeAudit: {
        auditedAt: new Date().toISOString(),
        probesAttempted: 0,
        probesReachable: 0,
        probes: [],
        notes: ["Rejected before evidence collection"],
      },
      workerInventory: {
        inventoriedAt: new Date().toISOString(),
        totalWorkers: 0,
        modulesPresent: 0,
        injectedCount: 0,
        items: [],
      },
      workerCertificationMatrix: emptyMatrix,
      integrationResults: {
        verifiedAt: new Date().toISOString(),
        rows: [],
        allBound: false,
        evidence: [],
      },
      endToEndWorkflowResults: {
        evaluatedAt: new Date().toISOString(),
        complete: false,
        currencyPrecisionVerified: false,
        traceabilityVerified: false,
        stages: [],
        evidence: [],
      },
      executiveReportingResults: {
        capable: false,
        executiveReportingAvailable: false,
        workersWithReportingAccess: 0,
        totalWorkers: 0,
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
      financialTraceabilityResults: {
        traceable: false,
        currencyPrecisionEnforced: false,
        auditHistoryPreserved: false,
        notes: ["Rejected before evidence collection"],
        evidence: [],
      },
      productionReadinessAssessment: {
        ready: false,
        modulesPresent: 0,
        modulesTotal: 0,
        certifiedWorkers: 0,
        certifiedWorkersTotal: 0,
        notes: ["Rejected before evidence collection"],
        evidence: [],
      },
      q911ContractConsumed: {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Rejected before handshake",
      },
      certificationDecision: "Failed",
      risks: errors,
      openIssues: errors,
      validation,
      workerId: config.workerId,
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: CapitalFactoryCertificationConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: CapitalCertificationReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `capcrt-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "capital-factory-certification",
      engineVersion: "PILLOW-CAPCRT-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...CAPCRT_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.certificationId ?? this.store.getLatestReportId(),
      lastCertificationDecision: latestReport?.certificationDecision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: CAPCRT_METADATA_VERSION,
    };
  }
}
