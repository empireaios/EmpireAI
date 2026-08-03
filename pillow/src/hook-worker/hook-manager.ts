import type { HookWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type HookWorkerDependencies,
} from "./integrations.js";
import { HookBuilder } from "./hook-builder.js";
import { HookStore } from "./hook-store.js";
import { HealthMonitor, HookValidator, RecoveryManager } from "./hook-validator.js";
import { appendHkwLog } from "./hkw-logging.js";
import {
  HKW_CAPABILITIES,
  HKW_METADATA_VERSION,
  HOOK_WORKER_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  HookReport,
  HookWorkerCatalog,
  HookWorkerEngineRecord,
  HookWorkerInput,
  HookWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
  ScriptContext,
} from "./types.js";

export class HookManager {
  private engineRecord: HookWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: HookWorkerCatalog | null = null;
  private readonly store = new HookStore();
  private readonly builder = new HookBuilder();
  private readonly validator = new HookValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: ScriptContext = {};

  bindIntegrations(deps: HookWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: HookWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedHookReports);
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

  getHookReports() {
    return this.store.list();
  }

  getLatestHookReportId() {
    return this.store.getLatestHookReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getContext() {
    return { ...this.context };
  }

  connect(
    _input: Record<string, unknown>,
    config: HookWorkerConfiguration,
  ): HookWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendHkwLog({
      event: "connect",
      details: `Hook Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `hkw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Hook Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: HKW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedScript(input: HookWorkerInput, config: HookWorkerConfiguration) {
    return this.runStage("receive_approved_script", input, config);
  }

  generateOpeningHooks(input: HookWorkerInput, config: HookWorkerConfiguration) {
    return this.runGeneration("generate_opening_hooks", input, config, (ctx, seq) => {
      const { primary, alternatives } = this.builder.generateOpeningHooks(ctx, config, seq);
      return { primary, alternatives };
    });
  }

  generateCuriosityGaps(input: HookWorkerInput, config: HookWorkerConfiguration) {
    return this.runPartial("generate_curiosity_gaps", input, config, (ctx, seq) =>
      this.builder.generateCuriosityGaps(ctx, seq),
    );
  }

  generateRetentionLoops(input: HookWorkerInput, config: HookWorkerConfiguration) {
    return this.runPartial("generate_retention_loops", input, config, (ctx, seq) =>
      this.builder.generateRetentionLoops(ctx, seq),
    );
  }

  generateContinuationMoments(input: HookWorkerInput, config: HookWorkerConfiguration) {
    return this.runPartial("generate_continuation_moments", input, config, (ctx, seq) =>
      this.builder.generateContinuationMoments(ctx, seq),
    );
  }

  improvePacingRecommendations(input: HookWorkerInput, config: HookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.hookRulesEnabled) {
      return this.disabled(
        "improve_pacing_recommendations",
        config,
        !config.enabled ? "Hook Worker is disabled" : "Hook rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail("improve_pacing_recommendations", input, config, started);
    const enriched = this.integrations.enrichFromScriptWorker(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const format =
      this.builder.resolveFormat(enriched, this.context) ??
      (config.defaultContentFormat as HookReport["contentFormat"]);
    const pacing = this.builder.improvePacingRecommendations(this.context, format, Date.now());
    const latest = this.store.list().at(-1);
    if (latest) {
      const updated = { ...latest, pacingRecommendations: pacing };
      this.store.save(updated, "improve_pacing_recommendations");
    }
    const validation = this.validator.validateHookReports(latest ? [latest] : null, enriched, started);
    return this.report(
      "improve_pacing_recommendations",
      this.getCatalog(),
      this.store.list(),
      latest ?? null,
      validation,
      started,
    );
  }

  improveAudienceEngagement(input: HookWorkerInput, config: HookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("improve_audience_engagement", input, config, started);
    const enriched = this.integrations.enrichFromScriptWorker(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const latest = this.store.list().at(-1);
    if (latest) {
      const rationale = this.builder.improveAudienceEngagement(
        this.context,
        latest.primaryHook,
        latest.curiosityGaps,
      );
      this.store.save({ ...latest, engagementRationale: rationale }, "improve_audience_engagement");
    }
    const validation = this.validator.validateHookReports(
      latest ? [this.store.list().at(-1)!] : null,
      enriched,
      started,
    );
    return this.report(
      "improve_audience_engagement",
      this.getCatalog(),
      this.store.list(),
      this.store.list().at(-1) ?? null,
      validation,
      started,
    );
  }

  generateMultipleHookAlternatives(input: HookWorkerInput, config: HookWorkerConfiguration) {
    return this.runGeneration("generate_multiple_hook_alternatives", input, config);
  }

  selfReviewHookEffectiveness(input: HookWorkerInput, config: HookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("self_review_hook_effectiveness", input, config, started);
    const enriched = this.integrations.enrichFromScriptWorker(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const latest = this.store.list().at(-1);
    if (!latest) {
      const validation = this.validator.finalize("fail", ["No hook report available for self-review"], [], started);
      return this.report("self_review_hook_effectiveness", this.getCatalog(), [], null, validation, started);
    }
    const review = this.builder.selfReviewHookEffectiveness(
      latest.primaryHook,
      latest.alternativeHooks,
      latest.curiosityGaps,
      latest.retentionLoops,
      latest.continuationMoments,
      this.context,
    );
    const updated: HookReport = {
      ...latest,
      selfReviewPassed: review.passed,
      selfReviewSummary: review.summary,
      selfReviewFindings: review.findings,
      confidenceScore: review.confidenceScore,
    };
    this.store.save(updated, "self_review_hook_effectiveness");
    const validation = this.validator.validateHookReports([updated], enriched, started);
    return this.report(
      "self_review_hook_effectiveness",
      this.getCatalog(),
      [updated],
      updated,
      validation,
      started,
    );
  }

  produceHookReport(input: HookWorkerInput, config: HookWorkerConfiguration) {
    return this.runFullGeneration("produce_hook_report", input, config);
  }

  submitReport(input: HookWorkerInput, config: HookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.hookReportId) {
      const one = this.store.get(input.hookReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFullGeneration("produce_hook_report", input, config);
      reports = generated.hookReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.hookReportId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateHookReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true, pillowGovernanceConfirmed: input.pillowGovernanceConfirmed ?? true },
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
    appendHkwLog({
      event: "submit_report",
      details: `hookReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: HookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateHookReports(
      reports.length ? reports : null,
      { validated: true, pillowGovernanceConfirmed: true },
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

  validate(input: HookWorkerInput, config: HookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateHookReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true, pillowGovernanceConfirmed: input.pillowGovernanceConfirmed ?? true },
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

  diagnostics(config: HookWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Hook Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendHkwLog({ event: "diagnostics", details: `hookReports=${this.store.count()}` });
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
    action: HookWorkerRunReport["action"],
    input: HookWorkerInput,
    config: HookWorkerConfiguration,
  ): HookWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.hookRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Hook Worker is disabled" : "Hook rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromScriptWorker(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    if (action === "receive_approved_script") {
      this.context = { ...this.context, receivedScript: true };
    }
    const validation = this.validator.validateHookReports(
      null,
      { ...enriched, validated: enriched.validated ?? true, pillowGovernanceConfirmed: enriched.pillowGovernanceConfirmed ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendHkwLog({
      event: action,
      details: `script=${this.context.scriptId ?? "pending"} received=${Boolean(this.context.receivedScript)}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runFullGeneration(
    action: HookWorkerRunReport["action"],
    input: HookWorkerInput,
    config: HookWorkerConfiguration,
  ): HookWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.hookRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Hook Worker is disabled" : "Hook rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromScriptWorker({
      ...input,
      pillowGovernanceConfirmed: input.pillowGovernanceConfirmed ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateHooks(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const report = this.builder.buildHookReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateHookReports(
      [report],
      { ...enriched, validated: enriched.validated ?? true, pillowGovernanceConfirmed: enriched.pillowGovernanceConfirmed ?? true },
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
    appendHkwLog({
      event: action,
      details: `hookReport=${report.hookReportId} script=${report.scriptId} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runGeneration(
    action: HookWorkerRunReport["action"],
    input: HookWorkerInput,
    config: HookWorkerConfiguration,
    _extract?: (ctx: ScriptContext, seq: number) => unknown,
  ): HookWorkerRunReport {
    return this.runFullGeneration(action, input, config);
  }

  private runPartial(
    action: HookWorkerRunReport["action"],
    input: HookWorkerInput,
    config: HookWorkerConfiguration,
    generate: (ctx: ScriptContext, seq: number) => unknown,
  ): HookWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.hookRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Hook Worker is disabled" : "Hook rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromScriptWorker(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateHooks(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const seq = Date.now();
    generate(this.context, seq);
    const report = this.builder.buildHookReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateHookReports([report], enriched, started);
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: HookWorkerRunReport["action"],
    input: HookWorkerInput,
    config: HookWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateHookReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: HookWorkerRunReport["action"],
    config: HookWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: HookWorkerInput) {
    return (
      input.rewriteCompleteScript === true ||
      input.generateThumbnails === true ||
      input.generateVideos === true ||
      input.publishContent === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ407OrLater === true ||
      input.useMisleadingHooks === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: HookWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: HookReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `hkw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: HOOK_WORKER_ID,
      engineVersion: "PILLOW-HKW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...HKW_CAPABILITIES],
      totalHookReports: this.store.count(),
      lastHookReportId: report?.hookReportId ?? this.store.getLatestHookReportId(),
      lastScriptId: report?.scriptId ?? null,
      lastContentFormat: report?.contentFormat ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: HKW_METADATA_VERSION,
    };
  }

  private report(
    action: HookWorkerRunReport["action"],
    catalog: HookWorkerCatalog | null,
    hookReports: HookReport[],
    latestHookReport: HookReport | null,
    validation: HookWorkerRunReport["validation"],
    started: number,
  ): HookWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      hookRunReportId: `hkw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      hookReports,
      latestHookReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: HKW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: HookWorkerCatalog): HookWorkerCatalog {
  return {
    ...catalog,
    hookReports: catalog.hookReports.map((r) => ({
      ...r,
      primaryHook: { ...r.primaryHook },
      alternativeHooks: r.alternativeHooks.map((h) => ({ ...h })),
      curiosityGaps: r.curiosityGaps.map((g) => ({ ...g })),
      retentionLoops: r.retentionLoops.map((l) => ({ ...l })),
      continuationMoments: r.continuationMoments.map((m) => ({ ...m })),
      pacingRecommendations: r.pacingRecommendations.map((p) => ({ ...p })),
      traceabilityRefs: [...r.traceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
      selfReviewFindings: r.selfReviewFindings.map((f) => ({ ...f })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
