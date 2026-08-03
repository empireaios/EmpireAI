import type { EbookWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type EbookWorkerDependencies,
} from "./integrations.js";
import { EbookBuilder } from "./ebook-builder.js";
import { EbookStore } from "./ebook-store.js";
import { HealthMonitor, EbookValidator, RecoveryManager } from "./ebook-validator.js";
import { appendEbwLog } from "./ebw-logging.js";
import {
  EBW_CAPABILITIES,
  EBW_METADATA_VERSION,
  EBOOK_WORKER_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  EbookContext,
  EbookReport,
  EbookWorkerCatalog,
  EbookWorkerEngineRecord,
  EbookWorkerInput,
  EbookWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class EbookManager {
  private engineRecord: EbookWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: EbookWorkerCatalog | null = null;
  private readonly store = new EbookStore();
  private readonly builder = new EbookBuilder();
  private readonly validator = new EbookValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: EbookContext = {};

  bindIntegrations(deps: EbookWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: EbookWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedEbooks);
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

  getEbooks() {
    return this.store.list();
  }

  getLatestEbookId() {
    return this.store.getLatestEbookId();
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
    config: EbookWorkerConfiguration,
  ): EbookWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendEbwLog({
      event: "connect",
      details: `Ebook Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `ebw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Ebook Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EBW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedDigitalProductResearch(
    input: EbookWorkerInput,
    config: EbookWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.ebookRulesEnabled) {
      return this.disabled(
        "receive_approved_digital_product_research",
        config,
        !config.enabled ? "Ebook Worker is disabled" : "Ebook rules are disabled",
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
    // Always materialize a fresh ebook for newly received research so product type
    // and research identity are not reused from a prior in-memory manuscript.
    const ebook = this.builder.buildEbook(enriched, config, this.context);
    this.store.save(ebook, "receive_approved_digital_product_research");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateEbooks(
      [ebook],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompleteManuscript: true },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      ebook,
    );
    appendEbwLog({
      event: "receive_approved_digital_product_research",
      details: `researchReportId=${ebook.researchReportId ?? "none"} ebook=${ebook.ebookId} type=${ebook.productType}`,
    });
    return this.report(
      "receive_approved_digital_product_research",
      this.getCatalog(),
      [ebook],
      ebook,
      validation,
      started,
    );
  }

  createProductOutline(input: EbookWorkerInput, config: EbookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.ebookRulesEnabled) {
      return this.disabled(
        "create_product_outline",
        config,
        !config.enabled ? "Ebook Worker is disabled" : "Ebook rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("create_product_outline", input, config, started);
    }
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const chapterCount = enriched.chapterCount ?? config.defaultChapterCount;
    const outline = this.builder.createProductOutline(this.context, chapterCount);
    const latest = this.ensureWorkingEbook(enriched, config, started);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["Unable to create outline without research/product context"],
        [],
        started,
      );
      return this.report("create_product_outline", this.getCatalog(), [], null, validation, started);
    }
    const updated: EbookReport = {
      ...latest,
      outline,
      productTitle: outline.title,
      chapterStructure: this.builder.createChapterStructure(outline, this.context),
      timestamp: new Date().toISOString(),
      preservedDecisions: [
        ...latest.preservedDecisions,
        {
          decisionId: `ebw-dec-outline-${Date.now()}`,
          topic: outline.title,
          decision: `Product outline and TOC created with ${outline.sections.length} sections`,
          recordedAt: new Date().toISOString(),
        },
      ],
    };
    this.store.save(updated, "create_product_outline");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateEbooks(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendEbwLog({
      event: "create_product_outline",
      details: `ebook=${updated.ebookId} sections=${outline.sections.length}`,
    });
    return this.report(
      "create_product_outline",
      this.getCatalog(),
      [updated],
      updated,
      validation,
      started,
    );
  }

  createChapterStructure(input: EbookWorkerInput, config: EbookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.ebookRulesEnabled) {
      return this.disabled(
        "create_chapter_structure",
        config,
        !config.enabled ? "Ebook Worker is disabled" : "Ebook rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("create_chapter_structure", input, config, started);
    }
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const latest = this.ensureWorkingEbook(enriched, config, started);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["Unable to create chapter structure without research/product context"],
        [],
        started,
      );
      return this.report(
        "create_chapter_structure",
        this.getCatalog(),
        [],
        null,
        validation,
        started,
      );
    }
    const outline =
      latest.outline ??
      this.builder.createProductOutline(
        this.context,
        enriched.chapterCount ?? config.defaultChapterCount,
      );
    const chapterStructure = this.builder.createChapterStructure(outline, this.context);
    const updated: EbookReport = {
      ...latest,
      outline,
      chapterStructure,
      timestamp: new Date().toISOString(),
    };
    this.store.save(updated, "create_chapter_structure");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateEbooks(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendEbwLog({
      event: "create_chapter_structure",
      details: `ebook=${updated.ebookId} chapters=${chapterStructure.length}`,
    });
    return this.report(
      "create_chapter_structure",
      this.getCatalog(),
      [updated],
      updated,
      validation,
      started,
    );
  }

  generateCompleteWrittenContent(input: EbookWorkerInput, config: EbookWorkerConfiguration) {
    return this.runContentStage("generate_complete_written_content", input, config, (ebook) => {
      const structure =
        ebook.chapterStructure.length > 0
          ? ebook.chapterStructure
          : this.builder.createChapterStructure(
              ebook.outline ??
                this.builder.createProductOutline(this.context, config.defaultChapterCount),
              this.context,
            );
      const chapters = this.builder.generateCompleteWrittenContent(structure, this.context);
      const chapterStructure = structure.map((entry) => {
        const chapter = chapters.find((c) => c.chapterNumber === entry.chapterNumber);
        return {
          ...entry,
          wordCount: chapter?.wordCount ?? 0,
          summary: chapter?.summary ?? entry.summary,
        };
      });
      const wordCount = chapters.reduce((sum, c) => sum + c.wordCount, 0);
      const productType = this.builder.normalizeProductType(
        input.productType ?? this.context.productType ?? ebook.productType,
      );
      return {
        ...ebook,
        productType,
        chapterStructure,
        chapters,
        wordCount,
        includedResources: ebook.includedResources.length
          ? ebook.includedResources
          : ["written_content"],
      };
    });
  }

  generateTablesChecklistsAndSummaries(
    input: EbookWorkerInput,
    config: EbookWorkerConfiguration,
  ) {
    return this.runContentStage(
      "generate_tables_checklists_summaries",
      input,
      config,
      (ebook) => {
        const baseChapters =
          ebook.chapters.length > 0
            ? ebook.chapters
            : this.builder.generateCompleteWrittenContent(
                ebook.chapterStructure.length
                  ? ebook.chapterStructure
                  : this.builder.createChapterStructure(
                      ebook.outline ??
                        this.builder.createProductOutline(
                          this.context,
                          config.defaultChapterCount,
                        ),
                      this.context,
                    ),
                this.context,
              );
        const result = this.builder.generateTablesChecklistsAndSummaries(
          baseChapters,
          this.context,
        );
        const wordCount = result.chapters.reduce((sum, c) => sum + c.wordCount, 0);
        return {
          ...ebook,
          chapters: result.chapters,
          includedResources: unique([
            ...ebook.includedResources,
            ...result.includedResources,
          ]),
          wordCount,
          chapterStructure: ebook.chapterStructure.map((entry) => {
            const chapter = result.chapters.find((c) => c.chapterNumber === entry.chapterNumber);
            return { ...entry, wordCount: chapter?.wordCount ?? entry.wordCount };
          }),
        };
      },
    );
  }

  generateReferencesAndAppendices(input: EbookWorkerInput, config: EbookWorkerConfiguration) {
    return this.runContentStage(
      "generate_references_and_appendices",
      input,
      config,
      (ebook) => {
        const baseChapters =
          ebook.chapters.length > 0
            ? ebook.chapters
            : this.builder.generateCompleteWrittenContent(
                ebook.chapterStructure.length
                  ? ebook.chapterStructure
                  : this.builder.createChapterStructure(
                      ebook.outline ??
                        this.builder.createProductOutline(
                          this.context,
                          config.defaultChapterCount,
                        ),
                      this.context,
                    ),
                this.context,
              );
        const result = this.builder.generateReferencesAndAppendices(
          baseChapters,
          this.context,
          ebook.includedResources,
        );
        const wordCount = result.chapters.reduce((sum, c) => sum + c.wordCount, 0);
        return {
          ...ebook,
          chapters: result.chapters,
          includedResources: result.includedResources,
          wordCount,
        };
      },
    );
  }

  applyConsistentFormatting(input: EbookWorkerInput, config: EbookWorkerConfiguration) {
    return this.runContentStage("apply_consistent_formatting", input, config, (ebook) => {
      const chapters = this.builder.applyConsistentFormatting(
        ebook.chapters.length
          ? ebook.chapters
          : this.builder.generateCompleteWrittenContent(
              ebook.chapterStructure.length
                ? ebook.chapterStructure
                : this.builder.createChapterStructure(
                    ebook.outline ??
                      this.builder.createProductOutline(this.context, config.defaultChapterCount),
                    this.context,
                  ),
              this.context,
            ),
      );
      return {
        ...ebook,
        chapters,
        formattingApplied: true,
        wordCount: chapters.reduce((sum, c) => sum + c.wordCount, 0),
      };
    });
  }

  performSelfReview(input: EbookWorkerInput, config: EbookWorkerConfiguration) {
    return this.runContentStage("perform_self_review", input, config, (ebook) => {
      const review = this.builder.performSelfReview(ebook, this.context);
      return {
        ...ebook,
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

  /** Alias for performSelfReview. */
  selfReviewEbook(input: EbookWorkerInput, config: EbookWorkerConfiguration) {
    return this.performSelfReview(input, config);
  }

  prepareExportReadyEbookAssets(input: EbookWorkerInput, config: EbookWorkerConfiguration) {
    return this.runContentStage(
      "prepare_export_ready_ebook_assets",
      input,
      config,
      (ebook) => ({
        ...ebook,
        exportFormats: this.builder.prepareExportFormats(),
        preservedDecisions: [
          ...ebook.preservedDecisions,
          {
            decisionId: `ebw-dec-export-${Date.now()}`,
            topic: ebook.productTitle,
            decision:
              "Prepared export-ready structural formats (markdown/pdf_ready/epub_ready/docx_ready) without publishing or delivering",
            recordedAt: new Date().toISOString(),
          },
        ],
      }),
    );
  }

  produceEbookReport(input: EbookWorkerInput, config: EbookWorkerConfiguration) {
    return this.runFullBuild("produce_ebook_report", input, config);
  }

  submitReport(input: EbookWorkerInput, config: EbookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let ebooks = this.store.list();
    if (input.ebookId) {
      const one = this.store.get(input.ebookId);
      ebooks = one ? [one] : [];
    }
    if (!ebooks.length) {
      const generated = this.runFullBuild("produce_ebook_report", input, config);
      ebooks = generated.ebooks;
      if (!ebooks.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(ebooks);
    if (submission.submitted && submission.executiveReportId) {
      ebooks = ebooks.map(
        (e) => this.store.markSubmitted(e.ebookId, submission.executiveReportId!) ?? e,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = ebooks[ebooks.length - 1] ?? null;
    const validation = this.validator.validateEbooks(
      ebooks.length ? ebooks : null,
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
    appendEbwLog({
      event: "submit_report",
      details: `ebooks=${ebooks.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      ebooks,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: EbookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const ebooks = this.store.list();
    const latest = ebooks[ebooks.length - 1] ?? null;
    const validation = this.validator.validateEbooks(
      ebooks.length ? ebooks : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), ebooks, latest, validation, started);
  }

  validate(input: EbookWorkerInput, config: EbookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const ebooks = this.store.list();
    const latest = ebooks[ebooks.length - 1] ?? null;
    const validation = this.validator.validateEbooks(
      ebooks.length ? ebooks : null,
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
    return this.report("validate", this.getCatalog(), ebooks, latest, validation, started);
  }

  diagnostics(config: EbookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Ebook Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendEbwLog({ event: "diagnostics", details: `ebooks=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runStage(
    action: EbookWorkerRunReport["action"],
    input: EbookWorkerInput,
    config: EbookWorkerConfiguration,
    markResearch: boolean,
  ): EbookWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.ebookRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Ebook Worker is disabled" : "Ebook rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    if (markResearch) {
      this.context = { ...this.context, receivedResearch: true };
    }
    const latest = this.ensureWorkingEbook(enriched, config, started);
    const validation = this.validator.validateEbooks(
      latest ? [latest] : null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompleteManuscript: true },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest ?? undefined,
    );
    appendEbwLog({
      event: action,
      details: `research=${Boolean(this.context.receivedResearch)} researchReportId=${this.context.researchReportId ?? "none"} ebook=${latest?.ebookId ?? "none"}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      latest ? [latest] : this.store.list(),
      latest,
      validation,
      started,
    );
  }

  private runContentStage(
    action: EbookWorkerRunReport["action"],
    input: EbookWorkerInput,
    config: EbookWorkerConfiguration,
    mutate: (ebook: EbookReport) => EbookReport,
  ): EbookWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.ebookRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Ebook Worker is disabled" : "Ebook rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const latest = this.ensureWorkingEbook(enriched, config, started);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["No ebook available — approved research/product context required"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const updated: EbookReport = {
      ...mutate(latest),
      timestamp: new Date().toISOString(),
    };
    this.store.save(updated, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateEbooks(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendEbwLog({
      event: action,
      details: `ebook=${updated.ebookId} words=${updated.wordCount} confidence=${updated.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [updated], updated, validation, started);
  }

  private runFullBuild(
    action: EbookWorkerRunReport["action"],
    input: EbookWorkerInput,
    config: EbookWorkerConfiguration,
  ): EbookWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.ebookRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Ebook Worker is disabled" : "Ebook rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    if (enriched.researchReportId || enriched.researchTopic || enriched.productTitle) {
      this.context = { ...this.context, receivedResearch: true };
    }
    const readiness = this.builder.canBuildEbook(this.context);
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
    const ebook = this.builder.buildEbook(enriched, config, this.context);
    this.store.save(ebook, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateEbooks(
      [ebook],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      ebook,
    );
    appendEbwLog({
      event: action,
      details: `ebook=${ebook.ebookId} type=${ebook.productType} words=${ebook.wordCount} confidence=${ebook.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [ebook], ebook, validation, started);
  }

  private ensureWorkingEbook(
    input: EbookWorkerInput,
    config: EbookWorkerConfiguration,
    _started: number,
  ): EbookReport | null {
    if (input.ebookId) {
      const existing = this.store.get(input.ebookId);
      if (existing) return existing;
    }
    const latest = this.store.list().at(-1);
    if (latest) return latest;
    const readiness = this.builder.canBuildEbook(this.context);
    if (!readiness.ready) return null;
    const created = this.builder.buildEbook(input, config, this.context);
    this.store.save(created, "bootstrap_ebook");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    return created;
  }

  private boundaryFail(
    action: EbookWorkerRunReport["action"],
    input: EbookWorkerInput,
    config: EbookWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateEbooks(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: EbookWorkerRunReport["action"],
    config: EbookWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: EbookWorkerInput) {
    return (
      input.buildSalesPages === true ||
      input.processPayments === true ||
      input.deliverProductsToCustomers === true ||
      input.publishProductsDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ504OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: EbookWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: EbookReport | null = null,
  ) {
    const ebook = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `ebw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EBOOK_WORKER_ID,
      engineVersion: "PILLOW-EBW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...EBW_CAPABILITIES],
      totalEbooks: this.store.count(),
      lastEbookId: ebook?.ebookId ?? this.store.getLatestEbookId(),
      lastProductType: ebook?.productType ?? null,
      lastConfidenceScore: ebook?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: EBW_METADATA_VERSION,
    };
  }

  private report(
    action: EbookWorkerRunReport["action"],
    catalog: EbookWorkerCatalog | null,
    ebooks: EbookReport[],
    latestEbook: EbookReport | null,
    validation: EbookWorkerRunReport["validation"],
    started: number,
  ): EbookWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      ebookRunReportId: `ebw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      ebooks,
      latestEbook,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: EBW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: EbookWorkerCatalog): EbookWorkerCatalog {
  return {
    ...catalog,
    ebooks: catalog.ebooks.map((ebook) => ({
      ...ebook,
      chapterStructure: ebook.chapterStructure.map((c) => ({ ...c })),
      includedResources: [...ebook.includedResources],
      exportFormats: [...ebook.exportFormats],
      chapters: ebook.chapters.map((c) => ({ ...c })),
      outline: ebook.outline
        ? {
            ...ebook.outline,
            tableOfContents: [...ebook.outline.tableOfContents],
            sections: ebook.outline.sections.map((s) => ({ ...s })),
            learningObjectives: [...ebook.outline.learningObjectives],
          }
        : null,
      selfReviewFindings: ebook.selfReviewFindings.map((f) => ({ ...f })),
      traceabilityRefs: [...ebook.traceabilityRefs],
      preservedDecisions: ebook.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
