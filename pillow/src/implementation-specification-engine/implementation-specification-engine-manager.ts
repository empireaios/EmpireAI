import { IsengValidator, GateManager, HealthMonitor } from "./audit-validator.js";
import {
  AuditStore,
  nextHistoryEntryId,
  resetImplementationSpecificationEngineManagerSequencesForTesting,
} from "./audit-store.js";
import type { ImplementationSpecificationEngineConfiguration } from "./configuration.js";
import {
  analyseRepositoryArchitecture as collectRepositoryArchitecture,
  buildRiskSummary,
  computeConfidenceScore,
  detectExistingImplementationsToPreserve,
  discoverImplementationDependencies,
  generateImplementationSpecification,
  parseApprovedRoadmapMission,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type ImplementationSpecificationEngineDependencies,
} from "./integrations.js";
import { appendIsengLog } from "./iseng-logging.js";
import { buildCatalog, buildReport } from "./report-builder.js";
import {
  ISENG_CAPABILITIES,
  ISENG_METADATA_VERSION,
  IMPLEMENTATION_SPECIFICATION_ENGINE_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  ImplementationSpecification,
  ImplementationSpecificationReport,
  IsengInput,
  OperationalState,
  ParsedRoadmapMission,
  Q1302ConsumableContract,
  RepositoryArchitectureSummary,
  SpecificationHistoryEntry,
} from "./types.js";

export { resetImplementationSpecificationEngineManagerSequencesForTesting };

export class ImplementationSpecificationEngineManager {
  private repositoryRoot = "";
  private engineRecord: import("./types.js").IsengEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new IsengValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;
  private lastMission: ParsedRoadmapMission | null = null;
  private lastArchitecture: RepositoryArchitectureSummary | null = null;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: ImplementationSpecificationEngineDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ImplementationSpecificationEngineConfiguration) {
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

  getCatalog() {
    return buildCatalog(
      IMPLEMENTATION_SPECIFICATION_ENGINE_IDENTITY.workerId,
      this.store.listReports(),
      this.store.listSpecifications(),
      this.integrations.getHandshakes(),
    );
  }

  getSpecificationHistory(limit = 100) {
    return this.store.getSpecificationHistory(limit);
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  connect(config: ImplementationSpecificationEngineConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendIsengLog({ event: "connect", details: `Implementation Specification Engine connected; integrations=${handshakes.length}` });
    return handshakes;
  }

  parseApprovedRoadmapMission(input: IsengInput) {
    const mission = parseApprovedRoadmapMission(input, this.repositoryRoot);
    this.lastMission = mission;
    appendIsengLog({ event: "parse_mission", details: mission.missionId });
    return mission;
  }

  analyseRepositoryArchitecture(config: ImplementationSpecificationEngineConfiguration) {
    const scanRoots = inputScanRoots(config, undefined);
    const architecture = collectRepositoryArchitecture(this.repositoryRoot, this.integrations.getDependencies(), scanRoots);
    this.lastArchitecture = architecture;
    appendIsengLog({ event: "analyse_architecture", details: `modules=${architecture.moduleCount}` });
    return architecture;
  }

  discoverImplementationDependencies(input: IsengInput, config: ImplementationSpecificationEngineConfiguration) {
    const mission = this.lastMission ?? parseApprovedRoadmapMission(input, this.repositoryRoot);
    const architecture = this.lastArchitecture ?? collectRepositoryArchitecture(
      this.repositoryRoot,
      this.integrations.getDependencies(),
      inputScanRoots(config, input),
    );
    return discoverImplementationDependencies(this.repositoryRoot, mission, architecture, this.integrations.getDependencies());
  }

  detectExistingImplementationsToPreserve(input: IsengInput, config: ImplementationSpecificationEngineConfiguration) {
    const mission = this.lastMission ?? parseApprovedRoadmapMission(input, this.repositoryRoot);
    const architecture = this.lastArchitecture ?? collectRepositoryArchitecture(
      this.repositoryRoot,
      this.integrations.getDependencies(),
      inputScanRoots(config, input),
    );
    return detectExistingImplementationsToPreserve(this.repositoryRoot, mission, architecture);
  }

  generateImplementationSpecification(input: IsengInput, config: ImplementationSpecificationEngineConfiguration): ImplementationSpecification {
    const mission = this.lastMission ?? parseApprovedRoadmapMission(input, this.repositoryRoot);
    const scanRoots = inputScanRoots(config, input);
    const architecture = this.lastArchitecture ?? collectRepositoryArchitecture(
      this.repositoryRoot,
      this.integrations.getDependencies(),
      scanRoots,
    );
    const dependencies = discoverImplementationDependencies(this.repositoryRoot, mission, architecture, this.integrations.getDependencies());
    const preservation = detectExistingImplementationsToPreserve(this.repositoryRoot, mission, architecture);
    const q1301 = this.integrations.attemptQ1301ContractHandshake();
    const specification = generateImplementationSpecification(mission, architecture, dependencies, preservation, q1301.fields);
    this.store.saveSpecification(specification);
    appendIsengLog({ event: "generate_specification", details: specification.specificationId });
    return specification;
  }

  async produceSpecificationReport(
    input: IsengInput,
    config: ImplementationSpecificationEngineConfiguration,
    started = Date.now(),
  ): Promise<ImplementationSpecificationReport> {
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const validation = this.validator.validateInput(input, started);
    const q1301ContractConsumed = this.integrations.attemptQ1301ContractHandshake();

    const mission = this.parseApprovedRoadmapMission(input);
    const scanRoots = inputScanRoots(config, input);
    const repositoryAuditSummary = collectRepositoryArchitecture(
      this.repositoryRoot,
      this.integrations.getDependencies(),
      scanRoots,
    );
    this.lastArchitecture = repositoryAuditSummary;

    const dependencySummary = discoverImplementationDependencies(
      this.repositoryRoot,
      mission,
      repositoryAuditSummary,
      this.integrations.getDependencies(),
    );
    const preservationSummary = detectExistingImplementationsToPreserve(
      this.repositoryRoot,
      mission,
      repositoryAuditSummary,
    );

    const specification = generateImplementationSpecification(
      mission,
      repositoryAuditSummary,
      dependencySummary,
      preservationSummary,
      q1301ContractConsumed.fields,
    );
    this.store.saveSpecification(specification);

    const architectureSummary = specification.architectureSummary;
    const risks = buildRiskSummary(preservationSummary, validation.decision);
    const confidenceScore = computeConfidenceScore(q1301ContractConsumed.consumed, 1, validation.decision);

    const report = buildReport({
      reportId: input.reportId,
      workerId: config.workerId,
      missionSummary: mission,
      repositoryAuditSummary,
      dependencySummary,
      preservationSummary,
      specifications: [specification],
      architectureSummary,
      risks,
      confidenceScore,
      validation,
      q1301ContractConsumed,
    });

    this.store.saveReport(report);
    this.store.saveHistory(this.buildHistoryEntry(report, specification));
    this.ensureRecord(
      validation.decision === "fail" ? "failed" : "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      confidenceScore,
    );
    appendIsengLog({ event: "produce_report", details: report.reportId });
    return report;
  }

  async produceReport(input: IsengInput, config: ImplementationSpecificationEngineConfiguration) {
    return this.produceSpecificationReport(input, config);
  }

  async submitReport(input: IsengInput, config: ImplementationSpecificationEngineConfiguration) {
    const report = await this.produceSpecificationReport(input, config);
    if (report.validation.decision === "fail") return report;
    const submission = this.integrations.submitReport(report);
    return {
      ...report,
      submittedToExecutiveReporting: submission.submitted,
      executiveReportId: submission.executiveReportId,
    };
  }

  list() {
    return this.store.listReports();
  }

  validate(input: IsengInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: ImplementationSpecificationEngineConfiguration) {
    this.ensureSeeded(config);
    const q1301 = this.integrations.attemptQ1301ContractHandshake();
    return {
      missionId: "Q13-01" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      specifications: this.store.specificationCount(),
      failureCount: this.gateManager.failureCount(),
      q1301ContractConsumed: q1301.consumed,
      readinessScore: q1301.consumed ? 0.85 : 0.45,
      integrations: verifyIntegrations(this.integrations.getDependencies()),
      locks: config,
    };
  }

  getQ1302ConsumableContract(): Q1302ConsumableContract {
    return {
      contractId: `q1302-contract-${ISENG_METADATA_VERSION}`,
      contractVersion: ISENG_METADATA_VERSION,
      producedBy: "implementation-specification-engine",
      missionId: "Q13-01",
      consumerMissionId: "Q13-02",
      exposedFields: [
        "missionSummary",
        "repositoryAuditSummary",
        "architectureSummary",
        "dependencySummary",
        "preservationSummary",
        "generatedSpecificationSummary",
        "specifications",
        "validationSummary",
        "confidenceScore",
        "q1301ContractConsumed",
      ],
      specificationCatalog: [
        "implementation_specification",
        "architecture_audit",
        "dependency_map",
        "preservation_registry",
        "validation_plan",
        "integration_plan",
      ],
      notes: [
        "Implementation Specification Engine Q13-01 — exposes Q1302ConsumableContract for Q13-02 without implementing Q13-02",
        "Architecture-aware implementation specifications only — never execute implementations",
        "Repository Intelligence Engine (Q13-02) is explicitly out of scope for ISENG",
        "neverImplementQ1302OrLater=true — contract is structural signal only",
      ],
      neverImplementQ1302OrLater: true,
      structuralSignalOnly: true,
      specificationPrerequisite: true,
    };
  }

  private buildHistoryEntry(
    report: ImplementationSpecificationReport,
    specification: ImplementationSpecification,
  ): SpecificationHistoryEntry {
    return {
      entryId: nextHistoryEntryId(),
      timestamp: report.timestamp,
      reportId: report.reportId,
      specificationId: specification.specificationId,
      missionId: specification.missionId,
      confidenceScore: report.confidenceScore,
      evidence: report.traceabilityRefs.slice(0, 5),
    };
  }

  private async rejectedReport(
    input: IsengInput,
    config: ImplementationSpecificationEngineConfiguration,
    started: number,
  ): Promise<ImplementationSpecificationReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendIsengLog({ event: "boundary_reject", details: errors.join(";") });

    const q1301ContractConsumed = this.integrations.attemptQ1301ContractHandshake();
    const mission = parseApprovedRoadmapMission(input, this.repositoryRoot);
    const scanRoots = inputScanRoots(config, input);
    const repositoryAuditSummary = collectRepositoryArchitecture(
      this.repositoryRoot,
      this.integrations.getDependencies(),
      scanRoots,
    );

    const report = buildReport({
      reportId: input.reportId,
      workerId: config.workerId,
      missionSummary: mission,
      repositoryAuditSummary,
      dependencySummary: {
        computedAt: new Date().toISOString(),
        dependencies: [],
        sessionWiringPatterns: [],
        injectedHandles: [],
        evidence: errors,
      },
      preservationSummary: {
        computedAt: new Date().toISOString(),
        preservedImplementations: [],
        neverOverwrite: true,
        evidence: errors,
      },
      specifications: [],
      architectureSummary: "boundary violation — specification withheld",
      risks: buildRiskSummary({ computedAt: "", preservedImplementations: [], neverOverwrite: true, evidence: errors }, "fail"),
      confidenceScore: 0,
      validation,
      q1301ContractConsumed,
    });

    this.store.saveReport(report);
    return report;
  }

  private ensureRecord(
    state: OperationalState,
    config: ImplementationSpecificationEngineConfiguration,
    validationStatus: "passed" | "failed" = "passed",
    lastConfidenceScore: number | null = null,
  ) {
    const healthStatus =
      state === "failed" ? "failed" : state === "active" ? "healthy" : state === "blocked" ? "blocked" : "standby";
    this.engineRecord = {
      engineRecordId: `iseng-engine-${ISENG_METADATA_VERSION}`,
      timestamp: new Date().toISOString(),
      engineId: "PILLOW-ISENG-001",
      engineVersion: "PILLOW-ISENG-001",
      currentOperationalState: state,
      healthStatus,
      validationStatus: validationStatus === "failed" ? "failed" : validationStatus === "passed" ? "passed" : "pending",
      supportedCapabilities: [...ISENG_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: this.store.getLatestReportId(),
      lastConfidenceScore: lastConfidenceScore ?? this.store.getLatestReport()?.confidenceScore ?? null,
      totalSpecifications: this.store.specificationCount(),
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: ISENG_METADATA_VERSION,
    };
  }
}

function inputScanRoots(
  config: ImplementationSpecificationEngineConfiguration,
  input: IsengInput | undefined,
): string[] {
  if (input?.scanRoots?.length) return input.scanRoots;
  return config.scanRoots;
}
