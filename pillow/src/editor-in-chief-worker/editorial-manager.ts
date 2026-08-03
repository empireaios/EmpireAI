import type { EditorInChiefWorkerConfiguration } from "./configuration.js";

import {

  IntegrationCoordinator,

  type EditorInChiefWorkerDependencies,

} from "./integrations.js";

import { appendEcwLog } from "./ecw-logging.js";

import {

  ECW_CAPABILITIES,

  ECW_METADATA_VERSION,

  EDITOR_IN_CHIEF_WORKER_ID,

  INTEGRATION_TARGETS,

} from "./paths.js";

import { EditorialBuilder } from "./editorial-builder.js";

import { EditorialStore } from "./editorial-store.js";

import {

  EditorialValidator,

  HealthMonitor,

  RecoveryManager,

} from "./editorial-validator.js";

import type {

  ApprovalStatus,

  BrandConsistencyStatus,

  EditorialContext,

  EditorialReport,

  EditorInChiefWorkerCatalog,

  EditorInChiefWorkerEngineRecord,

  EditorInChiefWorkerInput,

  EditorInChiefWorkerRunReport,

  IntegrationHandshake,

  OperationalState,

  ReviewOutcome,

} from "./types.js";



export class EditorialManager {

  private engineRecord: EditorInChiefWorkerEngineRecord | null = null;

  private seeded = false;

  private catalog: EditorInChiefWorkerCatalog | null = null;

  private readonly store = new EditorialStore();

  private readonly builder = new EditorialBuilder();

  private readonly validator = new EditorialValidator();

  private readonly healthMonitor = new HealthMonitor();

  private readonly recovery = new RecoveryManager();

  private readonly integrations = new IntegrationCoordinator();

  private handshakes: IntegrationHandshake[] = [];

  private pendingContext: EditorialContext = {};



  bindIntegrations(deps: EditorInChiefWorkerDependencies = {}) {

    this.integrations.bind(deps);

  }



  ensureSeeded(config: EditorInChiefWorkerConfiguration) {

    if (this.seeded) return;

    this.store.seed(config.seedReports);

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



  getEditorialReports() {

    return this.store.list();

  }



  getLatestEditorialReportId() {

    return this.store.getLatestEditorialReportId();

  }



  getAuditTrail() {

    return this.store.getAuditTrail();

  }



  getIntegrations() {

    return this.handshakes.map((h) => ({ ...h }));

  }



  connect(

    _input: Record<string, unknown>,

    config: EditorInChiefWorkerConfiguration,

  ): EditorInChiefWorkerRunReport {

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

    appendEcwLog({

      event: "connect",

      details: `Editor-in-Chief Worker connected; integrations=${this.handshakes.length}`,

    });

    return this.report(

      "connect",

      this.getCatalog(),

      [],

      null,

      {

        validationReportId: `ecw-val-${Date.now()}`,

        validationTimestamp: new Date().toISOString(),

        decision: config.enabled ? "pass" : "fail",

        errors: config.enabled ? [] : ["Editor-in-Chief Worker is disabled"],

        warnings: [],

        durationMs: Date.now() - started,

        metadataVersion: ECW_METADATA_VERSION,

      },

      started,

    );

  }



  manageEditorialDirection(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

    return this.runEditorial("manage_editorial_direction", input, config, (ctx, enriched) => {

      const strategy =

        enriched.editorialStrategy?.trim() ||

        "Direct downstream content workers with mission-aligned editorial strategy";

      const next = this.builder.recordDecision(

        this.builder.mergeContext(ctx, { ...enriched, editorialStrategy: strategy }),

        "editorial_direction",

        strategy,

      );

      return { ...next, editorialStrategy: strategy };

    });

  }



  defineChannelIdentity(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

    return this.runEditorial("define_channel_identity", input, config, (ctx, enriched) => {

      const identity =

        enriched.channelIdentity?.trim() ||

        enriched.channelName?.trim() ||

        `Identity for ${enriched.channelId ?? "channel"}`;

      const next = this.builder.recordDecision(

        this.builder.mergeContext(ctx, { ...enriched, channelIdentity: identity }),

        "channel_identity",

        identity,

      );

      return { ...next, channelIdentity: identity };

    });

  }



  defineTargetAudience(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

    return this.runEditorial("define_target_audience", input, config, (ctx, enriched) => {

      const audience =

        enriched.targetAudience?.trim() ||

        "Professionals seeking authoritative media content aligned with channel mission";

      const next = this.builder.recordDecision(

        this.builder.mergeContext(ctx, { ...enriched, targetAudience: audience }),

        "target_audience",

        audience,

      );

      return { ...next, targetAudience: audience };

    });

  }



  defineEditorialTone(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

    return this.runEditorial("define_editorial_tone", input, config, (ctx, enriched) => {

      const tone = this.builder.resolveTone(

        enriched.editorialTone ?? config.defaultEditorialTone,

      );

      const next = this.builder.recordDecision(

        this.builder.mergeContext(ctx, { ...enriched, editorialTone: tone }),

        "editorial_tone",

        tone,

      );

      return { ...next, editorialTone: tone };

    });

  }



  defineContentStandards(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

    return this.runEditorial("define_content_standards", input, config, (ctx, enriched) => {

      const standards =

        enriched.qualityStandards != null

          ? this.builder.normalizeStandards(enriched.qualityStandards)

          : this.builder.defaultStandards();

      const next = this.builder.recordDecision(

        this.builder.mergeContext(ctx, { ...enriched, qualityStandards: standards }),

        "content_standards",

        `${standards.length} standards enforced`,

      );

      return { ...next, qualityStandards: standards };

    });

  }



  definePublishingPriorities(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

    return this.runEditorial("define_publishing_priorities", input, config, (ctx, enriched) => {

      const priorities =

        enriched.contentPriorities?.length

          ? [...enriched.contentPriorities]

          : ["editorial_quality", "brand_consistency", "audience_growth"];

      const next = this.builder.recordDecision(

        this.builder.mergeContext(ctx, { ...enriched, contentPriorities: priorities }),

        "publishing_priorities",

        priorities.join(", "),

      );

      return { ...next, contentPriorities: priorities };

    });

  }



  reviewContentQuality(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

    return this.runEditorial("review_content_quality", input, config, (ctx, enriched) => {

      const reviewOutcome = this.builder.resolveReviewOutcome(

        enriched.reviewOutcome ??

          (enriched.contentReviewNotes?.toLowerCase().includes("revise")

            ? "revise"

            : config.defaultReviewOutcome),

      );

      const next = this.builder.mergeContext(ctx, {

        ...enriched,

        reviewOutcome,

        contentReviewNotes: enriched.contentReviewNotes,

      });

      return this.builder.recordDecision(

        next,

        "content_quality_review",

        `Review outcome: ${reviewOutcome}`,

      );

    });

  }



  ensureBrandConsistency(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

    return this.runEditorial("ensure_brand_consistency", input, config, (ctx, enriched) => {

      const brandConsistencyStatus = this.builder.assessBrandConsistency(

        enriched.brandSignals ?? [],

      );

      const next = this.builder.mergeContext(ctx, {

        ...enriched,

        brandSignals: enriched.brandSignals ?? [],

      });

      return {

        ...this.builder.recordDecision(

          next,

          "brand_consistency",

          `Status: ${brandConsistencyStatus}`,

        ),

        brandConsistencyStatus,

      };

    });

  }



  maintainLongTermStrategy(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

    return this.runEditorial("maintain_long_term_strategy", input, config, (ctx, enriched) => {

      const strategy =

        enriched.longTermStrategy?.trim() ||

        "Build durable editorial authority through consistent standards and audience trust";

      const next = this.builder.recordDecision(

        this.builder.mergeContext(ctx, { ...enriched, longTermStrategy: strategy }),

        "long_term_strategy",

        strategy,

      );

      return { ...next, longTermStrategy: strategy };

    });

  }



  approveEditorialDecisions(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

    const started = Date.now();

    this.ensureSeeded(config);

    if (this.hasBoundary(input)) {

      return this.boundaryFail("approve_editorial_decisions", input, config, started);

    }



    const approvalErrors = this.validator.validateApproval(input);

    if (approvalErrors.length) {

      const validation = this.validator.finalize("fail", approvalErrors, [], started);

      this.recovery.recordFailure();

      this.ensureRecord("failed", config, "failed");

      return this.report(

        "approve_editorial_decisions",

        this.getCatalog(),

        [],

        null,

        validation,

        started,

      );

    }



    const enriched = this.integrations.enrichFromMediaFactory(input);

    const approvalStatus = this.builder.resolveApprovalStatus(

      enriched.approvalDecision ?? "approved",

    );

    this.pendingContext = this.builder.recordDecision(

      this.builder.mergeContext(this.pendingContext, {

        ...enriched,

        approvalDecision: approvalStatus,

      }),

      "editorial_approval",

      `Approval status: ${approvalStatus}`,

    );

    this.pendingContext = {

      ...this.pendingContext,

      approvalStatus,

    };



    const validation = this.passWithWarnings(

      [`Editorial approval recorded: ${approvalStatus}`],

      started,

    );

    this.ensureRecord("active", config, "passed");

    appendEcwLog({

      event: "approve_editorial_decisions",

      details: `approval=${approvalStatus}`,

    });

    return this.report(

      "approve_editorial_decisions",

      this.getCatalog(),

      [],

      null,

      validation,

      started,

    );

  }



  produceReport(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

    return this.runEditorial("produce_report", input, config, (ctx, enriched) => {

      const merged = this.builder.mergeContext(ctx, enriched);

      return merged;

    }, true);

  }



  submitReport(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

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



    let reports = this.store.list();

    if (input.editorialReportId) {

      const one = this.store.get(input.editorialReportId);

      reports = one ? [one] : [];

    }

    if (!reports.length) {

      const generated = this.runEditorial(

        "produce_report",

        input,

        config,

        (ctx, enriched) => this.builder.mergeContext(ctx, enriched),

        true,

      );

      reports = generated.editorialReports;

      if (!reports.length || generated.validation.decision === "fail") return generated;

    }



    const submission = this.integrations.submitReport(reports);

    if (submission.submitted && submission.executiveReportId) {

      reports = reports.map(

        (r) =>

          this.store.markSubmitted(r.editorialReportId, submission.executiveReportId!) ?? r,

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

    appendEcwLog({

      event: "submit_report",

      details: `reports=${reports.length} submitted=${submission.submitted}`,

    });

    return this.report(

      "submit_report",

      this.getCatalog(),

      reports,

      latest,

      validation.warnings.length && validation.decision === "pass"

        ? { ...validation, decision: "partial" }

        : validation,

      started,

    );

  }



  list(config: EditorInChiefWorkerConfiguration) {

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



  validate(

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

  ) {

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



  diagnostics(config: EditorInChiefWorkerConfiguration) {

    const started = Date.now();

    this.ensureSeeded(config);

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    const validation = this.validator.finalize(

      config.enabled ? "pass" : "fail",

      config.enabled ? [] : ["Editor-in-Chief Worker is disabled"],

      [],

      started,

    );

    this.ensureRecord("active", config);

    appendEcwLog({

      event: "diagnostics",

      details: `editorialReports=${this.store.count()}`,

    });

    return this.report(

      "diagnostics",

      this.getCatalog(),

      this.store.list(),

      null,

      validation,

      started,

    );

  }



  private runEditorial(

    action: EditorInChiefWorkerRunReport["action"],

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

    transform: (

      ctx: EditorialContext,

      enriched: EditorInChiefWorkerInput,

    ) => EditorialContext,

    persistReport = false,

  ): EditorInChiefWorkerRunReport {

    const started = Date.now();

    this.ensureSeeded(config);

    if (!config.enabled || !config.editorialRulesEnabled) {

      return this.disabled(

        action,

        config,

        !config.enabled

          ? "Editor-in-Chief Worker is disabled"

          : "Editorial rules are disabled",

      );

    }

    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);



    const enriched = this.integrations.enrichFromMediaFactory(input);

    if (

      !enriched.mediaBusinessId?.trim() &&

      !enriched.channelId?.trim() &&

      !enriched.mediaMissionId?.trim()

    ) {

      return this.disabled(

        action,

        config,

        "Editorial operations require mediaBusinessId, channelId, or mediaMissionId",

      );

    }



    this.pendingContext = transform(this.pendingContext, enriched);



    let reports: EditorialReport[] = [];

    let latest: EditorialReport | null = null;

    if (persistReport) {

      latest = this.builder.buildReport(this.pendingContext, config);

      this.store.save(latest, action);

      reports = [latest];

      this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    }



    const validation = persistReport

      ? this.validator.validateReports(

          reports,

          { ...enriched, validated: enriched.validated ?? true },

          started,

        )

      : this.passWithWarnings(

          [`Editorial context updated via ${action}`],

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

    appendEcwLog({

      event: action,

      details: persistReport

        ? `report=${latest!.editorialReportId} channel=${latest!.channelId}`

        : `channel=${enriched.channelId ?? enriched.mediaBusinessId}`,

    });

    return this.report(action, this.getCatalog(), reports, latest, validation, started);

  }



  private passWithWarnings(warnings: string[], started: number) {
    const validation = this.validator.finalize("pass", [], warnings, started);
    if (validation.errors.length === 0) {
      validation.decision = "pass";
    }
    return validation;
  }

  private boundaryFail(

    action: EditorInChiefWorkerRunReport["action"],

    input: EditorInChiefWorkerInput,

    config: EditorInChiefWorkerConfiguration,

    started: number,

  ) {

    const validation = this.validator.validateReports(null, input, started);

    this.recovery.recordFailure();

    this.ensureRecord("failed", config, "failed");

    return this.report(action, this.getCatalog(), [], null, validation, started);

  }



  private disabled(

    action: EditorInChiefWorkerRunReport["action"],

    config: EditorInChiefWorkerConfiguration,

    message: string,

  ) {

    const started = Date.now();

    const validation = this.validator.finalize("fail", [message], [], started);

    this.recovery.recordFailure();

    this.ensureRecord("failed", config, "failed");

    return this.report(action, this.getCatalog(), [], null, validation, started);

  }



  private hasBoundary(input: EditorInChiefWorkerInput) {

    return (

      input.writeScripts === true ||

      input.createThumbnails === true ||

      input.assembleVideos === true ||

      input.publishContent === true ||

      input.bypassPillowGovernance === true ||

      input.overridePillow === true ||

      input.overrideGrandKing === true ||

      input.implementQ403OrLater === true

    );

  }



  private ensureRecord(

    state: OperationalState,

    config: EditorInChiefWorkerConfiguration,

    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",

    latest: EditorialReport | null = null,

  ) {

    const report = latest ?? this.store.list().at(-1) ?? null;

    this.engineRecord = {

      engineRecordId: this.engineRecord?.engineRecordId ?? `ecw-eng-${Date.now()}`,

      timestamp: new Date().toISOString(),

      engineId: EDITOR_IN_CHIEF_WORKER_ID,

      engineVersion: "PILLOW-ECW-001",

      currentOperationalState: state,

      healthStatus: this.healthMonitor.status(

        validationStatus === "failed" ? "fail" : "pass",

        config.enabled,

      ),

      validationStatus,

      supportedCapabilities: [...ECW_CAPABILITIES],

      totalEditorialReports: this.store.count(),

      lastEditorialReportId:

        report?.editorialReportId ?? this.store.getLatestEditorialReportId(),

      lastReviewOutcome: report?.reviewOutcome ?? null,

      lastApprovalStatus: report?.approvalStatus ?? null,

      lastBrandConsistencyStatus: report?.brandConsistencyStatus ?? null,

      workerId: config.workerId,

      integrationTargets: [...INTEGRATION_TARGETS],

      metadataVersion: ECW_METADATA_VERSION,

    };

  }



  private report(

    action: EditorInChiefWorkerRunReport["action"],

    catalog: EditorInChiefWorkerCatalog | null,

    editorialReports: EditorialReport[],

    latestEditorialReport: EditorialReport | null,

    validation: EditorInChiefWorkerRunReport["validation"],

    started: number,

  ): EditorInChiefWorkerRunReport {

    const engineRecord = this.getEngineRecord()!;

    return {

      editorialRunReportId: `ecw-run-${Date.now()}`,

      runTimestamp: new Date().toISOString(),

      action,

      engineRecord,

      catalog,

      editorialReports,

      latestEditorialReport,

      integrations: this.getIntegrations(),

      validation,

      durationMs: Date.now() - started,

      metadataVersion: ECW_METADATA_VERSION,

    };

  }

}



function cloneCatalog(catalog: EditorInChiefWorkerCatalog): EditorInChiefWorkerCatalog {

  return {

    ...catalog,

    editorialReports: catalog.editorialReports.map((report) => ({

      ...report,

      qualityStandards: report.qualityStandards.map((s) => ({ ...s })),

      contentPriorities: [...report.contentPriorities],

      executiveRecommendations: report.executiveRecommendations.map((r) => ({ ...r })),

      traceabilityRefs: [...report.traceabilityRefs],

      preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),

    })),

    integrations: catalog.integrations.map((i) => ({ ...i })),

  };

}


