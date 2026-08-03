import type { DigitalDeliveryWorkerConfiguration } from "./configuration.js";
import { DigitalDeliveryBuilder } from "./digital-delivery-builder.js";
import { DigitalDeliveryStore } from "./digital-delivery-store.js";
import {
  DigitalDeliveryValidator,
  HealthMonitor,
  RecoveryManager,
} from "./digital-delivery-validator.js";
import {
  IntegrationCoordinator,
  type DigitalDeliveryWorkerDependencies,
} from "./integrations.js";
import { appendDdwLog } from "./ddw-logging.js";
import {
  DDW_CAPABILITIES,
  DDW_METADATA_VERSION,
  DIGITAL_DELIVERY_WORKER_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  DeliveryContext,
  DigitalDeliveryReport,
  DigitalDeliveryWorkerCatalog,
  DigitalDeliveryWorkerEngineRecord,
  DigitalDeliveryWorkerInput,
  DigitalDeliveryWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class DigitalDeliveryManager {
  private engineRecord: DigitalDeliveryWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: DigitalDeliveryWorkerCatalog | null = null;
  private readonly store = new DigitalDeliveryStore();
  private readonly builder = new DigitalDeliveryBuilder();
  private readonly validator = new DigitalDeliveryValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: DeliveryContext = {};

  bindIntegrations(deps: DigitalDeliveryWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: DigitalDeliveryWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedDeliveries);
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

  getDeliveries() {
    return this.store.list();
  }

  getLatestDeliveryId() {
    return this.store.getLatestDeliveryId();
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
      assetLabels: [...(this.context.assetLabels ?? [])],
    };
  }

  connect(
    _input: Record<string, unknown>,
    config: DigitalDeliveryWorkerConfiguration,
  ): DigitalDeliveryWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendDdwLog({
      event: "connect",
      details: `Digital Delivery Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `ddw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Digital Delivery Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: DDW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveValidatedCheckoutCompletion(
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.deliveryRulesEnabled) {
      return this.disabled(
        "receive_validated_checkout_completion",
        config,
        !config.enabled ? "Digital Delivery Worker is disabled" : "Delivery rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_validated_checkout_completion", input, config, started);
    }
    const enriched = this.integrations.enrichFromValidatedCheckoutCompletion(input);
    const { enrichment } = this.integrations.pullCheckoutContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    this.context = {
      ...this.context,
      receivedValidatedCheckout: true,
      checkoutCompletionValidated:
        enriched.checkoutCompletionValidated ?? this.context.checkoutCompletionValidated ?? true,
      deliveryType: this.builder.normalizeDeliveryType(
        enriched.deliveryType ?? this.context.deliveryType ?? config.defaultDeliveryType,
      ),
      deliveryMethod: this.builder.normalizeDeliveryMethod(
        enriched.deliveryMethod ?? this.context.deliveryMethod ?? config.defaultDeliveryMethod,
      ),
    };
    const delivery = this.builder.createDeliveryShell(enriched, config, this.context);
    this.store.save(delivery, "receive_validated_checkout_completion");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateDeliveries(
      [delivery],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompleteDelivery: true },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      delivery,
    );
    appendDdwLog({
      event: "receive_validated_checkout_completion",
      details: `checkoutId=${delivery.checkoutId ?? "none"} delivery=${delivery.deliveryId} type=${delivery.deliveryType}`,
    });
    return this.report(
      "receive_validated_checkout_completion",
      this.getCatalog(),
      [delivery],
      delivery,
      validation,
      started,
    );
  }

  verifyFulfilmentEligibility(
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
  ) {
    return this.runContentStage("verify_fulfilment_eligibility", input, config, (delivery) => {
      const eligibility = this.builder.verifyFulfilmentEligibility(this.context, delivery);
      return {
        ...delivery,
        eligibilityVerified: eligibility.eligibilityVerified,
        deliveryStatus: eligibility.deliveryStatus,
        deliverySteps: [...delivery.deliverySteps, ...eligibility.steps],
        preservedDecisions: [
          ...delivery.preservedDecisions,
          {
            decisionId: `ddw-dec-eligibility-${Date.now()}`,
            topic: delivery.productTitle,
            decision: `Fulfilment eligibility verified=${eligibility.eligibilityVerified} status=${eligibility.deliveryStatus}`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  deliverPurchasedDigitalAssets(
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
  ) {
    return this.runContentStage("deliver_purchased_digital_assets", input, config, (delivery) => {
      const assets = this.builder.deliverPurchasedDigitalAssets(this.context, delivery);
      return {
        ...delivery,
        deliveredAssets: assets.deliveredAssets,
        deliveryStatus: assets.deliveryStatus,
        deliverySteps: [...delivery.deliverySteps, ...assets.steps],
        preservedDecisions: [
          ...delivery.preservedDecisions,
          {
            decisionId: `ddw-dec-assets-${Date.now()}`,
            topic: delivery.productTitle,
            decision: `Delivered ${assets.deliveredAssets.length} digital asset(s) via ${delivery.deliveryMethod}`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  grantProductAccess(input: DigitalDeliveryWorkerInput, config: DigitalDeliveryWorkerConfiguration) {
    return this.runContentStage("grant_product_access", input, config, (delivery) => {
      const access = this.builder.grantProductAccess(this.context, delivery);
      return {
        ...delivery,
        accessGranted: access.accessGranted,
        accessGrants: access.accessGrants,
        deliveryStatus: access.deliveryStatus,
        deliverySteps: [...delivery.deliverySteps, ...access.steps],
        preservedDecisions: [
          ...delivery.preservedDecisions,
          {
            decisionId: `ddw-dec-access-${Date.now()}`,
            topic: delivery.productTitle,
            decision: `Granted ${access.accessGrants.length} access grant(s) — customer access protected`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  generateSecureDownloadLinks(
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
  ) {
    return this.runContentStage("generate_secure_download_links", input, config, (delivery) => {
      const links = this.builder.generateSecureDownloadLinks(delivery.deliveredAssets);
      return {
        ...delivery,
        secureDownloadLinks: links.secureDownloadLinks,
        deliveryStatus: links.deliveryStatus,
        deliverySteps: [...delivery.deliverySteps, ...links.steps],
        preservedDecisions: [
          ...delivery.preservedDecisions,
          {
            decisionId: `ddw-dec-links-${Date.now()}`,
            topic: delivery.productTitle,
            decision: `Generated ${links.secureDownloadLinks.length} secure download link placeholder(s) — no live tokens`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  trackDeliveryStatus(input: DigitalDeliveryWorkerInput, config: DigitalDeliveryWorkerConfiguration) {
    return this.runContentStage("track_delivery_status", input, config, (delivery) => {
      const status = this.builder.trackDeliveryStatus(delivery);
      return {
        ...delivery,
        deliveryStatus: status.deliveryStatus,
        deliverySteps: [...delivery.deliverySteps, ...status.steps],
        preservedDecisions: [
          ...delivery.preservedDecisions,
          {
            decisionId: `ddw-dec-status-${Date.now()}`,
            topic: delivery.productTitle,
            decision: status.summary,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  handleDeliveryRetries(input: DigitalDeliveryWorkerInput, config: DigitalDeliveryWorkerConfiguration) {
    return this.runContentStage("handle_delivery_retries", input, config, (delivery) => {
      const retries = this.builder.handleDeliveryRetries(delivery, config);
      return {
        ...delivery,
        retryStatus: retries.retryStatus,
        deliveryStatus: retries.deliveryStatus,
        deliverySteps: [...delivery.deliverySteps, ...retries.steps],
        preservedDecisions: [
          ...delivery.preservedDecisions,
          {
            decisionId: `ddw-dec-retry-${Date.now()}`,
            topic: delivery.productTitle,
            decision: retries.notes,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  detectFulfilmentFailures(
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
  ) {
    return this.runContentStage("detect_fulfilment_failures", input, config, (delivery) => {
      const failures = this.builder.detectFulfilmentFailures(delivery);
      return {
        ...delivery,
        deliveryStatus: failures.deliveryStatus,
        deliverySteps: [...delivery.deliverySteps, ...failures.steps],
        preservedDecisions: [
          ...delivery.preservedDecisions,
          {
            decisionId: `ddw-dec-failures-${Date.now()}`,
            topic: delivery.productTitle,
            decision:
              failures.failures.length > 0
                ? `Detected failures: ${failures.failures.join("; ")}`
                : "No fulfilment failures detected",
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  produceCustomerDeliveryConfirmations(
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
  ) {
    return this.runContentStage(
      "produce_customer_delivery_confirmations",
      input,
      config,
      (delivery) => {
        const confirmation = this.builder.produceCustomerDeliveryConfirmations(delivery);
        return {
          ...delivery,
          fulfilmentConfirmation: confirmation.fulfilmentConfirmation,
          deliveryStatus: confirmation.deliveryStatus,
          deliverySteps: [...delivery.deliverySteps, ...confirmation.steps],
          preservedDecisions: [
            ...delivery.preservedDecisions,
            {
              decisionId: `ddw-dec-confirmation-${Date.now()}`,
              topic: delivery.productTitle,
              decision: confirmation.fulfilmentConfirmation.customerFacingSummary,
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
    );
  }

  produceDigitalDeliveryReport(
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
  ) {
    return this.runFullBuild("produce_digital_delivery_report", input, config);
  }

  submitReport(input: DigitalDeliveryWorkerInput, config: DigitalDeliveryWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let deliveries = this.store.list();
    if (input.deliveryId) {
      const one = this.store.get(input.deliveryId);
      deliveries = one ? [one] : [];
    }
    if (!deliveries.length) {
      const generated = this.runFullBuild("produce_digital_delivery_report", input, config);
      deliveries = generated.deliveries;
      if (!deliveries.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(deliveries);
    if (submission.submitted && submission.executiveReportId) {
      deliveries = deliveries.map(
        (r) => this.store.markSubmitted(r.deliveryId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = deliveries[deliveries.length - 1] ?? null;
    const validation = this.validator.validateDeliveries(
      deliveries.length ? deliveries : null,
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
    appendDdwLog({
      event: "submit_report",
      details: `deliveries=${deliveries.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      deliveries,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: DigitalDeliveryWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const deliveries = this.store.list();
    const latest = deliveries[deliveries.length - 1] ?? null;
    const validation = this.validator.validateDeliveries(
      deliveries.length ? deliveries : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), deliveries, latest, validation, started);
  }

  validate(input: DigitalDeliveryWorkerInput, config: DigitalDeliveryWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const deliveries = this.store.list();
    const latest = deliveries[deliveries.length - 1] ?? null;
    const validation = this.validator.validateDeliveries(
      deliveries.length ? deliveries : null,
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
    return this.report("validate", this.getCatalog(), deliveries, latest, validation, started);
  }

  diagnostics(config: DigitalDeliveryWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Digital Delivery Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendDdwLog({ event: "diagnostics", details: `deliveries=${this.store.count()}` });
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
    action: DigitalDeliveryWorkerRunReport["action"],
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
    mutate: (delivery: DigitalDeliveryReport) => DigitalDeliveryReport,
    allowIncomplete = true,
  ): DigitalDeliveryWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.deliveryRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Digital Delivery Worker is disabled" : "Delivery rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromValidatedCheckoutCompletion(input);
    const { enrichment } = this.integrations.pullCheckoutContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const latest = this.ensureWorkingDelivery(enriched, config);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["No delivery available — validated checkout completion required"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const updated: DigitalDeliveryReport = {
      ...mutate(latest),
      timestamp: new Date().toISOString(),
    };
    this.store.save(updated, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateDeliveries(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      allowIncomplete ? { allowIncompleteDelivery: true } : {},
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendDdwLog({
      event: action,
      details: `delivery=${updated.deliveryId} status=${updated.deliveryStatus} confidence=${updated.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [updated], updated, validation, started);
  }

  private runFullBuild(
    action: DigitalDeliveryWorkerRunReport["action"],
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
  ): DigitalDeliveryWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.deliveryRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Digital Delivery Worker is disabled" : "Delivery rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromValidatedCheckoutCompletion(input);
    const { enrichment } = this.integrations.pullCheckoutContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    if (enriched.checkoutId || enriched.orderId || enriched.checkoutCompletionValidated) {
      this.context = { ...this.context, receivedValidatedCheckout: true };
    }
    const readiness = this.builder.canBuildDelivery(this.context);
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
    const delivery = this.builder.buildDigitalDeliveryReport(enriched, config, this.context);
    this.store.save(delivery, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateDeliveries(
      [delivery],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      delivery,
    );
    appendDdwLog({
      event: action,
      details: `delivery=${delivery.deliveryId} type=${delivery.deliveryType} assets=${delivery.deliveredAssets.length} confidence=${delivery.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [delivery], delivery, validation, started);
  }

  private ensureWorkingDelivery(
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
  ): DigitalDeliveryReport | null {
    if (input.deliveryId) {
      const existing = this.store.get(input.deliveryId);
      if (existing) return existing;
    }
    const latest = this.store.list().at(-1);
    if (latest) return latest;
    const readiness = this.builder.canBuildDelivery(this.context);
    if (!readiness.ready) return null;
    const created = this.builder.createDeliveryShell(input, config, this.context);
    this.store.save(created, "bootstrap_delivery");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    return created;
  }

  private boundaryFail(
    action: DigitalDeliveryWorkerRunReport["action"],
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateDeliveries(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: DigitalDeliveryWorkerRunReport["action"],
    config: DigitalDeliveryWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: DigitalDeliveryWorkerInput) {
    return (
      input.processPayments === true ||
      input.createProducts === true ||
      input.publishStorefronts === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ511OrLater === true ||
      input.exposeUnauthorizedAccess === true ||
      input.bypassPillowGovernance === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: DigitalDeliveryWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: DigitalDeliveryReport | null = null,
  ) {
    const delivery = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `ddw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: DIGITAL_DELIVERY_WORKER_ID,
      engineVersion: "PILLOW-DDW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...DDW_CAPABILITIES],
      totalDeliveries: this.store.count(),
      lastDeliveryId: delivery?.deliveryId ?? this.store.getLatestDeliveryId(),
      lastDeliveryType: delivery?.deliveryType ?? null,
      lastConfidenceScore: delivery?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: DDW_METADATA_VERSION,
    };
  }

  private report(
    action: DigitalDeliveryWorkerRunReport["action"],
    catalog: DigitalDeliveryWorkerCatalog | null,
    deliveries: DigitalDeliveryReport[],
    latestDelivery: DigitalDeliveryReport | null,
    validation: DigitalDeliveryWorkerRunReport["validation"],
    started: number,
  ): DigitalDeliveryWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      deliveryRunReportId: `ddw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      deliveries,
      latestDelivery,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: DDW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: DigitalDeliveryWorkerCatalog): DigitalDeliveryWorkerCatalog {
  return {
    ...catalog,
    deliveries: catalog.deliveries.map((report) => ({
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
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
