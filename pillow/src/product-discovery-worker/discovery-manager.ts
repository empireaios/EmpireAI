import type { ProductDiscoveryWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type ProductDiscoveryWorkerDependencies,
} from "./integrations.js";
import { appendPdwLog } from "./pdw-logging.js";
import {
  INTEGRATION_TARGETS,
  PDW_CAPABILITIES,
  PDW_METADATA_VERSION,
  PRODUCT_DISCOVERY_WORKER_ID,
} from "./paths.js";
import { DiscoveryBuilder } from "./discovery-builder.js";
import { DiscoveryStore } from "./discovery-store.js";
import { DiscoveryValidator, HealthMonitor, RecoveryManager } from "./discovery-validator.js";
import type {
  IntegrationHandshake,
  OperationalState,
  ProductDiscoveryReport,
  ProductDiscoveryWorkerCatalog,
  ProductDiscoveryWorkerEngineRecord,
  ProductDiscoveryWorkerInput,
  ProductDiscoveryWorkerRunReport,
} from "./types.js";

export class DiscoveryManager {
  private engineRecord: ProductDiscoveryWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: ProductDiscoveryWorkerCatalog | null = null;
  private readonly store = new DiscoveryStore();
  private readonly builder = new DiscoveryBuilder();
  private readonly validator = new DiscoveryValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: ProductDiscoveryWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ProductDiscoveryWorkerConfiguration) {
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
    config: ProductDiscoveryWorkerConfiguration,
  ): ProductDiscoveryWorkerRunReport {
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
    appendPdwLog({
      event: "connect",
      details: `Product Discovery Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `pdw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Product Discovery Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: PDW_METADATA_VERSION,
      },
      started,
    );
  }

  discoverMarketplaces(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("discover_marketplaces", input, config, "marketplaces");
  }

  discoverSuppliers(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("discover_suppliers", input, config, "suppliers");
  }

  discoverSearchTrends(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("discover_search_trends", input, config, "search_trends");
  }

  discoverCustomerDemand(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("discover_customer_demand", input, config, "customer_demand");
  }

  discoverSeasonal(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("discover_seasonal", input, config, "seasonal");
  }

  detectEmergingTrends(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("detect_emerging_trends", input, config, "emerging");
  }

  detectDecliningProducts(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("detect_declining_products", input, config, "declining");
  }

  categorizeProducts(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("categorize_products", input, config, "categorize");
  }

  produceReport(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ) {
    return this.runDiscovery("produce_report", input, config, "full");
  }

  submitFindings(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
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
      const generated = this.runDiscovery("produce_report", input, config, "full");
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
    appendPdwLog({
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

  list(config: ProductDiscoveryWorkerConfiguration) {
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

  validate(input: ProductDiscoveryWorkerInput, config: ProductDiscoveryWorkerConfiguration) {
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

  diagnostics(config: ProductDiscoveryWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Product Discovery Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendPdwLog({ event: "diagnostics", details: `discoveries=${this.store.count()}` });
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
    action: ProductDiscoveryWorkerRunReport["action"],
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
    mode:
      | "marketplaces"
      | "suppliers"
      | "search_trends"
      | "customer_demand"
      | "seasonal"
      | "emerging"
      | "declining"
      | "categorize"
      | "full",
  ): ProductDiscoveryWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.discoveryRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Product Discovery Worker is disabled"
          : "Discovery rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    if (!this.hasDiscoveryInput(input, mode)) {
      return this.disabled(
        action,
        config,
        "Discovery requires marketplace/supplier candidates, trend signals, demand signals, or a product name",
      );
    }

    const discoveries = this.builder.discover(input, config, mode);
    if (!discoveries.length) {
      return this.disabled(
        action,
        config,
        "No discoveries produced from approved sources (unapproved sources are ignored)",
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
    appendPdwLog({
      event: action,
      details: `discoveries=${discoveries.length} latest=${latest?.discoveryId ?? "none"}`,
    });
    return this.report(action, this.getCatalog(), discoveries, latest, validation, started);
  }

  private hasDiscoveryInput(
    input: ProductDiscoveryWorkerInput,
    mode: string,
  ): boolean {
    if (input.productName?.trim()) return true;
    if (mode === "marketplaces" || mode === "full" || mode === "categorize") {
      if (input.marketplaceCandidates?.length || input.marketplace) return true;
    }
    if (mode === "suppliers" || mode === "full" || mode === "categorize") {
      if (input.supplierCandidates?.length || input.supplier) return true;
    }
    if (mode === "search_trends" || mode === "full" || mode === "categorize") {
      if (input.searchTrendSignals?.length) return true;
    }
    if (mode === "customer_demand" || mode === "full" || mode === "categorize") {
      if (input.customerDemandSignals?.length) return true;
    }
    if (mode === "seasonal" || mode === "full" || mode === "categorize") {
      if (input.seasonalSignals?.length) return true;
    }
    if (mode === "emerging" || mode === "full" || mode === "categorize") {
      if (input.emergingTrendSignals?.length) return true;
    }
    if (mode === "declining" || mode === "full" || mode === "categorize") {
      if (input.decliningProductSignals?.length) return true;
    }
    return false;
  }

  private boundaryFail(
    action: ProductDiscoveryWorkerRunReport["action"],
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateDiscoveries(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: ProductDiscoveryWorkerRunReport["action"],
    config: ProductDiscoveryWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: ProductDiscoveryWorkerInput) {
    return (
      input.evaluateProducts === true ||
      input.rankProducts === true ||
      input.selectSuppliers === true ||
      input.buildListings === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ303OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: ProductDiscoveryWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: ProductDiscoveryReport | null = null,
  ) {
    const discovery = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `pdw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PRODUCT_DISCOVERY_WORKER_ID,
      engineVersion: "PILLOW-PDW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...PDW_CAPABILITIES],
      totalDiscoveries: this.store.count(),
      lastCategory: discovery?.category ?? null,
      lastDiscoveryId: discovery?.discoveryId ?? this.store.getLatestDiscoveryId(),
      lastConfidenceScore: discovery?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: PDW_METADATA_VERSION,
    };
  }

  private report(
    action: ProductDiscoveryWorkerRunReport["action"],
    catalog: ProductDiscoveryWorkerCatalog | null,
    discoveries: ProductDiscoveryReport[],
    latestDiscovery: ProductDiscoveryReport | null,
    validation: ProductDiscoveryWorkerRunReport["validation"],
    started: number,
  ): ProductDiscoveryWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      discoveryRunReportId: `pdw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      discoveries,
      latestDiscovery,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PDW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: ProductDiscoveryWorkerCatalog): ProductDiscoveryWorkerCatalog {
  return {
    ...catalog,
    discoveries: catalog.discoveries.map((discovery) => ({
      ...discovery,
      searchTrendSignals: [...discovery.searchTrendSignals],
      customerDemandSignals: [...discovery.customerDemandSignals],
      facts: [...discovery.facts],
      assumptions: [...discovery.assumptions],
      supportingEvidence: discovery.supportingEvidence.map((e) => ({ ...e })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
