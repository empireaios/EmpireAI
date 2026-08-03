import type { InventoryWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type InventoryWorkerDependencies,
} from "./integrations.js";
import { appendInwLog } from "./inw-logging.js";
import {
  INTEGRATION_TARGETS,
  INW_CAPABILITIES,
  INW_METADATA_VERSION,
  INVENTORY_WORKER_ID,
} from "./paths.js";
import { InventoryBuilder } from "./inventory-builder.js";
import { InventoryStore } from "./inventory-store.js";
import {
  HealthMonitor,
  InventoryValidator,
  RecoveryManager,
} from "./inventory-validator.js";
import type {
  ApprovedProductInventoryInput,
  IntegrationHandshake,
  InventoryReport,
  InventoryWorkerCatalog,
  InventoryWorkerEngineRecord,
  InventoryWorkerInput,
  InventoryWorkerRunReport,
  OperationalState,
} from "./types.js";

export class InventoryManager {
  private engineRecord: InventoryWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: InventoryWorkerCatalog | null = null;
  private readonly store = new InventoryStore();
  private readonly builder = new InventoryBuilder();
  private readonly validator = new InventoryValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingProduct: ApprovedProductInventoryInput | null = null;
  private pendingContext: InventoryWorkerInput = {};

  bindIntegrations(deps: InventoryWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: InventoryWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedInventoryReports);
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

  getInventoryReports() {
    return this.store.list();
  }

  getLatestInventoryReportId() {
    return this.store.getLatestInventoryReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: InventoryWorkerConfiguration,
  ): InventoryWorkerRunReport {
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
    appendInwLog({
      event: "connect",
      details: `Inventory Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `inw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Inventory Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: INW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedProducts(input: InventoryWorkerInput, config: InventoryWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_approved_products", input, config, started);
    }
    const enriched = this.integrations.enrichFromEvaluations(input);
    const product =
      this.integrations.pullApprovedProduct(enriched) ?? this.builder.resolveProduct(enriched);
    if (!product.productId?.trim() && !product.productName?.trim()) {
      return this.disabled(
        "receive_approved_products",
        config,
        "No approved products received — provide approvedProduct / productId / productName or bind Supplier Evaluation Worker",
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
    appendInwLog({
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

  monitorSupplierStock(input: InventoryWorkerInput, config: InventoryWorkerConfiguration) {
    return this.runInventory("monitor_supplier_stock", input, config);
  }

  monitorInventoryQuantities(
    input: InventoryWorkerInput,
    config: InventoryWorkerConfiguration,
  ) {
    return this.runInventory("monitor_inventory_quantities", input, config);
  }

  monitorLeadTimes(input: InventoryWorkerInput, config: InventoryWorkerConfiguration) {
    return this.runInventory("monitor_lead_times", input, config);
  }

  monitorSupplierAvailability(
    input: InventoryWorkerInput,
    config: InventoryWorkerConfiguration,
  ) {
    return this.runInventory("monitor_supplier_availability", input, config);
  }

  calculateReorderPoints(input: InventoryWorkerInput, config: InventoryWorkerConfiguration) {
    return this.runInventory("calculate_reorder_points", input, config);
  }

  detectLowStock(input: InventoryWorkerInput, config: InventoryWorkerConfiguration) {
    return this.runInventory("detect_low_stock", input, config);
  }

  detectOutOfStock(input: InventoryWorkerInput, config: InventoryWorkerConfiguration) {
    return this.runInventory("detect_out_of_stock", input, config);
  }

  detectAbnormalChanges(input: InventoryWorkerInput, config: InventoryWorkerConfiguration) {
    return this.runInventory("detect_abnormal_changes", input, config);
  }

  generateAlerts(input: InventoryWorkerInput, config: InventoryWorkerConfiguration) {
    return this.runInventory("generate_alerts", input, config);
  }

  produceReport(input: InventoryWorkerInput, config: InventoryWorkerConfiguration) {
    return this.runInventory("produce_report", input, config);
  }

  submitFindings(input: InventoryWorkerInput, config: InventoryWorkerConfiguration) {
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
    if (input.inventoryReportId) {
      const one = this.store.get(input.inventoryReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runInventory("produce_report", input, config);
      reports = generated.inventoryReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitFindings(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) =>
          this.store.markSubmitted(r.inventoryReportId, submission.executiveReportId!) ?? r,
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
    appendInwLog({
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

  list(config: InventoryWorkerConfiguration) {
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

  validate(input: InventoryWorkerInput, config: InventoryWorkerConfiguration) {
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

  diagnostics(config: InventoryWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Inventory Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendInwLog({ event: "diagnostics", details: `reports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runInventory(
    action: InventoryWorkerRunReport["action"],
    input: InventoryWorkerInput,
    config: InventoryWorkerConfiguration,
  ): InventoryWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.inventoryRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Inventory Worker is disabled" : "Inventory rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const enriched = this.integrations.enrichFromEvaluations({
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
        "Inventory requires approved products (approvedProduct / productId / productName)",
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
    appendInwLog({
      event: action,
      details: `inventory=${report.inventoryReportId} stock=${report.currentStock} status=${report.stockStatus} reorder=${report.reorderPoint}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: InventoryWorkerRunReport["action"],
    input: InventoryWorkerInput,
    config: InventoryWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: InventoryWorkerRunReport["action"],
    config: InventoryWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: InventoryWorkerInput) {
    return (
      input.purchaseInventory === true ||
      input.modifySupplierStock === true ||
      input.placeSupplierOrders === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ311OrLater === true ||
      input.modifySupplierInventory === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: InventoryWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: InventoryReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `inw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: INVENTORY_WORKER_ID,
      engineVersion: "PILLOW-INW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...INW_CAPABILITIES],
      totalInventoryReports: this.store.count(),
      lastInventoryReportId: report?.inventoryReportId ?? this.store.getLatestInventoryReportId(),
      lastStockStatus: report?.stockStatus ?? null,
      lastReorderPoint: report?.reorderPoint ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: INW_METADATA_VERSION,
    };
  }

  private report(
    action: InventoryWorkerRunReport["action"],
    catalog: InventoryWorkerCatalog | null,
    inventoryReports: InventoryReport[],
    latestInventoryReport: InventoryReport | null,
    validation: InventoryWorkerRunReport["validation"],
    started: number,
  ): InventoryWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      inventoryRunReportId: `inw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      inventoryReports,
      latestInventoryReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: INW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: InventoryWorkerCatalog): InventoryWorkerCatalog {
  return {
    ...catalog,
    inventoryReports: catalog.inventoryReports.map((report) => ({
      ...report,
      inventoryAlerts: report.inventoryAlerts.map((a) => ({ ...a })),
      supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
