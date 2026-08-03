import type { PricingWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type PricingWorkerDependencies,
} from "./integrations.js";
import { appendPrwLog } from "./prw-logging.js";
import {
  INTEGRATION_TARGETS,
  PRW_CAPABILITIES,
  PRW_METADATA_VERSION,
  PRICING_WORKER_ID,
} from "./paths.js";
import { PricingBuilder } from "./pricing-builder.js";
import { PricingStore } from "./pricing-store.js";
import { HealthMonitor, PricingValidator, RecoveryManager } from "./pricing-validator.js";
import type {
  ApprovedProductPricingInput,
  IntegrationHandshake,
  OperationalState,
  PricingReport,
  PricingWorkerCatalog,
  PricingWorkerEngineRecord,
  PricingWorkerInput,
  PricingWorkerRunReport,
} from "./types.js";

export class PricingManager {
  private engineRecord: PricingWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: PricingWorkerCatalog | null = null;
  private readonly store = new PricingStore();
  private readonly builder = new PricingBuilder();
  private readonly validator = new PricingValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingProduct: ApprovedProductPricingInput | null = null;
  private pendingContext: PricingWorkerInput = {};

  bindIntegrations(deps: PricingWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: PricingWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedPricingReports);
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

  getPricingReports() {
    return this.store.list();
  }

  getLatestPricingId() {
    return this.store.getLatestPricingId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: PricingWorkerConfiguration,
  ): PricingWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendPrwLog({
      event: "connect",
      details: `Pricing Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `prw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Pricing Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: PRW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedProducts(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_approved_products", input, config, started);
    }
    const enriched = this.integrations.enrichFromListings(input);
    const product =
      this.integrations.pullApprovedProduct(enriched) ?? this.builder.resolveProduct(enriched);
    if (!product.productId?.trim() && !product.productName?.trim()) {
      return this.disabled(
        "receive_approved_products",
        config,
        "No approved products received — provide approvedProduct / productId / productName or bind Product Listing Worker",
      );
    }
    this.pendingProduct = product;
    this.pendingContext = enriched;
    const validation = this.validator.finalize(
      "pass",
      [],
      [`Received approved product ${product.productName ?? product.productId}`],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendPrwLog({
      event: "receive_approved_products",
      details: `product=${product.productId ?? product.productName}`,
    });
    return this.report(
      "receive_approved_products",
      this.getCatalog(),
      [],
      null,
      { ...validation, decision: "partial" },
      started,
    );
  }

  receiveSupplierCosts(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_supplier_costs", input, config, started);
    }
    const enriched = this.integrations.enrichFromListings({
      ...this.pendingContext,
      ...input,
    });
    const product = this.builder.resolveProduct({
      ...enriched,
      approvedProduct: {
        ...(this.pendingProduct ?? {}),
        ...(enriched.approvedProduct ?? {}),
        supplierCost: enriched.supplierCost ?? enriched.approvedProduct?.supplierCost,
        shippingCost: enriched.shippingCost ?? enriched.approvedProduct?.shippingCost,
      },
    });
    if (product.supplierCost == null && input.supplierCost == null) {
      return this.disabled(
        "receive_supplier_costs",
        config,
        "No supplier cost information received — provide supplierCost",
      );
    }
    this.pendingProduct = product;
    this.pendingContext = enriched;
    const validation = this.validator.finalize(
      "pass",
      [],
      [`Received supplier cost ${product.supplierCost} (${product.supplierCostKind ?? "actual"})`],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendPrwLog({
      event: "receive_supplier_costs",
      details: `supplierCost=${product.supplierCost}`,
    });
    return this.report(
      "receive_supplier_costs",
      this.getCatalog(),
      [],
      null,
      { ...validation, decision: "partial" },
      started,
    );
  }

  calculateLandedCost(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    return this.runPricing("calculate_landed_cost", input, config);
  }

  calculateMarketplaceFees(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    return this.runPricing("calculate_marketplace_fees", input, config);
  }

  calculatePaymentFees(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    return this.runPricing("calculate_payment_fees", input, config);
  }

  calculateAdvertising(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    return this.runPricing("calculate_advertising", input, config);
  }

  calculateShipping(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    return this.runPricing("calculate_shipping", input, config);
  }

  calculateTargetMargin(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    return this.runPricing("calculate_target_margin", input, config);
  }

  calculateTargetProfit(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    return this.runPricing("calculate_target_profit", input, config);
  }

  compareCompetitors(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    return this.runPricing("compare_competitors", input, config);
  }

  recommendSellingPrice(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    return this.runPricing("recommend_selling_price", input, config);
  }

  produceReport(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    return this.runPricing("produce_report", input, config);
  }

  submitFindings(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_findings", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_findings",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let reports = this.store.list();
    if (input.pricingId) {
      const one = this.store.get(input.pricingId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runPricing("produce_report", input, config);
      reports = generated.pricingReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitFindings(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.pricingId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
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
    appendPrwLog({
      event: "submit_findings",
      details: `reports=${reports.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_findings",
      this.getCatalog(),
      reports,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: PricingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), reports, latest, validation, started);
  }

  validate(input: PricingWorkerInput, config: PricingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
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
    return this.report("validate", this.getCatalog(), reports, latest, validation, started);
  }

  diagnostics(config: PricingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Pricing Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendPrwLog({ event: "diagnostics", details: `reports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runPricing(
    action: PricingWorkerRunReport["action"],
    input: PricingWorkerInput,
    config: PricingWorkerConfiguration,
  ): PricingWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.pricingRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Pricing Worker is disabled" : "Pricing rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const enriched = this.integrations.enrichFromListings({
      ...this.pendingContext,
      ...input,
      approvedProduct: {
        ...(this.pendingProduct ?? {}),
        ...(input.approvedProduct ?? {}),
      },
    });
    const product =
      this.integrations.pullApprovedProduct(enriched) ?? this.builder.resolveProduct(enriched);
    if (!product.productId?.trim() && !product.productName?.trim()) {
      return this.disabled(
        action,
        config,
        "Pricing requires approved products (approvedProduct / productId / productName)",
      );
    }
    this.pendingProduct = product;
    this.pendingContext = enriched;

    const report = this.builder.buildReport(enriched, config, product);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateReports(
      [report],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendPrwLog({
      event: action,
      details: `pricing=${report.pricingId} recommended=${report.recommendedSellingPrice} margin=${report.targetMargin}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: PricingWorkerRunReport["action"],
    input: PricingWorkerInput,
    config: PricingWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: PricingWorkerRunReport["action"],
    config: PricingWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: PricingWorkerInput) {
    return (
      input.publishListings === true ||
      input.modifySupplierCosts === true ||
      input.executePromotions === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ310OrLater === true ||
      input.publishPricing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: PricingWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: PricingReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `prw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PRICING_WORKER_ID,
      engineVersion: "PILLOW-PRW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...PRW_CAPABILITIES],
      totalPricingReports: this.store.count(),
      lastPricingId: report?.pricingId ?? this.store.getLatestPricingId(),
      lastRecommendedPrice: report?.recommendedSellingPrice ?? null,
      lastTargetMargin: report?.targetMargin ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: PRW_METADATA_VERSION,
    };
  }

  private report(
    action: PricingWorkerRunReport["action"],
    catalog: PricingWorkerCatalog | null,
    pricingReports: PricingReport[],
    latestPricingReport: PricingReport | null,
    validation: PricingWorkerRunReport["validation"],
    started: number,
  ): PricingWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      pricingRunReportId: `prw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      pricingReports,
      latestPricingReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PRW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: PricingWorkerCatalog): PricingWorkerCatalog {
  return {
    ...catalog,
    pricingReports: catalog.pricingReports.map((report) => ({
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
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
