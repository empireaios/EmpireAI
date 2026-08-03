import type { RequirementsWorkerConfiguration } from "./configuration.js";
import type { RequirementsWorkerDependencies } from "./integrations.js";
import { RequirementsManager } from "./requirements-manager.js";
import type {
  EngineStatus,
  RequirementsWorkerInput,
  RequirementsWorkerRunReport,
} from "./types.js";

export class RequirementsWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: RequirementsWorkerRunReport | null = null;

  constructor(
    private readonly manager: RequirementsManager,
    private readonly config: RequirementsWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: RequirementsWorkerDependencies = {}) {
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
      integrationTargets: [...this.config.integrationTargets],
      supportedRequirementTypes: [...this.config.supportedRequirementTypes],
      reportingLine: [...this.config.reportingLine],
      seedRequirementsReports: this.config.seedRequirementsReports.map((report) => ({
        ...report,
        requirementsSteps: report.requirementsSteps.map((s) => ({ ...s })),
        supportedRequirementTypes: [...report.supportedRequirementTypes],
        functionalRequirements: report.functionalRequirements.map((r) => ({ ...r })),
        nonFunctionalRequirements: report.nonFunctionalRequirements.map((r) => ({ ...r })),
        userStories: report.userStories.map((s) => ({ ...s })),
        useCases: report.useCases.map((u) => ({ ...u })),
        acceptanceCriteria: report.acceptanceCriteria.map((a) => ({ ...a })),
        assumptions: [...report.assumptions],
        constraints: [...report.constraints],
        technicalConstraints: [...report.technicalConstraints],
        regulatoryConstraints: [...report.regulatoryConstraints],
        risks: report.risks.map((r) => ({ ...r })),
        businessRules: report.businessRules.map((b) => ({ ...b })),
        stakeholders: [...report.stakeholders],
        selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
        traceabilityRefs: [...report.traceabilityRefs],
        preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
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

  receiveApprovedBusinessIntent(input: RequirementsWorkerInput = {}) {
    this.status = "receiving_intent";
    return this.finish(this.manager.receiveApprovedBusinessIntent(input, this.config));
  }

  identifyStakeholders(input: RequirementsWorkerInput = {}) {
    this.status = "identifying_stakeholders";
    return this.finish(this.manager.identifyStakeholders(input, this.config));
  }

  defineBusinessObjectives(input: RequirementsWorkerInput = {}) {
    this.status = "defining_objectives";
    return this.finish(this.manager.defineBusinessObjectives(input, this.config));
  }

  produceFunctionalRequirements(input: RequirementsWorkerInput = {}) {
    this.status = "producing_functional";
    return this.finish(this.manager.produceFunctionalRequirements(input, this.config));
  }

  produceNonFunctionalRequirements(input: RequirementsWorkerInput = {}) {
    this.status = "producing_non_functional";
    return this.finish(this.manager.produceNonFunctionalRequirements(input, this.config));
  }

  generateUserStories(input: RequirementsWorkerInput = {}) {
    this.status = "generating_stories";
    return this.finish(this.manager.generateUserStories(input, this.config));
  }

  generateUseCases(input: RequirementsWorkerInput = {}) {
    this.status = "generating_use_cases";
    return this.finish(this.manager.generateUseCases(input, this.config));
  }

  generateAcceptanceCriteria(input: RequirementsWorkerInput = {}) {
    this.status = "generating_acceptance";
    return this.finish(this.manager.generateAcceptanceCriteria(input, this.config));
  }

  identifyAssumptionsRisksAndConstraints(input: RequirementsWorkerInput = {}) {
    this.status = "identifying_risks";
    return this.finish(this.manager.identifyAssumptionsRisksAndConstraints(input, this.config));
  }

  produceRequirementsReport(input: RequirementsWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceRequirementsReport(input, this.config));
  }

  submitReport(input: RequirementsWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: RequirementsWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: RequirementsWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
