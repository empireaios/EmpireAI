import type { DigitalDeliveryWorkerConfiguration } from "./configuration.js";
import type { DigitalDeliveryWorkerDependencies } from "./integrations.js";
import { DigitalDeliveryManager } from "./digital-delivery-manager.js";
import type {
  EngineStatus,
  DigitalDeliveryWorkerInput,
  DigitalDeliveryWorkerRunReport,
} from "./types.js";

export class DigitalDeliveryWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: DigitalDeliveryWorkerRunReport | null = null;

  constructor(
    private readonly manager: DigitalDeliveryManager,
    private readonly config: DigitalDeliveryWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: DigitalDeliveryWorkerDependencies = {}) {
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
      supportedDeliveryTypes: [...this.config.supportedDeliveryTypes],
      supportedDeliveryMethods: [...this.config.supportedDeliveryMethods],
      reportingLine: [...this.config.reportingLine],
      seedDeliveries: this.config.seedDeliveries.map((report) => ({
        ...report,
        deliveredAssets: report.deliveredAssets.map((a) => ({ ...a })),
        accessGrants: report.accessGrants.map((g) => ({ ...g })),
        deliverySteps: report.deliverySteps.map((s) => ({ ...s })),
        supportedDeliveryMethods: [...report.supportedDeliveryMethods],
        supportedDeliveryTypes: [...report.supportedDeliveryTypes],
        secureDownloadLinks: report.secureDownloadLinks.map((l) => ({
          ...l,
          authorized: true as const,
          tokenPresent: false as const,
        })),
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

  receiveValidatedCheckoutCompletion(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveValidatedCheckoutCompletion(input, this.config));
  }

  verifyFulfilmentEligibility(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "verifying_eligibility";
    return this.finish(this.manager.verifyFulfilmentEligibility(input, this.config));
  }

  deliverPurchasedDigitalAssets(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "delivering_assets";
    return this.finish(this.manager.deliverPurchasedDigitalAssets(input, this.config));
  }

  grantProductAccess(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "granting_access";
    return this.finish(this.manager.grantProductAccess(input, this.config));
  }

  generateSecureDownloadLinks(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "generating_download_links";
    return this.finish(this.manager.generateSecureDownloadLinks(input, this.config));
  }

  trackDeliveryStatus(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "tracking_status";
    return this.finish(this.manager.trackDeliveryStatus(input, this.config));
  }

  handleDeliveryRetries(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "handling_retries";
    return this.finish(this.manager.handleDeliveryRetries(input, this.config));
  }

  detectFulfilmentFailures(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "detecting_failures";
    return this.finish(this.manager.detectFulfilmentFailures(input, this.config));
  }

  produceCustomerDeliveryConfirmations(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "confirming_delivery";
    return this.finish(this.manager.produceCustomerDeliveryConfirmations(input, this.config));
  }

  produceDigitalDeliveryReport(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceDigitalDeliveryReport(input, this.config));
  }

  submitReport(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: DigitalDeliveryWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: DigitalDeliveryWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
