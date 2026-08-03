import type { OperationalPlaybookEngineConfiguration } from "./configuration.js";
import { appendOpbkLog } from "./opbk-logging.js";
import { PlaybookRegistry } from "./playbook-registry.js";
import { PlaybookInterpreter } from "./playbook-interpreter.js";
import {
  HealthMonitor,
  PlaybookMetadataGenerator,
  PlaybookValidator,
  RecoveryManager,
} from "./playbook-validator.js";
import {
  OPERATIONAL_PLAYBOOK_ENGINE_ID,
  OPBK_CAPABILITIES,
  OPBK_METADATA_VERSION,
} from "./paths.js";
import type {
  ExecutableWorkflow,
  OperationalPlaybookEngineInput,
  OperationalPlaybookEngineRecord,
  OperationalPlaybookEngineRunReport,
  OperationalState,
  PlaybookExecutionRecord,
  PlaybookRecord,
} from "./types.js";

export class OperationalPlaybookEngineCore {
  private engineRecord: OperationalPlaybookEngineRecord | null = null;
  private executions: PlaybookExecutionRecord[] = [];
  private seeded = false;
  private readonly registry = new PlaybookRegistry();
  private readonly interpreter = new PlaybookInterpreter();
  private readonly validator = new PlaybookValidator();
  private readonly metadata = new PlaybookMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: OperationalPlaybookEngineConfiguration) {
    if (this.seeded) return;
    this.registry.seed(config.seedPlaybooks);
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

  getPlaybooks() {
    return this.registry.list();
  }

  getExecutions() {
    return this.executions.map((e) => this.cloneExecution(e));
  }

  getLatestExecution() {
    const executions = this.getExecutions();
    return executions[executions.length - 1] ?? null;
  }

  connect(
    _input: Record<string, unknown>,
    config: OperationalPlaybookEngineConfiguration,
  ): OperationalPlaybookEngineRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendOpbkLog({ event: "connect", details: "Operational Playbook Engine connected; coordination-only mode" });
    return this.report("connect", this.getPlaybooks(), [], null, null, {
      validationReportId: `opbk-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Operational Playbook Engine is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: OPBK_METADATA_VERSION,
    }, started);
  }

  register(input: OperationalPlaybookEngineInput, config: OperationalPlaybookEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalize(input);
    const decision = this.validator.decide(normalized);
    if (decision === "fail" || !config.enabled || !config.playbookRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validatePlaybookDefinition(null, ["Registration rejected"], normalized, started);
      return this.report("register", this.getPlaybooks(), [], null, null, validation, started);
    }
    const playbook = this.registry.register(normalized.playbook ?? {
      playbookId: normalized.playbookId ?? undefined,
      category: normalized.category ?? "operations",
      name: normalized.nameHint ?? normalized.intent ?? "Custom Playbook",
      purpose: normalized.intent ?? "Registered operational playbook",
    }, config.supportedCategories);
    const integrityErrors = this.interpreter.validateIntegrity(playbook, config.supportedCategories);
    const validation = this.validator.validatePlaybookDefinition(playbook, integrityErrors, normalized, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config);
    appendOpbkLog({
      event: "register_playbook",
      details: `playbookId=${playbook.playbookId}; version=${playbook.version}; category=${playbook.category}`,
    });
    return this.report("register", [playbook], [], playbook, null, validation, started);
  }

  retrieve(input: OperationalPlaybookEngineInput, config: OperationalPlaybookEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalize(input);
    const playbook = normalized.playbookId ? this.registry.get(normalized.playbookId) : null;
    const validation = this.validator.validatePlaybookDefinition(
      playbook,
      playbook ? [] : ["Playbook not found"],
      normalized,
      started,
    );
    return this.report(
      "retrieve",
      playbook ? [playbook] : [],
      [],
      playbook,
      null,
      validation,
      started,
    );
  }

  validatePlaybook(input: OperationalPlaybookEngineInput, config: OperationalPlaybookEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalize(input);
    const playbook = this.resolvePlaybook(normalized);
    const integrityErrors = playbook
      ? this.interpreter.validateIntegrity(playbook, config.supportedCategories)
      : ["Playbook not found"];
    const validation = this.validator.validatePlaybookDefinition(playbook, integrityErrors, normalized, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    return this.report("validate_playbook", playbook ? [playbook] : [], [], playbook, null, validation, started);
  }

  select(input: OperationalPlaybookEngineInput, config: OperationalPlaybookEngineConfiguration) {
    return this.prepareFromSelection("select", input, config, false);
  }

  interpret(input: OperationalPlaybookEngineInput, config: OperationalPlaybookEngineConfiguration) {
    return this.prepareFromSelection("interpret", input, config, false);
  }

  prepareWorkflow(input: OperationalPlaybookEngineInput, config: OperationalPlaybookEngineConfiguration) {
    return this.prepareFromSelection("prepare_workflow", input, config, true);
  }

  trackProgress(input: OperationalPlaybookEngineInput, config: OperationalPlaybookEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalize(input);
    const decision = this.validator.decide(normalized);
    if (decision === "fail" || !config.enabled) {
      const validation = this.validator.validateExecutions(null, normalized, started);
      return this.report("track_progress", this.getPlaybooks(), [], null, null, validation, started);
    }
    const existing = normalized.executionId
      ? this.executions.find((e) => e.executionId === normalized.executionId)
      : this.executions[this.executions.length - 1];
    if (!existing) {
      const validation = this.validator.validateExecutions(null, normalized, started);
      return this.report("track_progress", this.getPlaybooks(), [], null, null, validation, started);
    }
    const updated = this.interpreter.trackProgress(
      existing,
      normalized.progressStepId,
      normalized.progressStatus,
    );
    const index = this.executions.findIndex((e) => e.executionId === existing.executionId);
    this.executions[index] = updated;
    this.ensureRecord("active", config);
    const validation = this.validator.validateExecutions([updated], normalized, started);
    appendOpbkLog({
      event: "track_progress",
      details: `executionId=${updated.executionId}; status=${updated.status}; currentStep=${updated.currentStepId}`,
    });
    return this.report(
      "track_progress",
      this.getPlaybooks(),
      [updated],
      this.registry.get(updated.playbookId),
      updated.workflow,
      validation,
      started,
    );
  }

  listPlaybooks(config: OperationalPlaybookEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    return this.report("list_playbooks", this.getPlaybooks(), [], null, null, {
      validationReportId: `opbk-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Operational Playbook Engine is disabled"],
      warnings: this.registry.list().length === 0 ? ["No playbooks registered"] : [],
      durationMs: Date.now() - started,
      metadataVersion: OPBK_METADATA_VERSION,
    }, started);
  }

  listExecutions(config: OperationalPlaybookEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    return this.report("list_executions", this.getPlaybooks(), this.getExecutions(), null, null, {
      validationReportId: `opbk-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Operational Playbook Engine is disabled"],
      warnings: this.executions.length === 0 ? ["No execution records stored yet"] : [],
      durationMs: Date.now() - started,
      metadataVersion: OPBK_METADATA_VERSION,
    }, started);
  }

  validateEngine(input: OperationalPlaybookEngineInput, config: OperationalPlaybookEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.validator.validateExecutions(
      this.executions.length ? this.executions : null,
      normalize(input),
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    return this.report(
      "validate_engine",
      this.getPlaybooks(),
      this.getExecutions().slice(-5),
      null,
      this.getLatestExecution()?.workflow ?? null,
      validation,
      started,
    );
  }

  diagnostics(config: OperationalPlaybookEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.executions.length
      ? this.validator.validateExecutions(this.executions, { validated: true }, started)
      : {
          validationReportId: `opbk-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Operational Playbook Engine is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: OPBK_METADATA_VERSION,
        };
    appendOpbkLog({
      event: "health_information",
      details: `playbooks=${this.registry.list().length}; executions=${this.executions.length}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report(
      "diagnostics",
      this.getPlaybooks(),
      this.getExecutions().slice(-20),
      null,
      this.getLatestExecution()?.workflow ?? null,
      validation,
      started,
    );
  }

  private prepareFromSelection(
    action: OperationalPlaybookEngineRunReport["action"],
    input: OperationalPlaybookEngineInput,
    config: OperationalPlaybookEngineConfiguration,
    persist: boolean,
  ): OperationalPlaybookEngineRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalize(input);
    appendOpbkLog({
      event: "playbook_request",
      details: `action=${action}; playbookId=${normalized.playbookId ?? "auto"}; intentLength=${normalized.intent?.length ?? 0}`,
    });

    const decision = this.validator.decide(normalized);
    if (decision === "fail" || !config.enabled || !config.playbookRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateExecutions(null, normalized, started);
      return this.report(action, this.getPlaybooks(), [], null, null, validation, started);
    }

    const selection = this.interpreter.select(this.registry.list(), normalized);
    if (!selection.playbook) {
      const validation = this.validator.validatePlaybookDefinition(null, [selection.reason], normalized, started);
      return this.report(action, this.getPlaybooks(), [], null, null, validation, started);
    }

    const integrityErrors = this.interpreter.validateIntegrity(selection.playbook, config.supportedCategories);
    const integrityValid = integrityErrors.length === 0;
    const workflow = this.interpreter.prepareWorkflow(selection.playbook, withDefaults(normalized, selection.playbook));
    const status = decision === "partial" || !workflow.prerequisitesSatisfied ? "partial" : "passed";
    const execution = this.interpreter.buildExecutionRecord(
      selection.playbook,
      workflow,
      normalized,
      selection.reason,
      integrityValid,
      status,
    );
    if (persist) this.executions.push(execution);
    this.ensureRecord("active", config);

    const validation = integrityValid
      ? this.validator.validateExecutions([execution], normalized, started)
      : this.validator.validatePlaybookDefinition(selection.playbook, integrityErrors, normalized, started);

    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    appendOpbkLog({
      event: "produce_playbook_execution_record",
      details: `executionId=${execution.executionId}; playbookId=${execution.playbookId}; status=${execution.status}; workerTasksExecuted=false`,
    });
    this.metadata.generate(this.registry.list().length, this.executions.length, execution.confidenceScore);
    return this.report(
      action,
      [selection.playbook],
      persist ? [execution] : [],
      selection.playbook,
      workflow,
      validation,
      started,
    );
  }

  private resolvePlaybook(input: OperationalPlaybookEngineInput): PlaybookRecord | null {
    if (input.playbookId?.trim()) return this.registry.get(input.playbookId.trim());
    return this.interpreter.select(this.registry.list(), input).playbook;
  }

  private ensureRecord(state: OperationalState, config: OperationalPlaybookEngineConfiguration) {
    const latest = this.executions[this.executions.length - 1];
    const mapped =
      latest?.validationStatus === "passed"
        ? "passed"
        : latest?.validationStatus === "partial"
          ? "partial"
          : latest?.validationStatus === "failed"
            ? "failed"
            : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `opbk-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: OPERATIONAL_PLAYBOOK_ENGINE_ID,
      engineVersion: "PILLOW-OPBK-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...OPBK_CAPABILITIES],
      totalPlaybooks: this.registry.list().length,
      totalExecutionRecords: this.executions.length,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      metadataVersion: OPBK_METADATA_VERSION,
    };
  }

  private report(
    action: OperationalPlaybookEngineRunReport["action"],
    playbooks: PlaybookRecord[],
    executions: PlaybookExecutionRecord[],
    selectedPlaybook: PlaybookRecord | null,
    workflow: ExecutableWorkflow | null,
    validation: OperationalPlaybookEngineRunReport["validation"],
    started: number,
  ): OperationalPlaybookEngineRunReport {
    return {
      playbookRunReportId: `opbk-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      playbooks: playbooks.map(clonePlaybook),
      executions: executions.map((e) => this.cloneExecution(e)),
      selectedPlaybook: selectedPlaybook ? clonePlaybook(selectedPlaybook) : null,
      workflow: workflow
        ? {
            ...workflow,
            steps: workflow.steps.map((s) => ({ ...s })),
            blockedReasons: [...workflow.blockedReasons],
          }
        : null,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: OPBK_METADATA_VERSION,
    };
  }

  private cloneExecution(record: PlaybookExecutionRecord): PlaybookExecutionRecord {
    return {
      ...record,
      completedStepIds: [...record.completedStepIds],
      workflow: {
        ...record.workflow,
        steps: record.workflow.steps.map((s) => ({ ...s })),
        blockedReasons: [...record.workflow.blockedReasons],
      },
    };
  }
}

function normalize(input: OperationalPlaybookEngineInput): OperationalPlaybookEngineInput {
  return { ...input, validated: input.validated !== false };
}

function withDefaults(input: OperationalPlaybookEngineInput, playbook: PlaybookRecord): OperationalPlaybookEngineInput {
  return {
    ...input,
    availableCapabilities: input.availableCapabilities ?? playbook.requiredCapabilities,
    availableTools: input.availableTools ?? playbook.requiredTools,
    approvalsPresent: input.approvalsPresent ?? playbook.approvalRequirements,
  };
}

function clonePlaybook(playbook: PlaybookRecord): PlaybookRecord {
  return {
    ...playbook,
    preconditions: [...playbook.preconditions],
    executionSteps: playbook.executionSteps.map((s) => ({ ...s })),
    requiredCapabilities: [...playbook.requiredCapabilities],
    requiredTools: [...playbook.requiredTools],
    approvalRequirements: [...playbook.approvalRequirements],
    successCriteria: [...playbook.successCriteria],
    failureCriteria: [...playbook.failureCriteria],
  };
}
