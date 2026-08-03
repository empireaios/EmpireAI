import type { OrderWorkerConfiguration } from "./configuration.js";
import type { OrderWorkerDependencies } from "./integrations.js";
import { OrderManager } from "./order-manager.js";
import type {
  EngineStatus,
  OrderWorkerInput,
  OrderWorkerRunReport,
} from "./types.js";

export class OrderWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: OrderWorkerRunReport | null = null;

  constructor(
    private readonly manager: OrderManager,
    private readonly config: OrderWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: OrderWorkerDependencies = {}) {
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
      seedOrderReports: this.config.seedOrderReports.map((report) => ({
        ...report,
        exceptions: report.exceptions.map((e) => ({ ...e })),
        customerUpdates: report.customerUpdates.map((u) => ({ ...u })),
        escalations: report.escalations.map((e) => ({ ...e })),
        fulfilmentHistory: report.fulfilmentHistory.map((h) => ({ ...h })),
        orderHistory: report.orderHistory.map((h) => ({ ...h })),
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

  receiveConfirmedOrders(input: OrderWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveConfirmedOrders(input, this.config));
  }

  routeToSupplier(input: OrderWorkerInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.routeToSupplier(input, this.config));
  }

  trackFulfilment(input: OrderWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackFulfilment(input, this.config));
  }

  trackShipment(input: OrderWorkerInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackShipment(input, this.config));
  }

  detectExceptions(input: OrderWorkerInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectExceptions(input, this.config));
  }

  detectDelayed(input: OrderWorkerInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectDelayed(input, this.config));
  }

  detectFailedFulfilment(input: OrderWorkerInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectFailedFulfilment(input, this.config));
  }

  generateCustomerUpdates(input: OrderWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.generateCustomerUpdates(input, this.config));
  }

  escalateIssues(input: OrderWorkerInput = {}) {
    this.status = "escalating";
    return this.finish(this.manager.escalateIssues(input, this.config));
  }

  maintainHistory(input: OrderWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.maintainHistory(input, this.config));
  }

  produceReport(input: OrderWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: OrderWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: OrderWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: OrderWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
