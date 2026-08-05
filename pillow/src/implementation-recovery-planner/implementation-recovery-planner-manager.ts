import { GateManager, HealthMonitor, IrplnValidator } from "./audit-validator.js";
import {
  AuditStore,
  nextHistoryEntryId,
  nextReportId,
  resetImplementationRecoveryPlannerManagerSequencesForTesting,
} from "./audit-store.js";
import type { ImplementationRecoveryPlannerConfiguration } from "./configuration.js";
import {
  analyseCurrentRepositoryState,
  buildOutstandingIssues,
  compareAgainstApprovedSpecification,
  computeConfidenceScore,
  consumeQ1305Contract,
  detectCompletedWork,
  detectConflictingImplementation,
  detectInterruptedOrIncompleteMission,
  detectMissingImplementation,
  detectPartialWork,
  generateRecoveryPlan,
  generateRecoverySpecification,
  generateRecoveryStrategy,
  resolveApprovedMissionSpecification,
  validateBoundaries,
  validateGovernance,
  verifyRecoveryPrerequisite,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type ImplementationRecoveryPlannerDependencies,
} from "./integrations.js";
import { appendIrplnLog } from "./irpln-logging.js";
import { buildCatalog, buildReport } from "./report-builder.js";
import {
  IRPLN_CAPABILITIES,
  IRPLN_METADATA_VERSION,
  IMPLEMENTATION_RECOVERY_PLANNER_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  ComponentFinding,
  InterruptedMissionInput,
  IrplnInput,
  OperationalState,
  Q1306ConsumableContract,
  RecoveryHistoryEntry,
  RecoveryPlan,
  RecoverySpecification,
  RecoveryStrategy,
  RepositorySnapshot,
} from "./types.js";

export { resetImplementationRecoveryPlannerManagerSequencesForTesting };

export class ImplementationRecoveryPlannerManager {
  private latestMission: InterruptedMissionInput | null = null;
  private latestSnapshot: RepositorySnapshot | null = null;
  private latestComparison: {
    completed: ComponentFinding[];
    partial: ComponentFinding[];
    missing: ComponentFinding[];
    conflicts: ComponentFinding[];
  } | null = null;
  private latestStrategy: RecoveryStrategy | null = null;
  private latestPlan: RecoveryPlan | null = null;
  private latestRecoverySpecification: RecoverySpecification | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new IrplnValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private engineRecord: import("./types.js").IrplnEngineRecord | null = null;
  private seeded = false;

  bindIntegrations(deps: ImplementationRecoveryPlannerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ImplementationRecoveryPlannerConfiguration) {
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

  getLatestRecoverySpecification() {
    return this.latestRecoverySpecification ?? this.store.getLatestRecoverySpecification();
  }

  getCatalog() {
    return buildCatalog(
      IMPLEMENTATION_RECOVERY_PLANNER_IDENTITY.workerId,
      this.store.listReports(),
      this.store.listPlans(),
      this.integrations.getHandshakes(),
      this.store.getRecoveryHistory().length,
    );
  }

  getRecoveryHistory(limit = 100) {
    return this.store.getRecoveryHistory(limit);
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  connect(config: ImplementationRecoveryPlannerConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendIrplnLog({ event: "connect", details: `Implementation Recovery Planner connected; integrations=${handshakes.length}` });
    return handshakes;
  }

  detectInterruptedOrIncompleteMission(input: IrplnInput) {
    const mission = detectInterruptedOrIncompleteMission(input);
    this.latestMission = mission;
    appendIrplnLog({ event: "detect_interrupted", details: `missionId=${mission.missionId};classification=${mission.classification}` });
    return mission;
  }

  analyseCurrentRepositoryState(input: IrplnInput, config: ImplementationRecoveryPlannerConfiguration) {
    const deps = this.integrations.getDependencies();
    const approved = resolveApprovedMissionSpecification(deps, input);
    const snapshot = analyseCurrentRepositoryState(config.repositoryRoot, approved.expectedPaths, deps);
    this.latestSnapshot = snapshot;
    appendIrplnLog({ event: "analyse_repository", details: `paths=${snapshot.pathFindings.length};readOnly=true` });
    return snapshot;
  }

  compareAgainstApprovedSpecification(input: IrplnInput) {
    const deps = this.integrations.getDependencies();
    const approved = resolveApprovedMissionSpecification(deps, input);
    const snapshot = this.latestSnapshot;
    if (!snapshot) {
      throw new Error("Repository not analysed — call analyseCurrentRepositoryState first");
    }
    const comparison = compareAgainstApprovedSpecification(approved, snapshot);
    this.latestComparison = comparison;
    appendIrplnLog({ event: "compare_specification", details: `completed=${comparison.completed.length};missing=${comparison.missing.length}` });
    return comparison;
  }

  detectCompletedWork() {
    const comparison = this.requireComparison();
    return detectCompletedWork(comparison);
  }

  detectPartialWork() {
    const comparison = this.requireComparison();
    return detectPartialWork(comparison);
  }

  detectMissingImplementation() {
    const comparison = this.requireComparison();
    return detectMissingImplementation(comparison);
  }

  detectConflictingImplementation() {
    const comparison = this.requireComparison();
    return detectConflictingImplementation(comparison);
  }

  generateRecoveryStrategy() {
    const comparison = this.requireComparison();
    const strategy = generateRecoveryStrategy(
      comparison.completed,
      comparison.partial,
      comparison.missing,
      comparison.conflicts,
    );
    this.latestStrategy = strategy;
    appendIrplnLog({ event: "generate_strategy", details: `preserve=${strategy.preserveCompleted.length};create=${strategy.createMissing.length}` });
    return strategy;
  }

  generateRecoveryPlan(input: IrplnInput = {}) {
    const deps = this.integrations.getDependencies();
    const mission = this.latestMission ?? detectInterruptedOrIncompleteMission(input);
    const approved = resolveApprovedMissionSpecification(deps, input);
    const snapshot = this.latestSnapshot;
    const comparison = this.latestComparison;
    const strategy = this.latestStrategy;
    if (!snapshot || !comparison || !strategy) {
      appendIrplnLog({ event: "plan_withheld", details: "missing snapshot/comparison/strategy" });
      return null;
    }
    const plan = generateRecoveryPlan({
      recoveryId: input.recoveryId,
      mission,
      approved,
      snapshot,
      comparison,
      strategy,
    });
    this.latestPlan = plan;
    this.store.savePlan(plan);
    appendIrplnLog({ event: "plan_generated", details: plan.recoveryId });
    return plan;
  }

  generateRecoverySpecification(input: IrplnInput = {}) {
    const mission = this.latestMission ?? detectInterruptedOrIncompleteMission(input);
    const plan = this.latestPlan ?? this.generateRecoveryPlan(input);
    if (!plan) return null;
    const spec = generateRecoverySpecification(plan, mission);
    this.latestRecoverySpecification = spec;
    this.store.saveRecoverySpecification(spec);
    appendIrplnLog({ event: "rspec_generated", details: spec.recoverySpecificationId });
    return spec;
  }

  async produceRecoveryReport(
    input: IrplnInput = {},
    config: ImplementationRecoveryPlannerConfiguration,
    started = Date.now(),
  ) {
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const validation = this.validator.validateInput(input, started);
    const deps = this.integrations.getDependencies();
    const mission = this.latestMission ?? detectInterruptedOrIncompleteMission(input);
    const q1305ContractConsumed = consumeQ1305Contract(deps);

    if (!this.latestSnapshot) {
      this.analyseCurrentRepositoryState(input, config);
    }
    if (!this.latestComparison) {
      this.compareAgainstApprovedSpecification(input);
    }
    if (!this.latestStrategy) {
      this.generateRecoveryStrategy();
    }

    const snapshot = this.latestSnapshot!;
    const comparison = this.latestComparison!;
    const recoveryPrerequisite = verifyRecoveryPrerequisite(deps, input, mission, snapshot);

    const plan =
      recoveryPrerequisite.verified && validation.decision !== "failed"
        ? this.generateRecoveryPlan(input)
        : null;

    const recoverySpec = plan ? this.generateRecoverySpecification(input) : null;
    const strategy = this.latestStrategy!;

    const boundaryValidation = validateBoundaries();
    const governanceValidation = validateGovernance(deps);
    const confidenceScore = computeConfidenceScore(recoveryPrerequisite, validation.decision, plan);
    const outstandingIssues = buildOutstandingIssues(recoveryPrerequisite, q1305ContractConsumed, plan);

    const supportingEvidence = [
      ...recoveryPrerequisite.evidence,
      q1305ContractConsumed.evidence,
      "neverExecuteRecovery=true",
      "neverModifyRepository=true",
      "recoveryPlanningOnly=true",
    ];

    const report = buildReport({
      reportId: input.reportId ?? nextReportId(),
      workerId: config.workerId,
      mission,
      repositorySnapshot: snapshot,
      completed: comparison.completed,
      partial: comparison.partial,
      missing: comparison.missing,
      conflicts: comparison.conflicts,
      recoveryStrategy: strategy.principles,
      validationStrategy: plan?.validationPlan ?? ["Repository analysis required before planning"],
      acceptanceCriteria: plan?.acceptanceCriteria ?? [],
      riskSummary: plan?.risks ?? outstandingIssues,
      plans: plan ? [plan] : [],
      recoverySpecifications: recoverySpec ? [recoverySpec] : [],
      boundaryValidation,
      governanceValidation,
      validation,
      confidenceScore,
      q1305ContractConsumed,
      recoveryPrerequisite,
      supportingEvidence,
      historyRefs: this.store.getRecoveryHistory().map((entry) => entry.entryId),
    });

    if (outstandingIssues.length > 0 && !report.supportingEvidence.includes("outstandingIssues")) {
      report.supportingEvidence.push(...outstandingIssues.slice(0, 3));
    }

    this.store.saveReport(report);
    if (plan) {
      this.store.saveRecoveryHistory(this.buildHistoryEntry(report, plan));
    }
    const healthStatus = this.healthMonitor.evaluate(confidenceScore, validation.decision);
    this.ensureRecord(validation.decision === "failed" ? "failed" : "active", config, healthStatus, report, plan);
    appendIrplnLog({ event: "report_produced", details: `${report.reportId} confidence=${confidenceScore}` });
    return report;
  }

  async submitReport(input: IrplnInput, config: ImplementationRecoveryPlannerConfiguration) {
    const report = await this.produceRecoveryReport(input, config);
    const executive = this.integrations.getDependencies().executiveReportingRuntime;
    if (config.executiveReportingEnabled && executive?.submitWorkerReport) {
      executive.submitWorkerReport({
        workerId: config.workerId,
        missionId: "Q13-05",
        reportId: report.reportId,
        reportType: "implementation_recovery",
        payload: report,
      });
      appendIrplnLog({ event: "report_submitted", details: report.reportId });
    }
    return report;
  }

  validate(input: IrplnInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: ImplementationRecoveryPlannerConfiguration) {
    this.ensureSeeded(config);
    const deps = this.integrations.getDependencies();
    const q1305 = consumeQ1305Contract(deps);
    return {
      missionId: "Q13-05" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      plans: this.store.planCount(),
      failureCount: this.gateManager.failureCount(),
      q1305PrerequisitePresent: q1305.consumed,
      readinessScore: q1305.consumed ? 0.8 : 0.45,
      integrations: verifyIntegrations(deps),
      locks: config,
    };
  }

  getQ1306ConsumableContract(): Q1306ConsumableContract {
    const latest = this.getLatestPlan();
    return {
      contractId: `q1306-contract-${IRPLN_METADATA_VERSION}`,
      contractVersion: IRPLN_METADATA_VERSION,
      producedBy: "implementation-recovery-planner",
      missionId: "Q13-05",
      consumerMissionId: "Q13-06",
      exposedFields: [
        "missionSummary",
        "repositoryAuditSummary",
        "recoveryAnalysis",
        "completedWorkSummary",
        "partialWorkSummary",
        "missingWorkSummary",
        "conflictSummary",
        "recoveryStrategy",
        "validationStrategy",
        "acceptanceCriteria",
        "riskSummary",
        "confidenceScore",
        "plans",
        "recoverySpecifications",
      ],
      recoveryCatalog: [
        "interrupted_mission_detection",
        "read_only_repository_analysis",
        "specification_comparison",
        "recovery_strategy_generation",
        "recovery_plan_generation",
        "recovery_specification_generation",
        "recovery_report",
      ],
      notes: [
        "Implementation Recovery Planner Q13-05 — exposes Q1306ConsumableContract for Q13-06 without implementing Q13-06",
        "Recovery planning only — never executes recovery or modifies repository",
        "Cursor Specification Generator provides Q1305 contract via cursorSpecificationGenerator",
        "Never implements Q13-06 or later",
      ],
      neverImplementQ1306OrLater: true,
      structuralSignalOnly: true,
      recoveryPrerequisite: Boolean(latest),
    };
  }

  private requireComparison() {
    if (!this.latestComparison) {
      throw new Error("Specification comparison not performed — call compareAgainstApprovedSpecification first");
    }
    return this.latestComparison;
  }

  private buildHistoryEntry(report: import("./types.js").RecoveryReport, plan: RecoveryPlan): RecoveryHistoryEntry {
    return {
      entryId: nextHistoryEntryId(),
      timestamp: report.timestamp,
      reportId: report.reportId,
      recoveryId: plan.recoveryId,
      missionId: plan.missionId,
      confidenceScore: report.confidenceScore,
      evidence: report.supportingEvidence.slice(0, 5),
    };
  }

  private async rejectedReport(
    input: IrplnInput,
    config: ImplementationRecoveryPlannerConfiguration,
    started: number,
  ) {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("failed", errors, [], started);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendIrplnLog({ event: "boundary_reject", details: errors.join(";") });

    const deps = this.integrations.getDependencies();
    const mission = this.latestMission ?? detectInterruptedOrIncompleteMission(input);
    const q1305ContractConsumed = consumeQ1305Contract(deps);
    const snapshot =
      this.latestSnapshot ??
      analyseCurrentRepositoryState(config.repositoryRoot, input.expectedPaths ?? [], deps);
    const recoveryPrerequisite = verifyRecoveryPrerequisite(deps, input, mission, snapshot);

    const report = buildReport({
      reportId: input.reportId ?? nextReportId(),
      workerId: config.workerId,
      mission,
      repositorySnapshot: snapshot,
      completed: [],
      partial: [],
      missing: [],
      conflicts: [],
      recoveryStrategy: [],
      validationStrategy: [],
      acceptanceCriteria: [],
      riskSummary: errors,
      plans: [],
      recoverySpecifications: [],
      boundaryValidation: { ...validateBoundaries(), passed: false, issues: errors },
      governanceValidation: validateGovernance(deps),
      validation,
      confidenceScore: 0.1,
      q1305ContractConsumed,
      recoveryPrerequisite,
      supportingEvidence: errors,
      historyRefs: [],
    });
    this.store.saveReport(report);
    return report;
  }

  private ensureRecord(
    status: OperationalState,
    config: ImplementationRecoveryPlannerConfiguration,
    healthStatus: import("./types.js").EngineHealthStatus = "standby",
    report?: import("./types.js").RecoveryReport,
    plan?: RecoveryPlan | null,
  ) {
    const latestReport = report ?? this.getLatestReport();
    const latestPlan = plan ?? this.getLatestPlan();
    this.engineRecord = {
      engineVersion: "PILLOW-IRPLN-001",
      missionId: "Q13-05",
      workerId: config.workerId,
      status,
      healthStatus,
      supportedCapabilities: [...IRPLN_CAPABILITIES],
      integrationTargets: [...INTEGRATION_TARGETS],
      totalReports: this.store.reportCount(),
      totalPlans: this.store.planCount(),
      lastReportId: latestReport?.reportId ?? this.engineRecord?.lastReportId ?? null,
      lastRecoveryId: latestPlan?.recoveryId ?? this.engineRecord?.lastRecoveryId ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? this.engineRecord?.lastConfidenceScore ?? null,
      connectedAt: this.engineRecord?.connectedAt ?? new Date().toISOString(),
    };
  }
}
