import { AifrtValidator, GateManager, HealthMonitor } from "./audit-validator.js";
import { AuditStore, nextHistoryEntryId, resetAiInnovationFactoryManagerSequencesForTesting } from "./audit-store.js";
import type { AiInnovationFactoryConfiguration } from "./configuration.js";
import {
  analyseOperationalImprovements,
  buildCostOptimisationSummary,
  buildInnovationProposals,
  buildOutstandingIssues,
  buildRiskSummary,
  computeConfidenceScore,
  discoverBusinessOpportunities,
  evaluateArchitecturalImprovements,
  generateImplementationRecommendations,
  prioritiseInnovationProposals,
  researchEmergingTechnologies,
  trackModelsAndApis,
  verifySeriesCompletePrerequisite,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type AiInnovationFactoryDependencies,
} from "./integrations.js";
import { appendAifrtLog } from "./aifrt-logging.js";
import { buildCatalog, buildReport } from "./report-builder.js";
import {
  AIFRT_CAPABILITIES,
  AIFRT_METADATA_VERSION,
  AI_INNOVATION_FACTORY_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  AiInnovationReport,
  AifrtInput,
  InnovationHistoryEntry,
  OperationalState,
  Q1301ConsumableContract,
  SeriesCompletePrerequisite,
} from "./types.js";

export { resetAiInnovationFactoryManagerSequencesForTesting };

export class AiInnovationFactoryManager {
  private repositoryRoot = "";
  private engineRecord: import("./types.js").AifrtEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new AifrtValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: AiInnovationFactoryDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: AiInnovationFactoryConfiguration) {
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
      AI_INNOVATION_FACTORY_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
    );
  }

  getInnovationHistory(limit = 100) {
    return this.store.getInnovationHistory(limit);
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  connect(config: AiInnovationFactoryConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendAifrtLog({ event: "connect", details: `AI Innovation Factory connected; integrations=${handshakes.length}` });
    return handshakes;
  }

  verifySeriesCompletePrerequisite(): SeriesCompletePrerequisite {
    const q1201 = this.integrations.attemptQ1201ContractHandshake();
    return verifySeriesCompletePrerequisite(q1201);
  }

  researchEmergingTechnologies(config: AiInnovationFactoryConfiguration) {
    return researchEmergingTechnologies(
      this.integrations.getDependencies(),
      this.repositoryRoot,
      config.researchCatalogPaths,
    );
  }

  trackModelsAndApis() {
    return trackModelsAndApis();
  }

  discoverBusinessOpportunities() {
    return discoverBusinessOpportunities(this.integrations.getDependencies());
  }

  evaluateArchitecturalImprovements() {
    return evaluateArchitecturalImprovements(this.integrations.getDependencies());
  }

  analyseOperationalImprovements() {
    return analyseOperationalImprovements(this.integrations.getDependencies());
  }

  prioritiseInnovationProposals(proposals: import("./types.js").InnovationProposal[]) {
    return prioritiseInnovationProposals(proposals);
  }

  generateImplementationRecommendations(proposals: import("./types.js").InnovationProposal[]) {
    return generateImplementationRecommendations(proposals);
  }

  async produceAiInnovationReport(
    input: AifrtInput,
    config: AiInnovationFactoryConfiguration,
    started = Date.now(),
  ): Promise<AiInnovationReport> {
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const validation = this.validator.validateInput(input, started);
    const q1201ContractConsumed = this.integrations.attemptQ1201ContractHandshake();
    const gkQ1201Observation = this.integrations.observeGkQ1201Contract();
    const prerequisite = verifySeriesCompletePrerequisite(q1201ContractConsumed);

    const technologySummary = this.researchEmergingTechnologies(config);
    void this.trackModelsAndApis();
    const businessOpportunitySummary = this.discoverBusinessOpportunities();
    const architectureRecommendations = this.evaluateArchitecturalImprovements();
    const operationalImprovements = this.analyseOperationalImprovements();
    const costOptimisationSummary = buildCostOptimisationSummary();

    const rawProposals = buildInnovationProposals(
      technologySummary,
      businessOpportunitySummary,
      architectureRecommendations,
      operationalImprovements,
      costOptimisationSummary,
      input.grandKingApproved === true,
    );
    const proposals = this.generateImplementationRecommendations(rawProposals);
    const priorityRanking = this.prioritiseInnovationProposals(proposals);
    const riskSummary = buildRiskSummary(proposals);

    const outstandingIssues = buildOutstandingIssues(prerequisite, gkQ1201Observation);
    const supportingEvidence = [
      ...prerequisite.evidence,
      gkQ1201Observation.evidence,
      ...technologySummary.evidence,
      ...priorityRanking.evidence,
      `seriesCompleteActivation=${prerequisite.seriesCompleteActivation}`,
      "neverAutoDeployInnovations=true",
    ];

    const confidenceScore = computeConfidenceScore(prerequisite, proposals.length, validation.decision);

    const report = buildReport({
      reportId: input.reportId,
      workerId: config.workerId,
      technologySummary,
      businessOpportunitySummary,
      architectureRecommendations,
      operationalImprovements,
      costOptimisationSummary,
      riskSummary,
      priorityRanking,
      proposals,
      supportingEvidence,
      outstandingIssues,
      confidenceScore,
      validation,
      q1201ContractConsumed: q1201ContractConsumed,
      gkQ1201Observation,
      seriesCompleteActivation: prerequisite.seriesCompleteActivation,
    });

    this.store.saveReport(report);
    this.store.saveHistory(this.buildHistoryEntry(report));
    this.ensureRecord(
      prerequisite.seriesCompleteActivation ? "active" : "standby",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      confidenceScore,
      prerequisite.seriesCompleteActivation,
    );
    appendAifrtLog({ event: "produce_report", details: report.reportId });
    return report;
  }

  async researchInnovations(input: AifrtInput, config: AiInnovationFactoryConfiguration) {
    return this.produceAiInnovationReport(input, config);
  }

  async submitReport(input: AifrtInput, config: AiInnovationFactoryConfiguration) {
    const report = await this.produceAiInnovationReport(input, config);
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

  validate(input: AifrtInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: AiInnovationFactoryConfiguration) {
    this.ensureSeeded(config);
    const prerequisite = this.verifySeriesCompletePrerequisite();
    return {
      missionId: "Q12-01" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.gateManager.failureCount(),
      seriesCompleteActivation: prerequisite.seriesCompleteActivation,
      readinessScore: prerequisite.seriesCompleteActivation ? 0.85 : 0.45,
      integrations: verifyIntegrations(this.integrations.getDependencies()),
      locks: config,
    };
  }

  getQ1301ConsumableContract(): Q1301ConsumableContract {
    return {
      contractId: `q1301-contract-${AIFRT_METADATA_VERSION}`,
      contractVersion: AIFRT_METADATA_VERSION,
      producedBy: "ai-innovation-factory",
      missionId: "Q12-01",
      consumerMissionId: "Q13-01",
      exposedFields: [
        "technologySummary",
        "businessOpportunitySummary",
        "architectureRecommendations",
        "operationalImprovements",
        "costOptimisationSummary",
        "riskSummary",
        "priorityRanking",
        "proposals",
        "outstandingIssues",
        "confidenceScore",
        "seriesCompleteActivation",
      ],
      innovationCatalog: [
        "ai_model",
        "framework",
        "api",
        "architecture",
        "operations",
        "cost_optimisation",
        "business_opportunity",
        "research",
      ],
      notes: [
        "AI Innovation Factory Q12-01 — exposes Q1301ConsumableContract for Q13-01 without implementing Q13-01",
        "Governed innovation research/recommend only — never auto-deploy",
        "seriesCompleteActivation=true only when QSCPT Q1201 consumed AND finalCompletionDecision=complete",
        "Research may proceed with seriesCompleteActivation=false when Q Series incomplete",
      ],
      neverImplementQ1301OrLater: true,
      structuralSignalOnly: true,
      innovationPrerequisite: true,
    };
  }

  private buildHistoryEntry(report: AiInnovationReport): InnovationHistoryEntry {
    return {
      entryId: nextHistoryEntryId(),
      timestamp: report.timestamp,
      reportId: report.reportId,
      proposalCount: report.proposals.length,
      seriesCompleteActivation: report.seriesCompleteActivation,
      confidenceScore: report.confidenceScore,
      evidence: report.supportingEvidence.slice(0, 5),
    };
  }

  private async rejectedReport(
    input: AifrtInput,
    config: AiInnovationFactoryConfiguration,
    started: number,
  ): Promise<AiInnovationReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendAifrtLog({ event: "boundary_reject", details: errors.join(";") });

    const q1201ContractConsumed = this.integrations.attemptQ1201ContractHandshake();
    const gkQ1201Observation = this.integrations.observeGkQ1201Contract();
    const prerequisite = verifySeriesCompletePrerequisite(q1201ContractConsumed);

    const report = buildReport({
      reportId: input.reportId,
      workerId: config.workerId,
      technologySummary: this.researchEmergingTechnologies(config),
      businessOpportunitySummary: { computedAt: new Date().toISOString(), opportunities: [], evidence: errors },
      architectureRecommendations: { computedAt: new Date().toISOString(), recommendations: [], evidence: errors },
      operationalImprovements: { computedAt: new Date().toISOString(), improvements: [], evidence: errors },
      costOptimisationSummary: { computedAt: new Date().toISOString(), proposals: [], evidence: errors },
      riskSummary: { computedAt: new Date().toISOString(), risks: [], evidence: errors },
      priorityRanking: { computedAt: new Date().toISOString(), ranking: [], evidence: errors },
      proposals: [],
      supportingEvidence: [...errors],
      outstandingIssues: [...errors, "boundary violation — report rejected"],
      confidenceScore: 0,
      validation,
      q1201ContractConsumed,
      gkQ1201Observation,
      seriesCompleteActivation: false,
    });

    this.store.saveReport(report);
    return report;
  }

  private ensureRecord(
    state: OperationalState,
    config: AiInnovationFactoryConfiguration,
    validationStatus: "passed" | "failed" = "passed",
    lastConfidenceScore: number | null = null,
    lastSeriesCompleteActivation: boolean | null = null,
  ) {
    const healthStatus =
      state === "failed" ? "failed" : state === "active" ? "healthy" : state === "blocked" ? "blocked" : "standby";
    this.engineRecord = {
      engineRecordId: `aifrt-engine-${AIFRT_METADATA_VERSION}`,
      timestamp: new Date().toISOString(),
      engineId: "PILLOW-AIFRT-001",
      engineVersion: "PILLOW-AIFRT-001",
      currentOperationalState: state,
      healthStatus,
      validationStatus: validationStatus === "failed" ? "failed" : validationStatus === "passed" ? "passed" : "pending",
      supportedCapabilities: [...AIFRT_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: this.store.getLatestReportId(),
      lastConfidenceScore: lastConfidenceScore ?? this.store.getLatestReport()?.confidenceScore ?? null,
      lastSeriesCompleteActivation:
        lastSeriesCompleteActivation ?? this.store.getLatestReport()?.seriesCompleteActivation ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: AIFRT_METADATA_VERSION,
    };
  }
}
