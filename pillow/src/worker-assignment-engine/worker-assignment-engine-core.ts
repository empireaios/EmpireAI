import type { WorkerAssignmentEngineConfiguration } from "./configuration.js";
import { AssignmentBuilder } from "./assignment-builder.js";
import { AssignmentStore } from "./assignment-store.js";
import {
  AssignmentValidator,
  HealthMonitor,
  RecoveryManager,
  WorkerAssignmentMetadataGenerator,
} from "./assignment-validator.js";
import { appendWaeLog } from "./wae-logging.js";
import {
  WAE_CAPABILITIES,
  WAE_METADATA_VERSION,
  WORKER_ASSIGNMENT_ENGINE_ID,
} from "./paths.js";
import type {
  AssignmentDecision,
  AssignmentRecord,
  AssignmentWorker,
  OperationalState,
  WorkerAssignmentCatalog,
  WorkerAssignmentEngineRecord,
  WorkerAssignmentInput,
  WorkerAssignmentRunReport,
} from "./types.js";

export class WorkerAssignmentEngineCore {
  private engineRecord: WorkerAssignmentEngineRecord | null = null;
  private seeded = false;
  private catalog: WorkerAssignmentCatalog | null = null;
  private readonly store = new AssignmentStore();
  private readonly builder = new AssignmentBuilder();
  private readonly validator = new AssignmentValidator();
  private readonly metadata = new WorkerAssignmentMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkerAssignmentEngineConfiguration) {
    if (this.seeded) return;
    this.store.seed({
      workers: config.seedWorkers,
      records: config.seedRecords,
    });
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
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

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getWorkers() {
    return this.store.listWorkers();
  }

  getRecords() {
    return this.store.listRecords();
  }

  getLatestAssignmentId() {
    return this.store.getLatestAssignmentId();
  }

  connect(
    _input: Record<string, unknown>,
    config: WorkerAssignmentEngineConfiguration,
  ): WorkerAssignmentRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWaeLog({
      event: "connect",
      details: "Worker Assignment Engine connected; recommend-only mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      this.store.listWorkers(),
      [],
      null,
      [],
      [],
      null,
      [],
      {
        validationReportId: `wae-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Worker Assignment Engine is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WAE_METADATA_VERSION,
      },
      started,
    );
  }

  submitMission(input: WorkerAssignmentInput, config: WorkerAssignmentEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_mission", input, config, started);
    if (input.workers?.length) this.store.upsertWorkers(input.workers);
    const requirements = this.builder.normalizeRequirements(input);
    const missionId = input.missionId?.trim() || `mission-${Date.now()}`;
    this.store.submitMission(missionId, requirements);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const validation = this.validator.validateCatalog(
      this.catalog,
      { ...input, missionId, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWaeLog({
      event: "submit_mission",
      details: `mission=${missionId} skills=${requirements.requiredSkills.join("|")}`,
    });
    return this.report(
      "submit_mission",
      this.getCatalog(),
      this.store.listWorkers(),
      [],
      null,
      [],
      [],
      null,
      [],
      validation,
      started,
    );
  }

  discoverEligible(input: WorkerAssignmentInput, config: WorkerAssignmentEngineConfiguration) {
    return this.runEvaluation("discover_eligible", input, config, false);
  }

  evaluateCandidates(input: WorkerAssignmentInput, config: WorkerAssignmentEngineConfiguration) {
    return this.runEvaluation("evaluate_candidates", input, config, false);
  }

  recommendPrimary(input: WorkerAssignmentInput, config: WorkerAssignmentEngineConfiguration) {
    return this.runEvaluation("recommend_primary", input, config, true);
  }

  recommendSupporting(input: WorkerAssignmentInput, config: WorkerAssignmentEngineConfiguration) {
    return this.runEvaluation("recommend_supporting", input, config, true);
  }

  recommendAssignment(input: WorkerAssignmentInput, config: WorkerAssignmentEngineConfiguration) {
    return this.runEvaluation("recommend_assignment", input, config, true);
  }

  produce(input: WorkerAssignmentInput, config: WorkerAssignmentEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("produce", input, config, started);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const records = this.store.listRecords();
    const validation = this.validator.validateRecords(
      records.length ? records : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      records.length ? "valid" : "partially_valid",
    );
    appendWaeLog({
      event: "produce",
      details: `workers=${this.store.workerCount()} records=${this.store.recordCount()}`,
    });
    this.metadata.generate(this.store.workerCount(), this.store.recordCount());
    return this.report(
      "produce",
      this.getCatalog(),
      this.store.listWorkers(),
      records,
      records[records.length - 1] ?? null,
      [],
      [],
      records.length ? "valid" : "partially_valid",
      [],
      validation,
      started,
    );
  }

  list(config: WorkerAssignmentEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const records = this.store.listRecords();
    const validation = this.validator.validateRecords(
      records.length ? records : null,
      { validated: true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      this.getCatalog(),
      this.store.listWorkers(),
      records,
      records[records.length - 1] ?? null,
      [],
      [],
      "valid",
      [],
      validation,
      started,
    );
  }

  validate(input: WorkerAssignmentInput, config: WorkerAssignmentEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const records = this.store.listRecords();
    const validation = this.validator.validateRecords(
      records.length ? records : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      this.getCatalog(),
      this.store.listWorkers(),
      records,
      records[records.length - 1] ?? null,
      [],
      [],
      validation.decision === "fail" ? "invalid" : "valid",
      [],
      validation,
      started,
    );
  }

  diagnostics(config: WorkerAssignmentEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Worker Assignment Engine is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWaeLog({
      event: "diagnostics",
      details: `workers=${this.store.workerCount()} records=${this.store.recordCount()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listWorkers(),
      this.store.listRecords(),
      null,
      [],
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private runEvaluation(
    action: WorkerAssignmentRunReport["action"],
    input: WorkerAssignmentInput,
    config: WorkerAssignmentEngineConfiguration,
    persist: boolean,
  ): WorkerAssignmentRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.evaluationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Worker Assignment Engine is disabled"
          : "Evaluation rules are disabled",
      );
    }
    if (action.startsWith("recommend") && !config.recommendationRulesEnabled) {
      return this.disabled(action, config, "Recommendation rules are disabled");
    }
    if (action === "discover_eligible" && !config.discoveryRulesEnabled) {
      return this.disabled(action, config, "Discovery rules are disabled");
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    if (input.workers?.length) this.store.upsertWorkers(input.workers);

    const mergedInput = this.mergeWithLatestMission(input);
    const requirements = this.builder.normalizeRequirements(mergedInput);
    if (mergedInput.missionId?.trim()) {
      this.store.submitMission(mergedInput.missionId.trim(), requirements);
    }

    const evaluation = this.builder.evaluate(
      mergedInput,
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );

    let latest: AssignmentRecord | null = null;
    if (persist) {
      latest = this.builder.buildRecord({
        input: mergedInput,
        requirements,
        workers: this.store.listWorkers(),
        evaluations: evaluation.evaluations,
        primary: evaluation.primary,
        supporting: evaluation.supporting,
      });
      this.store.saveRecord(latest);
    }

    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
    );
    const validation = this.validator.validateRecords(
      latest ? [latest] : null,
      { ...mergedInput, validated: mergedInput.validated ?? true },
      started,
      evaluation.primary || action === "discover_eligible" || action === "evaluate_candidates"
        ? []
        : ["No eligible primary worker for recommendation"],
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.assignmentDecision,
    );
    appendWaeLog({
      event: action,
      details: `eligible=${evaluation.eligible.length} primary=${evaluation.primary?.workerId ?? "none"} supporting=${evaluation.supporting.map((w) => w.workerId).join("|") || "none"}`,
    });
    this.metadata.generate(this.store.workerCount(), this.store.recordCount());
    return this.report(
      action,
      this.getCatalog(),
      this.store.listWorkers(),
      latest ? [latest] : this.store.listRecords().slice(-1),
      latest,
      evaluation.eligible,
      evaluation.evaluations,
      evaluation.assignmentDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  private mergeWithLatestMission(input: WorkerAssignmentInput): WorkerAssignmentInput {
    const latest = this.store.getLatestRequirements();
    const missionId = input.missionId?.trim() || this.store.getLatestMissionId();
    if (!latest) {
      return { ...input, missionId };
    }
    return {
      ...input,
      missionId,
      requiredSkills: input.requiredSkills ?? latest.requiredSkills,
      requiredTools: input.requiredTools ?? latest.requiredTools,
      requiredAuthority: input.requiredAuthority ?? latest.requiredAuthority,
      maxRisk: input.maxRisk ?? latest.maxRisk,
      maxCost: input.maxCost ?? latest.maxCost,
      maxWorkload: input.maxWorkload ?? latest.maxWorkload,
      dependencyIds: input.dependencyIds ?? latest.dependencyIds,
      supportingWorkerCount: input.supportingWorkerCount ?? latest.supportingWorkerCount,
    };
  }

  private boundaryFail(
    action: WorkerAssignmentRunReport["action"],
    input: WorkerAssignmentInput,
    config: WorkerAssignmentEngineConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateRecords(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listWorkers(),
      [],
      null,
      [],
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private disabled(
    action: WorkerAssignmentRunReport["action"],
    config: WorkerAssignmentEngineConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listWorkers(),
      [],
      null,
      [],
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private hasBoundary(input: WorkerAssignmentInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.replaceTaskNegotiationProtocol === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkerAssignmentEngineConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastAssignmentDecision: AssignmentDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wae-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKER_ASSIGNMENT_ENGINE_ID,
      engineVersion: "PILLOW-WAE-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WAE_CAPABILITIES],
      totalWorkers: this.store.workerCount(),
      totalRecords: this.store.recordCount(),
      lastAssignmentDecision,
      metadataVersion: WAE_METADATA_VERSION,
    };
  }

  private report(
    action: WorkerAssignmentRunReport["action"],
    catalog: WorkerAssignmentCatalog | null,
    workers: AssignmentWorker[],
    records: AssignmentRecord[],
    latestAssignment: AssignmentRecord | null,
    eligibleWorkers: AssignmentWorker[],
    evaluations: WorkerAssignmentRunReport["evaluations"],
    assignmentDecision: AssignmentDecision | string | null,
    rulesFailed: string[],
    validation: WorkerAssignmentRunReport["validation"],
    started: number,
  ): WorkerAssignmentRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      assignmentRunReportId: `wae-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      workers,
      records,
      latestAssignment,
      eligibleWorkers,
      evaluations,
      assignmentDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WAE_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: WorkerAssignmentCatalog): WorkerAssignmentCatalog {
  return {
    ...catalog,
    factors: [...catalog.factors],
    workers: catalog.workers.map((w) => ({
      ...w,
      skills: [...w.skills],
      approvedTools: [...w.approvedTools],
      dependencyIds: [...w.dependencyIds],
      responsibilityDomains: [...w.responsibilityDomains],
      neverExecuteWorkerTasks: true,
    })),
    records: catalog.records.map((r) => ({
      ...r,
      missionRequirements: {
        ...r.missionRequirements,
        requiredSkills: [...r.missionRequirements.requiredSkills],
        requiredTools: [...r.missionRequirements.requiredTools],
        dependencyIds: [...r.missionRequirements.dependencyIds],
      },
      candidateWorkers: [...r.candidateWorkers],
      evaluationCriteria: [...r.evaluationCriteria],
      supportingWorkers: [...r.supportingWorkers],
      riskAssessment: {
        ...r.riskAssessment,
        notes: [...r.riskAssessment.notes],
      },
      evaluations: r.evaluations.map((e) => ({
        ...e,
        factorScores: { ...e.factorScores },
        rejectionReasons: [...e.rejectionReasons],
        evaluationNotes: [...e.evaluationNotes],
      })),
    })),
  };
}
