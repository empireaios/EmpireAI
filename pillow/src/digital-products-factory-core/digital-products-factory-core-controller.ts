import type { DigitalProductsFactoryCoreConfiguration } from "./configuration.js";
import type { DigitalProductsFactoryCoreDependencies } from "./integrations.js";
import { DigitalProductsFactoryManager } from "./factory-manager.js";
import type {
  DigitalProductsFactoryCoreInput,
  DigitalProductsFactoryCoreRunReport,
  EngineStatus,
} from "./types.js";

export class DigitalProductsFactoryCoreController {
  private status: EngineStatus = "idle";
  private latestReport: DigitalProductsFactoryCoreRunReport | null = null;

  constructor(
    private readonly manager: DigitalProductsFactoryManager,
    private readonly config: DigitalProductsFactoryCoreConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: DigitalProductsFactoryCoreDependencies = {}) {
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
      productTypes: [...this.config.productTypes],
      pipelineTypes: [...this.config.pipelineTypes],
      pipelineStages: [...this.config.pipelineStages],
      contentStages: [...this.config.contentStages],
      missionStatuses: [...this.config.missionStatuses],
      approvalStatuses: [...this.config.approvalStatuses],
      fulfilmentStatuses: [...this.config.fulfilmentStatuses],
      analyticsStatuses: [...this.config.analyticsStatuses],
      learningStatuses: [...this.config.learningStatuses],
      productionStatuses: [...this.config.productionStatuses],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedMissions: this.config.seedMissions.map((mission) => ({
        ...mission,
        productPortfolio: [...mission.productPortfolio],
        activeProducts: [...mission.activeProducts],
        assignedWorkers: [...mission.assignedWorkers],
        assignedWorkerRoles: [...mission.assignedWorkerRoles],
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

  createDigitalProductBusinessMission(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "creating";
    return this.finish(
      this.manager.createDigitalProductBusinessMission(input, this.config),
    );
  }

  registerDigitalProductBusiness(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerDigitalProductBusiness(input, this.config));
  }

  coordinateProductCreation(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateProductCreation(input, this.config));
  }

  coordinateDesignBranding(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateDesignBranding(input, this.config));
  }

  coordinateSalesPage(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateSalesPage(input, this.config));
  }

  coordinateCheckout(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateCheckout(input, this.config));
  }

  coordinateFulfilment(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateFulfilment(input, this.config));
  }

  coordinateCustomerDelivery(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateCustomerDelivery(input, this.config));
  }

  coordinateAnalytics(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateAnalytics(input, this.config));
  }

  coordinateLearning(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateLearning(input, this.config));
  }

  trackBusinessLifecycle(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.trackBusinessLifecycle(input, this.config));
  }

  manageLifecycle(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.manageLifecycle(input, this.config));
  }

  coordinateWorkers(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.coordinateWorkers(input, this.config));
  }

  coordinateApproval(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.coordinateApproval(input, this.config));
  }

  produceReport(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: DigitalProductsFactoryCoreInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: DigitalProductsFactoryCoreRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
