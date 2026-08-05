import { GateManager, HealthMonitor, RiengValidator } from "./audit-validator.js";
import {
  AuditStore,
  nextHistoryEntryId,
  nextReportId,
  resetRepositoryIntelligenceEngineManagerSequencesForTesting,
} from "./audit-store.js";
import type { RepositoryIntelligenceEngineConfiguration } from "./configuration.js";
import {
  buildOutstandingIssues,
  buildRepositorySnapshot,
  buildRiskSummary,
  computeConfidenceScore,
  observeQ1301Contract,
  observeQ1302Contract,
  verifyQ1302Prerequisite,
  verifyQ1301MissionPrerequisite,
  wrapLegacyIntelligenceContext,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type RepositoryIntelligenceEngineDependencies,
} from "./integrations.js";
import { appendRiengLog } from "./rieng-logging.js";
import { buildCatalog, buildReport } from "./report-builder.js";
import {
  INTEGRATION_TARGETS,
  REPOSITORY_INTELLIGENCE_ENGINE_IDENTITY,
  RIENG_CAPABILITIES,
  RIENG_METADATA_VERSION,
} from "./paths.js";
import type {
  Q1303ConsumableContract,
  RepositoryIntelligenceReport,
  RepositoryIntelligenceSnapshot,
  RepositoryKnowledgeHistoryEntry,
  RepositoryStructureDiscovery,
  RiengInput,
  OperationalState,
} from "./types.js";

export { resetRepositoryIntelligenceEngineManagerSequencesForTesting };

export class RepositoryIntelligenceEngineManager {
  private repositoryRoot = "";
  private engineRecord: import("./types.js").RiengEngineRecord | null = null;
  private latestSnapshot: RepositoryIntelligenceSnapshot | null = null;
  private latestDiscovery: RepositoryStructureDiscovery | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new RiengValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: RepositoryIntelligenceEngineDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: RepositoryIntelligenceEngineConfiguration) {
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
      REPOSITORY_INTELLIGENCE_ENGINE_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
      this.store.getRepositoryKnowledgeHistory().length,
    );
  }

  getRepositoryKnowledgeHistory(limit = 100) {
    return this.store.getRepositoryKnowledgeHistory(limit);
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  connect(config: RepositoryIntelligenceEngineConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendRiengLog({ event: "connect", details: `Repository Intelligence Engine connected; integrations=${handshakes.length}` });
    return handshakes;
  }

  discoverRepositoryStructure(config: RepositoryIntelligenceEngineConfiguration): RepositoryStructureDiscovery {
    const { snapshot, files } = buildRepositorySnapshot(this.repositoryRoot, config);
    this.latestSnapshot = snapshot;
    this.latestDiscovery = {
      discoveredAt: snapshot.timestamp,
      includeRoots: [...config.includeRoots],
      excludeDirs: [...config.excludeDirs],
      files: files.map((file) => ({ relativePath: file.relativePath, size: file.size, layer: file.layer })),
      repositoryFingerprint: snapshot.repositoryFingerprint,
      repositoryVersion: snapshot.repositoryVersion,
      totalFiles: files.length,
      readOnly: true,
    };
    appendRiengLog({ event: "discover", details: `files=${files.length} fingerprint=${snapshot.repositoryFingerprint.slice(0, 12)}` });
    return this.latestDiscovery;
  }

  analyzeModulesAndServices(config: RepositoryIntelligenceEngineConfiguration) {
    const snapshot = this.ensureSnapshot(config);
    return {
      moduleInventory: snapshot.moduleInventory.map((entry) => ({ ...entry, evidencePaths: [...entry.evidencePaths] })),
      serviceInventory: snapshot.serviceInventory.map((entry) => ({ ...entry, evidencePaths: [...entry.evidencePaths] })),
    };
  }

  buildDependencyGraph(config: RepositoryIntelligenceEngineConfiguration) {
    return { ...this.ensureSnapshot(config).dependencyGraph };
  }

  detectImplementationRelationships(config: RepositoryIntelligenceEngineConfiguration) {
    const snapshot = this.ensureSnapshot(config);
    return {
      integrationGraph: snapshot.integrationGraph,
      dependencyGraph: snapshot.dependencyGraph,
    };
  }

  discoverArchitecturalBoundaries(config: RepositoryIntelligenceEngineConfiguration) {
    return this.ensureSnapshot(config).architectureLayers.map((layer) => ({
      ...layer,
      constraints: [...layer.constraints],
      violations: [...layer.violations],
      evidencePaths: [...layer.evidencePaths],
    }));
  }

  detectExistingImplementations(config: RepositoryIntelligenceEngineConfiguration) {
    return this.ensureSnapshot(config).existingImplementations.map((entry) => ({
      ...entry,
      paths: [...entry.paths],
      evidence: [...entry.evidence],
    }));
  }

  identifyReusableComponents(config: RepositoryIntelligenceEngineConfiguration) {
    return this.ensureSnapshot(config).reusableComponents.map((entry) => ({
      ...entry,
      evidence: [...entry.evidence],
    }));
  }

  detectConflictsAndDuplicates(config: RepositoryIntelligenceEngineConfiguration) {
    return this.ensureSnapshot(config).conflicts.map((entry) => ({
      ...entry,
      paths: [...entry.paths],
      evidence: [...entry.evidence],
    }));
  }

  analyzeRepository(config: RepositoryIntelligenceEngineConfiguration) {
    const snapshot = this.ensureSnapshot(config);
    return JSON.parse(JSON.stringify(snapshot)) as RepositoryIntelligenceSnapshot;
  }

  async produceRepositoryIntelligenceReport(
    input: RiengInput,
    config: RepositoryIntelligenceEngineConfiguration,
    started = Date.now(),
  ): Promise<RepositoryIntelligenceReport> {
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const validation = this.validator.validateInput(input, started);
    const deps = this.integrations.getDependencies();
    const q1302ContractConsumed = observeQ1302Contract(deps);
    const q1302Prerequisite = verifyQ1302Prerequisite(deps);
    const q1301Observation = observeQ1301Contract(deps);
    const snapshot = this.ensureSnapshot(config);
    const legacyEvidence = wrapLegacyIntelligenceContext(deps, []);

    snapshot.risks = buildRiskSummary(snapshot.technicalDebtFindings, q1302Prerequisite, q1301Observation);
    this.latestSnapshot = snapshot;

    const confidenceScore = computeConfidenceScore(
      q1302Prerequisite,
      snapshot.moduleInventory.reduce((sum, module) => sum + module.fileCount, 0),
      validation.decision,
      snapshot.technicalDebtFindings.length,
    );

    const outstandingIssues = buildOutstandingIssues(q1302Prerequisite, q1302ContractConsumed, q1301Observation);
    const supportingEvidence = [
      ...q1302Prerequisite.evidence,
      q1302ContractConsumed.evidence,
      q1301Observation.evidence,
      ...legacyEvidence,
      `repositoryFingerprint=${snapshot.repositoryFingerprint}`,
      "neverModifyAnalyzedFiles=true",
      "readOnlyRepositoryAnalysis=true",
    ];

    const report = buildReport({
      reportId: input.reportId ?? nextReportId(),
      workerId: config.workerId,
      snapshot,
      includeRoots: config.includeRoots,
      excludeDirs: config.excludeDirs,
      validation,
      confidenceScore,
      q1302ContractConsumed,
      q1302Prerequisite,
      q1301Observation,
      supportingEvidence,
      outstandingIssues,
      historyRefs: this.store.getRepositoryKnowledgeHistory().map((entry) => entry.entryId),
    });

    this.store.saveReport(report);
    this.store.saveKnowledgeHistory(this.buildHistoryEntry(report));
    const healthStatus = this.healthMonitor.evaluate(confidenceScore, validation.decision);
    this.ensureRecord(validation.decision === "failed" ? "failed" : "active", config, healthStatus, report);
    appendRiengLog({ event: "report_produced", details: `${report.reportId} confidence=${confidenceScore}` });
    return report;
  }

  async submitReport(input: RiengInput, config: RepositoryIntelligenceEngineConfiguration) {
    const report = await this.produceRepositoryIntelligenceReport(input, config);
    const executive = this.integrations.getDependencies().executiveReportingRuntime;
    if (config.executiveReportingEnabled && executive?.submitWorkerReport) {
      executive.submitWorkerReport({
        workerId: config.workerId,
        missionId: "Q13-02",
        reportId: report.reportId,
        reportType: "repository_intelligence",
        payload: report,
      });
      appendRiengLog({ event: "report_submitted", details: report.reportId });
    }
    return report;
  }

  validate(input: RiengInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: RepositoryIntelligenceEngineConfiguration) {
    this.ensureSeeded(config);
    const prerequisite = verifyQ1302Prerequisite(this.integrations.getDependencies());
    return {
      missionId: "Q13-02" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.gateManager.failureCount(),
      q1302PrerequisitePresent: prerequisite.implementationSpecificationEnginePresent,
      q1301MissionPresent: prerequisite.implementationSpecificationEnginePresent,
      readinessScore: prerequisite.implementationSpecificationEnginePresent ? 0.75 : 0.45,
      integrations: verifyIntegrations(this.integrations.getDependencies()),
      locks: config,
    };
  }

  getQ1303ConsumableContract(): Q1303ConsumableContract {
    const latest = this.getLatestReport();
    return {
      contractId: `q1303-contract-${RIENG_METADATA_VERSION}`,
      contractVersion: RIENG_METADATA_VERSION,
      producedBy: "repository-intelligence-engine",
      missionId: "Q13-02",
      consumerMissionId: "Q13-03",
      exposedFields: [
        "repositorySummary",
        "moduleSummary",
        "serviceSummary",
        "dependencySummary",
        "architectureSummary",
        "existingImplementationSummary",
        "technicalDebtSummary",
        "riskSummary",
        "snapshot",
        "outstandingIssues",
        "confidenceScore",
        "repositoryFingerprint",
      ],
      repositoryCatalog: [
        "module_inventory",
        "service_inventory",
        "dependency_graph",
        "integration_graph",
        "architecture_layers",
        "existing_implementations",
        "reusable_components",
        "technical_debt",
        "conflicts",
      ],
      notes: [
        "Repository Intelligence Engine Q13-02 — exposes Q1303ConsumableContract for Q13-03 without implementing Q13-03",
        "Read-only repository analysis — never modifies analyzed files",
        "Q13-01 Implementation Specification Engine provides Q1302 contract via implementationSpecificationEngine",
        "Never certifies Q13-01 from RIENG",
      ],
      neverImplementQ1303OrLater: true,
      structuralSignalOnly: true,
      repositoryPrerequisite: latest != null,
    };
  }

  private ensureSnapshot(config: RepositoryIntelligenceEngineConfiguration): RepositoryIntelligenceSnapshot {
    if (this.latestSnapshot) return JSON.parse(JSON.stringify(this.latestSnapshot)) as RepositoryIntelligenceSnapshot;
    const { snapshot } = buildRepositorySnapshot(this.repositoryRoot, config);
    this.latestSnapshot = snapshot;
    return JSON.parse(JSON.stringify(snapshot)) as RepositoryIntelligenceSnapshot;
  }

  private buildHistoryEntry(report: RepositoryIntelligenceReport): RepositoryKnowledgeHistoryEntry {
    return {
      entryId: nextHistoryEntryId(),
      timestamp: report.timestamp,
      reportId: report.reportId,
      repositoryFingerprint: report.snapshot.repositoryFingerprint,
      repositoryVersion: report.snapshot.repositoryVersion,
      moduleCount: report.snapshot.moduleInventory.length,
      serviceCount: report.snapshot.serviceInventory.length,
      confidenceScore: report.confidenceScore,
      evidence: report.supportingEvidence.slice(0, 5),
    };
  }

  private async rejectedReport(
    input: RiengInput,
    config: RepositoryIntelligenceEngineConfiguration,
    started: number,
  ): Promise<RepositoryIntelligenceReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("failed", errors, [], started);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendRiengLog({ event: "boundary_reject", details: errors.join(";") });

    const deps = this.integrations.getDependencies();
    const q1302ContractConsumed = observeQ1302Contract(deps);
    const q1302Prerequisite = verifyQ1302Prerequisite(deps);
    const q1301Observation = observeQ1301Contract(deps);
    const snapshot = this.ensureSnapshot(config);
    snapshot.risks = buildRiskSummary(snapshot.technicalDebtFindings, q1302Prerequisite, q1301Observation);

    const report = buildReport({
      reportId: input.reportId ?? nextReportId(),
      workerId: config.workerId,
      snapshot,
      includeRoots: config.includeRoots,
      excludeDirs: config.excludeDirs,
      validation,
      confidenceScore: 0.1,
      q1302ContractConsumed,
      q1302Prerequisite,
      q1301Observation,
      supportingEvidence: errors,
      outstandingIssues: [...errors, ...buildOutstandingIssues(q1302Prerequisite, q1302ContractConsumed, q1301Observation)],
      historyRefs: [],
    });
    this.store.saveReport(report);
    return report;
  }

  private ensureRecord(
    status: OperationalState,
    config: RepositoryIntelligenceEngineConfiguration,
    healthStatus: import("./types.js").EngineHealthStatus = "standby",
    report?: RepositoryIntelligenceReport,
  ) {
    const latest = report ?? this.getLatestReport();
    this.engineRecord = {
      engineVersion: "PILLOW-RIENG-001",
      missionId: "Q13-02",
      workerId: config.workerId,
      status,
      healthStatus,
      supportedCapabilities: [...RIENG_CAPABILITIES],
      integrationTargets: [...INTEGRATION_TARGETS],
      totalReports: this.store.reportCount(),
      lastReportId: latest?.reportId ?? this.engineRecord?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? this.engineRecord?.lastConfidenceScore ?? null,
      lastRepositoryFingerprint: latest?.snapshot.repositoryFingerprint ?? this.engineRecord?.lastRepositoryFingerprint ?? null,
      connectedAt: this.engineRecord?.connectedAt ?? new Date().toISOString(),
    };
  }
}
