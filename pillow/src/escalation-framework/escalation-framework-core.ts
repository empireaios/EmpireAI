import type { EscalationFrameworkConfiguration } from "./configuration.js";
import { EscalationDetector } from "./escalation-detector.js";
import { EscalationStore } from "./escalation-store.js";
import {
  EscalationFrameworkMetadataGenerator,
  EscalationValidator,
  HealthMonitor,
  RecoveryManager,
} from "./escalation-validator.js";
import { appendEsfLog } from "./esf-logging.js";
import {
  ESCALATION_FRAMEWORK_ID,
  ESF_CAPABILITIES,
  ESF_METADATA_VERSION,
} from "./paths.js";
import type {
  EscalationCategory,
  EscalationFrameworkEngineRecord,
  EscalationFrameworkInput,
  EscalationFrameworkRunReport,
  EscalationPriority,
  EscalationRecord,
  OperationalState,
} from "./types.js";

export class EscalationFrameworkCore {
  private engineRecord: EscalationFrameworkEngineRecord | null = null;
  private seeded = false;
  private readonly store = new EscalationStore();
  private readonly detector = new EscalationDetector();
  private readonly validator = new EscalationValidator();
  private readonly metadata = new EscalationFrameworkMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: EscalationFrameworkConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedEscalations);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getRecords() {
    return this.store.list();
  }

  getLatestRecord() {
    const records = this.getRecords();
    return records[records.length - 1] ?? null;
  }

  connect(
    _input: Record<string, unknown>,
    config: EscalationFrameworkConfiguration,
  ): EscalationFrameworkRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendEsfLog({
      event: "connect",
      details: "Escalation Framework connected; escalate/route-only mode",
    });
    return this.report(
      "connect",
      [],
      [],
      false,
      null,
      {
        validationReportId: `esf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Escalation Framework is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: ESF_METADATA_VERSION,
      },
      started,
    );
  }

  detect(input: EscalationFrameworkInput, config: EscalationFrameworkConfiguration) {
    return this.runEscalation("detect", input, config, false);
  }

  escalateLowConfidence(
    input: EscalationFrameworkInput,
    config: EscalationFrameworkConfiguration,
  ) {
    return this.runEscalation("escalate_low_confidence", input, config, true, "low_confidence");
  }

  escalateMissingInformation(
    input: EscalationFrameworkInput,
    config: EscalationFrameworkConfiguration,
  ) {
    return this.runEscalation(
      "escalate_missing_information",
      input,
      config,
      true,
      "missing_information",
    );
  }

  escalateConflictingRecommendations(
    input: EscalationFrameworkInput,
    config: EscalationFrameworkConfiguration,
  ) {
    return this.runEscalation(
      "escalate_conflicting_recommendations",
      input,
      config,
      true,
      "conflicting_recommendations",
    );
  }

  escalateWorkerDeadlock(
    input: EscalationFrameworkInput,
    config: EscalationFrameworkConfiguration,
  ) {
    return this.runEscalation("escalate_worker_deadlock", input, config, true, "worker_deadlock");
  }

  escalateExecutiveDecision(
    input: EscalationFrameworkInput,
    config: EscalationFrameworkConfiguration,
  ) {
    return this.runEscalation(
      "escalate_executive_decision",
      input,
      config,
      true,
      "executive_decision_required",
    );
  }

  generate(input: EscalationFrameworkInput, config: EscalationFrameworkConfiguration) {
    return this.runEscalation("generate", input, config, true);
  }

  routeToPillow(input: EscalationFrameworkInput, config: EscalationFrameworkConfiguration) {
    return this.runEscalation(
      "route_to_pillow",
      { ...input, forceRouteToPillow: true },
      config,
      true,
    );
  }

  list(config: EscalationFrameworkConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation = this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      records,
      latest?.detectedConditions ?? [],
      latest?.routedToPillow ?? false,
      latest?.escalationPriority ?? null,
      validation,
      started,
    );
  }

  validate(input: EscalationFrameworkInput, config: EscalationFrameworkConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation = this.validator.validateRecords(
      records,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      records,
      latest?.detectedConditions ?? [],
      latest?.routedToPillow ?? false,
      latest?.escalationPriority ?? null,
      validation,
      started,
    );
  }

  diagnostics(config: EscalationFrameworkConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Escalation Framework is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendEsfLog({
      event: "diagnostics",
      details: `records=${this.store.count()} open=${this.store.openCount()} last=${this.getLatestRecord()?.escalationCategory ?? "none"}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.detectedConditions ?? [],
      latest?.routedToPillow ?? false,
      latest?.escalationPriority ?? null,
      validation,
      started,
    );
  }

  private runEscalation(
    action: EscalationFrameworkRunReport["action"],
    input: EscalationFrameworkInput,
    config: EscalationFrameworkConfiguration,
    requireContext: boolean,
    forcedCategory?: EscalationCategory | string | null,
  ): EscalationFrameworkRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.detectionRulesEnabled) {
      const validation = this.validator.finalize(
        "fail",
        [
          !config.enabled
            ? "Escalation Framework is disabled"
            : "Detection rules are disabled",
        ],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], [], false, null, validation, started);
    }

    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, requireContext);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], [], false, null, validation, started);
    }

    if (
      (action === "route_to_pillow" || input.forceRouteToPillow === true) &&
      !config.routingRulesEnabled
    ) {
      const validation = this.validator.finalize(
        "fail",
        ["Routing rules are disabled"],
        [],
        started,
      );
      return this.report(action, [], [], false, null, validation, started);
    }

    const enrichedInput = this.enrichForcedSignals(input, forcedCategory);
    const bundle = this.detector.detect(enrichedInput, config, forcedCategory);
    const shouldRoute =
      config.routingRulesEnabled &&
      (input.forceRouteToPillow === true ||
        action === "route_to_pillow" ||
        action.startsWith("escalate_") ||
        action === "generate" ||
        action === "detect");

    const record = this.store.buildRecord({
      input: enrichedInput,
      category: bundle.category,
      triggerReason: bundle.triggerReason,
      priority: bundle.priority,
      status: shouldRoute ? "routed_to_pillow" : "open",
      risk: bundle.risk,
      evidence: bundle.evidence,
      actions: bundle.actions,
      detectedConditions: bundle.detectedConditions,
      routedToPillow: shouldRoute,
      pillowNotified: shouldRoute,
      validationStatus: "passed",
    });

    const validation = this.validator.validateRecords(
      [record],
      { ...enrichedInput, validated: enrichedInput.validated ?? true },
      started,
      requireContext,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      record.escalationPriority,
    );
    appendEsfLog({
      event: action,
      details: `id=${record.escalationId} category=${record.escalationCategory} priority=${record.escalationPriority} routed=${record.routedToPillow}`,
    });
    this.metadata.generate(this.store.count(), this.store.openCount());
    return this.report(
      action,
      [record],
      record.detectedConditions,
      record.routedToPillow,
      record.escalationPriority,
      validation,
      started,
    );
  }

  private enrichForcedSignals(
    input: EscalationFrameworkInput,
    forcedCategory?: EscalationCategory | string | null,
  ): EscalationFrameworkInput {
    if (!forcedCategory) return input;
    const signals = { ...(input.signals ?? {}) };
    switch (forcedCategory) {
      case "low_confidence":
        if (signals.confidenceScore == null) signals.confidenceScore = 40;
        break;
      case "missing_information":
        if (!(signals.missingFields ?? []).length) {
          signals.missingFields = ["required_field"];
        }
        break;
      case "conflicting_recommendations":
        if (!(signals.conflictingRecommendations ?? []).length) {
          signals.conflictingRecommendations = ["option_a", "option_b"];
        }
        signals.unresolvedDisagreement = true;
        break;
      case "worker_deadlock":
        signals.workerDeadlock = true;
        break;
      case "executive_decision_required":
        signals.executiveDecisionRequired = true;
        break;
      default:
        break;
    }
    return { ...input, signals, escalationCategory: forcedCategory };
  }

  private hasBoundary(input: EscalationFrameworkInput) {
    return (
      input.executeWorkerTasks === true ||
      input.resolveBusinessDisputes === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.replaceExecutiveJudgement === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: EscalationFrameworkConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastPriority: EscalationPriority | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `esf-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: ESCALATION_FRAMEWORK_ID,
      engineVersion: "PILLOW-ESF-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...ESF_CAPABILITIES],
      totalEscalationRecords: this.store.count(),
      openEscalations: this.store.openCount(),
      lastPriority: lastPriority ?? this.getLatestRecord()?.escalationPriority ?? null,
      metadataVersion: ESF_METADATA_VERSION,
    };
  }

  private report(
    action: EscalationFrameworkRunReport["action"],
    records: EscalationRecord[],
    detectedConditions: string[],
    routedToPillow: boolean,
    escalationPriority: EscalationPriority | null,
    validation: EscalationFrameworkRunReport["validation"],
    started: number,
  ): EscalationFrameworkRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      escalationRunReportId: `esf-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      detectedConditions: [...detectedConditions],
      routedToPillow,
      escalationPriority,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: ESF_METADATA_VERSION,
    };
  }
}
