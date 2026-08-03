import type { CommerceFactoryCoreConfiguration } from "./configuration.js";
import type { CommerceFactoryCoreDependencies } from "./integrations.js";
import { CommerceFactoryManager } from "./factory-manager.js";
import type {
  EngineStatus,
  CommerceFactoryCoreInput,
  CommerceFactoryCoreRunReport,
} from "./types.js";

export class CommerceFactoryCoreController {
  private status: EngineStatus = "idle";
  private latestReport: CommerceFactoryCoreRunReport | null = null;

  constructor(
    private readonly manager: CommerceFactoryManager,
    private readonly config: CommerceFactoryCoreConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: CommerceFactoryCoreDependencies = {}) {
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
      commerceCategories: [...this.config.commerceCategories],
      missionStatuses: [...this.config.missionStatuses],
      approvalStatuses: [...this.config.approvalStatuses],
      requiredNextSteps: [...this.config.requiredNextSteps],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedMissions: this.config.seedMissions.map((mission) => ({
        ...mission,
        missingPrerequisites: [...mission.missingPrerequisites],
        preservedDecisions: [...mission.preservedDecisions],
        traceabilityRefs: [...mission.traceabilityRefs],
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

  receiveBlueprint(input: CommerceFactoryCoreInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveBlueprint(input, this.config));
  }

  receiveApprovalPack(input: CommerceFactoryCoreInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovalPack(input, this.config));
  }

  verifyApproval(input: CommerceFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.verifyApproval(input, this.config));
  }

  verifyBlueprint(input: CommerceFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.verifyBlueprint(input, this.config));
  }

  verifyPrerequisites(input: CommerceFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.verifyPrerequisites(input, this.config));
  }

  createMission(input: CommerceFactoryCoreInput = {}) {
    this.status = "creating";
    return this.finish(this.manager.createMission(input, this.config));
  }

  classifyCommerceType(input: CommerceFactoryCoreInput = {}) {
    this.status = "classifying";
    return this.finish(this.manager.classifyCommerceType(input, this.config));
  }

  registerMission(input: CommerceFactoryCoreInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerMission(input, this.config));
  }

  produceMission(input: CommerceFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceMission(input, this.config));
  }

  submitMission(input: CommerceFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitMission(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: CommerceFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: CommerceFactoryCoreRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
