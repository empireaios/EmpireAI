import type { VisualResearchWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type VisualResearchWorkerDependencies,
} from "./integrations.js";
import { VisualBuilder } from "./visual-builder.js";
import { VisualStore } from "./visual-store.js";
import { HealthMonitor, VisualValidator, RecoveryManager } from "./visual-validator.js";
import { appendVrwLog } from "./vrw-logging.js";
import {
  INTEGRATION_TARGETS,
  VRW_CAPABILITIES,
  VRW_METADATA_VERSION,
  VISUAL_RESEARCH_WORKER_ID,
} from "./paths.js";
import type {
  VisualResearchContext,
  VisualResearchReport,
  VisualResearchWorkerCatalog,
  VisualResearchWorkerEngineRecord,
  VisualResearchWorkerInput,
  VisualResearchWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
  VisualSceneRecord,
} from "./types.js";

export class VisualManager {
  private engineRecord: VisualResearchWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: VisualResearchWorkerCatalog | null = null;
  private readonly store = new VisualStore();
  private readonly builder = new VisualBuilder();
  private readonly validator = new VisualValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: VisualResearchContext = {};

  bindIntegrations(deps: VisualResearchWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: VisualResearchWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedVisualResearchReports);
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

  getVisualResearchReports() {
    return this.store.list();
  }

  getLatestVisualResearchId() {
    return this.store.getLatestVisualResearchId();
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
    config: VisualResearchWorkerConfiguration,
  ): VisualResearchWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendVrwLog({
      event: "connect",
      details: `Visual Research Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `vrw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Visual Research Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: VRW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedScript(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    return this.runStage("receive_approved_script", input, config, { receivedScript: true });
  }

  breakIntoVisualScenes(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    return this.runSceneStage("break_into_visual_scenes", input, config, (ctx, seq) => {
      const scenes = this.builder.breakIntoVisualScenes(ctx, seq);
      this.context = { ...this.context, scenes };
      return scenes;
    });
  }

  identifyRequiredVisualAssets(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    return this.runSceneStage("identify_required_visual_assets", input, config, (ctx) => {
      const scenes = this.builder.identifyRequiredVisualAssets(ctx.scenes ?? [], ctx);
      this.context = { ...this.context, scenes };
      return scenes;
    });
  }

  searchApprovedStockLibraries(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    return this.runSceneStage("search_approved_stock_libraries", input, config, (ctx, seq) => {
      const scenes = this.builder.searchApprovedStockLibraries(ctx.scenes ?? [], config, seq);
      this.context = { ...this.context, scenes };
      return scenes;
    });
  }

  searchPublicDomainSources(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    return this.runSceneStage("search_public_domain_sources", input, config, (ctx, seq) => {
      const scenes = this.builder.searchPublicDomainSources(ctx.scenes ?? [], config, seq);
      this.context = { ...this.context, scenes };
      return scenes;
    });
  }

  identifyInternallyGeneratedAssets(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    return this.runSceneStage("identify_internally_generated_assets", input, config, (ctx, seq) => {
      const scenes = this.builder.identifyInternallyGeneratedAssets(ctx.scenes ?? [], ctx, config, seq);
      this.context = { ...this.context, scenes };
      return scenes;
    });
  }

  classifyCopyrightStatus(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    return this.runSceneStage("classify_copyright_status", input, config, (ctx) => {
      const scenes = this.builder.classifyCopyrightStatus(ctx.scenes ?? []);
      this.context = { ...this.context, scenes };
      return scenes;
    });
  }

  matchVisualsToScriptTimeline(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    return this.runSceneStage("match_visuals_to_script_timeline", input, config, (ctx) => {
      const scenes = this.builder.matchVisualsToScriptTimeline(
        ctx.scenes ?? [],
        (ctx.scenes ?? []).length || 3,
      );
      this.context = { ...this.context, scenes };
      return scenes;
    });
  }

  detectMissingVisualCoverage(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    return this.runSceneStage("detect_missing_visual_coverage", input, config, (ctx) => {
      const { scenes } = this.builder.detectMissingVisualCoverage(ctx.scenes ?? []);
      this.context = { ...this.context, scenes };
      return scenes;
    });
  }

  produceVisualResearchReport(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    return this.runFullGeneration("produce_visual_research_report", input, config);
  }

  submitReport(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.visualResearchId) {
      const one = this.store.get(input.visualResearchId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFullGeneration("produce_visual_research_report", input, config);
      reports = generated.visualResearchReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.visualResearchId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateVisualResearchReports(
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
    appendVrwLog({
      event: "submit_report",
      details: `visualResearchReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: VisualResearchWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateVisualResearchReports(
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

  validate(input: VisualResearchWorkerInput, config: VisualResearchWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateVisualResearchReports(
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

  diagnostics(config: VisualResearchWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Visual Research Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendVrwLog({ event: "diagnostics", details: `visualResearchReports=${this.store.count()}` });
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
    action: VisualResearchWorkerRunReport["action"],
    input: VisualResearchWorkerInput,
    config: VisualResearchWorkerConfiguration,
    flags: { receivedScript?: boolean },
  ): VisualResearchWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.visualResearchRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Visual Research Worker is disabled" : "Visual research rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    if (flags.receivedScript) this.context = { ...this.context, receivedScript: true };
    const validation = this.validator.validateVisualResearchReports(
      null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendVrwLog({
      event: action,
      details: `script=${this.context.scriptId ?? "pending"}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runSceneStage(
    action: VisualResearchWorkerRunReport["action"],
    input: VisualResearchWorkerInput,
    config: VisualResearchWorkerConfiguration,
    transform: (ctx: VisualResearchContext, seq: number) => VisualSceneRecord[],
  ): VisualResearchWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.visualResearchRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Visual Research Worker is disabled" : "Visual research rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canResearchVisuals(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    if (!this.context.scenes?.length) {
      this.context = {
        ...this.context,
        scenes: this.builder.breakIntoVisualScenes(this.context, Date.now()),
      };
    }
    transform(this.context, Date.now());
    const validation = this.validator.validateVisualResearchReports(null, enriched, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendVrwLog({
      event: action,
      details: `scenes=${this.context.scenes?.length ?? 0} script=${this.context.scriptId}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runFullGeneration(
    action: VisualResearchWorkerRunReport["action"],
    input: VisualResearchWorkerInput,
    config: VisualResearchWorkerConfiguration,
  ): VisualResearchWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.visualResearchRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Visual Research Worker is disabled" : "Visual research rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    if (input.unapprovedSource && !this.builder.isApprovedSource(input.unapprovedSource, config)) {
      const validation = this.validator.finalize(
        "fail",
        [`Unapproved visual source rejected: ${input.unapprovedSource}`],
        [],
        started,
      );
      this.recovery.recordFailure();
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const readiness = this.builder.canResearchVisuals(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const report = this.builder.buildVisualResearchReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateVisualResearchReports(
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
    appendVrwLog({
      event: action,
      details: `visualResearch=${report.visualResearchId} script=${report.scriptId} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: VisualResearchWorkerRunReport["action"],
    input: VisualResearchWorkerInput,
    config: VisualResearchWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateVisualResearchReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: VisualResearchWorkerRunReport["action"],
    config: VisualResearchWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: VisualResearchWorkerInput) {
    return (
      input.generateFinalCreativeAssets === true ||
      input.editImages === true ||
      input.assembleVideos === true ||
      input.publishContent === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ409OrLater === true ||
      input.useUnapprovedVisualSource === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: VisualResearchWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: VisualResearchReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `vrw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: VISUAL_RESEARCH_WORKER_ID,
      engineVersion: "PILLOW-VRW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...VRW_CAPABILITIES],
      totalVisualResearchReports: this.store.count(),
      lastVisualResearchId: report?.visualResearchId ?? this.store.getLatestVisualResearchId(),
      lastScriptId: report?.scriptId ?? null,
      lastContentFormat: report?.contentFormat ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: VRW_METADATA_VERSION,
    };
  }

  private report(
    action: VisualResearchWorkerRunReport["action"],
    catalog: VisualResearchWorkerCatalog | null,
    visualResearchReports: VisualResearchReport[],
    latestVisualResearchReport: VisualResearchReport | null,
    validation: VisualResearchWorkerRunReport["validation"],
    started: number,
  ): VisualResearchWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      visualResearchRunReportId: `vrw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      visualResearchReports,
      latestVisualResearchReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: VRW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: VisualResearchWorkerCatalog): VisualResearchWorkerCatalog {
  return {
    ...catalog,
    visualResearchReports: catalog.visualResearchReports.map((r) => ({
      ...r,
      scenes: r.scenes.map((s) => ({ ...s })),
      missingAssets: [...r.missingAssets],
      licensingRestrictions: r.licensingRestrictions.map((l) => ({ ...l })),
      traceabilityRefs: [...r.traceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
