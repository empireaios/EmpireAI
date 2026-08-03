import type { TaskNegotiationProtocolConfiguration } from "./configuration.js";
import { appendTnpLog } from "./tnp-logging.js";
import { NegotiationResolver } from "./negotiation-resolver.js";
import { NegotiationStore } from "./negotiation-store.js";
import {
  HealthMonitor,
  NegotiationValidator,
  RecoveryManager,
  TaskNegotiationProtocolMetadataGenerator,
} from "./negotiation-validator.js";
import {
  TASK_NEGOTIATION_PROTOCOL_ID,
  TNP_CAPABILITIES,
  TNP_METADATA_VERSION,
} from "./paths.js";
import type {
  EscalationStatus,
  NegotiationOutcome,
  NegotiationRecord,
  OperationalState,
  TaskNegotiationProtocolEngineRecord,
  TaskNegotiationProtocolInput,
  TaskNegotiationProtocolRunReport,
} from "./types.js";

export class TaskNegotiationProtocolCore {
  private engineRecord: TaskNegotiationProtocolEngineRecord | null = null;
  private seeded = false;
  private readonly store = new NegotiationStore();
  private readonly resolver = new NegotiationResolver();
  private readonly validator = new NegotiationValidator();
  private readonly metadata = new TaskNegotiationProtocolMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: TaskNegotiationProtocolConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedNegotiations);
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
    config: TaskNegotiationProtocolConfiguration,
  ): TaskNegotiationProtocolRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendTnpLog({
      event: "connect",
      details: "Task Negotiation Protocol connected; negotiate-only mode",
    });
    return this.report(
      "connect",
      [],
      [],
      null,
      [],
      [],
      null,
      {
        validationReportId: `tnp-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Task Negotiation Protocol is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: TNP_METADATA_VERSION,
      },
      started,
    );
  }

  receiveTask(input: TaskNegotiationProtocolInput, config: TaskNegotiationProtocolConfiguration) {
    return this.negotiate("receive_task", input, config, true);
  }

  identifyCandidates(
    input: TaskNegotiationProtocolInput,
    config: TaskNegotiationProtocolConfiguration,
  ) {
    return this.negotiate("identify_candidates", input, config, true);
  }

  declareCapability(
    input: TaskNegotiationProtocolInput,
    config: TaskNegotiationProtocolConfiguration,
  ) {
    return this.negotiate("declare_capability", input, config, true);
  }

  declineWork(input: TaskNegotiationProtocolInput, config: TaskNegotiationProtocolConfiguration) {
    const declined = (input.candidateWorkers ?? []).map((c) => ({
      ...c,
      available: false,
      declineReason: c.declineReason ?? "declined_by_worker",
    }));
    return this.negotiate(
      "decline_work",
      { ...input, candidateWorkers: declined },
      config,
      true,
    );
  }

  resolveOwnership(
    input: TaskNegotiationProtocolInput,
    config: TaskNegotiationProtocolConfiguration,
  ) {
    return this.negotiate("resolve_ownership", input, config, true);
  }

  negotiateTask(input: TaskNegotiationProtocolInput, config: TaskNegotiationProtocolConfiguration) {
    return this.negotiate("negotiate", input, config, true);
  }

  detectConflicts(
    input: TaskNegotiationProtocolInput,
    config: TaskNegotiationProtocolConfiguration,
  ) {
    return this.negotiate("detect_conflicts", input, config, true);
  }

  escalate(input: TaskNegotiationProtocolInput, config: TaskNegotiationProtocolConfiguration) {
    return this.negotiate(
      "escalate",
      { ...input, forceEscalate: true },
      config,
      true,
    );
  }

  list(config: TaskNegotiationProtocolConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation = this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      records,
      latest?.candidateWorkers ?? [],
      latest?.ownershipDecision.primaryWorkerId ?? null,
      latest?.supportingWorkers ?? [],
      latest?.conflicts ?? [],
      latest?.escalationStatus ?? null,
      validation,
      started,
    );
  }

  validate(input: TaskNegotiationProtocolInput, config: TaskNegotiationProtocolConfiguration) {
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
      latest?.candidateWorkers ?? [],
      latest?.ownershipDecision.primaryWorkerId ?? null,
      latest?.supportingWorkers ?? [],
      latest?.conflicts ?? [],
      latest?.escalationStatus ?? null,
      validation,
      started,
    );
  }

  diagnostics(config: TaskNegotiationProtocolConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Task Negotiation Protocol is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendTnpLog({
      event: "diagnostics",
      details: `records=${this.store.count()} last=${this.getLatestRecord()?.negotiationResult ?? "none"}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.candidateWorkers ?? [],
      latest?.ownershipDecision.primaryWorkerId ?? null,
      latest?.supportingWorkers ?? [],
      latest?.conflicts ?? [],
      latest?.escalationStatus ?? null,
      validation,
      started,
    );
  }

  private negotiate(
    action: TaskNegotiationProtocolRunReport["action"],
    input: TaskNegotiationProtocolInput,
    config: TaskNegotiationProtocolConfiguration,
    requireTask: boolean,
  ): TaskNegotiationProtocolRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.negotiationRulesEnabled) {
      const validation = this.validator.finalize(
        "fail",
        [
          !config.enabled
            ? "Task Negotiation Protocol is disabled"
            : "Negotiation rules are disabled",
        ],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], [], null, [], [], null, validation, started);
    }

    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, requireTask);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], [], null, [], [], null, validation, started);
    }

    const bundle = this.resolver.resolve(input, config);
    if (
      action === "detect_conflicts" &&
      config.conflictRulesEnabled &&
      bundle.conflicts.length === 0
    ) {
      // Still produce a record with assessed conflicts (may be empty).
    }

    if (action === "escalate" && !config.escalationRulesEnabled) {
      const validation = this.validator.finalize(
        "fail",
        ["Escalation rules are disabled"],
        [],
        started,
      );
      return this.report(action, [], [], null, [], [], null, validation, started);
    }

    const record = this.store.buildRecord({
      input,
      candidates: bundle.candidates,
      ownership: bundle.ownership,
      supportingWorkers: bundle.supportingWorkers,
      dependencyGraph: bundle.dependencyGraph,
      handoffs: bundle.handoffs,
      conflicts: bundle.conflicts,
      result: bundle.result,
      escalationStatus: bundle.escalationStatus,
      validationStatus:
        bundle.result === "escalated"
          ? "partial"
          : bundle.result === "declined" || bundle.result === "cancelled"
            ? "partial"
            : "passed",
    });

    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
      requireTask,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      bundle.result,
    );
    appendTnpLog({
      event: action,
      details: `task=${record.taskId} result=${record.negotiationResult} primary=${record.ownershipDecision.primaryWorkerId ?? "none"}`,
    });
    this.metadata.generate(this.store.count(), bundle.result);
    return this.report(
      action,
      [record],
      record.candidateWorkers,
      record.ownershipDecision.primaryWorkerId,
      record.supportingWorkers,
      record.conflicts,
      record.escalationStatus,
      validation,
      started,
    );
  }

  private hasBoundary(input: TaskNegotiationProtocolInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.replacePillow === true ||
      input.overrideGrandKing === true ||
      input.performStrategicPlanning === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: TaskNegotiationProtocolConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastOutcome: NegotiationOutcome | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `tnp-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: TASK_NEGOTIATION_PROTOCOL_ID,
      engineVersion: "PILLOW-TNP-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...TNP_CAPABILITIES],
      totalNegotiationRecords: this.store.count(),
      lastOutcome: lastOutcome ?? this.getLatestRecord()?.negotiationResult ?? null,
      metadataVersion: TNP_METADATA_VERSION,
    };
  }

  private report(
    action: TaskNegotiationProtocolRunReport["action"],
    records: NegotiationRecord[],
    candidateWorkers: string[],
    primaryWorkerId: string | null,
    supportingWorkers: string[],
    conflicts: string[],
    escalationStatus: EscalationStatus | null,
    validation: TaskNegotiationProtocolRunReport["validation"],
    started: number,
  ): TaskNegotiationProtocolRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      negotiationRunReportId: `tnp-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      candidateWorkers: [...candidateWorkers],
      primaryWorkerId,
      supportingWorkers: [...supportingWorkers],
      conflicts: [...conflicts],
      escalationStatus,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: TNP_METADATA_VERSION,
    };
  }
}
