import type { OrderWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type OrderWorkerDependencies,
} from "./integrations.js";
import { appendOrwLog } from "./orw-logging.js";
import {
  INTEGRATION_TARGETS,
  ORW_CAPABILITIES,
  ORW_METADATA_VERSION,
  ORDER_WORKER_ID,
} from "./paths.js";
import { OrderBuilder } from "./order-builder.js";
import { OrderStore } from "./order-store.js";
import {
  HealthMonitor,
  OrderValidator,
  RecoveryManager,
} from "./order-validator.js";
import type {
  ConfirmedOrderInput,
  IntegrationHandshake,
  OrderReport,
  OrderWorkerCatalog,
  OrderWorkerEngineRecord,
  OrderWorkerInput,
  OrderWorkerRunReport,
  OperationalState,
} from "./types.js";

export class OrderManager {
  private engineRecord: OrderWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: OrderWorkerCatalog | null = null;
  private readonly store = new OrderStore();
  private readonly builder = new OrderBuilder();
  private readonly validator = new OrderValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingOrder: ConfirmedOrderInput | null = null;
  private pendingContext: OrderWorkerInput = {};

  bindIntegrations(deps: OrderWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: OrderWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedOrderReports);
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

  getOrderReports() {
    return this.store.list();
  }

  getLatestOrderReportId() {
    return this.store.getLatestOrderReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: OrderWorkerConfiguration,
  ): OrderWorkerRunReport {
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
    appendOrwLog({
      event: "connect",
      details: `Order Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `orw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Order Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: ORW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveConfirmedOrders(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_confirmed_orders", input, config, started);
    }
    const enriched = this.integrations.enrichFromInventory(input);
    const pulled = this.integrations.pullOrderContext(enriched);
    const order = pulled.order ?? this.builder.resolveOrder(enriched);
    if (!order.orderId?.trim() && !(order.customerId?.trim() && order.productId?.trim())) {
      return this.disabled(
        "receive_confirmed_orders",
        config,
        "No confirmed orders received — provide confirmedOrder / orderId or customerId+productId, or bind Inventory Worker",
      );
    }
    this.pendingOrder = order;
    this.pendingContext = enriched;
    const validation = this.validator.finalize(
      "pass",
      [],
      [`Received confirmed order ${order.orderId ?? `${order.customerId}:${order.productId}`}`],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendOrwLog({
      event: "receive_confirmed_orders",
      details: `order=${order.orderId ?? order.customerId}`,
    });
    return this.report(
      "receive_confirmed_orders",
      this.getCatalog(),
      [],
      null,
      { ...validation, decision: "partial" },
      started,
    );
  }

  routeToSupplier(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
    return this.runOrder("route_to_supplier", input, config);
  }

  trackFulfilment(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
    return this.runOrder("track_fulfilment", input, config);
  }

  trackShipment(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
    return this.runOrder("track_shipment", input, config);
  }

  detectExceptions(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
    return this.runOrder("detect_exceptions", input, config);
  }

  detectDelayed(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
    return this.runOrder("detect_delayed", input, config);
  }

  detectFailedFulfilment(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
    return this.runOrder("detect_failed_fulfilment", input, config);
  }

  generateCustomerUpdates(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
    return this.runOrder("generate_customer_updates", input, config);
  }

  escalateIssues(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
    return this.runOrder("escalate_issues", input, config);
  }

  maintainHistory(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
    return this.runOrder("maintain_history", input, config);
  }

  produceReport(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
    return this.runOrder("produce_report", input, config);
  }

  submitFindings(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
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
    if (input.orderReportId) {
      const one = this.store.get(input.orderReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runOrder("produce_report", input, config);
      reports = generated.orderReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitFindings(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) =>
          this.store.markSubmitted(r.orderReportId, submission.executiveReportId!) ?? r,
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
    appendOrwLog({
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

  list(config: OrderWorkerConfiguration) {
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

  validate(input: OrderWorkerInput, config: OrderWorkerConfiguration) {
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

  diagnostics(config: OrderWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Order Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendOrwLog({ event: "diagnostics", details: `reports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runOrder(
    action: OrderWorkerRunReport["action"],
    input: OrderWorkerInput,
    config: OrderWorkerConfiguration,
  ): OrderWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.orderRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Order Worker is disabled" : "Order rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const enriched = this.integrations.enrichFromInventory({
      ...this.pendingContext,
      ...input,
      confirmedOrder: {
        ...(this.pendingOrder ?? {}),
        ...(input.confirmedOrder ?? {}),
      },
    });
    const pulled = this.integrations.pullOrderContext(enriched);
    const order = pulled.order ?? this.builder.resolveOrder(enriched);
    if (!order.orderId?.trim() && !(order.customerId?.trim() && order.productId?.trim())) {
      return this.disabled(
        action,
        config,
        "Order requires confirmed order (confirmedOrder / orderId or customerId+productId)",
      );
    }
    this.pendingOrder = order;
    this.pendingContext = enriched;

    const report = this.builder.buildReport(enriched, config, order, pulled.inventory);
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
    appendOrwLog({
      event: action,
      details: `order=${report.orderReportId} status=${report.orderStatus} fulfilment=${report.fulfilmentStatus} shipping=${report.shippingStatus}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: OrderWorkerRunReport["action"],
    input: OrderWorkerInput,
    config: OrderWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: OrderWorkerRunReport["action"],
    config: OrderWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: OrderWorkerInput) {
    return (
      input.processPayments === true ||
      input.issueRefunds === true ||
      input.modifyInventory === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ312OrLater === true ||
      input.alterFinancialRecords === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: OrderWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: OrderReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `orw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: ORDER_WORKER_ID,
      engineVersion: "PILLOW-ORW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...ORW_CAPABILITIES],
      totalOrderReports: this.store.count(),
      lastOrderReportId: report?.orderReportId ?? this.store.getLatestOrderReportId(),
      lastOrderStatus: report?.orderStatus ?? null,
      lastFulfilmentStatus: report?.fulfilmentStatus ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: ORW_METADATA_VERSION,
    };
  }

  private report(
    action: OrderWorkerRunReport["action"],
    catalog: OrderWorkerCatalog | null,
    orderReports: OrderReport[],
    latestOrderReport: OrderReport | null,
    validation: OrderWorkerRunReport["validation"],
    started: number,
  ): OrderWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      orderRunReportId: `orw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      orderReports,
      latestOrderReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: ORW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: OrderWorkerCatalog): OrderWorkerCatalog {
  return {
    ...catalog,
    orderReports: catalog.orderReports.map((report) => ({
      ...report,
      exceptions: report.exceptions.map((e) => ({ ...e })),
      customerUpdates: report.customerUpdates.map((u) => ({ ...u })),
      escalations: report.escalations.map((e) => ({ ...e })),
      fulfilmentHistory: report.fulfilmentHistory.map((h) => ({ ...h })),
      orderHistory: report.orderHistory.map((h) => ({ ...h })),
      supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
