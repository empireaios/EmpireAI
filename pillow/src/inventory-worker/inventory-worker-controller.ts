import type { InventoryWorkerConfiguration } from "./configuration.js";
import type { InventoryWorkerDependencies } from "./integrations.js";
import { InventoryManager } from "./inventory-manager.js";
import type {
  EngineStatus,
  InventoryWorkerInput,
  InventoryWorkerRunReport,
} from "./types.js";

export class InventoryWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: InventoryWorkerRunReport | null = null;

  constructor(
    private readonly manager: InventoryManager,
    private readonly config: InventoryWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: InventoryWorkerDependencies = {}) {
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
      seedInventoryReports: this.config.seedInventoryReports.map((report) => ({
        ...report,
        inventoryAlerts: report.inventoryAlerts.map((a) => ({ ...a })),
        supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
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

  receiveApprovedProducts(input: InventoryWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedProducts(input, this.config));
  }

  monitorSupplierStock(input: InventoryWorkerInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorSupplierStock(input, this.config));
  }

  monitorInventoryQuantities(input: InventoryWorkerInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorInventoryQuantities(input, this.config));
  }

  monitorLeadTimes(input: InventoryWorkerInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorLeadTimes(input, this.config));
  }

  monitorSupplierAvailability(input: InventoryWorkerInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorSupplierAvailability(input, this.config));
  }

  calculateReorderPoints(input: InventoryWorkerInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.calculateReorderPoints(input, this.config));
  }

  detectLowStock(input: InventoryWorkerInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectLowStock(input, this.config));
  }

  detectOutOfStock(input: InventoryWorkerInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectOutOfStock(input, this.config));
  }

  detectAbnormalChanges(input: InventoryWorkerInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectAbnormalChanges(input, this.config));
  }

  generateAlerts(input: InventoryWorkerInput = {}) {
    this.status = "alerting";
    return this.finish(this.manager.generateAlerts(input, this.config));
  }

  produceReport(input: InventoryWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: InventoryWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: InventoryWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: InventoryWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
