import type { QueueRuntimeConfiguration } from "./configuration.js";
import { QrtIntegrationCoordinator, type QueueRuntimeDependencies } from "./integrations.js";
import { MetricsCollector } from "./metrics-collector.js";
import { QueueManagerCore } from "./queue-manager-core.js";
import { appendQrtLog } from "./qrt-logging.js";
import { QueueStore } from "./queue-store.js";
import { QueueValidator } from "./queue-validator.js";
import {
  INTEGRATION_TARGETS,
  QUEUE_RUNTIME_ID,
  QRT_CAPABILITIES,
  QRT_METADATA_VERSION,
} from "./paths.js";
import { ReportBuilder } from "./report-builder.js";
import type {
  DispatchRecord,
  IntegrationHandshake,
  Q1005ConsumableContract,
  QrtEngineRecord,
  QrtInput,
  QrtRunReport,
  QrtValidationReport,
  QueueDefinition,
  QueueJob,
  QueueRuntimeReport,
} from "./types.js";

export class QueueRuntimeManager {
  private engineRecord: QrtEngineRecord | null = null;
  private seeded = false;
  private readonly store = new QueueStore();
  private readonly validator = new QueueValidator();
  private readonly core = new QueueManagerCore();
  private readonly metricsCollector = new MetricsCollector();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new QrtIntegrationCoordinator();

  bindIntegrations(deps: QueueRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  ensureSeeded(_config: QueueRuntimeConfiguration) {
    if (this.seeded) return;
    this.seeded = true;
    this.ensureRecord("active", _config);
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

  getQ1005ConsumableContract(config: QueueRuntimeConfiguration): Q1005ConsumableContract {
    return this.reportBuilder.buildQ1005ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    appendQrtLog({
      event: "connect",
      details: `Queue Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction("connect", started, { validated: true }, config, null, null, [], handshakes);
  }

  createQueue(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("create_queue", started, validation, config);
    }
    const queue = this.core.createQueue(this.store, input, config);
    this.ensureRecord("active", config);
    appendQrtLog({ event: "create_queue", details: queue.queueId });
    return this.reportAction("create_queue", started, input, config, queue, null);
  }

  enqueue(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("enqueue", started, validation, config);
    }
    const queueName = input.queueName ?? "default-queue";
    let queue = this.store.getQueueByName(queueName);
    if (!queue) {
      queue = this.core.createQueue(this.store, { ...input, queueName }, config);
    }
    const job = this.core.enqueue(this.store, input, config, queue);
    this.ensureRecord("active", config);
    appendQrtLog({ event: "enqueue", details: job.jobId });
    return this.reportAction("enqueue", started, input, config, queue, job);
  }

  prioritize(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    const job = this.requireJob(input, started, config, "prioritize");
    if (!job) return this.lastFail!;
    const updated = this.core.prioritize(this.store, input);
    const queue = this.store.getQueue(job.queueId);
    return this.reportAction("prioritize", started, input, config, queue, updated);
  }

  pauseQueue(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    const queue = this.requireQueue(input, started, config, "pause_queue");
    if (!queue) return this.lastFail!;
    const updated = this.core.pauseQueue(this.store, queue, input);
    return this.reportAction("pause_queue", started, input, config, updated, null);
  }

  resumeQueue(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    const queue = this.requireQueue(input, started, config, "resume_queue");
    if (!queue) return this.lastFail!;
    const updated = this.core.resumeQueue(this.store, queue, input);
    return this.reportAction("resume_queue", started, input, config, updated, null);
  }

  cancelJob(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    const job = this.requireJob(input, started, config, "cancel_job");
    if (!job) return this.lastFail!;
    const updated = this.core.cancelJob(this.store, input);
    const queue = this.store.getQueue(job.queueId);
    return this.reportAction("cancel_job", started, input, config, queue, updated);
  }

  dispatchReady(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateDispatch(input, started);
    if (validation.decision === "fail") {
      return this.failReport("dispatch_ready", started, validation, config);
    }
    const queue = this.requireQueue(input, started, config, "dispatch_ready");
    if (!queue) return this.lastFail!;

    const { dispatches, jobs } = this.core.dispatchReady(this.store, input, queue);
    if (input.highRisk === true && input.grandKingApproved !== true) {
      return this.failReport(
        "dispatch_ready",
        started,
        {
          ...validation,
          decision: "fail",
          errors: ["High-risk dispatch requires grandKingApproved=true"],
        },
        config,
        queue,
        null,
        dispatches,
      );
    }

    for (const dispatch of dispatches) {
      this.integrations.notifyDispatch(dispatch);
      this.integrations.notifyMissionRuntime(dispatch);
    }

    appendQrtLog({ event: "dispatch_ready", details: `dispatched=${dispatches.length}` });
    return this.reportAction(
      "dispatch_ready",
      started,
      input,
      config,
      queue,
      jobs[0] ?? null,
      dispatches,
    );
  }

  retryFailed(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    const job = this.requireJob(input, started, config, "retry_failed");
    if (!job) return this.lastFail!;
    if (job.status !== "failed") {
      this.core.markJobFailed(this.store, input);
    }
    const current = this.store.getJob(input.jobId!)!;
    const updated = this.core.retryFailed(this.store, input);
    const queue = this.store.getQueue(current.queueId);
    return this.reportAction("retry_failed", started, input, config, queue, updated);
  }

  moveToDeadLetter(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    const job = this.requireJob(input, started, config, "move_to_dead_letter");
    if (!job) return this.lastFail!;
    const updated = this.core.moveToDeadLetter(this.store, input);
    const queue = this.store.getQueue(job.queueId);
    return this.reportAction("move_to_dead_letter", started, input, config, queue, updated);
  }

  metrics(_input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const m = this.metricsCollector.collect(this.store);
    appendQrtLog({ event: "metrics", details: `jobs=${m.totalJobs}` });
    return this.reportAction("metrics", started, _input, config, null, null);
  }

  produceReport(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_report", started, validation, config);
    }
    const handshakes = this.integrations.connect(config.integrationTargets);
    const report = this.reportBuilder.buildQueueRuntimeReport(
      this.store,
      this.core,
      this.metricsCollector,
      config,
      {
        auditStatus: handshakes.every((h) => h.available) ? "passed" : "partial",
        outstandingIssues: [],
        confidenceScore: 85,
        supportingEvidence: ["queue-runtime structural evidence"],
      },
    );
    this.store.saveReport(report);
    this.ensureRecord("active", config);
    return {
      action: "produce_report",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "pass",
      validation,
      queue: input.queueName ? this.store.getQueueByName(input.queueName) : null,
      job: input.jobId ? this.store.getJob(input.jobId) : null,
      dispatchRecords: [],
      queueRuntimeReport: report,
      errors: [],
      warnings: [],
    };
  }

  submitReport(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    const produced = this.produceReport(input, config);
    if (produced.decision === "fail" || !produced.queueRuntimeReport) {
      return produced;
    }
    this.integrations.submitReport(produced.queueRuntimeReport);
    this.integrations.recordAudit({
      event: "queue_runtime_report_submitted",
      reportId: produced.queueRuntimeReport.reportId,
    });
    return { ...produced, action: "submit_report" };
  }

  list(_input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    return this.reportAction("list", started, _input, config, null, null);
  }

  validate(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (input.forceFail === true) {
      validation.decision = "fail";
      validation.errors.push("forceFail is not permitted");
    }
    return {
      action: "validate",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: validation.decision === "pass" ? "pass" : "fail",
      validation,
      queue: null,
      job: null,
      dispatchRecords: [],
      queueRuntimeReport: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  diagnostics(_input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(config.integrationTargets);
    this.reportBuilder.buildDiagnostics(this.store, handshakes);
    return this.reportAction("diagnostics", started, _input, config, null, null, [], handshakes);
  }

  /** Test helper — mark job completed to unblock dependencies. */
  completeJob(input: QrtInput, config: QueueRuntimeConfiguration): QrtRunReport {
    const started = Date.now();
    const job = this.requireJob(input, started, config, "complete_job");
    if (!job) return this.lastFail!;
    const updated = this.core.completeJob(this.store, input.jobId!, input);
    const queue = this.store.getQueue(job.queueId);
    return this.reportAction("complete_job", started, input, config, queue, updated);
  }

  private lastFail: QrtRunReport | null = null;

  private requireQueue(
    input: QrtInput,
    started: number,
    config: QueueRuntimeConfiguration,
    action: string,
  ): QueueDefinition | null {
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      this.lastFail = this.failReport(action, started, validation, config);
      return null;
    }
    if (!input.queueName) {
      this.lastFail = this.failReport(
        action,
        started,
        { ...validation, decision: "fail", errors: ["queueName required"] },
        config,
      );
      return null;
    }
    const queue = this.store.getQueueByName(input.queueName);
    if (!queue) {
      this.lastFail = this.failReport(
        action,
        started,
        { ...validation, decision: "fail", errors: [`Queue ${input.queueName} not found`] },
        config,
      );
      return null;
    }
    return queue;
  }

  private requireJob(
    input: QrtInput,
    started: number,
    config: QueueRuntimeConfiguration,
    action: string,
  ): QueueJob | null {
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      this.lastFail = this.failReport(action, started, validation, config);
      return null;
    }
    if (!input.jobId) {
      this.lastFail = this.failReport(
        action,
        started,
        { ...validation, decision: "fail", errors: ["jobId required"] },
        config,
      );
      return null;
    }
    const job = this.store.getJob(input.jobId);
    if (!job) {
      this.lastFail = this.failReport(
        action,
        started,
        { ...validation, decision: "fail", errors: [`Job ${input.jobId} not found`] },
        config,
      );
      return null;
    }
    return job;
  }

  private ensureRecord(state: QrtEngineRecord["operationalState"], config: QueueRuntimeConfiguration) {
    const metrics = this.metricsCollector.collect(this.store);
    this.engineRecord = {
      engineId: QUEUE_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus: metrics.failedJobs > 0 ? "degraded" : "healthy",
      totalQueues: metrics.totalQueues,
      totalJobs: metrics.totalJobs,
      totalReports: this.store.listReports().length,
      lastReportId: this.store.listReports().at(-1)?.reportId ?? null,
      supportedCapabilities: [...QRT_CAPABILITIES],
      integrationTargets: (config.integrationTargets.length
        ? [...config.integrationTargets]
        : [...INTEGRATION_TARGETS]) as QrtEngineRecord["integrationTargets"],
      metadataVersion: QRT_METADATA_VERSION,
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: QrtValidationReport,
    config: QueueRuntimeConfiguration,
    queue: QueueDefinition | null = null,
    job: QueueJob | null = null,
    dispatchRecords: DispatchRecord[] = [],
  ): QrtRunReport {
    this.lastFail = {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      queue,
      job,
      dispatchRecords,
      queueRuntimeReport: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
    return this.lastFail;
  }

  private reportAction(
    action: string,
    started: number,
    input: QrtInput,
    config: QueueRuntimeConfiguration,
    queue: QueueDefinition | null,
    job: QueueJob | null,
    dispatchRecords: DispatchRecord[] = [],
    _handshakes: IntegrationHandshake[] = [],
  ): QrtRunReport {
    const validation = this.validator.validateInput(input, started);
    const decision = validation.decision === "fail" ? "fail" : "pass";
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation,
      queue,
      job,
      dispatchRecords,
      queueRuntimeReport: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
}

export { resetQrtSequenceForTesting } from "./queue-store.js";
