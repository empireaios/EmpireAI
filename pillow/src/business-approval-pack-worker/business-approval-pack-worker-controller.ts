import type { BusinessApprovalPackWorkerConfiguration } from "./configuration.js";
import type { BusinessApprovalPackWorkerDependencies } from "./integrations.js";
import { PackManager } from "./pack-manager.js";
import type {
  EngineStatus,
  BusinessApprovalPackWorkerInput,
  BusinessApprovalPackWorkerRunReport,
} from "./types.js";

export class BusinessApprovalPackWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: BusinessApprovalPackWorkerRunReport | null = null;

  constructor(
    private readonly manager: PackManager,
    private readonly config: BusinessApprovalPackWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: BusinessApprovalPackWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      businessTypes: [...this.config.businessTypes],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedPacks: this.config.seedPacks.map((pack) => ({
        ...pack,
        majorOpportunities: [...pack.majorOpportunities],
        majorRisks: [...pack.majorRisks],
        requiredApprovals: [...pack.requiredApprovals],
        outstandingIssues: [...pack.outstandingIssues],
        unresolvedRisks: [...pack.unresolvedRisks],
        requiredGrandKingDecisions: [...pack.requiredGrandKingDecisions],
        supportingEvidence: pack.supportingEvidence.map((e) => ({ ...e })),
        facts: [...pack.facts],
        recommendationsOnly: [...pack.recommendationsOnly],
        assumptions: [...pack.assumptions],
        sourceRefs: { ...pack.sourceRefs },
        preservedDecisions: [...pack.preservedDecisions],
        traceabilityRefs: [...pack.traceabilityRefs],
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  receiveBusinessModel(input: BusinessApprovalPackWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveBusinessModel(input, this.config));
  }

  receiveMarketResearch(input: BusinessApprovalPackWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveMarketResearch(input, this.config));
  }

  receiveOpportunityEvaluation(input: BusinessApprovalPackWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveOpportunityEvaluation(input, this.config));
  }

  receiveBlueprint(input: BusinessApprovalPackWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveBlueprint(input, this.config));
  }

  receiveLaunchPlan(input: BusinessApprovalPackWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveLaunchPlan(input, this.config));
  }

  receiveRiskReport(input: BusinessApprovalPackWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveRiskReport(input, this.config));
  }

  consolidateFindings(input: BusinessApprovalPackWorkerInput = {}) {
    this.status = "consolidating";
    return this.finish(this.manager.consolidateFindings(input, this.config));
  }

  produceExecutiveSummary(input: BusinessApprovalPackWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceExecutiveSummary(input, this.config));
  }

  produceApprovalPack(input: BusinessApprovalPackWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceApprovalPack(input, this.config));
  }

  submitApprovalPack(input: BusinessApprovalPackWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitApprovalPack(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: BusinessApprovalPackWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: BusinessApprovalPackWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
