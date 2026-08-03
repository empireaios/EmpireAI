import type { WorkerPerformanceReviewConfiguration } from "./configuration.js";
import { PerformanceBuilder } from "./performance-builder.js";
import { PerformanceStore } from "./performance-store.js";
import {
  HealthMonitor,
  PerformanceValidator,
  RecoveryManager,
  WorkerPerformanceMetadataGenerator,
} from "./performance-validator.js";
import { appendWprLog } from "./wpr-logging.js";
import {
  WPR_CAPABILITIES,
  WPR_METADATA_VERSION,
  WORKER_PERFORMANCE_REVIEW_ID,
} from "./paths.js";
import type {
  ExecutivePerformanceReport,
  OperationalState,
  PerformanceDecision,
  PerformanceRecord,
  PerformanceTrend,
  PerformanceWorker,
  WorkerPerformanceCatalog,
  WorkerPerformanceEngineRecord,
  WorkerPerformanceInput,
  WorkerPerformanceRunReport,
} from "./types.js";

export class WorkerPerformanceReviewCore {
  private engineRecord: WorkerPerformanceEngineRecord | null = null;
  private seeded = false;
  private catalog: WorkerPerformanceCatalog | null = null;
  private readonly store = new PerformanceStore();
  private readonly builder = new PerformanceBuilder();
  private readonly validator = new PerformanceValidator();
  private readonly metadata = new WorkerPerformanceMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkerPerformanceReviewConfiguration) {
    if (this.seeded) return;
    this.store.seed({
      workers: config.seedWorkers,
      records: config.seedRecords,
    });
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      this.store.getLatestExecutiveReport(),
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

  getLatestReviewId() {
    return this.store.getLatestReviewId();
  }

  getLatestExecutiveReport() {
    return this.store.getLatestExecutiveReport();
  }

  connect(
    _input: Record<string, unknown>,
    config: WorkerPerformanceReviewConfiguration,
  ): WorkerPerformanceRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWprLog({
      event: "connect",
      details: "Worker Performance Review connected; evaluate-only mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      this.store.listWorkers(),
      [],
      null,
      null,
      [],
      [],
      null,
      [],
      {
        validationReportId: `wpr-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Worker Performance Review is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WPR_METADATA_VERSION,
      },
      started,
    );
  }

  registerWorker(input: WorkerPerformanceInput, config: WorkerPerformanceReviewConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("register_worker", input, config, started);
    if (!input.workerId?.trim()) {
      return this.disabled("register_worker", config, "workerId is required to register");
    }
    const worker = this.builder.applyMetrics(this.store.getWorker(input.workerId), input);
    this.store.upsertWorker(worker);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      this.store.getLatestExecutiveReport(),
    );
    const validation = this.validator.validateCatalog(
      this.catalog,
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWprLog({
      event: "register_worker",
      details: `worker=${worker.workerId} department=${worker.department}`,
    });
    return this.report(
      "register_worker",
      this.getCatalog(),
      [worker],
      [],
      null,
      null,
      [],
      [],
      null,
      [],
      validation,
      started,
    );
  }

  reviewWorker(input: WorkerPerformanceInput, config: WorkerPerformanceReviewConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.reviewRulesEnabled) {
      return this.disabled(
        "review_worker",
        config,
        !config.enabled
          ? "Worker Performance Review is disabled"
          : "Review rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail("review_worker", input, config, started);
    const workerId = input.workerId?.trim();
    if (!workerId) {
      return this.disabled("review_worker", config, "workerId is required for review");
    }
    const worker = this.builder.applyMetrics(this.store.getWorker(workerId), input);
    this.store.upsertWorker(worker);
    const history = this.store.recordsFor(workerId);
    const assessment = this.builder.assess(worker, history, config);
    const record = this.builder.buildRecord({ input, worker, assessment, config });
    this.store.saveRecord(record);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      this.store.getLatestExecutiveReport(),
    );
    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", "valid");
    appendWprLog({
      event: "review_worker",
      details: `worker=${worker.workerId} score=${record.overallScore} rating=${record.executiveRating}`,
    });
    this.metadata.generate(this.store.workerCount(), this.store.recordCount());
    return this.report(
      "review_worker",
      this.getCatalog(),
      [worker],
      [record],
      record,
      null,
      [record.trend],
      record.improvementRecommendations,
      "valid",
      [],
      validation,
      started,
    );
  }

  reviewActive(input: WorkerPerformanceInput, config: WorkerPerformanceReviewConfiguration) {
    return this.bulkReview("review_active", input, config, (workers) =>
      workers.filter((w) => w.active),
    );
  }

  analyzeTrends(input: WorkerPerformanceInput, config: WorkerPerformanceReviewConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.trendRulesEnabled) {
      return this.disabled("analyze_trends", config, "Trend rules are disabled");
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("analyze_trends", input, config, started);
    }

    // Prefer historical score deltas over a fresh identical re-score.
    const records = this.store.listRecords();
    const byWorker = new Map<string, PerformanceRecord[]>();
    for (const record of records) {
      const list = byWorker.get(record.workerId) ?? [];
      list.push(record);
      byWorker.set(record.workerId, list);
    }

    const trends: PerformanceTrend[] = [];
    const focused: PerformanceRecord[] = [];
    for (const history of byWorker.values()) {
      const ordered = history
        .slice()
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const latest = ordered[ordered.length - 1];
      if (!latest) continue;
      focused.push(latest);
      if (ordered.length < 2) {
        trends.push(latest.trend);
        continue;
      }
      const previous = ordered[ordered.length - 2]!;
      const delta = Number((latest.overallScore - previous.overallScore).toFixed(4));
      let direction: PerformanceTrend["direction"] = "stable";
      if (delta >= config.improvingDeltaThreshold) direction = "improving";
      else if (delta <= config.decliningDeltaThreshold) direction = "declining";
      trends.push({
        direction,
        delta,
        samples: ordered.length,
        notes: [
          `Historical compare ${previous.performanceReviewId}->${latest.performanceReviewId}`,
        ],
      });
    }

    const evaluation = this.builder.evaluate(
      input,
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      focused,
      this.store.getLatestExecutiveReport(),
    );
    this.catalog = evaluation.catalog;
    const validation = this.validator.validateRecords(
      focused.length ? focused : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.performanceDecision,
    );
    appendWprLog({
      event: "analyze_trends",
      details: `workers=${trends.length} improving=${trends.filter((t) => t.direction === "improving").length} declining=${trends.filter((t) => t.direction === "declining").length}`,
    });
    return this.report(
      "analyze_trends",
      this.getCatalog(),
      this.store.listWorkers(),
      focused,
      focused[focused.length - 1] ?? null,
      this.store.getLatestExecutiveReport(),
      trends,
      evaluation.recommendations,
      evaluation.performanceDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  scoreWorker(input: WorkerPerformanceInput, config: WorkerPerformanceReviewConfiguration) {
    const report = this.reviewWorker(input, config);
    if (report.action !== "review_worker") return report;
    return { ...report, action: "score_worker" as const };
  }

  recommendImprovements(
    input: WorkerPerformanceInput,
    config: WorkerPerformanceReviewConfiguration,
  ) {
    if (!config.recommendationRulesEnabled) {
      return this.disabled(
        "recommend_improvements",
        config,
        "Recommendation rules are disabled",
      );
    }
    const report = this.reviewWorker(input, config);
    if (report.validation.decision === "fail" && report.action !== "review_worker") {
      return report;
    }
    return {
      ...report,
      action: "recommend_improvements" as const,
    };
  }

  produceExecutiveReport(
    input: WorkerPerformanceInput,
    config: WorkerPerformanceReviewConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_executive_report", input, config, started);
    }
    const reviewed = this.reviewTargets(
      input,
      config,
      this.store.listActiveWorkers(),
    );
    const period = input.reviewPeriod?.trim() || config.defaultReviewPeriod;
    const executiveReport = this.builder.buildExecutiveReport(reviewed, period);
    this.store.saveExecutiveReport(executiveReport);
    const evaluation = this.builder.evaluate(
      input,
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      reviewed,
      executiveReport,
    );
    this.catalog = evaluation.catalog;
    const validation = this.validator.validateRecords(
      reviewed.length ? reviewed : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.performanceDecision,
    );
    appendWprLog({
      event: "produce_executive_report",
      details: `reviewed=${reviewed.length} avg=${executiveReport.averageOverallScore}`,
    });
    return this.report(
      "produce_executive_report",
      this.getCatalog(),
      this.store.listActiveWorkers(),
      reviewed,
      reviewed[reviewed.length - 1] ?? null,
      executiveReport,
      evaluation.trends,
      evaluation.recommendations,
      evaluation.performanceDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  produce(input: WorkerPerformanceInput, config: WorkerPerformanceReviewConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("produce", input, config, started);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      this.store.getLatestExecutiveReport(),
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
    appendWprLog({
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
      this.store.getLatestExecutiveReport(),
      records.map((r) => r.trend),
      unique(records.flatMap((r) => r.improvementRecommendations)),
      records.length ? "valid" : "partially_valid",
      [],
      validation,
      started,
    );
  }

  list(config: WorkerPerformanceReviewConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      this.store.getLatestExecutiveReport(),
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
      this.store.getLatestExecutiveReport(),
      [],
      [],
      "valid",
      [],
      validation,
      started,
    );
  }

  validate(input: WorkerPerformanceInput, config: WorkerPerformanceReviewConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      this.store.getLatestExecutiveReport(),
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
      this.store.getLatestExecutiveReport(),
      [],
      [],
      validation.decision === "fail" ? "invalid" : "valid",
      [],
      validation,
      started,
    );
  }

  diagnostics(config: WorkerPerformanceReviewConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      this.store.getLatestExecutiveReport(),
    );
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Worker Performance Review is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWprLog({
      event: "diagnostics",
      details: `workers=${this.store.workerCount()} records=${this.store.recordCount()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listWorkers(),
      this.store.listRecords(),
      null,
      this.store.getLatestExecutiveReport(),
      [],
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private bulkReview(
    action: WorkerPerformanceRunReport["action"],
    input: WorkerPerformanceInput,
    config: WorkerPerformanceReviewConfiguration,
    select: (workers: PerformanceWorker[]) => PerformanceWorker[],
  ): WorkerPerformanceRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.reviewRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Worker Performance Review is disabled"
          : "Review rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    if (input.workers?.length) {
      for (const worker of input.workers) this.store.upsertWorker(worker);
    }
    const targets = select(this.store.listWorkers());
    const reviewed = this.reviewTargets(input, config, targets);
    const evaluation = this.builder.evaluate(
      input,
      config,
      this.store.listWorkers(),
      this.store.listRecords(),
      reviewed,
      this.store.getLatestExecutiveReport(),
    );
    this.catalog = evaluation.catalog;
    const validation = this.validator.validateRecords(
      reviewed.length ? reviewed : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.performanceDecision,
    );
    appendWprLog({
      event: action,
      details: `reviewed=${reviewed.length} improving=${reviewed.filter((r) => r.trend.direction === "improving").length} declining=${reviewed.filter((r) => r.trend.direction === "declining").length}`,
    });
    this.metadata.generate(this.store.workerCount(), this.store.recordCount());
    return this.report(
      action,
      this.getCatalog(),
      targets,
      reviewed,
      reviewed[reviewed.length - 1] ?? null,
      this.store.getLatestExecutiveReport(),
      evaluation.trends,
      evaluation.recommendations,
      evaluation.performanceDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  private reviewTargets(
    input: WorkerPerformanceInput,
    config: WorkerPerformanceReviewConfiguration,
    targets: PerformanceWorker[],
  ): PerformanceRecord[] {
    const reviewed: PerformanceRecord[] = [];
    for (const target of targets) {
      const worker = this.builder.applyMetrics(target, {
        ...input,
        workerId: target.workerId,
      });
      this.store.upsertWorker(worker);
      const history = this.store.recordsFor(worker.workerId);
      const assessment = this.builder.assess(worker, history, config);
      const record = this.builder.buildRecord({
        input: { ...input, workerId: worker.workerId },
        worker,
        assessment,
        config,
      });
      this.store.saveRecord(record);
      reviewed.push(record);
    }
    return reviewed;
  }

  private boundaryFail(
    action: WorkerPerformanceRunReport["action"],
    input: WorkerPerformanceInput,
    config: WorkerPerformanceReviewConfiguration,
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
    action: WorkerPerformanceRunReport["action"],
    config: WorkerPerformanceReviewConfiguration,
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
      null,
      [],
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private hasBoundary(input: WorkerPerformanceInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkerMonitoring === true ||
      input.replaceWorkforceCertificationMonitor === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkerPerformanceReviewConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastPerformanceDecision: PerformanceDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wpr-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKER_PERFORMANCE_REVIEW_ID,
      engineVersion: "PILLOW-WPR-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WPR_CAPABILITIES],
      totalWorkers: this.store.workerCount(),
      totalRecords: this.store.recordCount(),
      lastPerformanceDecision,
      metadataVersion: WPR_METADATA_VERSION,
    };
  }

  private report(
    action: WorkerPerformanceRunReport["action"],
    catalog: WorkerPerformanceCatalog | null,
    workers: PerformanceWorker[],
    records: PerformanceRecord[],
    latestRecord: PerformanceRecord | null,
    executiveReport: ExecutivePerformanceReport | null,
    trends: PerformanceTrend[],
    recommendations: string[],
    performanceDecision: PerformanceDecision | string | null,
    rulesFailed: string[],
    validation: WorkerPerformanceRunReport["validation"],
    started: number,
  ): WorkerPerformanceRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      performanceRunReportId: `wpr-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      workers,
      records,
      latestRecord,
      executiveReport,
      trends,
      recommendations,
      performanceDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WPR_METADATA_VERSION,
    };
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneCatalog(catalog: WorkerPerformanceCatalog): WorkerPerformanceCatalog {
  return {
    ...catalog,
    metrics: [...catalog.metrics],
    ratings: [...catalog.ratings],
    workers: catalog.workers.map((w) => ({
      ...w,
      metrics: { ...w.metrics },
      neverExecuteWorkerTasks: true,
    })),
    records: catalog.records.map((r) => ({
      ...r,
      improvementRecommendations: [...r.improvementRecommendations],
      metricScores: { ...r.metricScores },
      trend: { ...r.trend, notes: [...r.trend.notes] },
    })),
    latestExecutiveReport: catalog.latestExecutiveReport
      ? {
          ...catalog.latestExecutiveReport,
          ratingDistribution: { ...catalog.latestExecutiveReport.ratingDistribution },
          improvingWorkers: [...catalog.latestExecutiveReport.improvingWorkers],
          decliningWorkers: [...catalog.latestExecutiveReport.decliningWorkers],
          topPerformers: [...catalog.latestExecutiveReport.topPerformers],
          improvementPriorities: [...catalog.latestExecutiveReport.improvementPriorities],
        }
      : null,
  };
}
