import type { ServiceOfferWorkerConfiguration } from "./configuration.js";
import type { ServiceOfferWorkerDependencies } from "./integrations.js";
import { OfferManager } from "./offer-manager.js";
import type {
  EngineStatus,
  ServiceOfferInput,
  ServiceOfferWorkerRunReport,
} from "./types.js";

export class ServiceOfferWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: ServiceOfferWorkerRunReport | null = null;

  constructor(
    private readonly manager: OfferManager,
    private readonly config: ServiceOfferWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ServiceOfferWorkerDependencies = {}) {
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
      reportingLine: [...this.config.reportingLine],
      packageTypes: [...this.config.packageTypes],
      seedReports: this.config.seedReports.map((report) => ({ ...report })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  consumeMarketResearch(input: ServiceOfferInput = {}) {
    this.status = "consuming_research";
    return this.finish(this.manager.consumeMarketResearch(input, this.config));
  }

  defineServiceCatalogue(input: ServiceOfferInput = {}) {
    this.status = "defining_catalogue";
    return this.finish(this.manager.defineServiceCatalogue(input, this.config));
  }

  defineServicePackages(input: ServiceOfferInput = {}) {
    this.status = "defining_packages";
    return this.finish(this.manager.defineServicePackages(input, this.config));
  }

  recommendPricingStructure(input: ServiceOfferInput = {}) {
    this.status = "recommending_pricing";
    return this.finish(this.manager.recommendPricingStructure(input, this.config));
  }

  definePackageInclusions(input: ServiceOfferInput = {}) {
    this.status = "defining_packages";
    return this.finish(this.manager.definePackageInclusions(input, this.config));
  }

  definePackageExclusions(input: ServiceOfferInput = {}) {
    this.status = "defining_packages";
    return this.finish(this.manager.definePackageExclusions(input, this.config));
  }

  defineGuarantees(input: ServiceOfferInput = {}) {
    this.status = "defining_guarantees";
    return this.finish(this.manager.defineGuarantees(input, this.config));
  }

  defineFulfilmentRequirements(input: ServiceOfferInput = {}) {
    this.status = "defining_fulfilment";
    return this.finish(this.manager.defineFulfilmentRequirements(input, this.config));
  }

  defineRequiredResources(input: ServiceOfferInput = {}) {
    this.status = "defining_fulfilment";
    return this.finish(this.manager.defineRequiredResources(input, this.config));
  }

  produceReport(input: ServiceOfferInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceServiceOfferReport(input: ServiceOfferInput = {}) {
    return this.produceReport(input);
  }

  submitReport(input: ServiceOfferInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ServiceOfferInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  private finish(report: ServiceOfferWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
