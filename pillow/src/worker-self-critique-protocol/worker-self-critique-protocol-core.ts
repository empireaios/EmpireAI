import type { WorkerSelfCritiqueProtocolConfiguration } from "./configuration.js";
import { CritiqueStore } from "./critique-store.js";
import {
  CritiqueValidator,
  HealthMonitor,
  RecoveryManager,
  WorkerSelfCritiqueProtocolMetadataGenerator,
} from "./critique-validator.js";
import { SelfCritic } from "./self-critic.js";
import { appendWscpLog } from "./wscp-logging.js";
import {
  WORKER_SELF_CRITIQUE_PROTOCOL_ID,
  WSCP_CAPABILITIES,
  WSCP_METADATA_VERSION,
} from "./paths.js";
import type {
  OperationalState,
  SelfCritiqueRecord,
  SubmissionDecision,
  WorkerSelfCritiqueProtocolEngineRecord,
  WorkerSelfCritiqueProtocolInput,
  WorkerSelfCritiqueProtocolRunReport,
} from "./types.js";

export class WorkerSelfCritiqueProtocolCore {
  private engineRecord: WorkerSelfCritiqueProtocolEngineRecord | null = null;
  private seeded = false;
  private readonly store = new CritiqueStore();
  private readonly critic = new SelfCritic();
  private readonly validator = new CritiqueValidator();
  private readonly metadata = new WorkerSelfCritiqueProtocolMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkerSelfCritiqueProtocolConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedCritiques);
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
    config: WorkerSelfCritiqueProtocolConfiguration,
  ): WorkerSelfCritiqueProtocolRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWscpLog({
      event: "connect",
      details: "Worker Self-Critique Protocol connected; evaluate-only mode",
    });
    return this.report(
      "connect",
      [],
      null,
      null,
      [],
      false,
      {
        validationReportId: `wscp-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Worker Self-Critique Protocol is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WSCP_METADATA_VERSION,
      },
      started,
    );
  }

  critique(input: WorkerSelfCritiqueProtocolInput, config: WorkerSelfCritiqueProtocolConfiguration) {
    return this.runCritique("critique", input, config, true);
  }

  checkCompleteness(
    input: WorkerSelfCritiqueProtocolInput,
    config: WorkerSelfCritiqueProtocolConfiguration,
  ) {
    if (!config.completenessRulesEnabled) {
      return this.disabled("check_completeness", config, "Completeness rules are disabled");
    }
    return this.runCritique("check_completeness", input, config, true);
  }

  checkConsistency(
    input: WorkerSelfCritiqueProtocolInput,
    config: WorkerSelfCritiqueProtocolConfiguration,
  ) {
    if (!config.consistencyRulesEnabled) {
      return this.disabled("check_consistency", config, "Consistency rules are disabled");
    }
    return this.runCritique("check_consistency", input, config, true);
  }

  identifyWeaknesses(
    input: WorkerSelfCritiqueProtocolInput,
    config: WorkerSelfCritiqueProtocolConfiguration,
  ) {
    return this.runCritique("identify_weaknesses", input, config, true);
  }

  recalculateConfidence(
    input: WorkerSelfCritiqueProtocolInput,
    config: WorkerSelfCritiqueProtocolConfiguration,
  ) {
    if (!config.confidenceRulesEnabled) {
      return this.disabled("recalculate_confidence", config, "Confidence rules are disabled");
    }
    return this.runCritique("recalculate_confidence", input, config, true);
  }

  decideSubmission(
    input: WorkerSelfCritiqueProtocolInput,
    config: WorkerSelfCritiqueProtocolConfiguration,
  ) {
    if (!config.decisionRulesEnabled) {
      return this.disabled("decide_submission", config, "Decision rules are disabled");
    }
    return this.runCritique("decide_submission", input, config, true);
  }

  list(config: WorkerSelfCritiqueProtocolConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["Self-critique catalog is empty"], started)
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      records,
      latest?.submissionDecision ?? null,
      latest?.revisedConfidenceScore ?? null,
      latest?.weaknessesFound ?? [],
      latest?.revisionRequired ?? false,
      validation,
      started,
    );
  }

  validate(
    input: WorkerSelfCritiqueProtocolInput,
    config: WorkerSelfCritiqueProtocolConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.finalize("pass", [], ["No self-critique records yet"], started)
        : this.validator.validateRecords(
            records.length ? records : null,
            { ...input, validated: input.validated ?? true },
            started,
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      records,
      latest?.submissionDecision ?? null,
      latest?.revisedConfidenceScore ?? null,
      latest?.weaknessesFound ?? [],
      latest?.revisionRequired ?? false,
      validation,
      started,
    );
  }

  diagnostics(config: WorkerSelfCritiqueProtocolConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Worker Self-Critique Protocol is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWscpLog({
      event: "diagnostics",
      details: `records=${this.store.count()} revise=${this.store.countByDecision("revise_before_submit")} submit=${this.store.countByDecision("submit")}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.submissionDecision ?? null,
      latest?.revisedConfidenceScore ?? null,
      latest?.weaknessesFound ?? [],
      latest?.revisionRequired ?? false,
      validation,
      started,
    );
  }

  private runCritique(
    action: WorkerSelfCritiqueProtocolRunReport["action"],
    input: WorkerSelfCritiqueProtocolInput,
    config: WorkerSelfCritiqueProtocolConfiguration,
    requireOutput: boolean,
  ): WorkerSelfCritiqueProtocolRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.critiqueRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Worker Self-Critique Protocol is disabled"
          : "Critique rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, requireOutput);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], null, null, [], false, validation, started);
    }

    const evaluation = this.critic.critique(input, config);
    const record = this.store.buildRecord({
      input,
      workerId: evaluation.workerId,
      missionId: evaluation.missionId,
      outputReviewed: evaluation.outputReviewed,
      completenessScore: evaluation.completenessScore,
      logicalConsistency: evaluation.logicalConsistency,
      factualConsistency: evaluation.factualConsistency,
      evidenceReview: evaluation.evidenceReview,
      weaknessesFound: evaluation.weaknessesFound,
      suggestedImprovements: evaluation.suggestedImprovements,
      revisedConfidenceScore: evaluation.revisedConfidenceScore,
      submissionDecision: evaluation.submissionDecision,
      checksPerformed: evaluation.checksPerformed,
      checksFailed: evaluation.checksFailed,
      assumptionsIdentified: evaluation.assumptionsIdentified,
      missingEvidence: evaluation.missingEvidence,
      initialConfidenceScore: evaluation.initialConfidenceScore,
      revisionRequired: evaluation.revisionRequired,
      validationStatus:
        evaluation.submissionDecision === "submit"
          ? "passed"
          : evaluation.submissionDecision === "revise_before_submit"
            ? "partial"
            : "failed",
    });

    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
      requireOutput,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      record.submissionDecision,
    );
    appendWscpLog({
      event: action,
      details: `id=${record.selfCritiqueId} worker=${record.workerId} decision=${record.submissionDecision} confidence=${record.revisedConfidenceScore}`,
    });
    this.metadata.generate(
      this.store.count(),
      this.store.countByDecision("revise_before_submit"),
    );
    return this.report(
      action,
      [record],
      record.submissionDecision,
      record.revisedConfidenceScore,
      record.weaknessesFound,
      record.revisionRequired,
      validation,
      started,
    );
  }

  private disabled(
    action: WorkerSelfCritiqueProtocolRunReport["action"],
    config: WorkerSelfCritiqueProtocolConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, null, [], false, validation, started);
  }

  private hasBoundary(input: WorkerSelfCritiqueProtocolInput) {
    return (
      input.replacePeerReviewRuntime === true ||
      input.replaceWorkerQualityStandard === true ||
      input.executeWorkerTasks === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkerSelfCritiqueProtocolConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastDecision: SubmissionDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wscp-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKER_SELF_CRITIQUE_PROTOCOL_ID,
      engineVersion: "PILLOW-WSCP-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WSCP_CAPABILITIES],
      totalCritiqueRecords: this.store.count(),
      reviseCount: this.store.countByDecision("revise_before_submit"),
      submitCount: this.store.countByDecision("submit"),
      escalateCount: this.store.countByDecision("escalate"),
      averageRevisedConfidence: this.store.averageRevisedConfidence(),
      lastDecision: lastDecision ?? this.getLatestRecord()?.submissionDecision ?? null,
      metadataVersion: WSCP_METADATA_VERSION,
    };
  }

  private report(
    action: WorkerSelfCritiqueProtocolRunReport["action"],
    records: SelfCritiqueRecord[],
    submissionDecision: SubmissionDecision | string | null,
    revisedConfidenceScore: number | null,
    weaknessesFound: string[],
    revisionRequired: boolean,
    validation: WorkerSelfCritiqueProtocolRunReport["validation"],
    started: number,
  ): WorkerSelfCritiqueProtocolRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      critiqueRunReportId: `wscp-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      submissionDecision,
      revisedConfidenceScore,
      weaknessesFound: [...weaknessesFound],
      revisionRequired,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WSCP_METADATA_VERSION,
    };
  }
}
