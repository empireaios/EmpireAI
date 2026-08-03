import type { CheckoutWorkerConfiguration } from "./configuration.js";
import { CheckoutBuilder } from "./checkout-builder.js";
import { CheckoutStore } from "./checkout-store.js";
import {
  CheckoutValidator,
  HealthMonitor,
  RecoveryManager,
} from "./checkout-validator.js";
import {
  IntegrationCoordinator,
  type CheckoutWorkerDependencies,
} from "./integrations.js";
import { appendCkwLog } from "./ckw-logging.js";
import {
  CHECKOUT_WORKER_ID,
  CKW_CAPABILITIES,
  CKW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  CheckoutContext,
  CheckoutReport,
  CheckoutWorkerCatalog,
  CheckoutWorkerEngineRecord,
  CheckoutWorkerInput,
  CheckoutWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class CheckoutManager {
  private engineRecord: CheckoutWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: CheckoutWorkerCatalog | null = null;
  private readonly store = new CheckoutStore();
  private readonly builder = new CheckoutBuilder();
  private readonly validator = new CheckoutValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: CheckoutContext = {};

  bindIntegrations(deps: CheckoutWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: CheckoutWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedCheckouts);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getCheckouts() {
    return this.store.list();
  }

  getLatestCheckoutId() {
    return this.store.getLatestCheckoutId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getContext() {
    return {
      ...this.context,
      customerPainPoints: [...(this.context.customerPainPoints ?? [])],
      preferredProviders: this.context.preferredProviders
        ? [...this.context.preferredProviders]
        : null,
    };
  }

  connect(
    _input: Record<string, unknown>,
    config: CheckoutWorkerConfiguration,
  ): CheckoutWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendCkwLog({
      event: "connect",
      details: `Checkout Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `ckw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Checkout Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CKW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedDigitalProductInformation(
    input: CheckoutWorkerInput,
    config: CheckoutWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.checkoutRulesEnabled) {
      return this.disabled(
        "receive_approved_digital_product_information",
        config,
        !config.enabled ? "Checkout Worker is disabled" : "Checkout rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(
        "receive_approved_digital_product_information",
        input,
        config,
        started,
      );
    }
    const enriched = this.integrations.enrichFromApprovedProductInformation(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    this.context = {
      ...this.context,
      receivedProductInformation: true,
      checkoutFlowType: this.builder.normalizeCheckoutFlow(
        enriched.checkoutFlowType ??
          this.context.checkoutFlowType ??
          config.defaultCheckoutFlow,
      ),
      productType: this.builder.normalizeProductType(
        enriched.productType ?? this.context.productType ?? config.defaultProductType,
      ),
      currency: enriched.currency ?? this.context.currency ?? config.defaultCurrency,
      preferredProviders:
        (enriched.preferredProviders as CheckoutContext["preferredProviders"]) ??
        this.context.preferredProviders ??
        null,
    };
    // Always materialize a fresh checkout shell for newly received product information.
    const checkout = this.builder.createCheckoutShell(enriched, config, this.context);
    this.store.save(checkout, "receive_approved_digital_product_information");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateCheckouts(
      [checkout],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompleteCheckout: true },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      checkout,
    );
    appendCkwLog({
      event: "receive_approved_digital_product_information",
      details: `researchReportId=${checkout.researchReportId ?? "none"} checkout=${checkout.checkoutId} flow=${checkout.checkoutFlowType}`,
    });
    return this.report(
      "receive_approved_digital_product_information",
      this.getCatalog(),
      [checkout],
      checkout,
      validation,
      started,
    );
  }

  generateCheckoutWorkflow(input: CheckoutWorkerInput, config: CheckoutWorkerConfiguration) {
    return this.runContentStage("generate_checkout_workflow", input, config, (checkout) => {
      const checkoutFlow = this.builder.generateCheckoutWorkflow(this.context, config);
      return {
        ...checkout,
        checkoutFlow,
        checkoutFlowType: checkoutFlow.flowType,
        checkoutFlowSteps: checkoutFlow.steps.map((s) => ({ ...s })),
        preservedDecisions: [
          ...checkout.preservedDecisions,
          {
            decisionId: `ckw-dec-workflow-${Date.now()}`,
            topic: checkout.productTitle,
            decision: `Generated checkout workflow (${checkoutFlow.steps.length} steps) for ${checkoutFlow.flowType}`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  preparePaymentProviderConfiguration(
    input: CheckoutWorkerInput,
    config: CheckoutWorkerConfiguration,
  ) {
    return this.runContentStage(
      "prepare_payment_provider_configuration",
      input,
      config,
      (checkout) => {
        const paymentProviderConfiguration =
          this.builder.preparePaymentProviderConfiguration(this.context, config);
        return {
          ...checkout,
          paymentProviderConfiguration,
          preservedDecisions: [
            ...checkout.preservedDecisions,
            {
              decisionId: `ckw-dec-payments-${Date.now()}`,
              topic: checkout.productTitle,
              decision: `Prepared structural payment provider configuration for ${paymentProviderConfiguration.provider} — no API keys or secrets`,
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
    );
  }

  generateOrderSummary(input: CheckoutWorkerInput, config: CheckoutWorkerConfiguration) {
    return this.runContentStage("generate_order_summary", input, config, (checkout) => {
      const orderSummary = this.builder.generateOrderSummary(this.context, config);
      return {
        ...checkout,
        orderSummary,
        preservedDecisions: [
          ...checkout.preservedDecisions,
          {
            decisionId: `ckw-dec-order-${Date.now()}`,
            topic: checkout.productTitle,
            decision: `Generated order summary (${orderSummary.lineItems.length} line items, ${orderSummary.currency} ${orderSummary.subtotal}) — structural only`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  generateCustomerConfirmationWorkflow(
    input: CheckoutWorkerInput,
    config: CheckoutWorkerConfiguration,
  ) {
    return this.runContentStage(
      "generate_customer_confirmation_workflow",
      input,
      config,
      (checkout) => {
        const confirmationWorkflow =
          this.builder.generateCustomerConfirmationWorkflow(this.context);
        return {
          ...checkout,
          confirmationWorkflow,
          preservedDecisions: [
            ...checkout.preservedDecisions,
            {
              decisionId: `ckw-dec-confirmation-${Date.now()}`,
              topic: checkout.productTitle,
              decision: `Generated customer confirmation workflow (${confirmationWorkflow.steps.length} steps)`,
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
    );
  }

  validateRequiredPurchaseInformation(
    input: CheckoutWorkerInput,
    config: CheckoutWorkerConfiguration,
  ) {
    return this.runContentStage(
      "validate_required_purchase_information",
      input,
      config,
      (checkout) => {
        const purchaseInfo = this.builder.validateRequiredPurchaseInformation(this.context);
        return {
          ...checkout,
          customerInformationRequirements: purchaseInfo.requirements,
          purchaseInformationValid: purchaseInfo.purchaseInformationValid,
          validationResults: {
            ...checkout.validationResults,
            errors: unique([
              ...checkout.validationResults.errors,
              ...purchaseInfo.errors,
            ]),
            warnings: unique([
              ...checkout.validationResults.warnings,
              ...purchaseInfo.warnings,
            ]),
            purchaseInformationValid: purchaseInfo.purchaseInformationValid,
            summary: purchaseInfo.purchaseInformationValid
              ? "Required purchase information validated"
              : "Required purchase information incomplete",
          },
          preservedDecisions: [
            ...checkout.preservedDecisions,
            {
              decisionId: `ckw-dec-purchase-info-${Date.now()}`,
              topic: checkout.productTitle,
              decision: `Validated purchase information requirements (${purchaseInfo.requirements.length} fields); valid=${purchaseInfo.purchaseInformationValid}`,
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
    );
  }

  preparePostPaymentHandoff(input: CheckoutWorkerInput, config: CheckoutWorkerConfiguration) {
    return this.runContentStage("prepare_post_payment_handoff", input, config, (checkout) => {
      const handoff = this.builder.preparePostPaymentHandoff(checkout);
      return {
        ...checkout,
        deliveryHandoffStatus: handoff.deliveryHandoffStatus,
        handoffTarget: handoff.handoffTarget,
        handoffTargetWorkerId: handoff.handoffTargetWorkerId,
        preservedDecisions: [
          ...checkout.preservedDecisions,
          {
            decisionId: `ckw-dec-handoff-${Date.now()}`,
            topic: checkout.productTitle,
            decision: handoff.notes,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  configurePaymentProviderAbstraction(
    input: CheckoutWorkerInput,
    config: CheckoutWorkerConfiguration,
  ) {
    return this.runContentStage(
      "configure_payment_provider_abstraction",
      input,
      config,
      (checkout) => {
        if (input.preferredProviders?.length) {
          this.context = {
            ...this.context,
            preferredProviders: input.preferredProviders as CheckoutContext["preferredProviders"],
          };
        }
        const abstraction = this.builder.configurePaymentProviderAbstraction(
          this.context,
          config,
        );
        const primary =
          abstraction.adapters[0] ??
          this.builder.preparePaymentProviderConfiguration(this.context, config);
        return {
          ...checkout,
          supportedProviders: abstraction.supportedProviders,
          paymentProviderConfiguration:
            checkout.paymentProviderConfiguration ?? primary,
          preservedDecisions: [
            ...checkout.preservedDecisions,
            {
              decisionId: `ckw-dec-providers-${Date.now()}`,
              topic: checkout.productTitle,
              decision: `Configured payment provider abstraction across ${abstraction.supportedProviders.length} providers (structural readiness only)`,
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
    );
  }

  validateCheckoutReadiness(input: CheckoutWorkerInput, config: CheckoutWorkerConfiguration) {
    return this.runContentStage(
      "validate_checkout_readiness",
      input,
      config,
      (checkout) => {
        const readiness = this.builder.validateCheckoutReadiness(checkout);
        const review = this.builder.performQualityReview(
          {
            ...checkout,
            checkoutReady: readiness.checkoutReady,
          },
          this.context,
        );
        return {
          ...checkout,
          checkoutReady: readiness.checkoutReady,
          validationResults: {
            summary: readiness.summary,
            errors: readiness.errors,
            warnings: readiness.warnings,
            purchaseInformationValid: checkout.purchaseInformationValid,
            checkoutReady: readiness.checkoutReady,
          },
          qualityReview: review.qualityReview,
          complianceReview: review.complianceReview,
          selfReviewPassed: review.passed,
          selfReviewFindings: review.findings,
          selfReviewSummary: review.summary,
          confidenceScore: review.confidenceScore,
          researchCompliance: review.researchCompliance,
          researchComplianceNotes: review.researchComplianceNotes,
          preservedDecisions: [
            ...checkout.preservedDecisions,
            {
              decisionId: `ckw-dec-readiness-${Date.now()}`,
              topic: checkout.productTitle,
              decision: readiness.summary,
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
      false,
    );
  }

  produceCheckoutReport(input: CheckoutWorkerInput, config: CheckoutWorkerConfiguration) {
    return this.runFullBuild("produce_checkout_report", input, config);
  }

  submitReport(input: CheckoutWorkerInput, config: CheckoutWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let checkouts = this.store.list();
    if (input.checkoutId) {
      const one = this.store.get(input.checkoutId);
      checkouts = one ? [one] : [];
    }
    if (!checkouts.length) {
      const generated = this.runFullBuild("produce_checkout_report", input, config);
      checkouts = generated.checkouts;
      if (!checkouts.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(checkouts);
    if (submission.submitted && submission.executiveReportId) {
      checkouts = checkouts.map(
        (r) => this.store.markSubmitted(r.checkoutId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = checkouts[checkouts.length - 1] ?? null;
    const validation = this.validator.validateCheckouts(
      checkouts.length ? checkouts : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) validation.warnings.push(submission.details);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    appendCkwLog({
      event: "submit_report",
      details: `checkouts=${checkouts.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      checkouts,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: CheckoutWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const checkouts = this.store.list();
    const latest = checkouts[checkouts.length - 1] ?? null;
    const validation = this.validator.validateCheckouts(
      checkouts.length ? checkouts : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), checkouts, latest, validation, started);
  }

  validate(input: CheckoutWorkerInput, config: CheckoutWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const checkouts = this.store.list();
    const latest = checkouts[checkouts.length - 1] ?? null;
    const validation = this.validator.validateCheckouts(
      checkouts.length ? checkouts : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("validate", this.getCatalog(), checkouts, latest, validation, started);
  }

  diagnostics(config: CheckoutWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Checkout Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendCkwLog({ event: "diagnostics", details: `checkouts=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runContentStage(
    action: CheckoutWorkerRunReport["action"],
    input: CheckoutWorkerInput,
    config: CheckoutWorkerConfiguration,
    mutate: (checkout: CheckoutReport) => CheckoutReport,
    allowIncomplete = true,
  ): CheckoutWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.checkoutRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Checkout Worker is disabled" : "Checkout rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedProductInformation(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const latest = this.ensureWorkingCheckout(enriched, config);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["No checkout available — approved product information required"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const updated: CheckoutReport = {
      ...mutate(latest),
      timestamp: new Date().toISOString(),
    };
    this.store.save(updated, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateCheckouts(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      allowIncomplete ? { allowIncompleteCheckout: true } : {},
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendCkwLog({
      event: action,
      details: `checkout=${updated.checkoutId} steps=${updated.checkoutFlow.steps.length} confidence=${updated.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [updated], updated, validation, started);
  }

  private runFullBuild(
    action: CheckoutWorkerRunReport["action"],
    input: CheckoutWorkerInput,
    config: CheckoutWorkerConfiguration,
  ): CheckoutWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.checkoutRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Checkout Worker is disabled" : "Checkout rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedProductInformation(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    if (enriched.researchReportId || enriched.researchTopic || enriched.productTitle) {
      this.context = { ...this.context, receivedProductInformation: true };
    }
    if (enriched.preferredProviders?.length) {
      this.context = {
        ...this.context,
        preferredProviders: enriched.preferredProviders as CheckoutContext["preferredProviders"],
      };
    }
    const readiness = this.builder.canBuildCheckout(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize(
        "fail",
        [readiness.reason ?? "Not ready"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const checkout = this.builder.buildCheckoutReport(enriched, config, this.context);
    this.store.save(checkout, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateCheckouts(
      [checkout],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      checkout,
    );
    appendCkwLog({
      event: action,
      details: `checkout=${checkout.checkoutId} flow=${checkout.checkoutFlowType} steps=${checkout.checkoutFlow.steps.length} confidence=${checkout.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [checkout], checkout, validation, started);
  }

  private ensureWorkingCheckout(
    input: CheckoutWorkerInput,
    config: CheckoutWorkerConfiguration,
  ): CheckoutReport | null {
    if (input.checkoutId) {
      const existing = this.store.get(input.checkoutId);
      if (existing) return existing;
    }
    const latest = this.store.list().at(-1);
    if (latest) return latest;
    const readiness = this.builder.canBuildCheckout(this.context);
    if (!readiness.ready) return null;
    const created = this.builder.createCheckoutShell(input, config, this.context);
    this.store.save(created, "bootstrap_checkout");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    return created;
  }

  private boundaryFail(
    action: CheckoutWorkerRunReport["action"],
    input: CheckoutWorkerInput,
    config: CheckoutWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateCheckouts(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: CheckoutWorkerRunReport["action"],
    config: CheckoutWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: CheckoutWorkerInput) {
    return (
      input.chargeCustomers === true ||
      input.executePaymentTransactions === true ||
      input.processPayments === true ||
      input.deliverProducts === true ||
      input.publishStorefronts === true ||
      input.storeSensitivePaymentCredentials === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ510OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: CheckoutWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: CheckoutReport | null = null,
  ) {
    const checkout = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `ckw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CHECKOUT_WORKER_ID,
      engineVersion: "PILLOW-CKW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...CKW_CAPABILITIES],
      totalCheckouts: this.store.count(),
      lastCheckoutId: checkout?.checkoutId ?? this.store.getLatestCheckoutId(),
      lastCheckoutFlowType: checkout?.checkoutFlowType ?? null,
      lastConfidenceScore: checkout?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: CKW_METADATA_VERSION,
    };
  }

  private report(
    action: CheckoutWorkerRunReport["action"],
    catalog: CheckoutWorkerCatalog | null,
    checkouts: CheckoutReport[],
    latestCheckout: CheckoutReport | null,
    validation: CheckoutWorkerRunReport["validation"],
    started: number,
  ): CheckoutWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      checkoutRunReportId: `ckw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      checkouts,
      latestCheckout,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: CKW_METADATA_VERSION,
    };
  }
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function cloneCatalog(catalog: CheckoutWorkerCatalog): CheckoutWorkerCatalog {
  return {
    ...catalog,
    checkouts: catalog.checkouts.map((report) => ({
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
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
