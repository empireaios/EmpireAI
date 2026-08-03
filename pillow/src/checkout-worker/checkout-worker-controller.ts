import type { CheckoutWorkerConfiguration } from "./configuration.js";
import type { CheckoutWorkerDependencies } from "./integrations.js";
import { CheckoutManager } from "./checkout-manager.js";
import type {
  EngineStatus,
  CheckoutWorkerInput,
  CheckoutWorkerRunReport,
} from "./types.js";

export class CheckoutWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: CheckoutWorkerRunReport | null = null;

  constructor(
    private readonly manager: CheckoutManager,
    private readonly config: CheckoutWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: CheckoutWorkerDependencies = {}) {
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
      supportedCheckoutFlows: [...this.config.supportedCheckoutFlows],
      supportedProductTypes: [...this.config.supportedProductTypes],
      supportedPaymentProviders: [...this.config.supportedPaymentProviders],
      supportedFeatures: [...this.config.supportedFeatures],
      reportingLine: [...this.config.reportingLine],
      seedCheckouts: this.config.seedCheckouts.map((report) => ({
        ...report,
        checkoutFlow: {
          ...report.checkoutFlow,
          steps: report.checkoutFlow.steps.map((s) => ({ ...s })),
        },
        paymentProviderConfiguration: report.paymentProviderConfiguration
          ? {
              ...report.paymentProviderConfiguration,
              supportedMethods: [...report.paymentProviderConfiguration.supportedMethods],
              apiKeyPresent: false as const,
              secretsPresent: false as const,
            }
          : null,
        orderSummary: report.orderSummary
          ? {
              ...report.orderSummary,
              lineItems: report.orderSummary.lineItems.map((l) => ({ ...l })),
            }
          : null,
        customerInformationRequirements: [...report.customerInformationRequirements],
        validationResults: {
          ...report.validationResults,
          errors: [...report.validationResults.errors],
          warnings: [...report.validationResults.warnings],
        },
        checkoutFlowSteps: report.checkoutFlowSteps.map((s) => ({ ...s })),
        supportedProviders: [...report.supportedProviders],
        supportedFeatures: [...report.supportedFeatures],
        confirmationWorkflow: report.confirmationWorkflow
          ? {
              ...report.confirmationWorkflow,
              steps: report.confirmationWorkflow.steps.map((s) => ({ ...s })),
            }
          : null,
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

  receiveApprovedDigitalProductInformation(input: CheckoutWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(
      this.manager.receiveApprovedDigitalProductInformation(input, this.config),
    );
  }

  generateCheckoutWorkflow(input: CheckoutWorkerInput = {}) {
    this.status = "generating_workflow";
    return this.finish(this.manager.generateCheckoutWorkflow(input, this.config));
  }

  preparePaymentProviderConfiguration(input: CheckoutWorkerInput = {}) {
    this.status = "configuring_payments";
    return this.finish(this.manager.preparePaymentProviderConfiguration(input, this.config));
  }

  generateOrderSummary(input: CheckoutWorkerInput = {}) {
    this.status = "generating_order_summary";
    return this.finish(this.manager.generateOrderSummary(input, this.config));
  }

  generateCustomerConfirmationWorkflow(input: CheckoutWorkerInput = {}) {
    this.status = "generating_confirmation";
    return this.finish(this.manager.generateCustomerConfirmationWorkflow(input, this.config));
  }

  validateRequiredPurchaseInformation(input: CheckoutWorkerInput = {}) {
    this.status = "validating_purchase_info";
    return this.finish(this.manager.validateRequiredPurchaseInformation(input, this.config));
  }

  preparePostPaymentHandoff(input: CheckoutWorkerInput = {}) {
    this.status = "preparing_handoff";
    return this.finish(this.manager.preparePostPaymentHandoff(input, this.config));
  }

  configurePaymentProviderAbstraction(input: CheckoutWorkerInput = {}) {
    this.status = "configuring_providers";
    return this.finish(this.manager.configurePaymentProviderAbstraction(input, this.config));
  }

  validateCheckoutReadiness(input: CheckoutWorkerInput = {}) {
    this.status = "validating_readiness";
    return this.finish(this.manager.validateCheckoutReadiness(input, this.config));
  }

  produceCheckoutReport(input: CheckoutWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceCheckoutReport(input, this.config));
  }

  submitReport(input: CheckoutWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: CheckoutWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: CheckoutWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
