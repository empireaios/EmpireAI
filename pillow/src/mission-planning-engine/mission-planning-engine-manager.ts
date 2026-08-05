import { GateManager, HealthMonitor, MpengValidator } from "./audit-validator.js";
import {
  AuditStore,
  nextHistoryEntryId,
  nextPlanId,
  nextReportId,
  resetMissionPlanningEngineManagerSequencesForTesting,
} from "./audit-store.js";
import type { MissionPlanningEngineConfiguration } from "./configuration.js";
import {
  analyseApprovedMission,
  buildMissionPlan,
  buildOutstandingIssues,
  buildRiskSummary,
  computeConfidenceScore,
  consumeQ1303Contract,
  determineExecutionSequence,
  estimateImplementationRisks,
  identifyImplementationDependencies,
  identifyIntegrationPoints,
  observeQ1302Contract,
  produceAcceptanceCriteria,
  produceValidationStrategy,
  resolveRepositorySnapshot,
  verifyQ1303Prerequisite,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type MissionPlanningEngineDependencies,
} from "./integrations.js";
import { appendMpengLog } from "./mpeng-logging.js";
import { buildCatalog, buildReport } from "./report-builder.js";
import {
  INTEGRATION_TARGETS,
  MISSION_PLANNING_ENGINE_IDENTITY,
  MPENG_CAPABILITIES,
  MPENG_METADATA_VERSION,
} from "./paths.js";
import type {
  MissionAnalysis,
  MissionPlan,
  MissionPlanningReport,
  MpengInput,
  OperationalState,
  Q1304ConsumableContract,
  PlanningHistoryEntry,
} from "./types.js";

export { resetMissionPlanningEngineManagerSequencesForTesting };

export class MissionPlanningEngineManager {
  private latestAnalysis: MissionAnalysis | null = null;
  private latestPlan: MissionPlan | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new MpengValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private engineRecord: import("./types.js").MpengEngineRecord | null = null;
  private seeded = false;

  bindIntegrations(deps: MissionPlanningEngineDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: MissionPlanningEngineConfiguration) {
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

  getPlans() {
    return this.store.listPlans();
  }

  getLatestReport() {
    return this.store.getLatestReport();
  }

  getLatestPlan() {
    return this.latestPlan ?? this.store.getLatestPlan();
  }

  getCatalog() {
    return buildCatalog(
      MISSION_PLANNING_ENGINE_IDENTITY.workerId,
      this.store.listReports(),
      this.store.listPlans(),
      this.integrations.getHandshakes(),
      this.store.getPlanningHistory().length,
    );
  }

  getPlanningHistory(limit = 100) {
    return this.store.getPlanningHistory(limit);
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  connect(config: MissionPlanningEngineConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendMpengLog({ event: "connect", details: `Mission Planning Engine connected; integrations=${handshakes.length}` });
    return handshakes;
  }

  analyseApprovedMission(input: MpengInput) {
    const analysis = analyseApprovedMission(input);
    this.latestAnalysis = analysis;
    appendMpengLog({ event: "analyse_mission", details: `missionId=${analysis.missionId}` });
    return analysis;
  }

  consumeRepositoryIntelligence() {
    const deps = this.integrations.getDependencies();
    const q1303 = consumeQ1303Contract(deps);
    const snapshot = resolveRepositorySnapshot(deps);
    const report = deps.repositoryIntelligenceEngine?.getLatestReport?.();
    appendMpengLog({ event: "consume_rieng", details: q1303.evidence });
    return {
      q1303ContractConsumed: q1303,
      repositorySnapshot: snapshot,
      riengReportId: report?.reportId ?? null,
      riengConfidence: report?.confidenceScore ?? null,
    };
  }

  identifyImplementationDependencies(input: MpengInput = {}) {
    const analysis = this.latestAnalysis ?? analyseApprovedMission(input);
    const deps = this.integrations.getDependencies();
    return identifyImplementationDependencies(deps, analysis);
  }

  determineExecutionSequence() {
    return determineExecutionSequence();
  }

  identifyIntegrationPoints() {
    return identifyIntegrationPoints(this.integrations.getDependencies());
  }

  produceValidationStrategy(input: MpengInput = {}) {
    const analysis = this.latestAnalysis ?? analyseApprovedMission(input);
    return produceValidationStrategy(analysis);
  }

  produceAcceptanceCriteria(input: MpengInput = {}) {
    const analysis = this.latestAnalysis ?? analyseApprovedMission(input);
    return produceAcceptanceCriteria(analysis);
  }

  estimateImplementationRisks() {
    const deps = this.integrations.getDependencies();
    const prerequisite = verifyQ1303Prerequisite(deps);
    return estimateImplementationRisks(prerequisite, deps);
  }

  generateMissionPlan(input: MpengInput = {}) {
    const analysis = this.latestAnalysis ?? analyseApprovedMission(input);
    const deps = this.integrations.getDependencies();
    const repositorySnapshot = resolveRepositorySnapshot(deps);
    const dependencies = identifyImplementationDependencies(deps, analysis);
    const executionOrder = determineExecutionSequence();
    const integrationPoints = identifyIntegrationPoints(deps);
    const validationStrategy = produceValidationStrategy(analysis);
    const acceptanceCriteria = produceAcceptanceCriteria(analysis);
    const prerequisite = verifyQ1303Prerequisite(deps);
    const risks = estimateImplementationRisks(prerequisite, deps);

    const plan = buildMissionPlan({
      analysis,
      repositorySnapshot,
      dependencies,
      executionOrder,
      integrationPoints,
      validationStrategy,
      acceptanceCriteria,
      risks,
      planId: input.planId ?? nextPlanId(),
    });

    this.latestPlan = plan;
    this.store.savePlan(plan);
    appendMpengLog({ event: "plan_generated", details: plan.planId });
    return plan;
  }

  async produceMissionPlanningReport(
    input: MpengInput = {},
    config: MissionPlanningEngineConfiguration,
    started = Date.now(),
  ): Promise<MissionPlanningReport> {
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const validation = this.validator.validateInput(input, started);
    const deps = this.integrations.getDependencies();
    const analysis = this.latestAnalysis ?? analyseApprovedMission(input);
    const q1303ContractConsumed = consumeQ1303Contract(deps);
    const q1303Prerequisite = verifyQ1303Prerequisite(deps);
    const q1302Observation = observeQ1302Contract(deps);
    const repositorySnapshot = resolveRepositorySnapshot(deps);
    const riengReport = deps.repositoryIntelligenceEngine?.getLatestReport?.();
    const dependencies = identifyImplementationDependencies(deps, analysis);
    const executionPlan = determineExecutionSequence();
    const integrationPoints = identifyIntegrationPoints(deps);
    const validationStrategy = produceValidationStrategy(analysis);
    const acceptanceCriteria = produceAcceptanceCriteria(analysis);
    const risks = estimateImplementationRisks(q1303Prerequisite, deps);
    const plan = this.latestPlan ?? this.generateMissionPlan(input);

    const confidenceScore = computeConfidenceScore(
      q1303Prerequisite,
      validation.decision,
      dependencies.length,
    );

    const outstandingIssues = buildOutstandingIssues(q1303Prerequisite, q1303ContractConsumed);
    const supportingEvidence = [
      ...q1303Prerequisite.evidence,
      q1303ContractConsumed.evidence,
      q1302Observation.evidence,
      "neverModifyRepository=true",
      "neverExecuteImplementation=true",
      "planningOnly=true",
    ];

    const report = buildReport({
      reportId: input.reportId ?? nextReportId(),
      workerId: config.workerId,
      missionSummary: analysis,
      repositorySnapshot,
      riengReportId: riengReport?.reportId ?? null,
      riengConfidence: riengReport?.confidenceScore ?? null,
      dependencyNodeCount: riengReport?.dependencySummary?.nodeCount ?? null,
      dependencies,
      executionPlan,
      integrationPoints,
      validationStrategy,
      acceptanceCriteria,
      risks,
      plans: [plan],
      validation,
      confidenceScore,
      q1303ContractConsumed,
      q1303Prerequisite,
      q1302Observation,
      supportingEvidence,
      outstandingIssues,
      historyRefs: this.store.getPlanningHistory().map((entry) => entry.entryId),
    });

    this.store.saveReport(report);
    this.store.savePlanningHistory(this.buildHistoryEntry(report, plan));
    const healthStatus = this.healthMonitor.evaluate(confidenceScore, validation.decision);
    this.ensureRecord(validation.decision === "failed" ? "failed" : "active", config, healthStatus, report, plan);
    appendMpengLog({ event: "report_produced", details: `${report.reportId} confidence=${confidenceScore}` });
    return report;
  }

  async submitReport(input: MpengInput, config: MissionPlanningEngineConfiguration) {
    const report = await this.produceMissionPlanningReport(input, config);
    const executive = this.integrations.getDependencies().executiveReportingRuntime;
    if (config.executiveReportingEnabled && executive?.submitWorkerReport) {
      executive.submitWorkerReport({
        workerId: config.workerId,
        missionId: "Q13-03",
        reportId: report.reportId,
        reportType: "mission_planning",
        payload: report,
      });
      appendMpengLog({ event: "report_submitted", details: report.reportId });
    }
    return report;
  }

  validate(input: MpengInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: MissionPlanningEngineConfiguration) {
    this.ensureSeeded(config);
    const prerequisite = verifyQ1303Prerequisite(this.integrations.getDependencies());
    return {
      missionId: "Q13-03" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      plans: this.store.planCount(),
      failureCount: this.gateManager.failureCount(),
      q1303PrerequisitePresent: prerequisite.repositoryIntelligenceEnginePresent,
      readinessScore: prerequisite.verified ? 0.8 : 0.45,
      integrations: verifyIntegrations(this.integrations.getDependencies()),
      locks: config,
    };
  }

  getQ1304ConsumableContract(): Q1304ConsumableContract {
    const latest = this.getLatestReport();
    return {
      contractId: `q1304-contract-${MPENG_METADATA_VERSION}`,
      contractVersion: MPENG_METADATA_VERSION,
      producedBy: "mission-planning-engine",
      missionId: "Q13-03",
      consumerMissionId: "Q13-04",
      exposedFields: [
        "missionSummary",
        "repositoryIntelligenceSummary",
        "dependencySummary",
        "executionPlan",
        "integrationSummary",
        "validationStrategy",
        "acceptanceCriteria",
        "riskSummary",
        "plans",
        "confidenceScore",
      ],
      planningCatalog: [
        "mission_analysis",
        "repository_intelligence_consumption",
        "dependency_identification",
        "execution_sequence",
        "integration_points",
        "validation_strategy",
        "acceptance_criteria",
        "risk_estimation",
        "mission_plan",
      ],
      notes: [
        "Mission Planning Engine Q13-03 — exposes Q1304ConsumableContract for Q13-04 without implementing Q13-04",
        "Planning only — never modifies repository or executes implementation",
        "Repository Intelligence Engine provides Q1303 contract via repositoryIntelligenceEngine",
        "Never implements Q13-04 Cursor Specification Generator or later",
      ],
      neverImplementQ1304OrLater: true,
      structuralSignalOnly: true,
      planningPrerequisite: Boolean(latest),
    };
  }

  private buildHistoryEntry(report: MissionPlanningReport, plan: MissionPlan): PlanningHistoryEntry {
    return {
      entryId: nextHistoryEntryId(),
      timestamp: report.timestamp,
      reportId: report.reportId,
      planId: plan.planId,
      missionId: plan.missionId,
      confidenceScore: report.confidenceScore,
      evidence: report.supportingEvidence.slice(0, 5),
    };
  }

  private async rejectedReport(
    input: MpengInput,
    config: MissionPlanningEngineConfiguration,
    started: number,
  ): Promise<MissionPlanningReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("failed", errors, [], started);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendMpengLog({ event: "boundary_reject", details: errors.join(";") });

    const deps = this.integrations.getDependencies();
    const analysis = this.latestAnalysis ?? analyseApprovedMission(input);
    const q1303ContractConsumed = consumeQ1303Contract(deps);
    const q1303Prerequisite = verifyQ1303Prerequisite(deps);
    const q1302Observation = observeQ1302Contract(deps);
    const repositorySnapshot = resolveRepositorySnapshot(deps);
    const dependencies = identifyImplementationDependencies(deps, analysis);
    const risks = estimateImplementationRisks(q1303Prerequisite, deps);

    const report = buildReport({
      reportId: input.reportId ?? nextReportId(),
      workerId: config.workerId,
      missionSummary: analysis,
      repositorySnapshot,
      riengReportId: null,
      riengConfidence: null,
      dependencyNodeCount: null,
      dependencies,
      executionPlan: determineExecutionSequence(),
      integrationPoints: identifyIntegrationPoints(deps),
      validationStrategy: produceValidationStrategy(analysis),
      acceptanceCriteria: produceAcceptanceCriteria(analysis),
      risks,
      plans: [],
      validation,
      confidenceScore: 0.1,
      q1303ContractConsumed,
      q1303Prerequisite,
      q1302Observation,
      supportingEvidence: errors,
      outstandingIssues: [...errors, ...buildOutstandingIssues(q1303Prerequisite, q1303ContractConsumed)],
      historyRefs: [],
    });
    this.store.saveReport(report);
    return report;
  }

  private ensureRecord(
    status: OperationalState,
    config: MissionPlanningEngineConfiguration,
    healthStatus: import("./types.js").EngineHealthStatus = "standby",
    report?: MissionPlanningReport,
    plan?: MissionPlan,
  ) {
    const latestReport = report ?? this.getLatestReport();
    const latestPlan = plan ?? this.getLatestPlan();
    this.engineRecord = {
      engineVersion: "PILLOW-MPENG-001",
      missionId: "Q13-03",
      workerId: config.workerId,
      status,
      healthStatus,
      supportedCapabilities: [...MPENG_CAPABILITIES],
      integrationTargets: [...INTEGRATION_TARGETS],
      totalReports: this.store.reportCount(),
      totalPlans: this.store.planCount(),
      lastReportId: latestReport?.reportId ?? this.engineRecord?.lastReportId ?? null,
      lastPlanId: latestPlan?.planId ?? this.engineRecord?.lastPlanId ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? this.engineRecord?.lastConfidenceScore ?? null,
      connectedAt: this.engineRecord?.connectedAt ?? new Date().toISOString(),
    };
  }
}
