import type { PromptProductWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type PromptProductWorkerDependencies,
} from "./integrations.js";
import { PromptBuilder } from "./prompt-builder.js";
import { PromptStore } from "./prompt-store.js";
import { HealthMonitor, PromptValidator, RecoveryManager } from "./prompt-validator.js";
import { appendPpwLog } from "./ppw-logging.js";
import {
  INTEGRATION_TARGETS,
  PPW_CAPABILITIES,
  PPW_METADATA_VERSION,
  PROMPT_PRODUCT_WORKER_ID,
} from "./paths.js";
import type {
  IntegrationHandshake,
  OperationalState,
  PromptProductContext,
  PromptProductReport,
  PromptProductWorkerCatalog,
  PromptProductWorkerEngineRecord,
  PromptProductWorkerInput,
  PromptProductWorkerRunReport,
} from "./types.js";

export class PromptManager {
  private engineRecord: PromptProductWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: PromptProductWorkerCatalog | null = null;
  private readonly store = new PromptStore();
  private readonly builder = new PromptBuilder();
  private readonly validator = new PromptValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: PromptProductContext = {};

  bindIntegrations(deps: PromptProductWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: PromptProductWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedPromptProducts);
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

  getPromptProducts() {
    return this.store.list();
  }

  getLatestPromptProductId() {
    return this.store.getLatestPromptProductId();
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
      targetAiPlatforms: [...(this.context.targetAiPlatforms ?? [])],
    };
  }

  connect(
    _input: Record<string, unknown>,
    config: PromptProductWorkerConfiguration,
  ): PromptProductWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendPpwLog({
      event: "connect",
      details: `Prompt Product Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `ppw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Prompt Product Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: PPW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedDigitalProductResearch(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.promptRulesEnabled) {
      return this.disabled(
        "receive_approved_digital_product_research",
        config,
        !config.enabled
          ? "Prompt Product Worker is disabled"
          : "Prompt rules are disabled",
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
      targetAiPlatforms: this.builder.normalizePlatforms(
        enriched.targetAiPlatforms ?? this.context.targetAiPlatforms,
      ),
    };
    // Always materialize a fresh prompt product for newly received research so product type
    // and research identity are not reused from a prior in-memory product.
    const product = this.builder.buildFreshPromptProductShell(enriched, config, this.context);
    this.store.save(product, "receive_approved_digital_product_research");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validatePromptProducts(
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
    appendPpwLog({
      event: "receive_approved_digital_product_research",
      details: `researchReportId=${product.researchReportId ?? "none"} promptProduct=${product.promptProductId} type=${product.productType}`,
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

  designPromptArchitecture(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ) {
    return this.runContentStage("design_prompt_architecture", input, config, (product) => {
      const architecture = this.builder.designPromptArchitecture(this.context);
      return {
        ...product,
        promptArchitecture: architecture,
        promptCategories: unique([
          ...architecture.categories,
          ...product.promptCategories,
        ]),
        productTitle: architecture.title.replace(/ Prompt Architecture$/, "") || product.productTitle,
        preservedDecisions: [
          ...product.preservedDecisions,
          {
            decisionId: `ppw-dec-arch-${Date.now()}`,
            topic: product.productTitle,
            decision: `Designed prompt architecture with ${architecture.layers.length} layers and ${architecture.categories.length} categories`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  createPromptLibraries(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ) {
    return this.runContentStage("create_prompt_libraries", input, config, (product) => {
      const architecture =
        product.promptArchitecture ?? this.builder.designPromptArchitecture(this.context);
      const library = this.builder.createPromptLibraries(architecture, this.context);
      return {
        ...product,
        promptArchitecture: architecture,
        promptLibrary: library,
        promptCategories: unique([
          ...architecture.categories,
          ...library.map((p) => p.category),
        ]),
      };
    });
  }

  createReusablePromptTemplates(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ) {
    return this.runContentStage("create_reusable_prompt_templates", input, config, (product) => {
      const architecture =
        product.promptArchitecture ?? this.builder.designPromptArchitecture(this.context);
      const baseLibrary =
        product.promptLibrary.length > 0
          ? product.promptLibrary
          : this.builder.createPromptLibraries(architecture, this.context);
      const library = this.builder.createReusablePromptTemplates(baseLibrary, this.context);
      return {
        ...product,
        promptArchitecture: architecture,
        promptLibrary: library,
        promptCategories: unique([
          ...architecture.categories,
          ...library.map((p) => p.category),
        ]),
      };
    });
  }

  createAiWorkflowProducts(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ) {
    return this.runContentStage("create_ai_workflow_products", input, config, (product) => {
      const architecture =
        product.promptArchitecture ?? this.builder.designPromptArchitecture(this.context);
      let library = product.promptLibrary;
      if (!library.length) {
        library = this.builder.createReusablePromptTemplates(
          this.builder.createPromptLibraries(architecture, this.context),
          this.context,
        );
      }
      const workflowComponents = this.builder.createAiWorkflowProducts(library, this.context);
      return {
        ...product,
        promptArchitecture: architecture,
        promptLibrary: library,
        workflowComponents,
      };
    });
  }

  organizePromptsIntoStructuredPacks(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ) {
    return this.runContentStage(
      "organize_prompts_into_structured_packs",
      input,
      config,
      (product) => {
        const architecture =
          product.promptArchitecture ?? this.builder.designPromptArchitecture(this.context);
        let library = product.promptLibrary;
        if (!library.length) {
          library = this.builder.createReusablePromptTemplates(
            this.builder.createPromptLibraries(architecture, this.context),
            this.context,
          );
        }
        const structuredPacks = this.builder.organizePromptsIntoStructuredPacks(
          library,
          architecture,
          this.context,
        );
        return {
          ...product,
          promptArchitecture: architecture,
          promptLibrary: library,
          structuredPacks,
          promptCategories: unique([
            ...architecture.categories,
            ...library.map((p) => p.category),
          ]),
        };
      },
    );
  }

  generateUserInstructions(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ) {
    return this.runContentStage("generate_user_instructions", input, config, (product) => {
      const architecture =
        product.promptArchitecture ?? this.builder.designPromptArchitecture(this.context);
      let library = product.promptLibrary;
      if (!library.length) {
        library = this.builder.createReusablePromptTemplates(
          this.builder.createPromptLibraries(architecture, this.context),
          this.context,
        );
      }
      const workflowComponents =
        product.workflowComponents.length > 0
          ? product.workflowComponents
          : this.builder.createAiWorkflowProducts(library, this.context);
      const structuredPacks =
        product.structuredPacks.length > 0
          ? product.structuredPacks
          : this.builder.organizePromptsIntoStructuredPacks(library, architecture, this.context);
      const draft = {
        ...product,
        promptArchitecture: architecture,
        promptLibrary: library,
        workflowComponents,
        structuredPacks,
      };
      return {
        ...draft,
        userInstructions: this.builder.generateUserInstructions(draft, this.context),
      };
    });
  }

  validatePromptConsistency(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ) {
    return this.runContentStage("validate_prompt_consistency", input, config, (product) => {
      const review = this.builder.validatePromptConsistency(product, this.context);
      return {
        ...product,
        consistencyValidated: review.consistencyValidated,
        selfReviewPassed: review.passed,
        selfReviewSummary: review.summary,
        selfReviewFindings: review.findings,
        qualityReview: review.qualityReview,
        confidenceScore: review.confidenceScore,
        researchCompliance: review.researchCompliance,
        researchComplianceNotes: review.researchComplianceNotes,
      };
    });
  }

  packageExportReadyPromptProducts(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ) {
    return this.runContentStage(
      "package_export_ready_prompt_products",
      input,
      config,
      (product) => ({
        ...product,
        exportFormats: this.builder.prepareExportFormats(),
        preservedDecisions: [
          ...product.preservedDecisions,
          {
            decisionId: `ppw-dec-export-${Date.now()}`,
            topic: product.productTitle,
            decision:
              "Packaged export-ready structural formats (markdown/json_pack/zip_ready/notion_ready) without publishing or delivering",
            recordedAt: new Date().toISOString(),
          },
        ],
      }),
    );
  }

  producePromptProductReport(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ) {
    return this.runFullBuild("produce_prompt_product_report", input, config);
  }

  submitReport(input: PromptProductWorkerInput, config: PromptProductWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_report",
        config,
        "Executive reporting submission is disabled",
      );
    }
    let products = this.store.list();
    if (input.promptProductId) {
      const one = this.store.get(input.promptProductId);
      products = one ? [one] : [];
    }
    if (!products.length) {
      const generated = this.runFullBuild("produce_prompt_product_report", input, config);
      products = generated.promptProducts;
      if (!products.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(products);
    if (submission.submitted && submission.executiveReportId) {
      products = products.map(
        (p) => this.store.markSubmitted(p.promptProductId, submission.executiveReportId!) ?? p,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = products[products.length - 1] ?? null;
    const validation = this.validator.validatePromptProducts(
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
    appendPpwLog({
      event: "submit_report",
      details: `promptProducts=${products.length} submitted=${submission.submitted}`,
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

  list(config: PromptProductWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const products = this.store.list();
    const latest = products[products.length - 1] ?? null;
    const validation = this.validator.validatePromptProducts(
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

  validate(input: PromptProductWorkerInput, config: PromptProductWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const products = this.store.list();
    const latest = products[products.length - 1] ?? null;
    const validation = this.validator.validatePromptProducts(
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

  diagnostics(config: PromptProductWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Prompt Product Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendPpwLog({ event: "diagnostics", details: `promptProducts=${this.store.count()}` });
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
    action: PromptProductWorkerRunReport["action"],
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
    mutate: (product: PromptProductReport) => PromptProductReport,
  ): PromptProductWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.promptRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Prompt Product Worker is disabled"
          : "Prompt rules are disabled",
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
        ["No prompt product available — approved research/product context required"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const updated: PromptProductReport = {
      ...mutate(latest),
      timestamp: new Date().toISOString(),
    };
    this.store.save(updated, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validatePromptProducts(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompleteProduct: action !== "validate_prompt_consistency" },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendPpwLog({
      event: action,
      details: `promptProduct=${updated.promptProductId} prompts=${updated.promptLibrary.length} confidence=${updated.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [updated], updated, validation, started);
  }

  private runFullBuild(
    action: PromptProductWorkerRunReport["action"],
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ): PromptProductWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.promptRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Prompt Product Worker is disabled"
          : "Prompt rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    if (enriched.researchReportId || enriched.researchTopic || enriched.productTitle) {
      this.context = { ...this.context, receivedResearch: true };
    }
    const readiness = this.builder.canBuildPromptProduct(this.context);
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
    const product = this.builder.buildPromptProduct(enriched, config, this.context);
    this.store.save(product, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validatePromptProducts(
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
    appendPpwLog({
      event: action,
      details: `promptProduct=${product.promptProductId} type=${product.productType} prompts=${product.promptLibrary.length} confidence=${product.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [product], product, validation, started);
  }

  private ensureWorkingProduct(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
  ): PromptProductReport | null {
    if (input.promptProductId) {
      const existing = this.store.get(input.promptProductId);
      if (existing) return existing;
    }
    const latest = this.store.list().at(-1);
    if (latest) return latest;
    const readiness = this.builder.canBuildPromptProduct(this.context);
    if (!readiness.ready) return null;
    const created = this.builder.buildFreshPromptProductShell(input, config, this.context);
    this.store.save(created, "bootstrap_prompt_product");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    return created;
  }

  private boundaryFail(
    action: PromptProductWorkerRunReport["action"],
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validatePromptProducts(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: PromptProductWorkerRunReport["action"],
    config: PromptProductWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: PromptProductWorkerInput) {
    return (
      input.buildSalesPages === true ||
      input.processPayments === true ||
      input.processCustomerPayments === true ||
      input.deliverProducts === true ||
      input.publishProductsDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ505OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: PromptProductWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: PromptProductReport | null = null,
  ) {
    const product = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `ppw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PROMPT_PRODUCT_WORKER_ID,
      engineVersion: "PILLOW-PPW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...PPW_CAPABILITIES],
      totalPromptProducts: this.store.count(),
      lastPromptProductId: product?.promptProductId ?? this.store.getLatestPromptProductId(),
      lastProductType: product?.productType ?? null,
      lastConfidenceScore: product?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: PPW_METADATA_VERSION,
    };
  }

  private report(
    action: PromptProductWorkerRunReport["action"],
    catalog: PromptProductWorkerCatalog | null,
    promptProducts: PromptProductReport[],
    latestPromptProduct: PromptProductReport | null,
    validation: PromptProductWorkerRunReport["validation"],
    started: number,
  ): PromptProductWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      promptProductRunReportId: `ppw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      promptProducts,
      latestPromptProduct,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PPW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: PromptProductWorkerCatalog): PromptProductWorkerCatalog {
  return {
    ...catalog,
    promptProducts: catalog.promptProducts.map((product) => ({
      ...product,
      targetAiPlatforms: [...product.targetAiPlatforms],
      promptCategories: [...product.promptCategories],
      promptLibrary: product.promptLibrary.map((p) => ({
        ...p,
        variables: p.variables ? [...p.variables] : undefined,
        platformHints: p.platformHints ? [...p.platformHints] : undefined,
      })),
      workflowComponents: product.workflowComponents.map((w) => ({ ...w })),
      exportFormats: [...product.exportFormats],
      structuredPacks: product.structuredPacks.map((s) => ({
        ...s,
        promptIds: [...s.promptIds],
      })),
      promptArchitecture: product.promptArchitecture
        ? {
            ...product.promptArchitecture,
            layers: [...product.promptArchitecture.layers],
            categories: [...product.promptArchitecture.categories],
            designPrinciples: [...product.promptArchitecture.designPrinciples],
          }
        : null,
      selfReviewFindings: product.selfReviewFindings.map((f) => ({ ...f })),
      traceabilityRefs: [...product.traceabilityRefs],
      preservedDecisions: product.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
