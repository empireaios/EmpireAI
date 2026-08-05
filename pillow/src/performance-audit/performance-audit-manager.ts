import { collectPerformanceComponentDiscovery } from "./performance-discovery.js";
import {
  executeWorkloadBenchmarkForComponent,
  executeWorkloadBenchmarks,
  measureResourceUtilisation,
  measureResponseTimes,
  measureScalability,
  measureThroughput,
  verifySustainedStability,
} from "./benchmark-runner.js";
import { buildBenchmarkResult, resetBenchmarkSequenceForTesting } from "./performance-classifier.js";
import { verifyIntegrations as computeIntegrationVerification } from "./integration-verifier.js";
import {
  buildResourceUtilisationSummary,
  buildSustainedStabilitySummary,
  detectBottlenecks,
  evaluateApiPerformanceSummary,
  evaluateBenchmarkSummary,
  evaluateFactoryPerformanceSummary,
  evaluateGovernanceSummary,
  evaluatePerformanceReadinessSummary,
  evaluateQueuePerformanceSummary,
  evaluateRuntimePerformanceSummary,
  evaluateWorkerPerformanceSummary,
} from "./performance-evaluator.js";
import { evaluatePerformanceReadinessGates } from "./performance-gates.js";
import { PerfartValidator, HealthMonitor, RecoveryManager } from "./audit-validator.js";
import { AuditStore, nextReportId } from "./audit-store.js";
import { buildCatalog, buildOutstandingIssues, buildReport } from "./report-builder.js";
import { IntegrationCoordinator, type PerformanceAuditDependencies } from "./integrations.js";
import { appendPerfartLog } from "./perfart-logging.js";
import {
  INTEGRATION_TARGETS,
  PERFART_CAPABILITIES,
  PERFART_METADATA_VERSION,
  PERFORMANCE_AUDIT_IDENTITY,
  PERFORMANCE_COMPONENT_KEYS,
} from "./paths.js";
import type { PerformanceAuditConfiguration } from "./configuration.js";
import type {
  BenchmarkResult,
  OperationalState,
  PerfartEngineRecord,
  PerfartInput,
  PerformanceAuditReport,
  Q1107ConsumableContract,
} from "./types.js";

export class PerformanceAuditManager {
  private repositoryRoot = "";
  private engineRecord: PerfartEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new PerfartValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: PerformanceAuditDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: PerformanceAuditConfiguration) {
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
      PERFORMANCE_AUDIT_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
    );
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  /** Preserves immutable benchmark history across every produced report. */
  getBenchmarkHistory(limit = 100) {
    return this.store.getBenchmarkHistory(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  connect(config: PerformanceAuditConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendPerfartLog({
      event: "connect",
      details: `Performance Audit connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  /** Discovers every performance benchmark target strictly from injected handles. Never invents components. */
  discoverPerformanceComponents(_config: PerformanceAuditConfiguration) {
    return collectPerformanceComponentDiscovery(this.integrations.getDependencies());
  }

  /** Executes ONE real timed structural probe per catalogued component — never fabricated. */
  executeWorkloadBenchmarks(_config: PerformanceAuditConfiguration) {
    return executeWorkloadBenchmarks(this.integrations.getDependencies());
  }

  measureResponseTimes(_config: PerformanceAuditConfiguration) {
    return measureResponseTimes(this.integrations.getDependencies());
  }

  async measureThroughput(config: PerformanceAuditConfiguration) {
    return measureThroughput(this.integrations.getDependencies(), config);
  }

  async measureResourceUtilisation(_config: PerformanceAuditConfiguration) {
    return measureResourceUtilisation(this.integrations.getDependencies());
  }

  async measureScalability(config: PerformanceAuditConfiguration) {
    return measureScalability(this.integrations.getDependencies(), config);
  }

  verifySustainedStability(config: PerformanceAuditConfiguration) {
    return verifySustainedStability(this.integrations.getDependencies(), config);
  }

  /** Builds the deterministic per-component Benchmark Result matrix from measured evidence only. */
  async buildAssessments(config: PerformanceAuditConfiguration): Promise<BenchmarkResult[]> {
    const deps = this.integrations.getDependencies();
    const [throughputRows, resource] = await Promise.all([
      measureThroughput(deps, config),
      measureResourceUtilisation(deps),
    ]);
    return PERFORMANCE_COMPONENT_KEYS.map((componentKey) => {
      const evidence = executeWorkloadBenchmarkForComponent(componentKey, deps);
      const throughputRow = throughputRows.find((r) => r.componentId === componentKey);
      return buildBenchmarkResult(evidence, config, {
        testScenario: `${componentKey}: structural workload benchmark via ${evidence.probeMethod}()`,
        throughput: evidence.bound ? throughputRow?.throughput ?? null : null,
        latency: evidence.responseTime,
        cpuUsage: evidence.bound ? resource.cpuUserMs : null,
        memoryUsage: evidence.bound ? resource.heapUsedMb : null,
        extraEvidence: [
          throughputRow ? throughputRow.evidence : null,
          evidence.bound
            ? "cpuUsage/memoryUsage reflect a process-level structural signal measured once per audit run (Node does not expose reliable per-call attribution); never a fabricated per-component estimate"
            : null,
        ].filter((n): n is string => !!n),
      });
    });
  }

  verifyIntegrations() {
    return computeIntegrationVerification(this.integrations.getDependencies());
  }

  /** Deterministic bottleneck detection from a freshly measured benchmark matrix — never inferred without evidence. */
  async detectBottlenecks(config: PerformanceAuditConfiguration) {
    const matrix = await this.buildAssessments(config);
    return detectBottlenecks(matrix, config);
  }

  async producePerformanceReadinessFindings(input: PerfartInput, config: PerformanceAuditConfiguration) {
    const matrix = await this.buildAssessments(config);
    const performanceReadinessSummary = evaluatePerformanceReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, this.integrations.getDependencies());
    const integrationVerification = this.verifyIntegrations();
    const q1106 = this.integrations.attemptQ1106ContractHandshake();

    const decision = evaluatePerformanceReadinessGates({
      matrix,
      performanceReadinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1106Consumed: q1106.consumed,
      q1106Attempted: q1106.attempted,
      input,
    });

    const bottleneckSummary = detectBottlenecks(matrix, config);
    const outstandingIssues = buildOutstandingIssues(matrix, governanceSummary, integrationVerification, performanceReadinessSummary, bottleneckSummary);

    return {
      decision,
      assessments: matrix,
      bottleneckSummary,
      outstandingIssues,
      confidenceScore: performanceReadinessSummary.overallReadinessScore,
    };
  }

  async produceReport(input: PerfartInput, config: PerformanceAuditConfiguration): Promise<PerformanceAuditReport> {
    const started = Date.now();
    this.ensureSeeded(config);

    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const discovery = this.discoverPerformanceComponents(config);
    const matrix = await this.buildAssessments(config);
    const performanceReadinessSummary = evaluatePerformanceReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, this.integrations.getDependencies());
    const benchmarkSummary = evaluateBenchmarkSummary(matrix);
    const workerPerformanceSummary = evaluateWorkerPerformanceSummary(matrix);
    const factoryPerformanceSummary = evaluateFactoryPerformanceSummary(matrix);
    const runtimePerformanceSummary = evaluateRuntimePerformanceSummary(matrix);
    const apiPerformanceSummary = evaluateApiPerformanceSummary(matrix);
    const queuePerformanceSummary = evaluateQueuePerformanceSummary(matrix);
    const bottleneckSummary = detectBottlenecks(matrix, config);
    const resourceRaw = await measureResourceUtilisation(this.integrations.getDependencies());
    const resourceUtilisationSummary = buildResourceUtilisationSummary(resourceRaw, matrix);
    const stabilityRows = verifySustainedStability(this.integrations.getDependencies(), config);
    const sustainedStabilitySummary = buildSustainedStabilitySummary(stabilityRows, config.stabilityProbeRepeats);
    const integrationVerification = this.verifyIntegrations();
    const q1106ContractConsumed = this.integrations.attemptQ1106ContractHandshake();

    const decision = evaluatePerformanceReadinessGates({
      matrix,
      performanceReadinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1106Consumed: q1106ContractConsumed.consumed,
      q1106Attempted: q1106ContractConsumed.attempted,
      input,
    });

    const outstandingIssues = buildOutstandingIssues(matrix, governanceSummary, integrationVerification, performanceReadinessSummary, bottleneckSummary);
    const validation = this.validator.validateInput({ ...input, validated: input.validated ?? true }, started);

    const report = buildReport({
      reportId: input.reportId,
      componentInventory: discovery.components,
      assessments: matrix,
      governanceSummary,
      benchmarkSummary,
      workerPerformanceSummary,
      factoryPerformanceSummary,
      runtimePerformanceSummary,
      apiPerformanceSummary,
      queuePerformanceSummary,
      bottleneckSummary,
      resourceUtilisationSummary,
      sustainedStabilitySummary,
      integrationVerification,
      performanceReadinessSummary,
      q1106ContractConsumed,
      decision,
      outstandingIssues,
      validation,
      workerId: config.workerId,
      consumableByQ1107: true,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendPerfartLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.decision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  async submitReport(input: PerfartInput, config: PerformanceAuditConfiguration): Promise<PerformanceAuditReport> {
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
    const updated: PerformanceAuditReport = {
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

  validate(input: PerfartInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: PerformanceAuditConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q11-06" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.recovery.failureCount(),
      locks: config,
    };
  }

  getPerformanceMatrix() {
    return this.store.getLatestReport()?.assessments ?? [];
  }

  getQ1107ConsumableContract(): Q1107ConsumableContract {
    return {
      contractId: `q1107-contract-${PERFART_METADATA_VERSION}`,
      contractVersion: PERFART_METADATA_VERSION,
      producedBy: "performance-audit",
      missionId: "Q11-06",
      consumerMissionId: "Q11-07",
      exposedFields: [
        "assessments",
        "performanceReadinessSummary",
        "decision",
        "componentInventory",
        "bottleneckSummary",
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
        "Performance Audit Q11-06 certified — stops at Q11-06, exposes Q1107ConsumableContract for Q11-07 (Recovery Audit)",
        "This contract is structural-signal-only; Q11-06 never implements Q11-07 or any later mission itself",
      ],
      neverImplementQ1107OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private async rejectedReport(
    input: PerfartInput,
    config: PerformanceAuditConfiguration,
    started: number,
  ): Promise<PerformanceAuditReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendPerfartLog({ event: "boundary_reject", details: errors.join(";") });
    const now = new Date().toISOString();
    const emptySegmentSummary = (segment: "worker" | "factory" | "runtime" | "api" | "queue") => ({
      segment,
      passedCount: 0,
      partialCount: 0,
      failedCount: 0,
      missingCount: 0,
      totalComponents: 0,
      evidence: [] as string[],
    });
    return buildReport({
      reportId: `perfart-rejected-${nextReportId()}`,
      componentInventory: [],
      assessments: [],
      governanceSummary: {
        compliant: false,
        grandKingApprovalRequired: true,
        performanceAuditRequired: true,
        selfDocPresent: false,
        selfDocPath: "",
        boundaryLocksHonoured: false,
        requiredComponentsBoundCount: 0,
        totalRequiredComponents: 0,
        evidence: [],
      },
      benchmarkSummary: {
        totalBenchmarks: 0,
        passedCount: 0,
        partialCount: 0,
        failedCount: 0,
        missingCount: 0,
        averageResponseTimeMs: null,
        averageThroughput: null,
        averageErrorRate: 0,
        evidence: [],
      },
      workerPerformanceSummary: emptySegmentSummary("worker"),
      factoryPerformanceSummary: emptySegmentSummary("factory"),
      runtimePerformanceSummary: emptySegmentSummary("runtime"),
      apiPerformanceSummary: emptySegmentSummary("api"),
      queuePerformanceSummary: emptySegmentSummary("queue"),
      bottleneckSummary: { computedAt: now, totalBottlenecks: 0, rows: [], evidence: [] },
      resourceUtilisationSummary: {
        computedAt: now,
        heapUsedMb: 0,
        heapTotalMb: 0,
        rssMb: 0,
        cpuUserMs: null,
        cpuSystemMs: null,
        rows: [],
        evidence: ["Rejected before resource measurement"],
      },
      sustainedStabilitySummary: {
        computedAt: now,
        repeats: 0,
        rows: [],
        overallStabilityStatus: "Missing",
        evidence: ["Rejected before stability probing"],
      },
      integrationVerification: { verifiedAt: now, rows: [], totalTargets: 0, boundCount: 0, allBound: false, evidence: [] },
      performanceReadinessSummary: {
        computedAt: now,
        totalComponents: 0,
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
      q1106ContractConsumed: {
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
      consumableByQ1107: false,
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: PerformanceAuditConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: PerformanceAuditReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `perfart-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "performance-audit",
      engineVersion: "PILLOW-PERFART-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...PERFART_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastDecision: latestReport?.decision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: PERFART_METADATA_VERSION,
    };
  }
}

export function resetPerformanceAuditManagerSequencesForTesting() {
  resetBenchmarkSequenceForTesting();
}
