import type { TemplateBuilderWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type TemplateBuilderWorkerDependencies,
} from "./integrations.js";
import { TemplateBuilder } from "./template-builder.js";
import { TemplateStore } from "./template-store.js";
import { HealthMonitor, RecoveryManager, TemplateValidator } from "./template-validator.js";
import { appendTbwLog } from "./tbw-logging.js";
import {
  INTEGRATION_TARGETS,
  TBW_CAPABILITIES,
  TBW_METADATA_VERSION,
  TEMPLATE_BUILDER_WORKER_ID,
} from "./paths.js";
import type {
  IntegrationHandshake,
  OperationalState,
  TemplateBuilderReport,
  TemplateBuilderWorkerCatalog,
  TemplateBuilderWorkerEngineRecord,
  TemplateBuilderWorkerInput,
  TemplateBuilderWorkerRunReport,
  TemplateContext,
} from "./types.js";

export class TemplateManager {
  private engineRecord: TemplateBuilderWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: TemplateBuilderWorkerCatalog | null = null;
  private readonly store = new TemplateStore();
  private readonly builder = new TemplateBuilder();
  private readonly validator = new TemplateValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: TemplateContext = {};

  bindIntegrations(deps: TemplateBuilderWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: TemplateBuilderWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedTemplateProducts);
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

  getTemplateProducts() {
    return this.store.list();
  }

  getLatestTemplateProductId() {
    return this.store.getLatestTemplateProductId();
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
    };
  }

  connect(
    _input: Record<string, unknown>,
    config: TemplateBuilderWorkerConfiguration,
  ): TemplateBuilderWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendTbwLog({
      event: "connect",
      details: `Template Builder Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `tbw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Template Builder Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: TBW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedDigitalProductResearch(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.templateRulesEnabled) {
      return this.disabled(
        "receive_approved_digital_product_research",
        config,
        !config.enabled ? "Template Builder Worker is disabled" : "Template rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(
        "receive_approved_digital_product_research",
        input,
        config,
        started,
      );
    }
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    this.context = {
      ...this.context,
      receivedResearch: true,
      productType: this.builder.normalizeProductType(
        enriched.productType ?? this.context.productType ?? config.defaultProductType,
      ),
    };
    // Always materialize a fresh template product shell for newly received research.
    const product = this.builder.createTemplateProductShell(enriched, config, this.context);
    this.store.save(product, "receive_approved_digital_product_research");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateTemplateProducts(
      [product],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompleteProduct: true },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      product,
    );
    appendTbwLog({
      event: "receive_approved_digital_product_research",
      details: `researchReportId=${product.researchReportId ?? "none"} templateProduct=${product.templateProductId} type=${product.productType}`,
    });
    return this.report(
      "receive_approved_digital_product_research",
      this.getCatalog(),
      [product],
      product,
      validation,
      started,
    );
  }

  generateReusableTemplates(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
  ) {
    return this.runContentStage("generate_reusable_templates", input, config, (product) => {
      const assetCount = input.assetCount ?? config.defaultAssetCount;
      const templates = this.builder.generateReusableTemplates(this.context, assetCount);
      const templateTypes = [...new Set(templates.map((t) => t.templateType))];
      const includedAssets = uniqueAssets(product, templates.map((t) => t.assetId));
      return {
        ...product,
        templates,
        templateTypes,
        includedAssets,
        preservedDecisions: [
          ...product.preservedDecisions,
          {
            decisionId: `tbw-dec-templates-${Date.now()}`,
            topic: product.productTitle,
            decision: `Generated ${templates.length} reusable templates`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  generatePlanners(input: TemplateBuilderWorkerInput, config: TemplateBuilderWorkerConfiguration) {
    return this.runContentStage("generate_planners", input, config, (product) => {
      const assetCount = input.assetCount ?? config.defaultAssetCount;
      const planners = this.builder.generatePlanners(this.context, assetCount);
      return {
        ...product,
        planners,
        includedAssets: uniqueAssets(product, planners.map((p) => p.assetId)),
      };
    });
  }

  generateSpreadsheets(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
  ) {
    return this.runContentStage("generate_spreadsheets", input, config, (product) => {
      const assetCount = input.assetCount ?? config.defaultAssetCount;
      const spreadsheets = this.builder.generateSpreadsheets(this.context, assetCount);
      return {
        ...product,
        spreadsheets,
        includedAssets: uniqueAssets(product, spreadsheets.map((s) => s.assetId)),
      };
    });
  }

  generateContractsAndDocumentTemplates(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
  ) {
    return this.runContentStage(
      "generate_contracts_and_document_templates",
      input,
      config,
      (product) => {
        const contracts = this.builder.generateContractsAndDocumentTemplates(this.context);
        return {
          ...product,
          contracts,
          includedAssets: uniqueAssets(product, contracts.map((c) => c.assetId)),
        };
      },
    );
  }

  generateBusinessFormsAndChecklists(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
  ) {
    return this.runContentStage(
      "generate_business_forms_and_checklists",
      input,
      config,
      (product) => {
        const { forms, checklists } = this.builder.generateBusinessFormsAndChecklists(
          this.context,
        );
        return {
          ...product,
          forms,
          checklists,
          includedAssets: uniqueAssets(product, [
            ...forms.map((f) => f.assetId),
            ...checklists.map((c) => c.assetId),
          ]),
        };
      },
    );
  }

  generateReusablePromptLibraries(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
  ) {
    return this.runContentStage(
      "generate_reusable_prompt_libraries",
      input,
      config,
      (product) => {
        const promptLibrary = this.builder.generateReusablePromptLibraries(this.context);
        return {
          ...product,
          promptLibrary,
          includedAssets: uniqueAssets(
            product,
            promptLibrary.map((p) => p.promptId),
          ),
        };
      },
    );
  }

  validateUsabilityAndCompleteness(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
  ) {
    return this.runContentStage(
      "validate_usability_and_completeness",
      input,
      config,
      (product) => {
        const review = this.builder.validateUsabilityAndCompleteness(product, this.context);
        return {
          ...product,
          usabilityValidated: review.usabilityValidated,
          selfReviewPassed: review.passed,
          selfReviewSummary: review.summary,
          selfReviewFindings: review.findings,
          qualityReview: review.qualityReview,
          confidenceScore: review.confidenceScore,
          researchCompliance: review.researchCompliance,
          researchComplianceNotes: review.researchComplianceNotes,
        };
      },
      false,
    );
  }

  prepareExportReadyTemplatePackages(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
  ) {
    return this.runContentStage(
      "prepare_export_ready_template_packages",
      input,
      config,
      (product) => ({
        ...product,
        exportFormats: this.builder.prepareExportFormats(),
        supportedFormats: this.builder.prepareSupportedFormats(),
        preservedDecisions: [
          ...product.preservedDecisions,
          {
            decisionId: `tbw-dec-export-${Date.now()}`,
            topic: product.productTitle,
            decision:
              "Prepared export-ready structural formats (markdown/csv_ready/xlsx_ready/docx_ready/zip_ready) without publishing or delivering",
            recordedAt: new Date().toISOString(),
          },
        ],
      }),
      false,
    );
  }

  produceTemplateBuilderReport(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
  ) {
    return this.runFullBuild("produce_template_builder_report", input, config);
  }

  submitReport(input: TemplateBuilderWorkerInput, config: TemplateBuilderWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let products = this.store.list();
    if (input.templateProductId) {
      const one = this.store.get(input.templateProductId);
      products = one ? [one] : [];
    }
    if (!products.length) {
      const generated = this.runFullBuild("produce_template_builder_report", input, config);
      products = generated.templateProducts;
      if (!products.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(products);
    if (submission.submitted && submission.executiveReportId) {
      products = products.map(
        (p) =>
          this.store.markSubmitted(p.templateProductId, submission.executiveReportId!) ?? p,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = products[products.length - 1] ?? null;
    const validation = this.validator.validateTemplateProducts(
      products.length ? products : null,
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
    appendTbwLog({
      event: "submit_report",
      details: `templateProducts=${products.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      products,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: TemplateBuilderWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const products = this.store.list();
    const latest = products[products.length - 1] ?? null;
    const validation = this.validator.validateTemplateProducts(
      products.length ? products : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), products, latest, validation, started);
  }

  validate(input: TemplateBuilderWorkerInput, config: TemplateBuilderWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const products = this.store.list();
    const latest = products[products.length - 1] ?? null;
    const validation = this.validator.validateTemplateProducts(
      products.length ? products : null,
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
    return this.report("validate", this.getCatalog(), products, latest, validation, started);
  }

  diagnostics(config: TemplateBuilderWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Template Builder Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendTbwLog({ event: "diagnostics", details: `templateProducts=${this.store.count()}` });
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
    action: TemplateBuilderWorkerRunReport["action"],
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
    mutate: (product: TemplateBuilderReport) => TemplateBuilderReport,
    allowIncomplete = true,
  ): TemplateBuilderWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.templateRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Template Builder Worker is disabled" : "Template rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const latest = this.ensureWorkingProduct(enriched, config);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["No template product available — approved research/product context required"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const updated: TemplateBuilderReport = {
      ...mutate(latest),
      timestamp: new Date().toISOString(),
    };
    this.store.save(updated, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateTemplateProducts(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      allowIncomplete ? { allowIncompleteProduct: true } : {},
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendTbwLog({
      event: action,
      details: `templateProduct=${updated.templateProductId} templates=${updated.templates.length} confidence=${updated.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [updated], updated, validation, started);
  }

  private runFullBuild(
    action: TemplateBuilderWorkerRunReport["action"],
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
  ): TemplateBuilderWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.templateRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Template Builder Worker is disabled" : "Template rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    if (enriched.researchReportId || enriched.researchTopic || enriched.productTitle) {
      this.context = { ...this.context, receivedResearch: true };
    }
    const readiness = this.builder.canBuildTemplateProduct(this.context);
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
    const product = this.builder.buildTemplateProduct(enriched, config, this.context);
    this.store.save(product, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateTemplateProducts(
      [product],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      product,
    );
    appendTbwLog({
      event: action,
      details: `templateProduct=${product.templateProductId} type=${product.productType} templates=${product.templates.length} confidence=${product.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [product], product, validation, started);
  }

  private ensureWorkingProduct(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
  ): TemplateBuilderReport | null {
    if (input.templateProductId) {
      const existing = this.store.get(input.templateProductId);
      if (existing) return existing;
    }
    const latest = this.store.list().at(-1);
    if (latest) return latest;
    const readiness = this.builder.canBuildTemplateProduct(this.context);
    if (!readiness.ready) return null;
    const created = this.builder.createTemplateProductShell(input, config, this.context);
    this.store.save(created, "bootstrap_template_product");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    return created;
  }

  private boundaryFail(
    action: TemplateBuilderWorkerRunReport["action"],
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateTemplateProducts(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: TemplateBuilderWorkerRunReport["action"],
    config: TemplateBuilderWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: TemplateBuilderWorkerInput) {
    return (
      input.buildSalesPages === true ||
      input.processPayments === true ||
      input.deliverProductsToCustomers === true ||
      input.publishProductsDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ507OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: TemplateBuilderWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: TemplateBuilderReport | null = null,
  ) {
    const product = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `tbw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: TEMPLATE_BUILDER_WORKER_ID,
      engineVersion: "PILLOW-TBW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...TBW_CAPABILITIES],
      totalTemplateProducts: this.store.count(),
      lastTemplateProductId: product?.templateProductId ?? this.store.getLatestTemplateProductId(),
      lastProductType: product?.productType ?? null,
      lastConfidenceScore: product?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: TBW_METADATA_VERSION,
    };
  }

  private report(
    action: TemplateBuilderWorkerRunReport["action"],
    catalog: TemplateBuilderWorkerCatalog | null,
    templateProducts: TemplateBuilderReport[],
    latestTemplateProduct: TemplateBuilderReport | null,
    validation: TemplateBuilderWorkerRunReport["validation"],
    started: number,
  ): TemplateBuilderWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      templateRunReportId: `tbw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      templateProducts,
      latestTemplateProduct,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: TBW_METADATA_VERSION,
    };
  }
}

function uniqueAssets(product: TemplateBuilderReport, nextIds: string[]) {
  return [...new Set([...product.includedAssets, ...nextIds].filter(Boolean))];
}

function cloneCatalog(catalog: TemplateBuilderWorkerCatalog): TemplateBuilderWorkerCatalog {
  return {
    ...catalog,
    templateProducts: catalog.templateProducts.map((product) => ({
      ...product,
      templateTypes: [...product.templateTypes],
      includedAssets: [...product.includedAssets],
      supportedFormats: [...product.supportedFormats],
      exportFormats: [...product.exportFormats],
      templates: product.templates.map((t) => ({
        ...t,
        sections: t.sections ? t.sections.map((s) => ({ ...s })) : undefined,
      })),
      planners: product.planners.map((p) => ({
        ...p,
        weeks: p.weeks.map((w) => ({
          ...w,
          tasks: w.tasks.map((task) => ({ ...task })),
        })),
      })),
      spreadsheets: product.spreadsheets.map((s) => ({
        ...s,
        columns: [...s.columns],
        rows: s.rows.map((r) => ({ ...r })),
      })),
      contracts: product.contracts.map((c) => ({
        ...c,
        clauses: c.clauses.map((clause) => ({ ...clause })),
      })),
      forms: product.forms.map((f) => ({
        ...f,
        fields: f.fields.map((field) => ({ ...field })),
      })),
      checklists: product.checklists.map((c) => ({
        ...c,
        items: c.items.map((item) => ({ ...item })),
      })),
      promptLibrary: product.promptLibrary.map((p) => ({ ...p })),
      selfReviewFindings: product.selfReviewFindings.map((f) => ({ ...f })),
      traceabilityRefs: [...product.traceabilityRefs],
      preservedDecisions: product.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
