import type { PeerReviewRuntimeConfiguration } from "./configuration.js";
import { appendPrrLog } from "./prr-logging.js";
import { PeerReviewResolver } from "./peer-review-resolver.js";
import { PeerReviewStore } from "./peer-review-store.js";
import {
  HealthMonitor,
  PeerReviewRuntimeMetadataGenerator,
  PeerReviewValidator,
  RecoveryManager,
} from "./peer-review-validator.js";
import {
  PEER_REVIEW_RUNTIME_ID,
  PRR_CAPABILITIES,
  PRR_METADATA_VERSION,
} from "./paths.js";
import type {
  EscalationStatus,
  OperationalState,
  PeerReviewRecord,
  PeerReviewRuntimeEngineRecord,
  PeerReviewRuntimeInput,
  PeerReviewRuntimeRunReport,
  ReviewOutcome,
} from "./types.js";

export class PeerReviewRuntimeCore {
  private engineRecord: PeerReviewRuntimeEngineRecord | null = null;
  private seeded = false;
  private readonly store = new PeerReviewStore();
  private readonly resolver = new PeerReviewResolver();
  private readonly validator = new PeerReviewValidator();
  private readonly metadata = new PeerReviewRuntimeMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: PeerReviewRuntimeConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReviews);
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
    config: PeerReviewRuntimeConfiguration,
  ): PeerReviewRuntimeRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendPrrLog({
      event: "connect",
      details: "Peer Review Runtime connected; validate-only mode",
    });
    return this.report(
      "connect",
      [],
      [],
      false,
      null,
      [],
      null,
      {
        validationReportId: `prr-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Peer Review Runtime is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: PRR_METADATA_VERSION,
      },
      started,
    );
  }

  submitWork(input: PeerReviewRuntimeInput, config: PeerReviewRuntimeConfiguration) {
    return this.runReview("submit_work", input, config, true);
  }

  determineRequired(input: PeerReviewRuntimeInput, config: PeerReviewRuntimeConfiguration) {
    return this.runReview("determine_required", input, config, true);
  }

  selectReviewers(input: PeerReviewRuntimeInput, config: PeerReviewRuntimeConfiguration) {
    return this.runReview("select_reviewers", input, config, true);
  }

  deliverToReviewers(input: PeerReviewRuntimeInput, config: PeerReviewRuntimeConfiguration) {
    return this.runReview("deliver_to_reviewers", input, config, true);
  }

  collectReviews(input: PeerReviewRuntimeInput, config: PeerReviewRuntimeConfiguration) {
    return this.runReview("collect_reviews", input, config, true);
  }

  compareReviews(input: PeerReviewRuntimeInput, config: PeerReviewRuntimeConfiguration) {
    return this.runReview("compare_reviews", input, config, true);
  }

  requestRevision(input: PeerReviewRuntimeInput, config: PeerReviewRuntimeConfiguration) {
    return this.runReview("request_revision", { ...input, forceRevision: true }, config, true);
  }

  escalate(input: PeerReviewRuntimeInput, config: PeerReviewRuntimeConfiguration) {
    return this.runReview("escalate", { ...input, forceEscalate: true }, config, true);
  }

  review(input: PeerReviewRuntimeInput, config: PeerReviewRuntimeConfiguration) {
    return this.runReview("review", input, config, true);
  }

  list(config: PeerReviewRuntimeConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation = this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      records,
      latest?.reviewers ?? [],
      latest?.peerReviewRequired ?? false,
      latest?.agreementLevel ?? null,
      latest?.disagreements ?? [],
      latest?.escalationStatus ?? null,
      validation,
      started,
    );
  }

  validate(input: PeerReviewRuntimeInput, config: PeerReviewRuntimeConfiguration) {
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
      latest?.reviewers ?? [],
      latest?.peerReviewRequired ?? false,
      latest?.agreementLevel ?? null,
      latest?.disagreements ?? [],
      latest?.escalationStatus ?? null,
      validation,
      started,
    );
  }

  diagnostics(config: PeerReviewRuntimeConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Peer Review Runtime is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendPrrLog({
      event: "diagnostics",
      details: `records=${this.store.count()} last=${this.getLatestRecord()?.reviewOutcome ?? "none"}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.reviewers ?? [],
      latest?.peerReviewRequired ?? false,
      latest?.agreementLevel ?? null,
      latest?.disagreements ?? [],
      latest?.escalationStatus ?? null,
      validation,
      started,
    );
  }

  private runReview(
    action: PeerReviewRuntimeRunReport["action"],
    input: PeerReviewRuntimeInput,
    config: PeerReviewRuntimeConfiguration,
    requireWork: boolean,
  ): PeerReviewRuntimeRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.reviewRulesEnabled) {
      const validation = this.validator.finalize(
        "fail",
        [
          !config.enabled
            ? "Peer Review Runtime is disabled"
            : "Review rules are disabled",
        ],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], [], false, null, [], null, validation, started);
    }

    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, requireWork);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], [], false, null, [], null, validation, started);
    }

    if (action === "escalate" && !config.escalationRulesEnabled) {
      const validation = this.validator.finalize(
        "fail",
        ["Escalation rules are disabled"],
        [],
        started,
      );
      return this.report(action, [], [], false, null, [], null, validation, started);
    }

    const bundle = this.resolver.resolve(input, config);
    const record = this.store.buildRecord({
      input,
      reviewers: bundle.selectedReviewers,
      findings: bundle.findings,
      agreementLevel: bundle.agreementLevel,
      issuesFound: bundle.issuesFound,
      requiredRevisions: bundle.requiredRevisions,
      outcome: bundle.outcome,
      escalationStatus: bundle.escalationStatus,
      peerReviewRequired: bundle.peerReviewRequired,
      independentReviews: bundle.independentReviews,
      disagreements: bundle.disagreements,
      impactLevel: bundle.impactLevel,
      validationStatus:
        bundle.outcome === "escalated" || bundle.outcome === "revision_required"
          ? "partial"
          : bundle.outcome === "rejected"
            ? "failed"
            : "passed",
    });

    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
      requireWork,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      bundle.outcome,
    );
    appendPrrLog({
      event: action,
      details: `task=${record.taskId} outcome=${record.reviewOutcome} reviewers=${record.reviewers.join(",")}`,
    });
    this.metadata.generate(this.store.count(), bundle.outcome);
    return this.report(
      action,
      [record],
      record.reviewers,
      record.peerReviewRequired,
      record.agreementLevel,
      record.disagreements,
      record.escalationStatus,
      validation,
      started,
    );
  }

  private hasBoundary(input: PeerReviewRuntimeInput) {
    return (
      input.replaceWorkers === true ||
      input.rewriteCompletedWork === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.executeBusinessTasks === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: PeerReviewRuntimeConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastOutcome: ReviewOutcome | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `prr-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PEER_REVIEW_RUNTIME_ID,
      engineVersion: "PILLOW-PRR-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...PRR_CAPABILITIES],
      totalReviewRecords: this.store.count(),
      lastOutcome: lastOutcome ?? this.getLatestRecord()?.reviewOutcome ?? null,
      metadataVersion: PRR_METADATA_VERSION,
    };
  }

  private report(
    action: PeerReviewRuntimeRunReport["action"],
    records: PeerReviewRecord[],
    selectedReviewers: string[],
    peerReviewRequired: boolean,
    agreementLevel: number | null,
    disagreements: string[],
    escalationStatus: EscalationStatus | null,
    validation: PeerReviewRuntimeRunReport["validation"],
    started: number,
  ): PeerReviewRuntimeRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      reviewRunReportId: `prr-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      selectedReviewers: [...selectedReviewers],
      peerReviewRequired,
      agreementLevel,
      disagreements: [...disagreements],
      escalationStatus,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PRR_METADATA_VERSION,
    };
  }
}
