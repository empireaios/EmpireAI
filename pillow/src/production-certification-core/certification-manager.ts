import { existsSync } from "node:fs";
import { join } from "node:path";
import { collectFactoryDiscovery, collectWorkerDiscovery, collectRuntimeDiscovery } from "./evidence-collector.js";
import { evaluateProgramme, type ProgrammeEvaluationContext } from "./component-classifier.js";
import { probeWorker } from "./worker-probe.js";
import { verifyIntegrations as computeIntegrationVerification } from "./integration-verifier.js";
import {
  evaluateGovernanceResults,
  evaluateReportingResults,
  buildFactorySummary,
  buildWorkerSummary,
  buildRuntimeSummary,
  evaluateReadinessSummary,
  buildEvidenceSummary,
} from "./readiness-evaluator.js";
import { evaluateCertificationGates } from "./certification-gates.js";
import { PccrtValidator, HealthMonitor, RecoveryManager } from "./certification-validator.js";
import { CertificationStore, nextReportId } from "./certification-store.js";
import { buildCatalog, buildReport, buildRisksAndFindings } from "./report-builder.js";
import { IntegrationCoordinator, type ProductionCertificationCoreDependencies } from "./integrations.js";
import { appendPccrtLog } from "./pccrt-logging.js";
import { PROGRAMMES } from "./programme-catalog.js";
import { Q10_RUNTIME_IDS } from "./paths.js";
import {
  INTEGRATION_TARGETS,
  PCCRT_CAPABILITIES,
  PCCRT_METADATA_VERSION,
  PRODUCTION_CERTIFICATION_CORE_IDENTITY,
} from "./paths.js";
import type { ProductionCertificationCoreConfiguration } from "./configuration.js";
import type {
  CertificationFindings,
  CertificationResult,
  PccrtEngineRecord,
  PccrtInput,
  ProductionCertificationReport,
  ProgrammeRegistration,
  OperationalState,
  Q1102ConsumableContract,
} from "./types.js";

const FINANCIAL_BRIDGE_PATHS = [
  "backend/src/orchestration/pillow-host/financial-reporting-worker-bridge.ts",
  "backend/src/orchestration/pillow-host/capital-risk-worker-bridge.ts",
  "backend/src/orchestration/pillow-host/investment-planning-worker-bridge.ts",
];

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100) / 100;
}

export class ProductionCertificationCoreManager {
  private repositoryRoot = "";
  private executiveReady = false;
  private executiveBriefingPresent = false;
  private engineRecord: PccrtEngineRecord | null = null;
  private readonly store = new CertificationStore();
  private readonly validator = new PccrtValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  setExecutiveContext(executiveReady: boolean, executiveBriefingPresent: boolean) {
    this.executiveReady = executiveReady;
    this.executiveBriefingPresent = executiveBriefingPresent;
  }

  bindIntegrations(deps: ProductionCertificationCoreDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ProductionCertificationCoreConfiguration) {
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
      PRODUCTION_CERTIFICATION_CORE_IDENTITY.workerId,
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

  connect(config: ProductionCertificationCoreConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendPccrtLog({
      event: "connect",
      details: `Production Certification Core connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  /** Registers the fixed Q11 certification programme catalog. Deterministic. */
  registerProgrammeCatalog(): ProgrammeRegistration[] {
    const now = new Date().toISOString();
    return PROGRAMMES.map((programme) => ({
      programmeId: programme.programmeId,
      programmeName: programme.programmeName,
      componentType: programme.componentType,
      description: programme.description,
      requiredEvidenceRefs: [...programme.requiredEvidenceRefs],
      registeredAt: now,
    }));
  }

  discoverFactories(_config: ProductionCertificationCoreConfiguration) {
    const sharedRuntimeCore = this.integrations.getDependencies().sharedRuntimeCore;
    const listFactories = sharedRuntimeCore?.listFactories?.bind(sharedRuntimeCore);
    return collectFactoryDiscovery(this.repositoryRoot, listFactories);
  }

  discoverWorkers(config: ProductionCertificationCoreConfiguration) {
    const workerRegistry = this.integrations.getDependencies().workerRegistry;
    const listWorkers = workerRegistry?.listWorkers?.bind(workerRegistry);
    return collectWorkerDiscovery(listWorkers, config.seedWorkerCount);
  }

  async discoverRuntimes() {
    const handles = this.integrations.getAllRuntimeHandles();
    const probes = await this.probeRuntimes();
    return collectRuntimeDiscovery(this.repositoryRoot, handles, probes);
  }

  async probeRuntimes() {
    const handles = this.integrations.getAllRuntimeHandles();
    const entries = await Promise.all(
      Q10_RUNTIME_IDS.map(async (runtime) => {
        const probe = await probeWorker(runtime.dependencyKey, handles.get(runtime.missionId));
        return [runtime.missionId, probe] as const;
      }),
    );
    return new Map(entries);
  }

  evaluateGovernance(config: ProductionCertificationCoreConfiguration) {
    return evaluateGovernanceResults(this.repositoryRoot, config);
  }

  evaluateReporting() {
    return evaluateReportingResults(this.integrations.getDependencies());
  }

  verifyIntegrations() {
    return computeIntegrationVerification(this.integrations.getDependencies());
  }

  private countFinancialBridges(): number {
    return FINANCIAL_BRIDGE_PATHS.filter((relativePath) => existsSync(join(this.repositoryRoot, relativePath)))
      .length;
  }

  private async buildEvaluationContext(
    config: ProductionCertificationCoreConfiguration,
  ): Promise<ProgrammeEvaluationContext> {
    const deps = this.integrations.getDependencies();
    const factoryDiscovery = this.discoverFactories(config);
    const workerDiscovery = this.discoverWorkers(config);
    const runtimeDiscovery = await this.discoverRuntimes();
    const governanceResults = this.evaluateGovernance(config);
    const reportingResults = this.evaluateReporting();
    const integrationVerification = this.verifyIntegrations();

    const monitoringProbe = await probeWorker("monitoringRuntime", deps.monitoringRuntime ?? undefined);
    const recoveryHandle = deps.recoveryRuntime ?? deps.workerRecoverySystem ?? undefined;
    const recoveryProbe = deps.recoveryRuntime
      ? await probeWorker("recoveryRuntime", deps.recoveryRuntime)
      : { workerKey: "recoveryRuntime", reachable: false, evidence: "No injected runtime handle" };

    return {
      factoryDiscovery,
      workerDiscovery,
      runtimeDiscovery,
      governanceResults,
      reportingResults,
      integrationVerification,
      monitoringInjected: Boolean(deps.monitoringRuntime),
      monitoringReachable: monitoringProbe.reachable,
      recoveryInjected: Boolean(recoveryHandle),
      recoveryReachable: recoveryProbe.reachable || Boolean(deps.workerRecoverySystem),
      financialBridgesPresent: this.countFinancialBridges(),
      financialBridgesTotal: FINANCIAL_BRIDGE_PATHS.length,
      executiveReady: this.executiveReady,
      executiveBriefingPresent: this.executiveBriefingPresent,
    };
  }

  async aggregateCertificationEvidence(
    config: ProductionCertificationCoreConfiguration,
  ): Promise<CertificationResult[]> {
    const ctx = await this.buildEvaluationContext(config);
    const now = new Date().toISOString();
    const rows: CertificationResult[] = [];

    for (const programme of PROGRAMMES) {
      const classification = evaluateProgramme(programme.programmeId, ctx);
      rows.push({
        certificationId: `pccrt-cert-programme-${programme.programmeId}`,
        programmeId: programme.programmeId,
        componentId: programme.programmeId,
        componentType: programme.programmeId === "custom_extension" ? "custom_extension" : "programme",
        certificationStatus: classification.status,
        readinessScore: classification.readinessScore,
        evidenceReferences: [...programme.requiredEvidenceRefs],
        validationResults: [classification.reason],
        failedChecks: classification.failedChecks,
        passedChecks: classification.passedChecks,
        outstandingIssues: classification.failedChecks,
        auditReference: `programme:${programme.programmeId}`,
        certificationTimestamp: now,
      });
    }

    for (const factory of ctx.factoryDiscovery.factories) {
      const discovered = factory.injected || factory.repositoryEvidence;
      rows.push({
        certificationId: `pccrt-cert-factory-${factory.factoryKey}`,
        programmeId: "factory_certification",
        componentId: factory.factoryKey,
        componentType: "factory",
        certificationStatus: discovered ? "Discovered" : "Pending",
        readinessScore: discovered ? 1 : 0,
        evidenceReferences: [factory.evidence],
        validationResults: [factory.evidence],
        failedChecks: discovered ? [] : ["not discovered"],
        passedChecks: discovered ? ["discovered"] : [],
        outstandingIssues: discovered ? [] : [`${factory.factoryKey} not discovered`],
        auditReference: `factory:${factory.factoryKey}`,
        certificationTimestamp: now,
      });
    }

    for (const worker of ctx.workerDiscovery.workers) {
      rows.push({
        certificationId: `pccrt-cert-worker-${worker.workerId}`,
        programmeId: "workforce_certification",
        componentId: worker.workerId,
        componentType: "worker",
        certificationStatus: "Discovered",
        readinessScore: 1,
        evidenceReferences: [worker.evidence],
        validationResults: [worker.evidence],
        failedChecks: [],
        passedChecks: ["discovered"],
        outstandingIssues: [],
        auditReference: `worker:${worker.workerId}`,
        certificationTimestamp: now,
      });
    }

    for (const runtime of ctx.runtimeDiscovery.runtimes) {
      const discovered = runtime.injected || runtime.repositoryEvidence;
      const status = !discovered ? "Pending" : runtime.reachable ? "Certified" : "Discovered";
      rows.push({
        certificationId: `pccrt-cert-runtime-${runtime.missionId}`,
        programmeId: "runtime_certification",
        componentId: runtime.missionId,
        componentType: "runtime",
        certificationStatus: status,
        readinessScore: !discovered ? 0 : runtime.reachable ? 1 : 0.75,
        evidenceReferences: [runtime.evidence],
        validationResults: [runtime.evidence],
        failedChecks: discovered ? [] : ["not discovered"],
        passedChecks: discovered ? ["discovered"] : [],
        outstandingIssues: discovered ? [] : [`${runtime.missionId} not discovered`],
        auditReference: `runtime:${runtime.missionId}`,
        certificationTimestamp: now,
      });
    }

    rows.push({
      certificationId: "pccrt-cert-governance-self",
      programmeId: "governance_certification",
      componentId: "self",
      componentType: "governance",
      certificationStatus: ctx.governanceResults.compliant ? "Certified" : "Failed Certification",
      readinessScore: ctx.governanceResults.compliant ? 1 : 0,
      evidenceReferences: ctx.governanceResults.evidence,
      validationResults: ctx.governanceResults.evidence,
      failedChecks: ctx.governanceResults.compliant ? [] : ["governance evidence incomplete"],
      passedChecks: ctx.governanceResults.compliant ? ["governance compliant"] : [],
      outstandingIssues: ctx.governanceResults.compliant ? [] : ["governance evidence incomplete"],
      auditReference: "governance:self",
      certificationTimestamp: now,
    });

    rows.push({
      certificationId: "pccrt-cert-reporting-executive",
      programmeId: "reporting_certification",
      componentId: "executive_reporting_runtime",
      componentType: "reporting",
      certificationStatus: ctx.reportingResults.verified ? "Certified" : "Pending",
      readinessScore: ctx.reportingResults.verified ? 1 : 0,
      evidenceReferences: ctx.reportingResults.evidence,
      validationResults: ctx.reportingResults.evidence,
      failedChecks: ctx.reportingResults.verified ? [] : ["executiveReportingRuntime not injected"],
      passedChecks: ctx.reportingResults.verified ? ["executiveReportingRuntime injected"] : [],
      outstandingIssues: ctx.reportingResults.verified ? [] : ["executive reporting not verified"],
      auditReference: "reporting:executive_reporting_runtime",
      certificationTimestamp: now,
    });

    const integrationStatus = ctx.integrationVerification.allBound
      ? "Certified"
      : ctx.integrationVerification.boundCount > 0
        ? "Partially Certified"
        : "Pending";
    rows.push({
      certificationId: "pccrt-cert-integration-overall",
      programmeId: "integration_certification",
      componentId: "integration_targets",
      componentType: "integration",
      certificationStatus: integrationStatus,
      readinessScore: ratio(ctx.integrationVerification.boundCount, ctx.integrationVerification.totalTargets),
      evidenceReferences: ctx.integrationVerification.evidence,
      validationResults: ctx.integrationVerification.evidence,
      failedChecks: ctx.integrationVerification.rows.filter((r) => !r.bound).map((r) => r.target),
      passedChecks: ctx.integrationVerification.rows.filter((r) => r.bound).map((r) => r.target),
      outstandingIssues: ctx.integrationVerification.allBound
        ? []
        : [`${ctx.integrationVerification.totalTargets - ctx.integrationVerification.boundCount} integration targets unbound`],
      auditReference: "integration:targets",
      certificationTimestamp: now,
    });

    return rows;
  }

  async produceCertificationFindings(
    input: PccrtInput,
    config: ProductionCertificationCoreConfiguration,
  ): Promise<CertificationFindings> {
    const matrix = await this.aggregateCertificationEvidence(config);
    const readinessSummary = evaluateReadinessSummary(matrix);
    const governanceResults = this.evaluateGovernance(config);
    const reportingResults = this.evaluateReporting();
    const integrationVerification = this.verifyIntegrations();
    const q1101 = this.integrations.attemptQ1101ContractHandshake();

    const certificationDecision = evaluateCertificationGates({
      matrix,
      readinessSummary,
      governanceResults,
      integrationsAllBound: integrationVerification.allBound,
      q1101Consumed: q1101.consumed,
      q1101Attempted: q1101.attempted,
      input,
    });

    const { risks, outstandingIssues } = buildRisksAndFindings(
      matrix,
      governanceResults,
      reportingResults,
      integrationVerification,
      readinessSummary,
    );

    return {
      certificationDecision,
      certificationResults: matrix,
      risks,
      outstandingIssues,
      confidenceScore: readinessSummary.overallReadinessScore,
    };
  }

  async produceReport(
    input: PccrtInput,
    config: ProductionCertificationCoreConfiguration,
  ): Promise<ProductionCertificationReport> {
    const started = Date.now();
    this.ensureSeeded(config);

    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const matrix = await this.aggregateCertificationEvidence(config);
    const readinessSummary = evaluateReadinessSummary(matrix);
    const governanceResults = this.evaluateGovernance(config);
    const reportingResults = this.evaluateReporting();
    const integrationVerification = this.verifyIntegrations();
    const q1101ContractConsumed = this.integrations.attemptQ1101ContractHandshake();

    const factoryDiscovery = this.discoverFactories(config);
    const workerDiscovery = this.discoverWorkers(config);
    const runtimeDiscovery = await this.discoverRuntimes();

    const certificationDecision = evaluateCertificationGates({
      matrix,
      readinessSummary,
      governanceResults,
      integrationsAllBound: integrationVerification.allBound,
      q1101Consumed: q1101ContractConsumed.consumed,
      q1101Attempted: q1101ContractConsumed.attempted,
      input,
    });

    const { risks, outstandingIssues } = buildRisksAndFindings(
      matrix,
      governanceResults,
      reportingResults,
      integrationVerification,
      readinessSummary,
    );

    const validation = this.validator.validateInput({ ...input, validated: input.validated ?? true }, started);

    const report = buildReport({
      reportId: input.reportId,
      certificationScope: this.registerProgrammeCatalog(),
      factorySummary: buildFactorySummary(factoryDiscovery),
      workerSummary: buildWorkerSummary(workerDiscovery),
      runtimeSummary: buildRuntimeSummary(runtimeDiscovery),
      governanceResults,
      reportingResults,
      integrationVerification,
      readinessSummary,
      evidenceSummary: buildEvidenceSummary(matrix),
      certificationResults: matrix,
      q1101ContractConsumed,
      certificationDecision,
      risks,
      outstandingIssues,
      validation,
      workerId: config.workerId,
      consumableByQ1102: true,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendPccrtLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.certificationDecision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  async submitReport(
    input: PccrtInput,
    config: ProductionCertificationCoreConfiguration,
  ): Promise<ProductionCertificationReport> {
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
    const updated: ProductionCertificationReport = {
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

  validate(input: PccrtInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: ProductionCertificationCoreConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q11-01" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.recovery.failureCount(),
      locks: config,
    };
  }

  getCertificationResults() {
    return this.store.getLatestReport()?.certificationResults ?? [];
  }

  getQ1102ConsumableContract(): Q1102ConsumableContract {
    return {
      contractId: `q1102-contract-${PCCRT_METADATA_VERSION}`,
      contractVersion: PCCRT_METADATA_VERSION,
      producedBy: "production-certification-core",
      missionId: "Q11-01",
      consumerMissionId: "Q11-02",
      exposedFields: [
        "certificationResults",
        "readinessSummary",
        "certificationDecision",
        "programmeInventory",
        "failedItems",
        "outstandingRisks",
        "confidenceScore",
      ],
      programmeCatalog: PROGRAMMES.map((p) => p.programmeId),
      certificationStatusCatalog: [
        "Certified",
        "Partially Certified",
        "Failed Certification",
        "Blocked",
        "Deferred",
        "Registered",
        "Discovered",
        "Pending",
      ],
      certificationDecisionCatalog: [
        "Certified",
        "Conditionally_Certified",
        "Not_Certified",
        "Failed",
        "Deferred",
      ],
      notes: [
        "Production Certification Core Q11-01 certified — stops at Q11-01, exposes Q1102ConsumableContract for Q11-02 (Worker Readiness Audit)",
        "This contract is structural-signal-only; Q11-01 never implements Q11-02 or any later mission itself",
      ],
      neverImplementQ1102OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private rejectedReport(
    input: PccrtInput,
    config: ProductionCertificationCoreConfiguration,
    started: number,
  ): ProductionCertificationReport {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendPccrtLog({ event: "boundary_reject", details: errors.join(";") });
    const now = new Date().toISOString();
    const emptyMatrix: CertificationResult[] = PROGRAMMES.map((programme) => ({
      certificationId: `pccrt-cert-programme-${programme.programmeId}`,
      programmeId: programme.programmeId,
      componentId: programme.programmeId,
      componentType: programme.programmeId === "custom_extension" ? "custom_extension" : "programme",
      certificationStatus: "Failed Certification",
      readinessScore: 0,
      evidenceReferences: [],
      validationResults: ["Rejected before evidence collection due to forbidden boundary input"],
      failedChecks: ["rejected before evaluation"],
      passedChecks: [],
      outstandingIssues: ["rejected before evaluation"],
      auditReference: `programme:${programme.programmeId}`,
      certificationTimestamp: now,
    }));
    return buildReport({
      reportId: `pccrt-rejected-${nextReportId()}`,
      certificationScope: this.registerProgrammeCatalog(),
      factorySummary: { totalCatalog: 0, discoveredCount: 0, evidence: [] },
      workerSummary: { discoveredCount: 0, registryInjected: false, evidence: [] },
      runtimeSummary: { totalCatalog: 0, discoveredCount: 0, evidence: [] },
      governanceResults: {
        compliant: false,
        grandKingApprovalRequired: true,
        pillowCommandRequired: true,
        selfDocPresent: false,
        selfDocPath: "",
        boundaryLocksHonoured: false,
        evidence: [],
      },
      reportingResults: { verified: false, executiveReportingAvailable: false, evidence: [] },
      integrationVerification: { verifiedAt: now, rows: [], totalTargets: 0, boundCount: 0, allBound: false, evidence: [] },
      readinessSummary: {
        computedAt: now,
        totalItems: 0,
        certifiedCount: 0,
        partiallyCertifiedCount: 0,
        failedCount: 0,
        blockedCount: 0,
        deferredCount: 0,
        registeredCount: 0,
        discoveredCount: 0,
        pendingCount: 0,
        overallReadinessScore: 0,
        ready: false,
        notes: ["Rejected before evidence collection"],
        evidence: [],
      },
      evidenceSummary: { totalRows: 0, byComponentType: {}, evidence: [] },
      certificationResults: emptyMatrix,
      q1101ContractConsumed: {
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
      consumableByQ1102: false,
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: ProductionCertificationCoreConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: ProductionCertificationReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `pccrt-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "production-certification-core",
      engineVersion: "PILLOW-PCCRT-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...PCCRT_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastCertificationDecision: latestReport?.certificationDecision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: PCCRT_METADATA_VERSION,
    };
  }
}
