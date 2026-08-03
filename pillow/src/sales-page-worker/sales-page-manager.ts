import type { SalesPageWorkerConfiguration } from "./configuration.js";
import { SalesPageBuilder } from "./sales-page-builder.js";
import { SalesPageStore } from "./sales-page-store.js";
import {
  HealthMonitor,
  RecoveryManager,
  SalesPageValidator,
} from "./sales-page-validator.js";
import {
  IntegrationCoordinator,
  type SalesPageWorkerDependencies,
} from "./integrations.js";
import { appendSpwLog } from "./spw-logging.js";
import {
  INTEGRATION_TARGETS,
  SALES_PAGE_WORKER_ID,
  SPW_CAPABILITIES,
  SPW_METADATA_VERSION,
} from "./paths.js";
import type {
  IntegrationHandshake,
  OperationalState,
  SalesPageContext,
  SalesPageReport,
  SalesPageWorkerCatalog,
  SalesPageWorkerEngineRecord,
  SalesPageWorkerInput,
  SalesPageWorkerRunReport,
} from "./types.js";

export class SalesPageManager {
  private engineRecord: SalesPageWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: SalesPageWorkerCatalog | null = null;
  private readonly store = new SalesPageStore();
  private readonly builder = new SalesPageBuilder();
  private readonly validator = new SalesPageValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: SalesPageContext = {};

  bindIntegrations(deps: SalesPageWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: SalesPageWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedSalesPages);
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

  getSalesPages() {
    return this.store.list();
  }

  getLatestSalesPageId() {
    return this.store.getLatestSalesPageId();
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
      designAssetRefs: [...(this.context.designAssetRefs ?? [])],
      approvedTestimonials: this.context.approvedTestimonials
        ? this.context.approvedTestimonials.map((t) => ({ ...t }))
        : null,
    };
  }

  connect(
    _input: Record<string, unknown>,
    config: SalesPageWorkerConfiguration,
  ): SalesPageWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendSpwLog({
      event: "connect",
      details: `Sales Page Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `spw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Sales Page Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: SPW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedDigitalProductInformation(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.salesPageRulesEnabled) {
      return this.disabled(
        "receive_approved_digital_product_information",
        config,
        !config.enabled ? "Sales Page Worker is disabled" : "Sales page rules are disabled",
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
      pageType: this.builder.normalizePageType(
        enriched.pageType ??
          enriched.productType ??
          this.context.pageType ??
          config.defaultPageType,
      ),
      productType: this.builder.normalizePageType(
        enriched.productType ??
          enriched.pageType ??
          this.context.productType ??
          config.defaultProductType,
      ),
      approvedTestimonials:
        enriched.approvedTestimonials ?? this.context.approvedTestimonials ?? null,
      designAssetRefs: unique([
        ...(this.context.designAssetRefs ?? []),
        ...(enrichment?.designAssetRefs ?? []),
      ]),
    };
    // Always materialize a fresh sales page shell for newly received product information.
    const page = this.builder.createSalesPageShell(enriched, config, this.context);
    this.store.save(page, "receive_approved_digital_product_information");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateSalesPages(
      [page],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompletePage: true },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      page,
    );
    appendSpwLog({
      event: "receive_approved_digital_product_information",
      details: `researchReportId=${page.researchReportId ?? "none"} salesPage=${page.salesPageId} type=${page.pageType}`,
    });
    return this.report(
      "receive_approved_digital_product_information",
      this.getCatalog(),
      [page],
      page,
      validation,
      started,
    );
  }

  /** Factory-consistency alias — same intake as receiveApprovedDigitalProductInformation. */
  receiveApprovedDigitalProductResearch(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ) {
    return this.receiveApprovedDigitalProductInformation(input, config);
  }

  generateCompleteLandingPageStructure(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ) {
    return this.runContentStage(
      "generate_complete_landing_page_structure",
      input,
      config,
      (page) => {
        const landingPageStructure = this.builder.generateCompleteLandingPageStructure(
          this.context,
        );
        return {
          ...page,
          landingPageStructure,
          sectionsGenerated: unique([
            ...page.sectionsGenerated,
            ...landingPageStructure.map((s) => s.sectionType),
          ]),
          preservedDecisions: [
            ...page.preservedDecisions,
            {
              decisionId: `spw-dec-structure-${Date.now()}`,
              topic: page.productTitle,
              decision: `Generated complete landing page structure (${landingPageStructure.length} sections)`,
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
    );
  }

  generateCompellingHeadlines(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ) {
    return this.runContentStage("generate_compelling_headlines", input, config, (page) => {
      const headlines = this.builder.generateCompellingHeadlines(this.context);
      return {
        ...page,
        headlines,
        headline: headlines[0] ?? page.headline,
        sectionsGenerated: unique([...page.sectionsGenerated, "headlines"]),
      };
    });
  }

  generateBenefitDrivenCopy(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ) {
    return this.runContentStage("generate_benefit_driven_copy", input, config, (page) => {
      const benefitCopy = this.builder.generateBenefitDrivenCopy(this.context);
      return {
        ...page,
        benefitCopy,
        sectionsGenerated: unique([...page.sectionsGenerated, "benefits"]),
      };
    });
  }

  generateFeatureSections(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ) {
    return this.runContentStage("generate_feature_sections", input, config, (page) => {
      const featureSections = this.builder.generateFeatureSections(this.context);
      return {
        ...page,
        featureSections,
        sectionsGenerated: unique([...page.sectionsGenerated, "features"]),
      };
    });
  }

  generatePricingPresentation(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ) {
    return this.runContentStage("generate_pricing_presentation", input, config, (page) => {
      const pricingPresentation = this.builder.generatePricingPresentation(this.context);
      return {
        ...page,
        pricingPresentation,
        sectionsGenerated: unique([...page.sectionsGenerated, "pricing"]),
      };
    });
  }

  generateTestimonialsOrPlaceholders(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ) {
    return this.runContentStage(
      "generate_testimonials_or_placeholders",
      input,
      config,
      (page) => {
        if (input.approvedTestimonials?.length) {
          this.context = {
            ...this.context,
            approvedTestimonials: input.approvedTestimonials,
          };
        }
        const testimonials = this.builder.generateTestimonialsOrPlaceholders(this.context);
        return {
          ...page,
          testimonials,
          sectionsGenerated: unique([...page.sectionsGenerated, "testimonials"]),
          preservedDecisions: [
            ...page.preservedDecisions,
            {
              decisionId: `spw-dec-testimonials-${Date.now()}`,
              topic: page.productTitle,
              decision: testimonials.every((t) => t.status === "placeholder")
                ? "Emitted labeled testimonial placeholders — never invented customer results"
                : "Used approved-provided testimonials only — fabricated=false",
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
    );
  }

  generateFaqSections(input: SalesPageWorkerInput, config: SalesPageWorkerConfiguration) {
    return this.runContentStage("generate_faq_sections", input, config, (page) => {
      const faqs = this.builder.generateFaqSections(this.context);
      return {
        ...page,
        faqs,
        sectionsGenerated: unique([...page.sectionsGenerated, "faqs"]),
      };
    });
  }

  generateCallToActionSections(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ) {
    return this.runContentStage(
      "generate_call_to_action_sections",
      input,
      config,
      (page) => {
        const ctas = this.builder.generateCallToActionSections(this.context);
        return {
          ...page,
          ctas,
          ctaSummary: ctas.map((c) => `${c.placement}:${c.label}`).join(" | "),
          sectionsGenerated: unique([...page.sectionsGenerated, "ctas"]),
        };
      },
    );
  }

  generateGuaranteeSections(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ) {
    return this.runContentStage("generate_guarantee_sections", input, config, (page) => {
      const guarantees = this.builder.generateGuaranteeSections(this.context);
      return {
        ...page,
        guarantees,
        sectionsGenerated: unique([...page.sectionsGenerated, "guarantees"]),
      };
    });
  }

  optimizePageStructureForReadabilityAndConversion(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ) {
    return this.runContentStage(
      "optimize_page_structure_for_readability_and_conversion",
      input,
      config,
      (page) => {
        const optimization = this.builder.optimizePageStructureForReadabilityAndConversion(page);
        const review = this.builder.performQualityReview(
          {
            ...page,
            landingPageStructure: optimization.landingPageStructure,
            readabilityOptimized: optimization.readabilityOptimized,
            conversionOptimized: optimization.conversionOptimized,
          },
          this.context,
        );
        return {
          ...page,
          landingPageStructure: optimization.landingPageStructure,
          readabilityOptimized: optimization.readabilityOptimized,
          conversionOptimized: optimization.conversionOptimized,
          exportFormats: optimization.exportFormats,
          qualityReview: optimization.qualityReview,
          complianceReview: review.complianceReview,
          selfReviewPassed: review.passed,
          selfReviewFindings: review.findings,
          selfReviewSummary: review.summary,
          confidenceScore: review.confidenceScore,
          researchCompliance: review.researchCompliance,
          researchComplianceNotes: review.researchComplianceNotes,
          preservedDecisions: [
            ...page.preservedDecisions,
            {
              decisionId: `spw-dec-optimize-${Date.now()}`,
              topic: page.productTitle,
              decision:
                "Optimized page structure for readability and conversion; export formats prepared as structural signals only",
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
      false,
    );
  }

  produceSalesPageReport(input: SalesPageWorkerInput, config: SalesPageWorkerConfiguration) {
    return this.runFullBuild("produce_sales_page_report", input, config);
  }

  submitReport(input: SalesPageWorkerInput, config: SalesPageWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let pages = this.store.list();
    if (input.salesPageId) {
      const one = this.store.get(input.salesPageId);
      pages = one ? [one] : [];
    }
    if (!pages.length) {
      const generated = this.runFullBuild("produce_sales_page_report", input, config);
      pages = generated.salesPages;
      if (!pages.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(pages);
    if (submission.submitted && submission.executiveReportId) {
      pages = pages.map(
        (r) => this.store.markSubmitted(r.salesPageId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = pages[pages.length - 1] ?? null;
    const validation = this.validator.validateSalesPages(
      pages.length ? pages : null,
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
    appendSpwLog({
      event: "submit_report",
      details: `salesPages=${pages.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      pages,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: SalesPageWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const pages = this.store.list();
    const latest = pages[pages.length - 1] ?? null;
    const validation = this.validator.validateSalesPages(
      pages.length ? pages : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), pages, latest, validation, started);
  }

  validate(input: SalesPageWorkerInput, config: SalesPageWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const pages = this.store.list();
    const latest = pages[pages.length - 1] ?? null;
    const validation = this.validator.validateSalesPages(
      pages.length ? pages : null,
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
    return this.report("validate", this.getCatalog(), pages, latest, validation, started);
  }

  diagnostics(config: SalesPageWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Sales Page Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendSpwLog({ event: "diagnostics", details: `salesPages=${this.store.count()}` });
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
    action: SalesPageWorkerRunReport["action"],
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
    mutate: (page: SalesPageReport) => SalesPageReport,
    allowIncomplete = true,
  ): SalesPageWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.salesPageRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Sales Page Worker is disabled" : "Sales page rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedProductInformation(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const latest = this.ensureWorkingPage(enriched, config);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["No sales page available — approved product information required"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const updated: SalesPageReport = {
      ...mutate(latest),
      timestamp: new Date().toISOString(),
      assetsReferenced: unique([
        ...latest.assetsReferenced,
        ...(this.context.designAssetRefs ?? []),
      ]),
    };
    this.store.save(updated, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateSalesPages(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      allowIncomplete ? { allowIncompletePage: true } : {},
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendSpwLog({
      event: action,
      details: `salesPage=${updated.salesPageId} sections=${updated.landingPageStructure.length} confidence=${updated.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [updated], updated, validation, started);
  }

  private runFullBuild(
    action: SalesPageWorkerRunReport["action"],
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ): SalesPageWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.salesPageRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Sales Page Worker is disabled" : "Sales page rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedProductInformation(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    if (enriched.researchReportId || enriched.researchTopic || enriched.productTitle) {
      this.context = { ...this.context, receivedProductInformation: true };
    }
    if (enriched.approvedTestimonials?.length) {
      this.context = {
        ...this.context,
        approvedTestimonials: enriched.approvedTestimonials,
      };
    }
    const readiness = this.builder.canBuildSalesPage(this.context);
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
    const page = this.builder.buildSalesPageReport(enriched, config, this.context);
    this.store.save(page, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateSalesPages(
      [page],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      page,
    );
    appendSpwLog({
      event: action,
      details: `salesPage=${page.salesPageId} type=${page.pageType} sections=${page.landingPageStructure.length} confidence=${page.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [page], page, validation, started);
  }

  private ensureWorkingPage(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
  ): SalesPageReport | null {
    if (input.salesPageId) {
      const existing = this.store.get(input.salesPageId);
      if (existing) return existing;
    }
    const latest = this.store.list().at(-1);
    if (latest) return latest;
    const readiness = this.builder.canBuildSalesPage(this.context);
    if (!readiness.ready) return null;
    const created = this.builder.createSalesPageShell(input, config, this.context);
    this.store.save(created, "bootstrap_sales_page");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    return created;
  }

  private boundaryFail(
    action: SalesPageWorkerRunReport["action"],
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateSalesPages(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: SalesPageWorkerRunReport["action"],
    config: SalesPageWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: SalesPageWorkerInput) {
    return (
      input.processPayments === true ||
      input.deliverProducts === true ||
      input.publishWebsites === true ||
      input.publishPagesDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ509OrLater === true ||
      input.fabricateTestimonials === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: SalesPageWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: SalesPageReport | null = null,
  ) {
    const page = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `spw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SALES_PAGE_WORKER_ID,
      engineVersion: "PILLOW-SPW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...SPW_CAPABILITIES],
      totalSalesPages: this.store.count(),
      lastSalesPageId: page?.salesPageId ?? this.store.getLatestSalesPageId(),
      lastPageType: page?.pageType ?? null,
      lastConfidenceScore: page?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: SPW_METADATA_VERSION,
    };
  }

  private report(
    action: SalesPageWorkerRunReport["action"],
    catalog: SalesPageWorkerCatalog | null,
    salesPages: SalesPageReport[],
    latestSalesPage: SalesPageReport | null,
    validation: SalesPageWorkerRunReport["validation"],
    started: number,
  ): SalesPageWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      salesPageRunReportId: `spw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      salesPages,
      latestSalesPage,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: SPW_METADATA_VERSION,
    };
  }
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function cloneCatalog(catalog: SalesPageWorkerCatalog): SalesPageWorkerCatalog {
  return {
    ...catalog,
    salesPages: catalog.salesPages.map((report) => ({
      ...report,
      landingPageStructure: report.landingPageStructure.map((s) => ({ ...s })),
      sectionsGenerated: [...report.sectionsGenerated],
      assetsReferenced: [...report.assetsReferenced],
      headlines: [...report.headlines],
      featureSections: report.featureSections.map((f) => ({ ...f })),
      pricingPresentation: report.pricingPresentation
        ? {
            ...report.pricingPresentation,
            tiers: report.pricingPresentation.tiers.map((t) => ({
              ...t,
              includes: [...t.includes],
            })),
          }
        : null,
      testimonials: report.testimonials.map((t) => ({ ...t, fabricated: false as const })),
      faqs: report.faqs.map((f) => ({ ...f })),
      ctas: report.ctas.map((c) => ({ ...c })),
      guarantees: report.guarantees.map((g) => ({ ...g })),
      exportFormats: [...report.exportFormats],
      selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
      traceabilityRefs: [...report.traceabilityRefs],
      preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
