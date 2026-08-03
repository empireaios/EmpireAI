import type { ProductDiscoveryWorkerConfiguration } from "./configuration.js";
import type { ProductDiscoveryWorkerDependencies } from "./integrations.js";
import { DiscoveryManager } from "./discovery-manager.js";
import type {
  EngineStatus,
  ProductDiscoveryWorkerInput,
  ProductDiscoveryWorkerRunReport,
} from "./types.js";

export class ProductDiscoveryWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: ProductDiscoveryWorkerRunReport | null = null;

  constructor(
    private readonly manager: DiscoveryManager,
    private readonly config: ProductDiscoveryWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ProductDiscoveryWorkerDependencies = {}) {
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
      approvedMarketplaces: [...this.config.approvedMarketplaces],
      approvedSupplierPlatforms: [...this.config.approvedSupplierPlatforms],
      discoverySources: [...this.config.discoverySources],
      productCategories: [...this.config.productCategories],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedDiscoveries: this.config.seedDiscoveries.map((discovery) => ({
        ...discovery,
        searchTrendSignals: [...discovery.searchTrendSignals],
        customerDemandSignals: [...discovery.customerDemandSignals],
        facts: [...discovery.facts],
        assumptions: [...discovery.assumptions],
        supportingEvidence: discovery.supportingEvidence.map((e) => ({ ...e })),
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

  discoverMarketplaces(input: ProductDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.discoverMarketplaces(input, this.config));
  }

  discoverSuppliers(input: ProductDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.discoverSuppliers(input, this.config));
  }

  discoverSearchTrends(input: ProductDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.discoverSearchTrends(input, this.config));
  }

  discoverCustomerDemand(input: ProductDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.discoverCustomerDemand(input, this.config));
  }

  discoverSeasonal(input: ProductDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.discoverSeasonal(input, this.config));
  }

  detectEmergingTrends(input: ProductDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.detectEmergingTrends(input, this.config));
  }

  detectDecliningProducts(input: ProductDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.detectDecliningProducts(input, this.config));
  }

  categorizeProducts(input: ProductDiscoveryWorkerInput = {}) {
    this.status = "categorizing";
    return this.finish(this.manager.categorizeProducts(input, this.config));
  }

  produceReport(input: ProductDiscoveryWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: ProductDiscoveryWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ProductDiscoveryWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ProductDiscoveryWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
