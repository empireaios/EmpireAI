import { collectFactoryDiscovery } from "./factory-discovery.js";
import { collectWorkerDiscovery } from "./evidence-collector.js";
import {
  assessFactory,
  classifyBusinessFactoryReadiness,
  classifyExternalIntegration,
  classifyGovernance,
  classifyOperationalReadiness,
  classifyRegistration,
  classifyRuntimeIntegration,
  classifyWorkerCoverage,
  probeWorkflowDispatch,
} from "./factory-classifier.js";
import { verifyIntegrations as computeIntegrationVerification } from "./integration-verifier.js";
import {
  evaluateFactoryReadinessSummary,
  evaluateGovernanceSummary,
  evaluateRuntimeSummary,
  evaluateWorkflowSummary,
} from "./factory-evaluator.js";
import { evaluateBusinessFactoryReadinessGates } from "./factory-gates.js";
import { BfartValidator, HealthMonitor, RecoveryManager } from "./audit-validator.js";
import { AuditStore, nextReportId } from "./audit-store.js";
import { buildCatalog, buildOutstandingIssues, buildReport } from "./report-builder.js";
import { IntegrationCoordinator, type BusinessFactoryAuditDependencies } from "./integrations.js";
import { appendBfartLog } from "./bfart-logging.js";
import {
  BFART_CAPABILITIES,
  BFART_METADATA_VERSION,
  BUSINESS_FACTORY_AUDIT_IDENTITY,
  DEDICATED_CORE_FACTORY_KEYS,
  FACTORY_KEYS,
  INTEGRATION_TARGETS,
  WORKFORCE_FACTORY_KEYS,
} from "./paths.js";
import type { BusinessFactoryAuditConfiguration } from "./configuration.js";
import type {
  BfartEngineRecord,
  BfartInput,
  BusinessFactoryAssessment,
  BusinessFactoryAuditReport,
  DiscoveredFactoryRecord,
  GovernanceCheckRow,
  OperationalCheckRow,
  OperationalState,
  Q1105ConsumableContract,
  RegistrationCheckRow,
  RegisteredWorkerRecord,
  RuntimeCheckRow,
  WorkerCheckRow,
  WorkflowCheckRow,
} from "./types.js";

function titleizeFactoryKey(factoryKey: string): string {
  return factoryKey
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isDedicatedCoreFactory(factoryKey: string): boolean {
  return (DEDICATED_CORE_FACTORY_KEYS as readonly string[]).includes(factoryKey);
}

function isWorkforceFactory(factoryKey: string): boolean {
  return (WORKFORCE_FACTORY_KEYS as readonly string[]).includes(factoryKey);
}

function getDedicatedCoreHandle(
  factoryKey: string,
  deps: BusinessFactoryAuditDependencies,
): object | null {
  switch (factoryKey) {
    case "empire-builder-factory":
      return deps.empireBuilderFactoryCore ?? null;
    case "commerce-factory":
      return deps.commerceFactoryCore ?? null;
    case "media-factory":
      return deps.mediaFactoryCore ?? null;
    case "digital-products-factory":
      return deps.digitalProductsFactoryCore ?? null;
    case "enterprise-platform-factory":
      return deps.enterprisePlatformFactoryCore ?? null;
    case "local-business-factory":
      return deps.localBusinessFactoryCore ?? null;
    case "affiliate-factory":
      return deps.affiliateFactoryCore ?? null;
    case "capital-factory":
      return deps.capitalFactoryCore ?? null;
    default:
      return null;
  }
}

export class BusinessFactoryAuditManager {
  private repositoryRoot = "";
  private engineRecord: BfartEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new BfartValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: BusinessFactoryAuditDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: BusinessFactoryAuditConfiguration) {
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
      BUSINESS_FACTORY_AUDIT_IDENTITY.workerId,
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

  connect(config: BusinessFactoryAuditConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendBfartLog({
      event: "connect",
      details: `Business Factory Audit connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  /** Discovers every business factory strictly from the injected Shared Runtime Core. Never invents factories. */
  discoverFactories(_config: BusinessFactoryAuditConfiguration) {
    const sharedRuntimeCore = this.integrations.getDependencies().sharedRuntimeCore;
    return collectFactoryDiscovery(sharedRuntimeCore);
  }

  /** Discovers every registered worker strictly from the injected Worker Registry. Never invents workers. */
  discoverWorkers(_config: BusinessFactoryAuditConfiguration) {
    const workerRegistry = this.integrations.getDependencies().workerRegistry;
    const listWorkers = workerRegistry?.listWorkers?.bind(workerRegistry);
    return collectWorkerDiscovery(listWorkers);
  }

  private workersForFactory(factoryKey: string, workers: RegisteredWorkerRecord[]): RegisteredWorkerRecord[] {
    return workers.filter((w) => w.factory === factoryKey);
  }

  private catalogFactoryIds(discovered: DiscoveredFactoryRecord[]): string[] {
    const discoveredIds = discovered.map((f) => f.factoryKey);
    return Array.from(new Set([...FACTORY_KEYS.filter((k) => discoveredIds.includes(k)), ...discoveredIds]));
  }

  verifyRegistration(config: BusinessFactoryAuditConfiguration): RegistrationCheckRow[] {
    const discovery = this.discoverFactories(config);
    const workerDiscovery = this.discoverWorkers(config);
    const deps = this.integrations.getDependencies();
    return this.catalogFactoryIds(discovery.factories).map((factoryKey) => {
      const record = discovery.factories.find((f) => f.factoryKey === factoryKey);
      const dedicated = isDedicatedCoreFactory(factoryKey);
      const workforce = isWorkforceFactory(factoryKey);
      const coreBound = !!getDedicatedCoreHandle(factoryKey, deps);
      const workforcePresent =
        !!deps.workerRegistry && this.workersForFactory(factoryKey, workerDiscovery.workers).length > 0;
      const registrationStatus = classifyRegistration(!!record, dedicated, coreBound, workforce, workforcePresent);
      return {
        factoryId: factoryKey,
        factoryName: record?.factoryName ?? titleizeFactoryKey(factoryKey),
        registrationStatus,
        evidence: [
          `discovered=${!!record}`,
          dedicated ? `dedicatedCoreBound=${coreBound}` : workforce ? `workforcePresent=${workforcePresent}` : "no dedicated core required",
        ],
      };
    });
  }

  verifyWorkers(config: BusinessFactoryAuditConfiguration): WorkerCheckRow[] {
    const discovery = this.discoverFactories(config);
    const workerDiscovery = this.discoverWorkers(config);
    return this.catalogFactoryIds(discovery.factories).map((factoryKey) => {
      const record = discovery.factories.find((f) => f.factoryKey === factoryKey);
      const factoryWorkers = this.workersForFactory(factoryKey, workerDiscovery.workers);
      return {
        factoryId: factoryKey,
        factoryName: record?.factoryName ?? titleizeFactoryKey(factoryKey),
        workerCount: factoryWorkers.length,
        workerStatus: classifyWorkerCoverage(factoryWorkers.length),
        evidence: [`workerCount=${factoryWorkers.length}`, `registryInjected=${workerDiscovery.registryInjected}`],
      };
    });
  }

  /** Structural, presence-only workflow-dispatch verification per discovered factory. Never invokes invokeWorker. */
  verifyWorkflows(config: BusinessFactoryAuditConfiguration): WorkflowCheckRow[] {
    const discovery = this.discoverFactories(config);
    const orchestration = this.integrations.getDependencies().pillowOrchestrationRuntime;
    return this.catalogFactoryIds(discovery.factories).map((factoryKey) => {
      const record = discovery.factories.find((f) => f.factoryKey === factoryKey);
      const probe = probeWorkflowDispatch(factoryKey, orchestration);
      return {
        factoryId: factoryKey,
        factoryName: record?.factoryName ?? titleizeFactoryKey(factoryKey),
        workflowStatus: probe.workflowStatus,
        evidence: [probe.evidence],
      };
    });
  }

  verifyRuntimeIntegration(config: BusinessFactoryAuditConfiguration): RuntimeCheckRow[] {
    const discovery = this.discoverFactories(config);
    const sharedRuntimeCoreBound = !!this.integrations.getDependencies().sharedRuntimeCore;
    return this.catalogFactoryIds(discovery.factories).map((factoryKey) => {
      const record = discovery.factories.find((f) => f.factoryKey === factoryKey);
      return {
        factoryId: factoryKey,
        factoryName: record?.factoryName ?? titleizeFactoryKey(factoryKey),
        runtimeStatus: classifyRuntimeIntegration(record?.healthStatus ?? null, sharedRuntimeCoreBound),
        evidence: [
          `healthStatus=${record?.healthStatus ?? "(missing)"}`,
          `sharedRuntimeCoreBound=${sharedRuntimeCoreBound}`,
        ],
      };
    });
  }

  /** External integrations: shared operational infrastructure a certified factory depends on. */
  verifyExternalIntegrations(config: BusinessFactoryAuditConfiguration) {
    const discovery = this.discoverFactories(config);
    const deps = this.integrations.getDependencies();
    const productionCertificationBound = !!deps.productionCertificationCore;
    const monitoringBound = !!deps.monitoringRuntime;
    const auditBound = !!deps.auditRuntime;
    const integrationStatus = classifyExternalIntegration(productionCertificationBound, monitoringBound, auditBound);
    return this.catalogFactoryIds(discovery.factories).map((factoryKey) => {
      const record = discovery.factories.find((f) => f.factoryKey === factoryKey);
      return {
        factoryId: factoryKey,
        factoryName: record?.factoryName ?? titleizeFactoryKey(factoryKey),
        integrationStatus,
        evidence: [
          `productionCertificationCoreBound=${productionCertificationBound}`,
          `monitoringRuntimeBound=${monitoringBound}`,
          `auditRuntimeBound=${auditBound}`,
        ],
      };
    });
  }

  verifyGovernance(config: BusinessFactoryAuditConfiguration) {
    const discovery = this.discoverFactories(config);
    const workerDiscovery = this.discoverWorkers(config);
    const pillowCommandAuditBound = !!this.integrations.getDependencies().pillowCommandAudit;
    const rows: GovernanceCheckRow[] = this.catalogFactoryIds(discovery.factories).map((factoryKey) => {
      const record = discovery.factories.find((f) => f.factoryKey === factoryKey);
      const factoryWorkers = this.workersForFactory(factoryKey, workerDiscovery.workers);
      return {
        factoryId: factoryKey,
        factoryName: record?.factoryName ?? titleizeFactoryKey(factoryKey),
        governanceStatus: classifyGovernance(pillowCommandAuditBound, factoryWorkers),
        evidence: [
          `pillowCommandAuditBound=${pillowCommandAuditBound}`,
          `assignedWorkerCount=${factoryWorkers.length}`,
        ],
      };
    });
    const assessments = this.buildAssessments(config);
    const summary = evaluateGovernanceSummary(this.repositoryRoot, config, assessments);
    return { rows, summary };
  }

  verifyOperationalReadiness(config: BusinessFactoryAuditConfiguration): OperationalCheckRow[] {
    const discovery = this.discoverFactories(config);
    return this.catalogFactoryIds(discovery.factories).map((factoryKey) => {
      const record = discovery.factories.find((f) => f.factoryKey === factoryKey);
      return {
        factoryId: factoryKey,
        factoryName: record?.factoryName ?? titleizeFactoryKey(factoryKey),
        operationalStatus: classifyOperationalReadiness(record),
        evidence: [
          `healthStatus=${record?.healthStatus ?? "(missing)"}`,
          `evidencePresent=${record?.evidencePresent ?? false}`,
        ],
      };
    });
  }

  verifyIntegrations() {
    return computeIntegrationVerification(this.integrations.getDependencies());
  }

  /** Builds the deterministic per-factory Business Factory Assessment matrix from evidence only. */
  buildAssessments(config: BusinessFactoryAuditConfiguration): BusinessFactoryAssessment[] {
    const discovery = this.discoverFactories(config);
    const workerDiscovery = this.discoverWorkers(config);
    const deps = this.integrations.getDependencies();
    const sharedRuntimeCoreBound = !!deps.sharedRuntimeCore;
    const pillowCommandAuditBound = !!deps.pillowCommandAudit;
    const productionCertificationBound = !!deps.productionCertificationCore;
    const monitoringBound = !!deps.monitoringRuntime;
    const auditBound = !!deps.auditRuntime;
    const integrationStatus = classifyExternalIntegration(productionCertificationBound, monitoringBound, auditBound);

    return this.catalogFactoryIds(discovery.factories).map((factoryKey) => {
      const record = discovery.factories.find((f) => f.factoryKey === factoryKey);
      const factoryName = record?.factoryName ?? titleizeFactoryKey(factoryKey);
      const dedicated = isDedicatedCoreFactory(factoryKey);
      const workforce = isWorkforceFactory(factoryKey);
      const coreBound = !!getDedicatedCoreHandle(factoryKey, deps);
      const factoryWorkers = this.workersForFactory(factoryKey, workerDiscovery.workers);
      const workforcePresent = !!deps.workerRegistry && factoryWorkers.length > 0;

      const registrationStatus = classifyRegistration(!!record, dedicated, coreBound, workforce, workforcePresent);
      const workerStatus = classifyWorkerCoverage(factoryWorkers.length);
      const workflow = probeWorkflowDispatch(factoryKey, deps.pillowOrchestrationRuntime);
      const runtimeStatus = classifyRuntimeIntegration(record?.healthStatus ?? null, sharedRuntimeCoreBound);
      const governanceStatus = classifyGovernance(pillowCommandAuditBound, factoryWorkers);
      const operationalStatus = classifyOperationalReadiness(record);

      const statuses = {
        registrationStatus,
        workerStatus,
        workflowStatus: workflow.workflowStatus,
        runtimeStatus,
        integrationStatus,
        governanceStatus,
        operationalStatus,
      };
      const readinessClassification = classifyBusinessFactoryReadiness(statuses);

      const evidenceNotes = [
        `registrationStatus=${registrationStatus} (discovered=${!!record}, dedicated=${dedicated}, workforce=${workforce})`,
        `workerStatus=${workerStatus} (workerCount=${factoryWorkers.length})`,
        `workflowStatus=${workflow.workflowStatus} (${workflow.evidence})`,
        `runtimeStatus=${runtimeStatus} (healthStatus=${record?.healthStatus ?? "(missing)"}, sharedRuntimeCoreBound=${sharedRuntimeCoreBound})`,
        `integrationStatus=${integrationStatus} (productionCertificationCoreBound=${productionCertificationBound}, monitoringRuntimeBound=${monitoringBound}, auditRuntimeBound=${auditBound})`,
        `governanceStatus=${governanceStatus} (pillowCommandAuditBound=${pillowCommandAuditBound})`,
        `operationalStatus=${operationalStatus}`,
      ];

      return assessFactory(
        factoryKey,
        factoryName,
        statuses,
        readinessClassification,
        `factory:${factoryKey}`,
        evidenceNotes,
      );
    });
  }

  produceBusinessFactoryReadinessFindings(input: BfartInput, config: BusinessFactoryAuditConfiguration) {
    const matrix = this.buildAssessments(config);
    const factoryReadinessSummary = evaluateFactoryReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, matrix);
    const integrationVerification = this.verifyIntegrations();
    const q1104 = this.integrations.attemptQ1104ContractHandshake();

    const decision = evaluateBusinessFactoryReadinessGates({
      matrix,
      factoryReadinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1104Consumed: q1104.consumed,
      q1104Attempted: q1104.attempted,
      input,
    });

    const outstandingIssues = buildOutstandingIssues(matrix, governanceSummary, integrationVerification, factoryReadinessSummary);

    return {
      decision,
      assessments: matrix,
      outstandingIssues,
      confidenceScore: factoryReadinessSummary.overallReadinessScore,
    };
  }

  produceReport(input: BfartInput, config: BusinessFactoryAuditConfiguration): BusinessFactoryAuditReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const discovery = this.discoverFactories(config);
    const matrix = this.buildAssessments(config);
    const factoryReadinessSummary = evaluateFactoryReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, matrix);
    const workflowSummary = evaluateWorkflowSummary(matrix);
    const runtimeSummary = evaluateRuntimeSummary(this.integrations.getDependencies(), matrix);
    const integrationVerification = this.verifyIntegrations();
    const q1104ContractConsumed = this.integrations.attemptQ1104ContractHandshake();

    const decision = evaluateBusinessFactoryReadinessGates({
      matrix,
      factoryReadinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1104Consumed: q1104ContractConsumed.consumed,
      q1104Attempted: q1104ContractConsumed.attempted,
      input,
    });

    const outstandingIssues = buildOutstandingIssues(matrix, governanceSummary, integrationVerification, factoryReadinessSummary);
    const validation = this.validator.validateInput({ ...input, validated: input.validated ?? true }, started);

    const report = buildReport({
      reportId: input.reportId,
      factoryInventory: discovery.factories,
      assessments: matrix,
      governanceSummary,
      workflowSummary,
      runtimeSummary,
      integrationVerification,
      factoryReadinessSummary,
      q1104ContractConsumed,
      decision,
      outstandingIssues,
      validation,
      workerId: config.workerId,
      consumableByQ1105: true,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendBfartLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.decision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  submitReport(input: BfartInput, config: BusinessFactoryAuditConfiguration): BusinessFactoryAuditReport {
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
    const updated: BusinessFactoryAuditReport = {
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

  validate(input: BfartInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: BusinessFactoryAuditConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q11-04" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.recovery.failureCount(),
      locks: config,
    };
  }

  getBusinessFactoryMatrix() {
    return this.store.getLatestReport()?.assessments ?? [];
  }

  getQ1105ConsumableContract(): Q1105ConsumableContract {
    return {
      contractId: `q1105-contract-${BFART_METADATA_VERSION}`,
      contractVersion: BFART_METADATA_VERSION,
      producedBy: "business-factory-audit",
      missionId: "Q11-04",
      consumerMissionId: "Q11-05",
      exposedFields: [
        "assessments",
        "factoryReadinessSummary",
        "decision",
        "factoryInventory",
        "outstandingIssues",
        "confidenceScore",
      ],
      readinessClassificationCatalog: [
        "certified",
        "partially_certified",
        "failed",
        "missing",
        "blocked",
        "deferred",
      ],
      decisionCatalog: ["certify", "withhold", "escalate", "defer"],
      notes: [
        "Business Factory Audit Q11-04 certified — stops at Q11-04, exposes Q1105ConsumableContract for Q11-05 (Security Audit)",
        "This contract is structural-signal-only; Q11-04 never implements Q11-05 or any later mission itself",
      ],
      neverImplementQ1105OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private rejectedReport(
    input: BfartInput,
    config: BusinessFactoryAuditConfiguration,
    started: number,
  ): BusinessFactoryAuditReport {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendBfartLog({ event: "boundary_reject", details: errors.join(";") });
    const now = new Date().toISOString();
    return buildReport({
      reportId: `bfart-rejected-${nextReportId()}`,
      factoryInventory: [],
      assessments: [],
      governanceSummary: {
        compliant: false,
        grandKingApprovalRequired: true,
        businessFactoryAuditRequired: true,
        selfDocPresent: false,
        selfDocPath: "",
        boundaryLocksHonoured: false,
        governedFactoryCount: 0,
        totalFactories: 0,
        evidence: [],
      },
      workflowSummary: { workflowReadyFactoryCount: 0, totalFactories: 0, evidence: [] },
      runtimeSummary: { runtimeIntegratedFactoryCount: 0, totalFactories: 0, sharedRuntimeCoreBound: false, evidence: [] },
      integrationVerification: { verifiedAt: now, rows: [], totalTargets: 0, boundCount: 0, allBound: false, evidence: [] },
      factoryReadinessSummary: {
        computedAt: now,
        totalFactories: 0,
        certifiedCount: 0,
        partiallyCertifiedCount: 0,
        failedCount: 0,
        missingCount: 0,
        blockedCount: 0,
        deferredCount: 0,
        overallReadinessScore: 0,
        allCertified: false,
        notes: ["Rejected before evidence collection"],
        evidence: [],
      },
      q1104ContractConsumed: {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Rejected before handshake",
      },
      decision: "escalate",
      outstandingIssues: errors,
      validation,
      workerId: config.workerId,
      consumableByQ1105: false,
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: BusinessFactoryAuditConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: BusinessFactoryAuditReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `bfart-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "business-factory-audit",
      engineVersion: "PILLOW-BFART-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...BFART_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastDecision: latestReport?.decision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: BFART_METADATA_VERSION,
    };
  }
}
