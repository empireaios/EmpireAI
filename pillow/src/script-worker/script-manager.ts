import type { ScriptWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type ScriptWorkerDependencies,
} from "./integrations.js";
import { ScriptBuilder } from "./script-builder.js";
import { ScriptStore } from "./script-store.js";
import { HealthMonitor, ScriptValidator, RecoveryManager } from "./script-validator.js";
import { appendScwLog } from "./scw-logging.js";
import {
  INTEGRATION_TARGETS,
  SCW_CAPABILITIES,
  SCW_METADATA_VERSION,
  SCRIPT_WORKER_ID,
} from "./paths.js";
import type {
  IntegrationHandshake,
  OperationalState,
  ScriptContext,
  ScriptReport,
  ScriptWorkerCatalog,
  ScriptWorkerEngineRecord,
  ScriptWorkerInput,
  ScriptWorkerRunReport,
} from "./types.js";

export class ScriptManager {
  private engineRecord: ScriptWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: ScriptWorkerCatalog | null = null;
  private readonly store = new ScriptStore();
  private readonly builder = new ScriptBuilder();
  private readonly validator = new ScriptValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: ScriptContext = {};

  bindIntegrations(deps: ScriptWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ScriptWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedScripts);
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

  getScripts() {
    return this.store.list();
  }

  getLatestScriptId() {
    return this.store.getLatestScriptId();
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
    config: ScriptWorkerConfiguration,
  ): ScriptWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendScwLog({
      event: "connect",
      details: `Script Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `scw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Script Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: SCW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedTopicPlan(input: ScriptWorkerInput, config: ScriptWorkerConfiguration) {
    return this.runStage("receive_approved_topic_plan", input, config, false, true);
  }

  receiveEditorialStrategy(input: ScriptWorkerInput, config: ScriptWorkerConfiguration) {
    return this.runStage("receive_editorial_strategy", input, config, false, false);
  }

  determineContentFormat(input: ScriptWorkerInput, config: ScriptWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.scriptRulesEnabled) {
      return this.disabled(
        "determine_content_format",
        config,
        !config.enabled ? "Script Worker is disabled" : "Script rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail("determine_content_format", input, config, started);
    const enriched = this.integrations.enrichFromUpstreamWorkers(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const format = this.builder.determineContentFormat(enriched, this.context);
    this.context = { ...this.context, contentFormat: format };
    const validation = this.validator.validateScripts(null, enriched, started);
    this.ensureRecord("active", config);
    appendScwLog({ event: "determine_content_format", details: `format=${format}` });
    return this.report("determine_content_format", this.getCatalog(), this.store.list(), null, validation, started);
  }

  generateCompleteScript(input: ScriptWorkerInput, config: ScriptWorkerConfiguration) {
    return this.runScripting("generate_complete_script", input, config);
  }

  adaptWritingStyle(input: ScriptWorkerInput, config: ScriptWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("adapt_writing_style", input, config, started);
    const enriched = this.integrations.enrichFromUpstreamWorkers(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const latest = this.store.list().at(-1);
    if (!latest) {
      const validation = this.validator.finalize("fail", ["No script available to adapt"], [], started);
      return this.report("adapt_writing_style", this.getCatalog(), [], null, validation, started);
    }
    const adapted = this.builder.adaptWritingStyle(
      latest.scriptSections,
      this.context.channelIdentity ?? latest.channelId,
      this.context.editorialTone ?? "informative",
    );
    const updated: ScriptReport = {
      ...latest,
      scriptSections: adapted.sections,
      writingStyleNotes: adapted.notes,
      narrationReadyText: this.builder.generateNarrationReadyOutput(adapted.sections),
    };
    this.store.save(updated, "adapt_writing_style");
    const validation = this.validator.validateScripts([updated], enriched, started);
    return this.report("adapt_writing_style", this.getCatalog(), [updated], updated, validation, started);
  }

  structureScriptSections(input: ScriptWorkerInput, config: ScriptWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("structure_script_sections", input, config, started);
    const enriched = this.integrations.enrichFromUpstreamWorkers(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const format = this.context.contentFormat ?? this.builder.determineContentFormat(enriched, this.context);
    const sections = this.builder.structureScriptSections(
      this.context.topicTitle ?? enriched.topicTitle ?? "Topic",
      format,
      this.context.editorialStrategy ?? enriched.editorialStrategy ?? "",
      this.context.channelIdentity ?? enriched.channelIdentity ?? "",
      this.context.editorialTone ?? enriched.editorialTone ?? "informative",
      this.context.contentPriorities ?? enriched.contentPriorities ?? [],
      this.context.targetAudience ?? enriched.targetAudience ?? "audience",
    );
    const validation = this.validator.validateScripts(null, enriched, started);
    appendScwLog({ event: "structure_script_sections", details: `sections=${sections.length}` });
    return this.report("structure_script_sections", this.getCatalog(), this.store.list(), null, validation, started);
  }

  generateNarrationReadyOutput(input: ScriptWorkerInput, config: ScriptWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("generate_narration_ready_output", input, config, started);
    const enriched = this.integrations.enrichFromUpstreamWorkers(input);
    const latest = this.store.list().at(-1);
    if (!latest) {
      const validation = this.validator.finalize("fail", ["No script available"], [], started);
      return this.report("generate_narration_ready_output", this.getCatalog(), [], null, validation, started);
    }
    const narration = this.builder.generateNarrationReadyOutput(latest.scriptSections);
    const updated: ScriptReport = { ...latest, narrationReadyText: narration };
    this.store.save(updated, "generate_narration_ready_output");
    const validation = this.validator.validateScripts([updated], enriched, started);
    return this.report(
      "generate_narration_ready_output",
      this.getCatalog(),
      [updated],
      updated,
      validation,
      started,
    );
  }

  selfReviewScript(input: ScriptWorkerInput, config: ScriptWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("self_review_script", input, config, started);
    const enriched = this.integrations.enrichFromUpstreamWorkers(input);
    const latest = this.store.list().at(-1);
    if (!latest) {
      const validation = this.validator.finalize("fail", ["No script available for self-review"], [], started);
      return this.report("self_review_script", this.getCatalog(), [], null, validation, started);
    }
    const review = this.builder.selfReviewScript(
      latest.scriptSections,
      latest.narrationReadyText,
      this.context.editorialStrategy ?? enriched.editorialStrategy ?? "",
      this.context.contentPriorities ?? enriched.contentPriorities ?? [],
      this.context.topicTitle ?? latest.scriptTitle,
    );
    const updated: ScriptReport = {
      ...latest,
      selfReviewPassed: review.passed,
      selfReviewSummary: review.summary,
      selfReviewFindings: review.findings,
      confidenceScore: review.complianceScore,
      editorialCompliance: review.editorialCompliance,
      editorialComplianceNotes: review.editorialComplianceNotes,
    };
    this.store.save(updated, "self_review_script");
    const validation = this.validator.validateScripts([updated], enriched, started);
    return this.report("self_review_script", this.getCatalog(), [updated], updated, validation, started);
  }

  produceScriptReport(input: ScriptWorkerInput, config: ScriptWorkerConfiguration) {
    return this.runScripting("produce_script_report", input, config);
  }

  submitReport(input: ScriptWorkerInput, config: ScriptWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let scripts = this.store.list();
    if (input.scriptId) {
      const one = this.store.get(input.scriptId);
      scripts = one ? [one] : [];
    }
    if (!scripts.length) {
      const generated = this.runScripting("produce_script_report", input, config);
      scripts = generated.scripts;
      if (!scripts.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(scripts);
    if (submission.submitted && submission.executiveReportId) {
      scripts = scripts.map(
        (s) => this.store.markSubmitted(s.scriptId, submission.executiveReportId!) ?? s,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = scripts[scripts.length - 1] ?? null;
    const validation = this.validator.validateScripts(
      scripts.length ? scripts : null,
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
    appendScwLog({
      event: "submit_report",
      details: `scripts=${scripts.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      scripts,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: ScriptWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const scripts = this.store.list();
    const latest = scripts[scripts.length - 1] ?? null;
    const validation = this.validator.validateScripts(
      scripts.length ? scripts : null,
      { validated: true, pillowGovernanceConfirmed: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), scripts, latest, validation, started);
  }

  validate(input: ScriptWorkerInput, config: ScriptWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const scripts = this.store.list();
    const latest = scripts[scripts.length - 1] ?? null;
    const validation = this.validator.validateScripts(
      scripts.length ? scripts : null,
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
    return this.report("validate", this.getCatalog(), scripts, latest, validation, started);
  }

  diagnostics(config: ScriptWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Script Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendScwLog({ event: "diagnostics", details: `scripts=${this.store.count()}` });
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
    action: ScriptWorkerRunReport["action"],
    input: ScriptWorkerInput,
    config: ScriptWorkerConfiguration,
    requireScript: boolean,
    markTopicPlan: boolean,
  ): ScriptWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.scriptRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Script Worker is disabled" : "Script rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromUpstreamWorkers(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    if (markTopicPlan) {
      this.context = { ...this.context, receivedTopicPlan: true };
    }
    if (action === "receive_editorial_strategy") {
      this.context = { ...this.context, receivedEditorial: true };
    }
    const validation = this.validator.validateScripts(
      requireScript ? this.store.list() : null,
      { ...enriched, validated: enriched.validated ?? true, pillowGovernanceConfirmed: enriched.pillowGovernanceConfirmed ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendScwLog({
      event: action,
      details: `topicPlan=${Boolean(this.context.receivedTopicPlan)} editorial=${Boolean(this.context.receivedEditorial)}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runScripting(
    action: ScriptWorkerRunReport["action"],
    input: ScriptWorkerInput,
    config: ScriptWorkerConfiguration,
  ): ScriptWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.scriptRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Script Worker is disabled" : "Script rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromUpstreamWorkers({
      ...input,
      pillowGovernanceConfirmed: input.pillowGovernanceConfirmed ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateScript(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    if (!enriched.channelId?.trim()) {
      return this.disabled(action, config, "Script generation requires channelId");
    }
    const script = this.builder.buildScript(enriched, config, this.context);
    this.store.save(script, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateScripts(
      [script],
      { ...enriched, validated: enriched.validated ?? true, pillowGovernanceConfirmed: enriched.pillowGovernanceConfirmed ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      script,
    );
    appendScwLog({
      event: action,
      details: `script=${script.scriptId} format=${script.contentFormat} confidence=${script.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [script], script, validation, started);
  }

  private boundaryFail(
    action: ScriptWorkerRunReport["action"],
    input: ScriptWorkerInput,
    config: ScriptWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateScripts(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: ScriptWorkerRunReport["action"],
    config: ScriptWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: ScriptWorkerInput) {
    return (
      input.generateVisuals === true ||
      input.generateVoiceovers === true ||
      input.assembleVideos === true ||
      input.publishContent === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ406OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: ScriptWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: ScriptReport | null = null,
  ) {
    const script = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `scw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SCRIPT_WORKER_ID,
      engineVersion: "PILLOW-SCW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...SCW_CAPABILITIES],
      totalScripts: this.store.count(),
      lastScriptId: script?.scriptId ?? this.store.getLatestScriptId(),
      lastContentFormat: script?.contentFormat ?? null,
      lastConfidenceScore: script?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: SCW_METADATA_VERSION,
    };
  }

  private report(
    action: ScriptWorkerRunReport["action"],
    catalog: ScriptWorkerCatalog | null,
    scripts: ScriptReport[],
    latestScript: ScriptReport | null,
    validation: ScriptWorkerRunReport["validation"],
    started: number,
  ): ScriptWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      scriptRunReportId: `scw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      scripts,
      latestScript,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: SCW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: ScriptWorkerCatalog): ScriptWorkerCatalog {
  return {
    ...catalog,
    scripts: catalog.scripts.map((script) => ({
      ...script,
      scriptSections: script.scriptSections.map((s) => ({ ...s })),
      traceabilityRefs: [...script.traceabilityRefs],
      preservedDecisions: script.preservedDecisions.map((d) => ({ ...d })),
      selfReviewFindings: script.selfReviewFindings.map((f) => ({ ...f })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
