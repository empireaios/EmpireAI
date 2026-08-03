import type { SupplierDiscoveryWorkerConfiguration } from "./configuration.js";
import type { SupplierDiscoveryWorkerDependencies } from "./integrations.js";
import { DiscoveryManager } from "./discovery-manager.js";
import type {
  EngineStatus,
  SupplierDiscoveryWorkerInput,
  SupplierDiscoveryWorkerRunReport,
} from "./types.js";

export class SupplierDiscoveryWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: SupplierDiscoveryWorkerRunReport | null = null;

  constructor(
    private readonly manager: DiscoveryManager,
    private readonly config: SupplierDiscoveryWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: SupplierDiscoveryWorkerDependencies = {}) {
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
      approvedSupplierPlatforms: [...this.config.approvedSupplierPlatforms],
      approvedSupplierApis: [...this.config.approvedSupplierApis],
      discoveryChannels: [...this.config.discoveryChannels],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedDiscoveries: this.config.seedDiscoveries.map((discovery) => ({
        ...discovery,
        fieldAvailability: { ...discovery.fieldAvailability },
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

  receiveApprovedProducts(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedProducts(input, this.config));
  }

  searchPlatforms(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "searching";
    return this.finish(this.manager.searchPlatforms(input, this.config));
  }

  searchApis(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "searching";
    return this.finish(this.manager.searchApis(input, this.config));
  }

  discoverCandidates(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.discoverCandidates(input, this.config));
  }

  captureProductInformation(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.captureProductInformation(input, this.config));
  }

  capturePricing(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.capturePricing(input, this.config));
  }

  captureMoq(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.captureMoq(input, this.config));
  }

  captureShipping(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.captureShipping(input, this.config));
  }

  captureLocation(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.captureLocation(input, this.config));
  }

  produceReport(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: SupplierDiscoveryWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: SupplierDiscoveryWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
