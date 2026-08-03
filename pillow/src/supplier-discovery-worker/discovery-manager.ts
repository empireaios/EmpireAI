import type { SupplierDiscoveryWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type SupplierDiscoveryWorkerDependencies,
} from "./integrations.js";
import { appendSdwLog } from "./sdw-logging.js";
import {
  INTEGRATION_TARGETS,
  SDW_CAPABILITIES,
  SDW_METADATA_VERSION,
  SUPPLIER_DISCOVERY_WORKER_ID,
} from "./paths.js";
import { DiscoveryBuilder } from "./discovery-builder.js";
import { DiscoveryStore } from "./discovery-store.js";
import { DiscoveryValidator, HealthMonitor, RecoveryManager } from "./discovery-validator.js";
import type {
  ApprovedProductInput,
  IntegrationHandshake,
  OperationalState,
  SupplierDiscoveryReport,
  SupplierDiscoveryWorkerCatalog,
  SupplierDiscoveryWorkerEngineRecord,
  SupplierDiscoveryWorkerInput,
  SupplierDiscoveryWorkerRunReport,
} from "./types.js";

export class DiscoveryManager {
  private engineRecord: SupplierDiscoveryWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: SupplierDiscoveryWorkerCatalog | null = null;
  private readonly store = new DiscoveryStore();
  private readonly builder = new DiscoveryBuilder();
  private readonly validator = new DiscoveryValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingProducts: ApprovedProductInput[] = [];

  bindIntegrations(deps: SupplierDiscoveryWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: SupplierDiscoveryWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedDiscoveries);
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

  getDiscoveries() {
    return this.store.list();
  }

  getLatestDiscoveryId() {
    return this.store.getLatestDiscoveryId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: SupplierDiscoveryWorkerConfiguration,
  ): SupplierDiscoveryWorkerRunReport {
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
    appendSdwLog({
      event: "connect",
      details: `Supplier Discovery Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `sdw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Supplier Discovery Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: SDW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedProducts(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_approved_products", input, config, started);
    }
    const pulled = this.integrations.pullApprovedProducts();
    const products = this.builder.resolveProducts(input, pulled);
    this.pendingProducts = products;
    if (!products.length) {
      return this.disabled(
        "receive_approved_products",
        config,
        "No approved products received — provide approvedProduct(s) or bind Product Evaluation Worker with Proceed recommendations",
      );
    }
    const validation = this.validator.finalize(
      "pass",
      [],
      [`Received ${products.length} approved product(s) for supplier discovery`],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendSdwLog({
      event: "receive_approved_products",
      details: `products=${products.length}`,
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

  searchPlatforms(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("search_platforms", input, config, "platforms");
  }

  searchApis(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("search_apis", input, config, "apis");
  }

  discoverCandidates(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("discover_candidates", input, config, "all");
  }

  captureProductInformation(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("capture_product_information", input, config, "all");
  }

  capturePricing(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("capture_pricing", input, config, "all");
  }

  captureMoq(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("capture_moq", input, config, "all");
  }

  captureShipping(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("capture_shipping", input, config, "all");
  }

  captureLocation(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("capture_location", input, config, "all");
  }

  produceReport(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("produce_report", input, config, "all");
  }

  submitFindings(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ) {
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

    let discoveries = this.store.list();
    if (input.discoveryId) {
      const one = this.store.get(input.discoveryId);
      discoveries = one ? [one] : [];
    }
    if (!discoveries.length) {
      const generated = this.runDiscovery("produce_report", input, config, "all");
      discoveries = generated.discoveries;
      if (!discoveries.length || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitFindings(discoveries);
    if (submission.submitted && submission.executiveReportId) {
      discoveries = discoveries.map(
        (d) =>
          this.store.markSubmitted(d.discoveryId, submission.executiveReportId!) ?? d,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = discoveries[discoveries.length - 1] ?? null;
    const validation = this.validator.validateDiscoveries(
      discoveries.length ? discoveries : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) {
      validation.warnings.push(submission.details);
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    appendSdwLog({
      event: "submit_findings",
      details: `discoveries=${discoveries.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_findings",
      this.getCatalog(),
      discoveries,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: SupplierDiscoveryWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const discoveries = this.store.list();
    const latest = discoveries[discoveries.length - 1] ?? null;
    const validation = this.validator.validateDiscoveries(
      discoveries.length ? discoveries : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), discoveries, latest, validation, started);
  }

  validate(input: SupplierDiscoveryWorkerInput, config: SupplierDiscoveryWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const discoveries = this.store.list();
    const latest = discoveries[discoveries.length - 1] ?? null;
    const validation = this.validator.validateDiscoveries(
      discoveries.length ? discoveries : null,
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
    return this.report("validate", this.getCatalog(), discoveries, latest, validation, started);
  }

  diagnostics(config: SupplierDiscoveryWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Supplier Discovery Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendSdwLog({ event: "diagnostics", details: `discoveries=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runDiscovery(
    action: SupplierDiscoveryWorkerRunReport["action"],
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
    mode: "platforms" | "apis" | "all",
  ): SupplierDiscoveryWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.discoveryRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Supplier Discovery Worker is disabled"
          : "Discovery rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const pulled = this.integrations.pullApprovedProducts();
    const products = this.builder.resolveProducts(
      input,
      this.pendingProducts.length ? this.pendingProducts : pulled,
    );
    if (!products.length) {
      return this.disabled(
        action,
        config,
        "Supplier discovery requires approved products (approvedProduct / productName)",
      );
    }
    this.pendingProducts = products;

    const discoveries = this.builder.discover(input, config, products, mode);
    if (!discoveries.length) {
      return this.disabled(
        action,
        config,
        "No supplier discoveries produced from approved platforms/APIs (unapproved sources are ignored)",
      );
    }

    this.store.saveMany(discoveries, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = discoveries[discoveries.length - 1] ?? null;
    const validation = this.validator.validateDiscoveries(
      discoveries,
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
    appendSdwLog({
      event: action,
      details: `discoveries=${discoveries.length} latest=${latest?.discoveryId ?? "none"}`,
    });
    return this.report(action, this.getCatalog(), discoveries, latest, validation, started);
  }

  private boundaryFail(
    action: SupplierDiscoveryWorkerRunReport["action"],
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateDiscoveries(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: SupplierDiscoveryWorkerRunReport["action"],
    config: SupplierDiscoveryWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: SupplierDiscoveryWorkerInput) {
    return (
      input.evaluateSuppliers === true ||
      input.negotiateSuppliers === true ||
      input.selectSuppliers === true ||
      input.placeOrders === true ||
      input.modifySupplierData === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ305OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: SupplierDiscoveryWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: SupplierDiscoveryReport | null = null,
  ) {
    const discovery = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `sdw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SUPPLIER_DISCOVERY_WORKER_ID,
      engineVersion: "PILLOW-SDW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...SDW_CAPABILITIES],
      totalDiscoveries: this.store.count(),
      lastSupplierPlatform: discovery?.supplierPlatform ?? null,
      lastDiscoveryId: discovery?.discoveryId ?? this.store.getLatestDiscoveryId(),
      lastConfidenceScore: discovery?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: SDW_METADATA_VERSION,
    };
  }

  private report(
    action: SupplierDiscoveryWorkerRunReport["action"],
    catalog: SupplierDiscoveryWorkerCatalog | null,
    discoveries: SupplierDiscoveryReport[],
    latestDiscovery: SupplierDiscoveryReport | null,
    validation: SupplierDiscoveryWorkerRunReport["validation"],
    started: number,
  ): SupplierDiscoveryWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      supplierDiscoveryRunReportId: `sdw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      discoveries,
      latestDiscovery,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: SDW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: SupplierDiscoveryWorkerCatalog,
): SupplierDiscoveryWorkerCatalog {
  return {
    ...catalog,
    discoveries: catalog.discoveries.map((discovery) => ({
      ...discovery,
      fieldAvailability: { ...discovery.fieldAvailability },
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
