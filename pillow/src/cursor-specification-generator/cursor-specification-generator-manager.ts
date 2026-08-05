import { GateManager, HealthMonitor, CsgenValidator } from "./audit-validator.js";
import {
  AuditStore,
  nextHistoryEntryId,
  nextReportId,
  resetCursorSpecificationGeneratorManagerSequencesForTesting,
} from "./audit-store.js";
import type { CursorSpecificationGeneratorConfiguration } from "./configuration.js";
import {
  buildCursorSpecification,
  buildOutstandingIssues,
  computeConfidenceScore,
  consumeApprovedRoadmapMission,
  consumeQ1303Contract,
  consumeQ1304Contract,
  identifySpecificationDependencies,
  observeQ1302Contract,
  resolveImplementationSpecificationReference,
  resolveMissionPlanReference,
  resolveRepositorySnapshotReference,
  validateBoundaries,
  validateCompleteness,
  validateGovernance,
  verifyGenerationPrerequisite,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type CursorSpecificationGeneratorDependencies,
} from "./integrations.js";
import { appendCsgenLog } from "./csgen-logging.js";
import { buildCatalog, buildReport } from "./report-builder.js";
import {
  CSGEN_CAPABILITIES,
  CSGEN_METADATA_VERSION,
  CURSOR_SPECIFICATION_GENERATOR_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  CursorSpecification,
  CursorSpecificationReport,
  CsgenInput,
  OperationalState,
  Q1305ConsumableContract,
  RoadmapMissionInput,
  SpecificationHistoryEntry,
} from "./types.js";

export { resetCursorSpecificationGeneratorManagerSequencesForTesting };

export class CursorSpecificationGeneratorManager {
  private latestMission: RoadmapMissionInput | null = null;
  private latestSpecification: CursorSpecification | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new CsgenValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private engineRecord: import("./types.js").CsgenEngineRecord | null = null;
  private seeded = false;

  bindIntegrations(deps: CursorSpecificationGeneratorDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: CursorSpecificationGeneratorConfiguration) {
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

  getSpecifications() {
    return this.store.listSpecifications();
  }

  getLatestReport() {
    return this.store.getLatestReport();
  }

  getLatestSpecification() {
    return this.latestSpecification ?? this.store.getLatestSpecification();
  }

  getCatalog() {
    return buildCatalog(
      CURSOR_SPECIFICATION_GENERATOR_IDENTITY.workerId,
      this.store.listReports(),
      this.store.listSpecifications(),
      this.integrations.getHandshakes(),
      this.store.getSpecificationHistory().length,
    );
  }

  getSpecificationHistory(limit = 100) {
    return this.store.getSpecificationHistory(limit);
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  connect(config: CursorSpecificationGeneratorConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendCsgenLog({ event: "connect", details: `Cursor Specification Generator connected; integrations=${handshakes.length}` });
    return handshakes;
  }

  consumeApprovedRoadmapMission(input: CsgenInput) {
    const mission = consumeApprovedRoadmapMission(input);
    this.latestMission = mission;
    appendCsgenLog({ event: "consume_mission", details: `missionId=${mission.missionId}` });
    return mission;
  }

  consumeRepositoryIntelligence() {
    const deps = this.integrations.getDependencies();
    const q1303 = consumeQ1303Contract(deps);
    const snapshot = resolveRepositorySnapshotReference(deps);
    const report = deps.repositoryIntelligenceEngine?.getLatestReport?.();
    appendCsgenLog({ event: "consume_rieng", details: q1303.evidence });
    return {
      q1303ContractConsumed: q1303,
      repositorySnapshot: snapshot,
      riengReportId: report?.reportId ?? null,
      riengConfidence: report?.confidenceScore ?? null,
    };
  }

  consumeMissionPlanning() {
    const deps = this.integrations.getDependencies();
    const q1304 = consumeQ1304Contract(deps);
    const planRef = resolveMissionPlanReference(deps);
    const report = deps.missionPlanningEngine?.getLatestReport?.();
    appendCsgenLog({ event: "consume_mpeng", details: q1304.evidence });
    return {
      q1304ContractConsumed: q1304,
      missionPlanReference: planRef,
      mpengReportId: report?.reportId ?? null,
      mpengConfidence: report?.confidenceScore ?? null,
    };
  }

  consumeImplementationSpecification() {
    const deps = this.integrations.getDependencies();
    const q1302 = observeQ1302Contract(deps);
    const isengRef = resolveImplementationSpecificationReference(deps);
    appendCsgenLog({ event: "consume_iseng", details: q1302.evidence });
    return {
      q1302Observation: q1302,
      implementationSpecificationReference: isengRef,
    };
  }

  generateCursorSpecification(input: CsgenInput = {}) {
    const deps = this.integrations.getDependencies();
    const mission = this.latestMission ?? consumeApprovedRoadmapMission(input);
    const prerequisite = verifyGenerationPrerequisite(deps, input, mission);

    if (!prerequisite.verified || this.validator.hasBoundaryViolation(input)) {
      appendCsgenLog({ event: "spec_withheld", details: prerequisite.outstandingPrerequisiteIssues.join(";") });
      return null;
    }

    const spec = buildCursorSpecification({
      mission,
      deps,
      specId: input.cursorSpecificationId,
    });

    if (spec) {
      this.latestSpecification = spec;
      this.store.saveSpecification(spec);
      appendCsgenLog({ event: "spec_generated", details: spec.cursorSpecificationId });
    }
    return spec;
  }

  validateBoundaries() {
    return validateBoundaries();
  }

  validateGovernance() {
    return validateGovernance(this.integrations.getDependencies());
  }

  validateCompleteness(input: CsgenInput = {}) {
    const spec = this.latestSpecification ?? this.generateCursorSpecification(input);
    return validateCompleteness(spec);
  }

  async produceCursorSpecificationReport(
    input: CsgenInput = {},
    config: CursorSpecificationGeneratorConfiguration,
    started = Date.now(),
  ): Promise<CursorSpecificationReport> {
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const validation = this.validator.validateInput(input, started);
    const deps = this.integrations.getDependencies();
    const mission = this.latestMission ?? consumeApprovedRoadmapMission(input);
    const q1304ContractConsumed = consumeQ1304Contract(deps);
    const q1303ContractConsumed = consumeQ1303Contract(deps);
    const q1302Observation = observeQ1302Contract(deps);
    const generationPrerequisite = verifyGenerationPrerequisite(deps, input, mission);
    const repositorySnapshot = resolveRepositorySnapshotReference(deps);
    const riengReport = deps.repositoryIntelligenceEngine?.getLatestReport?.();
    const mpengReport = deps.missionPlanningEngine?.getLatestReport?.();
    const missionPlanRef = {
      ...resolveMissionPlanReference(deps),
      confidenceScore: mpengReport?.confidenceScore ?? null,
    };
    const isengRef = resolveImplementationSpecificationReference(deps);

    const spec =
      generationPrerequisite.verified && validation.decision !== "failed"
        ? this.generateCursorSpecification(input)
        : null;

    const boundaryValidation = validateBoundaries();
    const governanceValidation = validateGovernance(deps);
    const completenessValidation = validateCompleteness(spec);
    const confidenceScore = computeConfidenceScore(generationPrerequisite, validation.decision, spec);
    const outstandingIssues = buildOutstandingIssues(generationPrerequisite, q1304ContractConsumed, spec);

    const supportingEvidence = [
      ...generationPrerequisite.evidence,
      q1304ContractConsumed.evidence,
      q1303ContractConsumed.evidence,
      q1302Observation.evidence,
      "neverImplementCode=true",
      "neverExecuteCursorMissions=true",
      "specificationOnly=true",
    ];

    const report = buildReport({
      reportId: input.reportId ?? nextReportId(),
      workerId: config.workerId,
      mission,
      repositorySnapshot,
      riengReportId: riengReport?.reportId ?? null,
      riengConfidence: riengReport?.confidenceScore ?? null,
      missionPlanRef,
      isengRef,
      generatedCursorSpecification: spec,
      boundaryValidation,
      governanceValidation,
      completenessValidation,
      validation,
      confidenceScore,
      q1304ContractConsumed,
      q1303ContractConsumed,
      q1302Observation,
      generationPrerequisite,
      supportingEvidence,
      outstandingIssues,
      historyRefs: this.store.getSpecificationHistory().map((entry) => entry.entryId),
    });

    this.store.saveReport(report);
    if (spec) {
      this.store.saveSpecificationHistory(this.buildHistoryEntry(report, spec));
    }
    const healthStatus = this.healthMonitor.evaluate(confidenceScore, validation.decision);
    this.ensureRecord(validation.decision === "failed" ? "failed" : "active", config, healthStatus, report, spec);
    appendCsgenLog({ event: "report_produced", details: `${report.reportId} confidence=${confidenceScore}` });
    return report;
  }

  async submitReport(input: CsgenInput, config: CursorSpecificationGeneratorConfiguration) {
    const report = await this.produceCursorSpecificationReport(input, config);
    const executive = this.integrations.getDependencies().executiveReportingRuntime;
    if (config.executiveReportingEnabled && executive?.submitWorkerReport) {
      executive.submitWorkerReport({
        workerId: config.workerId,
        missionId: "Q13-04",
        reportId: report.reportId,
        reportType: "cursor_specification",
        payload: report,
      });
      appendCsgenLog({ event: "report_submitted", details: report.reportId });
    }
    return report;
  }

  validate(input: CsgenInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: CursorSpecificationGeneratorConfiguration) {
    this.ensureSeeded(config);
    const deps = this.integrations.getDependencies();
    const q1304 = consumeQ1304Contract(deps);
    return {
      missionId: "Q13-04" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      specifications: this.store.specificationCount(),
      failureCount: this.gateManager.failureCount(),
      q1304PrerequisitePresent: q1304.consumed,
      readinessScore: q1304.consumed ? 0.8 : 0.45,
      integrations: verifyIntegrations(deps),
      locks: config,
    };
  }

  getQ1305ConsumableContract(): Q1305ConsumableContract {
    const latest = this.getLatestSpecification();
    return {
      contractId: `q1305-contract-${CSGEN_METADATA_VERSION}`,
      contractVersion: CSGEN_METADATA_VERSION,
      producedBy: "cursor-specification-generator",
      missionId: "Q13-04",
      consumerMissionId: "Q13-05",
      exposedFields: [
        "missionSummary",
        "sourceOfTruthSummary",
        "repositoryIntelligenceReference",
        "missionPlanningReference",
        "implementationSpecificationReference",
        "generatedCursorSpecification",
        "boundaryValidation",
        "governanceValidation",
        "completenessValidation",
        "confidenceScore",
      ],
      specificationCatalog: [
        "roadmap_mission_consumption",
        "repository_intelligence_consumption",
        "mission_planning_consumption",
        "implementation_specification_consumption",
        "cursor_specification_generation",
        "constitutional_body_formatting",
        "boundary_validation",
        "governance_validation",
        "completeness_validation",
        "cursor_specification_report",
      ],
      notes: [
        "Cursor Specification Generator Q13-04 — exposes Q1305ConsumableContract for Q13-05 without implementing Q13-05",
        "Specification only — never implements code or executes Cursor missions",
        "Mission Planning Engine provides Q1304 contract via missionPlanningEngine",
        "Never implements Q13-05 or later",
      ],
      neverImplementQ1305OrLater: true,
      structuralSignalOnly: true,
      specificationPrerequisite: Boolean(latest),
    };
  }

  private buildHistoryEntry(report: CursorSpecificationReport, spec: CursorSpecification): SpecificationHistoryEntry {
    return {
      entryId: nextHistoryEntryId(),
      timestamp: report.timestamp,
      reportId: report.reportId,
      cursorSpecificationId: spec.cursorSpecificationId,
      missionId: spec.missionId,
      confidenceScore: report.confidenceScore,
      evidence: report.supportingEvidence.slice(0, 5),
    };
  }

  private async rejectedReport(
    input: CsgenInput,
    config: CursorSpecificationGeneratorConfiguration,
    started: number,
  ): Promise<CursorSpecificationReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("failed", errors, [], started);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendCsgenLog({ event: "boundary_reject", details: errors.join(";") });

    const deps = this.integrations.getDependencies();
    const mission = this.latestMission ?? consumeApprovedRoadmapMission(input);
    const q1304ContractConsumed = consumeQ1304Contract(deps);
    const q1303ContractConsumed = consumeQ1303Contract(deps);
    const q1302Observation = observeQ1302Contract(deps);
    const generationPrerequisite = verifyGenerationPrerequisite(deps, input, mission);

    const report = buildReport({
      reportId: input.reportId ?? nextReportId(),
      workerId: config.workerId,
      mission,
      repositorySnapshot: resolveRepositorySnapshotReference(deps),
      riengReportId: null,
      riengConfidence: null,
      missionPlanRef: { ...resolveMissionPlanReference(deps), confidenceScore: null },
      isengRef: resolveImplementationSpecificationReference(deps),
      generatedCursorSpecification: null,
      boundaryValidation: { ...validateBoundaries(), passed: false, issues: errors },
      governanceValidation: validateGovernance(deps),
      completenessValidation: validateCompleteness(null),
      validation,
      confidenceScore: 0.1,
      q1304ContractConsumed,
      q1303ContractConsumed,
      q1302Observation,
      generationPrerequisite,
      supportingEvidence: errors,
      outstandingIssues: [...errors, ...buildOutstandingIssues(generationPrerequisite, q1304ContractConsumed, null)],
      historyRefs: [],
    });
    this.store.saveReport(report);
    return report;
  }

  private ensureRecord(
    status: OperationalState,
    config: CursorSpecificationGeneratorConfiguration,
    healthStatus: import("./types.js").EngineHealthStatus = "standby",
    report?: CursorSpecificationReport,
    spec?: CursorSpecification | null,
  ) {
    const latestReport = report ?? this.getLatestReport();
    const latestSpec = spec ?? this.getLatestSpecification();
    this.engineRecord = {
      engineVersion: "PILLOW-CSGEN-001",
      missionId: "Q13-04",
      workerId: config.workerId,
      status,
      healthStatus,
      supportedCapabilities: [...CSGEN_CAPABILITIES],
      integrationTargets: [...INTEGRATION_TARGETS],
      totalReports: this.store.reportCount(),
      totalSpecifications: this.store.specificationCount(),
      lastReportId: latestReport?.reportId ?? this.engineRecord?.lastReportId ?? null,
      lastSpecificationId: latestSpec?.cursorSpecificationId ?? this.engineRecord?.lastSpecificationId ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? this.engineRecord?.lastConfidenceScore ?? null,
      connectedAt: this.engineRecord?.connectedAt ?? new Date().toISOString(),
    };
  }
}
