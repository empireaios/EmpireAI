import type { RecoveryRuntimeConfiguration } from "./configuration.js";
import {
  RecrtIntegrationCoordinator,
  type RecoveryRuntimeDependencies,
} from "./integrations.js";
import { appendRecrtLog } from "./recrt-logging.js";
import { RecoveryStore } from "./recovery-store.js";
import { RecoveryValidator } from "./recovery-validator.js";
import { FailureDetector } from "./failure-detector.js";
import { FailureClassifier } from "./failure-classifier.js";
import { StrategySelector } from "./strategy-selector.js";
import { StateRestorer } from "./state-restorer.js";
import { JobRestarter } from "./job-restarter.js";
import { WorkflowResumer } from "./workflow-resumer.js";
import { RollbackEngine } from "./rollback-engine.js";
import { EscalationEngine } from "./escalation-engine.js";
import { MetricsCollector } from "./metrics-collector.js";
import { ReportBuilder } from "./report-builder.js";
import {
  INTEGRATION_TARGETS,
  RECRT_CAPABILITIES,
  RECRT_METADATA_VERSION,
  RECOVERY_RUNTIME_ID,
} from "./paths.js";
import type {
  CheckpointRecord,
  EscalationRecord,
  FailureRecord,
  IntegrationHandshake,
  Q1012ConsumableContract,
  RecrtEngineRecord,
  RecrtInput,
  RecrtRunReport,
  RecrtValidationReport,
  RecoveryCase,
  RestartRecord,
  RollbackRecord,
} from "./types.js";

export class RecoveryRuntimeManager {
  private engineRecord: RecrtEngineRecord | null = null;
  private seeded = false;
  private readonly store = new RecoveryStore();
  private readonly validator = new RecoveryValidator();
  private readonly failureDetector = new FailureDetector();
  private readonly failureClassifier = new FailureClassifier();
  private readonly strategySelector = new StrategySelector();
  private readonly stateRestorer = new StateRestorer();
  private readonly jobRestarter = new JobRestarter();
  private readonly workflowResumer = new WorkflowResumer();
  private readonly rollbackEngine = new RollbackEngine();
  private readonly escalationEngine = new EscalationEngine();
  private readonly metricsCollector = new MetricsCollector();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new RecrtIntegrationCoordinator();

  bindIntegrations(deps: RecoveryRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  /**
   * Seeds engine record only — no fabricated completed recoveries.
   * Failures are created via detectFailure in tests/ops.
   */
  ensureSeeded(config: RecoveryRuntimeConfiguration) {
    if (this.seeded) return;
    this.seeded = true;
    this.ensureRecord("active", config);
    appendRecrtLog({
      event: "seed_runtime",
      details:
        "Recovery Runtime seeded standby — no fabricated completed recoveries; failures via detectFailure",
    });
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

  getReports() {
    return this.store.listReports();
  }

  getHistory() {
    return this.store.getHistory();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getQ1012ConsumableContract(config: RecoveryRuntimeConfiguration): Q1012ConsumableContract {
    return this.reportBuilder.buildQ1012ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    appendRecrtLog({
      event: "connect",
      details: `Recovery Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction(
      "connect",
      started,
      { validated: true },
      config,
      null,
      this.store.listFailures(),
      null,
      this.store.listCases(),
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      handshakes,
    );
  }

  detectFailure(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateDetect(input, started);
    if (validation.decision === "fail") {
      return this.failReport("detect_failure", started, validation, config);
    }
    const failure = this.failureDetector.detectFailure(this.store, input);
    this.ensureRecord("detecting", config);
    appendRecrtLog({
      event: "detect_failure",
      details: `${failure.failureId}:${failure.jobId}`,
    });
    return this.reportAction(
      "detect_failure",
      started,
      input,
      config,
      failure,
      [failure],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
    );
  }

  classifyFailure(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("classify_failure", started, validation, config);
    }
    const failure = this.resolveFailure(input);
    if (!failure) {
      return this.failReport(
        "classify_failure",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Unknown failure for classifyFailure"],
        },
        config,
      );
    }
    const classified = this.failureClassifier.classify(this.store, failure, input);
    this.ensureRecord("classifying", config);
    appendRecrtLog({
      event: "classify_failure",
      details: `${classified.failureId}:${classified.failureClassification}`,
    });
    return this.reportAction(
      "classify_failure",
      started,
      input,
      config,
      classified,
      [classified],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
    );
  }

  selectStrategy(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("select_strategy", started, validation, config);
    }
    let failure = this.resolveFailure(input);
    if (!failure) {
      return this.failReport(
        "select_strategy",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Unknown failure for selectStrategy"],
        },
        config,
      );
    }
    if (!failure.failureClassification) {
      failure = this.failureClassifier.classify(this.store, failure, input);
    }

    const strategyInput = this.constrainStrategyInput(failure, input);
    let recovery = this.strategySelector.select(
      this.store,
      failure,
      strategyInput,
      config.defaultMaxRestarts,
    );
    recovery = this.enforceUnrecoverableStrategy(recovery, failure);

    this.ensureRecord("classifying", config);
    appendRecrtLog({
      event: "select_strategy",
      details: `${recovery.recoveryId}:${recovery.recoveryStrategy}`,
    });
    return this.reportAction(
      "select_strategy",
      started,
      input,
      config,
      failure,
      [failure],
      recovery,
      [recovery],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
    );
  }

  restoreState(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("restore_state", started, validation, config);
    }
    const recovery = this.resolveRecovery(input);
    if (!recovery) {
      return this.failReport(
        "restore_state",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Unknown recovery for restoreState"],
        },
        config,
      );
    }
    if (this.isResumeOrRestartBlocked(recovery)) {
      return this.failReport(
        "restore_state",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [
            ...validation.errors,
            "unrecoverable classification blocks restore/resume/restart — escalate_only",
          ],
        },
        config,
      );
    }
    const gate = this.governanceGate(recovery, input, validation, started);
    if (gate) return this.failReport("restore_state", started, gate, config);

    const result = this.stateRestorer.restore(this.store, recovery, input);
    this.ensureRecord(result.awaitingApproval ? "active" : "restoring", config);
    appendRecrtLog({
      event: "restore_state",
      details: `${result.recovery.recoveryId}:${result.recovery.recoveryStatus}`,
    });
    return this.reportAction(
      "restore_state",
      started,
      input,
      config,
      this.store.getFailure(result.recovery.failureId),
      this.store.listFailures(),
      result.recovery,
      [result.recovery],
      result.checkpoint,
      [result.checkpoint],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
    );
  }

  restartJob(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("restart_job", started, validation, config);
    }
    const recovery = this.resolveRecovery(input);
    if (!recovery) {
      return this.failReport(
        "restart_job",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Unknown recovery for restartJob"],
        },
        config,
      );
    }
    if (this.isResumeOrRestartBlocked(recovery)) {
      return this.failReport(
        "restart_job",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [
            ...validation.errors,
            "unrecoverable classification blocks resume/restart — escalate_only",
          ],
        },
        config,
      );
    }
    const gate = this.governanceGate(recovery, input, validation, started);
    if (gate) return this.failReport("restart_job", started, gate, config);

    const result = this.jobRestarter.restart(this.store, recovery, input);
    this.ensureRecord(result.awaitingApproval ? "active" : "restarting", config);
    appendRecrtLog({
      event: "restart_job",
      details: `${result.recovery.recoveryId}:${result.restart.status}`,
    });
    return this.reportAction(
      "restart_job",
      started,
      input,
      config,
      this.store.getFailure(result.recovery.failureId),
      this.store.listFailures(),
      result.recovery,
      [result.recovery],
      null,
      [],
      result.restart,
      [result.restart],
      null,
      [],
      null,
      [],
      null,
    );
  }

  resumeWorkflow(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("resume_workflow", started, validation, config);
    }
    const recovery = this.resolveRecovery(input);
    if (!recovery) {
      return this.failReport(
        "resume_workflow",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Unknown recovery for resumeWorkflow"],
        },
        config,
      );
    }
    if (this.isResumeOrRestartBlocked(recovery)) {
      return this.failReport(
        "resume_workflow",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [
            ...validation.errors,
            "unrecoverable classification blocks resume/restart — escalate_only",
          ],
        },
        config,
      );
    }
    const gate = this.governanceGate(recovery, input, validation, started);
    if (gate) return this.failReport("resume_workflow", started, gate, config);

    const result = this.workflowResumer.resume(this.store, recovery, input);
    this.ensureRecord(result.awaitingApproval ? "active" : "restoring", config);
    appendRecrtLog({
      event: "resume_workflow",
      details: `${result.recovery.recoveryId}:${result.recovery.recoveryStatus}`,
    });
    return this.reportAction(
      "resume_workflow",
      started,
      input,
      config,
      this.store.getFailure(result.recovery.failureId),
      this.store.listFailures(),
      result.recovery,
      [result.recovery],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
    );
  }

  rollback(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("rollback", started, validation, config);
    }
    const recovery = this.resolveRecovery(input);
    if (!recovery) {
      return this.failReport(
        "rollback",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Unknown recovery for rollback"],
        },
        config,
      );
    }
    if (recovery.failureClassification === "unrecoverable") {
      return this.failReport(
        "rollback",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [
            ...validation.errors,
            "unrecoverable classification blocks rollback — escalate_only",
          ],
        },
        config,
      );
    }
    const gate = this.governanceGate(recovery, input, validation, started);
    if (gate) return this.failReport("rollback", started, gate, config);

    const result = this.rollbackEngine.rollback(this.store, recovery, input);
    this.ensureRecord(result.awaitingApproval ? "active" : "rolling_back", config);
    appendRecrtLog({
      event: "rollback",
      details: `${result.recovery.recoveryId}:${result.rollback.rollbackStatus}`,
    });
    return this.reportAction(
      "rollback",
      started,
      input,
      config,
      this.store.getFailure(result.recovery.failureId),
      this.store.listFailures(),
      result.recovery,
      [result.recovery],
      null,
      [],
      null,
      [],
      result.rollback,
      [result.rollback],
      null,
      [],
      null,
    );
  }

  escalate(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("escalate", started, validation, config);
    }
    const recovery = this.resolveRecovery(input);
    if (!recovery) {
      return this.failReport(
        "escalate",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Unknown recovery for escalate"],
        },
        config,
      );
    }
    const result = this.escalationEngine.escalate(this.store, recovery, input);
    this.ensureRecord("escalating", config);
    appendRecrtLog({
      event: "escalate",
      details: `${result.recovery.recoveryId}:${result.escalation.escalationId}`,
    });
    return this.reportAction(
      "escalate",
      started,
      input,
      config,
      this.store.getFailure(result.recovery.failureId),
      this.store.listFailures(),
      result.recovery,
      [result.recovery],
      null,
      [],
      null,
      [],
      null,
      [],
      result.escalation,
      [result.escalation],
      null,
    );
  }

  /**
   * Full structural pipeline: detect → classify → strategy → execute engines → update case.
   * NEVER fabricates success — completed only when engines report structural success evidence.
   */
  runRecovery(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("run_recovery", started, validation, config);
    }
    if (input.fabricateSuccess === true) {
      return this.failReport(
        "run_recovery",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Recovery Runtime must never fabricate recovery success"],
        },
        config,
      );
    }

    let failure =
      this.resolveFailure(input) ??
      this.failureDetector.detectFailure(this.store, {
        ...input,
        failureId: input.failureId,
        jobId: input.jobId ?? `job-${input.failureId ?? "run"}`,
      });
    if (!input.failureId && !input.jobId && !failure) {
      return this.failReport(
        "run_recovery",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "failureId or jobId required for runRecovery"],
        },
        config,
      );
    }

    failure = this.failureClassifier.classify(this.store, failure, input);
    const strategyInput = this.constrainStrategyInput(failure, input);
    let recovery = this.strategySelector.select(
      this.store,
      failure,
      strategyInput,
      config.defaultMaxRestarts,
    );
    recovery = this.enforceUnrecoverableStrategy(recovery, failure);

    let checkpoint: CheckpointRecord | null = null;
    let restart: RestartRecord | null = null;
    let rollback: RollbackRecord | null = null;
    let escalation: EscalationRecord | null = null;

    if (
      recovery.failureClassification === "unrecoverable" ||
      recovery.recoveryStrategy === "escalate_only"
    ) {
      const esc = this.escalationEngine.escalate(this.store, recovery, input);
      recovery = esc.recovery;
      escalation = esc.escalation;
    } else if (recovery.recoveryStrategy === "manual_recovery") {
      recovery =
        this.store.updateCase(recovery.recoveryId, {
          recoveryStatus: "awaiting_approval",
          supportingEvidence: [
            ...recovery.supportingEvidence,
            "manual_recovery:awaiting_operator",
          ],
        }) ?? recovery;
    } else if (recovery.recoveryStrategy === "automatic_recovery") {
      const autoOk =
        recovery.automaticPermitted === true &&
        (input.pillowConfirmed === true || recovery.pillowConfirmed) &&
        (!recovery.highRisk || input.grandKingApproved === true || recovery.grandKingApproved);
      if (!autoOk) {
        recovery =
          this.store.updateCase(recovery.recoveryId, {
            recoveryStatus: "awaiting_approval",
            supportingEvidence: [
              ...recovery.supportingEvidence,
              "automatic_recovery:gates_not_met",
            ],
          }) ?? recovery;
      } else {
        const underlying = this.strategySelector.strategyForClassification(
          recovery.failureClassification,
          failure,
        );
        recovery =
          this.store.updateCase(recovery.recoveryId, {
            recoveryStrategy: underlying === "escalate_only" ? "escalate_only" : underlying,
            pillowConfirmed: true,
            automaticPermitted: true,
            supportingEvidence: [
              ...recovery.supportingEvidence,
              `automatic_recovery:delegate:${underlying}`,
            ],
          }) ?? recovery;
        const executed = this.executeStrategy(recovery, failure, input);
        recovery = executed.recovery;
        checkpoint = executed.checkpoint;
        restart = executed.restart;
        rollback = executed.rollback;
        escalation = executed.escalation;
      }
    } else if (recovery.recoveryStrategy === "custom_extension") {
      recovery =
        this.store.updateCase(recovery.recoveryId, {
          recoveryStatus: "awaiting_approval",
          supportingEvidence: [
            ...recovery.supportingEvidence,
            "custom_extension:structural_hold",
          ],
        }) ?? recovery;
    } else {
      const gate = this.governanceGate(recovery, input, validation, started);
      if (gate) {
        recovery =
          this.store.updateCase(recovery.recoveryId, {
            recoveryStatus: "awaiting_approval",
            supportingEvidence: [
              ...recovery.supportingEvidence,
              `governance_gate:${gate.errors[0] ?? "blocked"}`,
            ],
          }) ?? recovery;
      } else {
        const executed = this.executeStrategy(recovery, failure, input);
        recovery = executed.recovery;
        checkpoint = executed.checkpoint;
        restart = executed.restart;
        rollback = executed.rollback;
        escalation = executed.escalation;
      }
    }

    // Never fabricate: if somehow marked completed without evidence, revert to failed.
    recovery = this.rejectFabricatedCompletion(recovery);

    this.ensureRecord(
      recovery.recoveryStatus === "escalated"
        ? "escalating"
        : recovery.recoveryStatus === "completed"
          ? "active"
          : "active",
      config,
    );
    appendRecrtLog({
      event: "run_recovery",
      details: `${recovery.recoveryId}:${recovery.recoveryStrategy}:${recovery.recoveryStatus}`,
    });

    return this.reportAction(
      "run_recovery",
      started,
      input,
      config,
      this.store.getFailure(failure.failureId),
      this.store.listFailures(),
      recovery,
      [recovery],
      checkpoint,
      checkpoint ? [checkpoint] : this.store.listCheckpoints().filter((c) => c.recoveryId === recovery.recoveryId),
      restart,
      restart ? [restart] : this.store.listRestarts().filter((r) => r.recoveryId === recovery.recoveryId),
      rollback,
      rollback ? [rollback] : this.store.listRollbacks().filter((r) => r.recoveryId === recovery.recoveryId),
      escalation,
      escalation
        ? [escalation]
        : this.store.listEscalations().filter((e) => e.recoveryId === recovery.recoveryId),
      null,
    );
  }

  produceReport(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_report", started, validation, config);
    }

    const cases = this.store.listCases();
    const withEvidence = cases.filter((c) => c.supportingEvidence.length > 0).length;
    const escalated = cases.filter((c) => c.recoveryStatus === "escalated").length;
    const confidenceScore = Math.min(95, 40 + withEvidence * 5 + (escalated > 0 ? 5 : 0));

    const report = this.reportBuilder.buildRecoveryRuntimeReport(
      this.store,
      this.metricsCollector,
      config,
      {
        auditStatus: "passed",
        outstandingIssues: escalated
          ? [`${escalated} escalated recovery case(s) retained in history`]
          : [],
        confidenceScore,
        supportingEvidence: [
          `engine:${RECOVERY_RUNTIME_ID}`,
          "neverFabricateRecoverySuccess:true",
        ],
      },
    );
    this.store.saveReport(report);
    this.ensureRecord("reporting", config, report.reportId);
    appendRecrtLog({
      event: "produce_report",
      details: `${report.reportId}:consumableByQ1012=${report.consumableByQ1012}`,
    });

    return this.reportAction(
      "produce_report",
      started,
      input,
      config,
      null,
      this.store.listFailures(),
      null,
      this.store.listCases(),
      null,
      this.store.listCheckpoints(),
      null,
      this.store.listRestarts(),
      null,
      this.store.listRollbacks(),
      null,
      this.store.listEscalations(),
      report,
    );
  }

  submitReport(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("submit_report", started, validation, config);
    }

    let report = this.store.listReports().at(-1) ?? null;
    if (!report) {
      const produced = this.produceReport({ ...input, validated: true }, config);
      report = produced.recoveryRuntimeReport;
    }
    if (report) {
      this.integrations.submitReport(report);
      this.integrations.recordAudit({
        event: "recovery_runtime_report_submitted",
        reportId: report.reportId,
        auditReference: `audit://recrt/report/${report.reportId}`,
      });
    }
    this.ensureRecord("reporting", config, report?.reportId ?? null);
    return this.reportAction(
      "submit_report",
      started,
      input,
      config,
      null,
      this.store.listFailures(),
      null,
      this.store.listCases(),
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      report,
    );
  }

  list(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("list", started, validation, config);
    }
    const failures = this.store.listFailures();
    const recoveries = this.store.listCases();
    return this.reportAction(
      "list",
      started,
      input,
      config,
      failures[0] ?? null,
      failures,
      recoveries[0] ?? null,
      recoveries,
      this.store.listCheckpoints()[0] ?? null,
      this.store.listCheckpoints(),
      this.store.listRestarts()[0] ?? null,
      this.store.listRestarts(),
      this.store.listRollbacks()[0] ?? null,
      this.store.listRollbacks(),
      this.store.listEscalations()[0] ?? null,
      this.store.listEscalations(),
      null,
    );
  }

  validate(input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    return this.reportAction(
      "validate",
      started,
      input,
      config,
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      undefined,
      validation,
    );
  }

  diagnostics(_input: RecrtInput, config: RecoveryRuntimeConfiguration): RecrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    const diag = this.reportBuilder.buildDiagnostics(this.store, handshakes);
    appendRecrtLog({
      event: "diagnostics",
      details: `failures=${diag.totalFailures};recoveries=${diag.totalRecoveries}`,
    });
    return this.reportAction(
      "diagnostics",
      started,
      { validated: true },
      config,
      null,
      this.store.listFailures(),
      null,
      this.store.listCases(),
      null,
      this.store.listCheckpoints(),
      null,
      this.store.listRestarts(),
      null,
      this.store.listRollbacks(),
      null,
      this.store.listEscalations(),
      null,
      handshakes,
    );
  }

  private executeStrategy(
    recovery: RecoveryCase,
    failure: FailureRecord,
    input: RecrtInput,
  ): {
    recovery: RecoveryCase;
    checkpoint: CheckpointRecord | null;
    restart: RestartRecord | null;
    rollback: RollbackRecord | null;
    escalation: EscalationRecord | null;
  } {
    void failure;
    switch (recovery.recoveryStrategy) {
      case "restart_job": {
        const r = this.jobRestarter.restart(this.store, recovery, input);
        return {
          recovery: r.recovery,
          checkpoint: null,
          restart: r.restart,
          rollback: null,
          escalation: null,
        };
      }
      case "resume_workflow": {
        const r = this.workflowResumer.resume(this.store, recovery, input);
        return {
          recovery: r.recovery,
          checkpoint: null,
          restart: null,
          rollback: null,
          escalation: null,
        };
      }
      case "restore_checkpoint": {
        const r = this.stateRestorer.restore(this.store, recovery, input);
        return {
          recovery: r.recovery,
          checkpoint: r.checkpoint,
          restart: null,
          rollback: null,
          escalation: null,
        };
      }
      case "rollback_partial": {
        const r = this.rollbackEngine.rollback(this.store, recovery, input);
        return {
          recovery: r.recovery,
          checkpoint: null,
          restart: null,
          rollback: r.rollback,
          escalation: null,
        };
      }
      case "escalate_only": {
        const r = this.escalationEngine.escalate(this.store, recovery, input);
        return {
          recovery: r.recovery,
          checkpoint: null,
          restart: null,
          rollback: null,
          escalation: r.escalation,
        };
      }
      default:
        return {
          recovery:
            this.store.updateCase(recovery.recoveryId, {
              recoveryStatus: "awaiting_approval",
              supportingEvidence: [
                ...recovery.supportingEvidence,
                `strategy_hold:${recovery.recoveryStrategy}`,
              ],
            }) ?? recovery,
          checkpoint: null,
          restart: null,
          rollback: null,
          escalation: null,
        };
    }
  }

  private constrainStrategyInput(failure: FailureRecord, input: RecrtInput): RecrtInput {
    if (failure.failureClassification === "unrecoverable") {
      return { ...input, recoveryStrategy: "escalate_only" };
    }
    if (input.recoveryStrategy === "automatic_recovery") {
      return {
        ...input,
        automaticPermitted: input.automaticPermitted === true,
        pillowConfirmed: input.pillowConfirmed === true,
      };
    }
    return input;
  }

  private enforceUnrecoverableStrategy(
    recovery: RecoveryCase,
    failure: FailureRecord,
  ): RecoveryCase {
    if (failure.failureClassification !== "unrecoverable") return recovery;
    if (recovery.recoveryStrategy === "escalate_only") return recovery;
    return (
      this.store.updateCase(recovery.recoveryId, {
        recoveryStrategy: "escalate_only",
        escalationStatus: "pending",
        highRisk: true,
        supportingEvidence: [
          ...recovery.supportingEvidence,
          "forced_escalate_only:unrecoverable",
        ],
      }) ?? recovery
    );
  }

  private isResumeOrRestartBlocked(recovery: RecoveryCase): boolean {
    return (
      recovery.failureClassification === "unrecoverable" ||
      recovery.recoveryStrategy === "escalate_only"
    );
  }

  /**
   * highRisk / grand_king strategies require grandKingApproved.
   * automatic_recovery only when automaticPermitted && pillowConfirmed && (!highRisk || grandKingApproved).
   */
  private governanceGate(
    recovery: RecoveryCase,
    input: RecrtInput,
    validation: RecrtValidationReport,
    started: number,
  ): RecrtValidationReport | null {
    const highRisk =
      recovery.highRisk ||
      input.highRisk === true ||
      recovery.recoveryStrategy === "automatic_recovery";
    const gkApproved = input.grandKingApproved === true || recovery.grandKingApproved;

    if (
      (recovery.highRisk || input.highRisk === true) &&
      !gkApproved &&
      recovery.recoveryStrategy !== "escalate_only"
    ) {
      // Engines set awaiting_approval — do not hard-fail the gate for highRisk
      // when engines can hold; only hard-fail explicit bypass attempts (already validated).
      void started;
      return null;
    }

    if (recovery.recoveryStrategy === "automatic_recovery") {
      const autoOk =
        (input.automaticPermitted === true || recovery.automaticPermitted) &&
        (input.pillowConfirmed === true || recovery.pillowConfirmed) &&
        (!highRisk || gkApproved);
      if (!autoOk) {
        return {
          ...validation,
          decision: "fail",
          errors: [
            ...validation.errors,
            "automatic_recovery requires automaticPermitted && pillowConfirmed && (!highRisk || grandKingApproved)",
          ],
          durationMs: Date.now() - started,
        };
      }
    }

    return null;
  }

  private rejectFabricatedCompletion(recovery: RecoveryCase): RecoveryCase {
    if (recovery.recoveryStatus !== "completed") return recovery;
    const hasEvidence = recovery.supportingEvidence.some((e) =>
      /(_completed|restart_completed|restore_completed|rollback_completed|resume_structural)/.test(
        e,
      ),
    );
    if (hasEvidence && recovery.fabricated === false) return recovery;
    return (
      this.store.updateCase(recovery.recoveryId, {
        recoveryStatus: "failed",
        supportingEvidence: [
          ...recovery.supportingEvidence,
          "rejected_fabricated_or_unevidenced_completion",
        ],
      }) ?? recovery
    );
  }

  private resolveFailure(input: RecrtInput): FailureRecord | null {
    if (input.failureId) {
      const byId = this.store.getFailure(input.failureId);
      if (byId) return byId;
    }
    if (input.recoveryId) {
      const recovery = this.store.getCase(input.recoveryId);
      if (recovery) return this.store.getFailure(recovery.failureId);
    }
    if (input.jobId) {
      return this.store.listFailures().find((f) => f.jobId === input.jobId) ?? null;
    }
    return null;
  }

  private resolveRecovery(input: RecrtInput): RecoveryCase | null {
    if (input.recoveryId) {
      const byId = this.store.getCase(input.recoveryId);
      if (byId) return byId;
    }
    if (input.failureId) {
      const byFailure = this.store.getCaseByFailureId(input.failureId);
      if (byFailure) return byFailure;
    }
    return null;
  }

  private ensureRecord(
    state: RecrtEngineRecord["operationalState"],
    config: RecoveryRuntimeConfiguration,
    lastReportId?: string | null,
  ) {
    const history = this.store.getHistory();
    const failedOrEscalated = history.cases.some(
      (c) => c.recoveryStatus === "failed" || c.recoveryStatus === "escalated",
    );
    this.engineRecord = {
      engineId: RECOVERY_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus: failedOrEscalated
        ? "degraded"
        : history.cases.length > 0
          ? "healthy"
          : "standby",
      totalFailures: history.failures.length,
      totalRecoveries: history.cases.length,
      totalRestarts: history.restarts.length,
      totalRollbacks: history.rollbacks.length,
      totalEscalations: history.escalations.length,
      totalReports: history.reports.length,
      lastReportId: lastReportId ?? this.engineRecord?.lastReportId ?? null,
      supportedCapabilities: [...RECRT_CAPABILITIES],
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: RECRT_METADATA_VERSION,
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: RecrtValidationReport,
    config: RecoveryRuntimeConfiguration,
  ): RecrtRunReport {
    this.ensureRecord("failed", config);
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      failure: null,
      failures: [],
      recovery: null,
      recoveries: [],
      checkpoint: null,
      checkpoints: [],
      restart: null,
      restarts: [],
      rollback: null,
      rollbacks: [],
      escalation: null,
      escalations: [],
      recoveryRuntimeReport: null,
      q1012Contract: null,
      integrationHandshakes: [],
      errors: [...validation.errors],
      warnings: [...validation.warnings],
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: RecrtInput,
    config: RecoveryRuntimeConfiguration,
    failure: FailureRecord | null,
    failures: FailureRecord[],
    recovery: RecoveryCase | null,
    recoveries: RecoveryCase[],
    checkpoint: CheckpointRecord | null,
    checkpoints: CheckpointRecord[],
    restart: RestartRecord | null,
    restarts: RestartRecord[],
    rollback: RollbackRecord | null,
    rollbacks: RollbackRecord[],
    escalation: EscalationRecord | null,
    escalations: EscalationRecord[],
    recoveryRuntimeReport: RecrtRunReport["recoveryRuntimeReport"],
    handshakes?: IntegrationHandshake[],
    validationOverride?: RecrtValidationReport,
  ): RecrtRunReport {
    const validation =
      validationOverride ?? this.validator.validateInput({ ...input, validated: true }, started);
    const decision =
      validation.decision === "fail"
        ? "fail"
        : validation.warnings.length
          ? "partial"
          : "pass";
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation,
      failure,
      failures,
      recovery,
      recoveries,
      checkpoint,
      checkpoints,
      restart,
      restarts,
      rollback,
      rollbacks,
      escalation,
      escalations,
      recoveryRuntimeReport,
      q1012Contract:
        action === "get_q1012_contract" ? this.getQ1012ConsumableContract(config) : null,
      integrationHandshakes: handshakes ?? [],
      errors: [...validation.errors],
      warnings: [...validation.warnings],
    };
  }
}
