import type { PricingWorkerConfiguration } from "./configuration.js";
import type { PricingWorkerDependencies } from "./integrations.js";
import { PricingManager } from "./pricing-manager.js";
import type {
  EngineStatus,
  PricingWorkerInput,
  PricingWorkerRunReport,
} from "./types.js";

export class PricingWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: PricingWorkerRunReport | null = null;

  constructor(
    private readonly manager: PricingManager,
    private readonly config: PricingWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: PricingWorkerDependencies = {}) {
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
      marketplaceTargets: [...this.config.marketplaceTargets],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedPricingReports: this.config.seedPricingReports.map((report) => ({
        ...report,
        supplierCost: { ...report.supplierCost },
        shippingCost: { ...report.shippingCost },
        marketplaceFees: { ...report.marketplaceFees },
        paymentFees: { ...report.paymentFees },
        advertisingAllocation: { ...report.advertisingAllocation },
        totalLandedCost: { ...report.totalLandedCost },
        targetProfit: { ...report.targetProfit },
        competitorPricing: report.competitorPricing.map((c) => ({ ...c })),
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

  receiveApprovedProducts(input: PricingWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedProducts(input, this.config));
  }

  receiveSupplierCosts(input: PricingWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveSupplierCosts(input, this.config));
  }

  calculateLandedCost(input: PricingWorkerInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.calculateLandedCost(input, this.config));
  }

  calculateMarketplaceFees(input: PricingWorkerInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.calculateMarketplaceFees(input, this.config));
  }

  calculatePaymentFees(input: PricingWorkerInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.calculatePaymentFees(input, this.config));
  }

  calculateAdvertising(input: PricingWorkerInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.calculateAdvertising(input, this.config));
  }

  calculateShipping(input: PricingWorkerInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.calculateShipping(input, this.config));
  }

  calculateTargetMargin(input: PricingWorkerInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.calculateTargetMargin(input, this.config));
  }

  calculateTargetProfit(input: PricingWorkerInput = {}) {
    this.status = "calculating";
    return this.finish(this.manager.calculateTargetProfit(input, this.config));
  }

  compareCompetitors(input: PricingWorkerInput = {}) {
    this.status = "comparing";
    return this.finish(this.manager.compareCompetitors(input, this.config));
  }

  recommendSellingPrice(input: PricingWorkerInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommendSellingPrice(input, this.config));
  }

  produceReport(input: PricingWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: PricingWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: PricingWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: PricingWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
