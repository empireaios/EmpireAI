import type { ExecutiveReportingRuntimeConfiguration } from "./configuration.js";
import { appendErtLog } from "./ert-logging.js";
import { ReportAggregator } from "./report-aggregator.js";
import { ReportStore } from "./report-store.js";
import {
  ExecutiveReportingRuntimeMetadataGenerator,
  HealthMonitor,
  RecoveryManager,
  ReportValidator,
} from "./report-validator.js";
import {
  ERT_CAPABILITIES,
  ERT_METADATA_VERSION,
  EXECUTIVE_REPORTING_RUNTIME_ID,
} from "./paths.js";
import type {
  EntityType,
  ExecutiveReportingRuntimeEngineRecord,
  ExecutiveReportingRuntimeInput,
  ExecutiveReportingRuntimeRunReport,
  ExecutiveSummary,
  OperationalState,
  ReportRecord,
  ReportType,
} from "./types.js";

export class ExecutiveReportingRuntimeCore {
  private engineRecord: ExecutiveReportingRuntimeEngineRecord | null = null;
  private seeded = false;
  private latestSummary: ExecutiveSummary | null = null;
  private readonly store = new ReportStore();
  private readonly aggregator = new ReportAggregator();
  private readonly validator = new ReportValidator();
  private readonly metadata = new ExecutiveReportingRuntimeMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: ExecutiveReportingRuntimeConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
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

  getLatestSummary() {
    return this.latestSummary
      ? {
          ...this.latestSummary,
          openBlockers: [...this.latestSummary.openBlockers],
          openRisks: [...this.latestSummary.openRisks],
          completionBreakdown: { ...this.latestSummary.completionBreakdown },
          entityBreakdown: { ...this.latestSummary.entityBreakdown },
        }
      : null;
  }

  connect(
    _input: Record<string, unknown>,
    config: ExecutiveReportingRuntimeConfiguration,
  ): ExecutiveReportingRuntimeRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendErtLog({
      event: "connect",
      details: "Executive Reporting Runtime connected; report-only mode",
    });
    return this.report(
      "connect",
      [],
      null,
      null,
      [],
      {
        validationReportId: `ert-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Executive Reporting Runtime is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: ERT_METADATA_VERSION,
      },
      started,
    );
  }

  submitWorker(input: ExecutiveReportingRuntimeInput, config: ExecutiveReportingRuntimeConfiguration) {
    return this.submit(
      "submit_worker",
      input,
      config,
      "worker",
      "progress_report",
      config.workerReportingEnabled,
      "Worker reporting is disabled",
    );
  }

  submitDepartment(
    input: ExecutiveReportingRuntimeInput,
    config: ExecutiveReportingRuntimeConfiguration,
  ) {
    return this.submit(
      "submit_department",
      input,
      config,
      "department",
      "department_summary",
      config.departmentReportingEnabled,
      "Department reporting is disabled",
    );
  }

  submitFactory(
    input: ExecutiveReportingRuntimeInput,
    config: ExecutiveReportingRuntimeConfiguration,
  ) {
    return this.submit(
      "submit_factory",
      input,
      config,
      "factory",
      "factory_summary",
      config.factoryReportingEnabled,
      "Factory reporting is disabled",
    );
  }

  submitExecutive(
    input: ExecutiveReportingRuntimeInput,
    config: ExecutiveReportingRuntimeConfiguration,
  ) {
    return this.submit(
      "submit_executive",
      input,
      config,
      "executive_component",
      "executive_summary",
      config.executiveReportingEnabled,
      "Executive reporting is disabled",
    );
  }

  aggregateProgress(
    input: ExecutiveReportingRuntimeInput,
    config: ExecutiveReportingRuntimeConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.aggregationRulesEnabled) {
      return this.disabledReport(
        "aggregate_progress",
        config,
        started,
        !config.enabled
          ? "Executive Reporting Runtime is disabled"
          : "Aggregation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("aggregate_progress", input, config, started);
    }

    const records = this.filterRecords(input);
    const averageProgress = this.aggregator.aggregateProgress(records);
    const openBlockers = this.aggregator.collectBlockers(records);
    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["No reports available to aggregate"], started)
        : this.validator.validateRecords(
            records,
            { ...input, validated: input.validated ?? true },
            started,
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendErtLog({
      event: "aggregate_progress",
      details: `count=${records.length} average=${averageProgress}`,
    });
    return this.report(
      "aggregate_progress",
      records,
      null,
      averageProgress,
      openBlockers,
      validation,
      started,
    );
  }

  listBlockers(
    input: ExecutiveReportingRuntimeInput,
    config: ExecutiveReportingRuntimeConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled) {
      return this.disabledReport(
        "list_blockers",
        config,
        started,
        "Executive Reporting Runtime is disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("list_blockers", input, config, started);
    }

    const records = this.filterRecords(input).filter((r) => r.blockers.length > 0);
    const openBlockers = this.aggregator.collectBlockers(records);
    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["No blockers currently reported"], started)
        : this.validator.validateRecords(
            records,
            { ...input, validated: input.validated ?? true },
            started,
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list_blockers",
      records,
      null,
      this.aggregator.aggregateProgress(this.store.list()),
      openBlockers,
      validation,
      started,
    );
  }

  generateSummary(
    input: ExecutiveReportingRuntimeInput,
    config: ExecutiveReportingRuntimeConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.summaryRulesEnabled) {
      return this.disabledReport(
        "generate_summary",
        config,
        started,
        !config.enabled
          ? "Executive Reporting Runtime is disabled"
          : "Summary rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("generate_summary", input, config, started);
    }

    const records = this.filterRecords(input);
    const summary = this.aggregator.buildSummary(records);
    this.latestSummary = summary;

    // Also persist an executive summary report record for machine-readable history
    const summaryRecord = this.store.buildRecord({
      input,
      reportingEntity: input.reportingEntity?.trim() || "executive-reporting-runtime",
      entityType: "executive_component",
      businessId: summary.businessId,
      missionId: summary.missionId ?? "mission-portfolio",
      currentStatus: "executive_summary_ready",
      progress: summary.averageProgress,
      blockers: summary.openBlockers,
      risks: summary.openRisks,
      evidence: [`summary:${summary.summaryId}`, `reports:${summary.totalReports}`],
      nextAction: "Review executive summary in Pillow",
      completionStatus: summary.openBlockers.length ? "blocked" : "in_progress",
      reportType: "executive_summary",
      reportingFrequency: input.reportingFrequency?.toString().trim() || "on_demand",
      validationStatus: "passed",
    });

    const validation = this.validator.validateRecords(
      [summaryRecord],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendErtLog({
      event: "generate_summary",
      details: `summary=${summary.summaryId} reports=${summary.totalReports}`,
    });
    this.metadata.generate(this.store.count(), this.store.averageProgress());
    return this.report(
      "generate_summary",
      records.length ? [...records, summaryRecord] : [summaryRecord],
      summary,
      summary.averageProgress,
      summary.openBlockers,
      validation,
      started,
    );
  }

  list(config: ExecutiveReportingRuntimeConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["Reporting catalog is empty"], started)
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      records,
      this.latestSummary,
      this.store.averageProgress(),
      this.store.openBlockers(),
      validation,
      started,
    );
  }

  validate(input: ExecutiveReportingRuntimeInput, config: ExecutiveReportingRuntimeConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const validation =
      records.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.finalize("pass", [], ["No reporting records yet"], started)
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
      this.latestSummary,
      this.store.averageProgress(),
      this.store.openBlockers(),
      validation,
      started,
    );
  }

  diagnostics(config: ExecutiveReportingRuntimeConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Executive Reporting Runtime is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendErtLog({
      event: "diagnostics",
      details: `records=${this.store.count()} blockers=${this.store.openBlockers().length} avg=${this.store.averageProgress()}`,
    });
    return this.report(
      "diagnostics",
      this.store.list(),
      this.latestSummary,
      this.store.averageProgress(),
      this.store.openBlockers(),
      validation,
      started,
    );
  }

  private submit(
    action: ExecutiveReportingRuntimeRunReport["action"],
    input: ExecutiveReportingRuntimeInput,
    config: ExecutiveReportingRuntimeConfiguration,
    entityType: EntityType,
    reportType: ReportType,
    enabledFlag: boolean,
    disabledMessage: string,
  ): ExecutiveReportingRuntimeRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !enabledFlag) {
      return this.disabledReport(
        action,
        config,
        started,
        !config.enabled ? "Executive Reporting Runtime is disabled" : disabledMessage,
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started, true);
    }

    const normalized = this.aggregator.normalize(input, entityType, reportType);
    const record = this.store.buildRecord({
      input,
      reportingEntity: normalized.reportingEntity,
      entityType: normalized.entityType,
      businessId: normalized.businessId,
      missionId: normalized.missionId,
      currentStatus: normalized.currentStatus,
      progress: normalized.progress,
      blockers: normalized.blockers,
      risks: normalized.risks,
      evidence: normalized.evidence,
      nextAction: normalized.nextAction,
      completionStatus: normalized.completionStatus,
      reportType: normalized.reportType,
      reportingFrequency: normalized.reportingFrequency,
      validationStatus: "passed",
    });

    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
      true,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      record.reportType,
    );
    appendErtLog({
      event: action,
      details: `id=${record.reportId} entity=${record.reportingEntity} type=${record.reportType} progress=${record.progress}`,
    });
    this.metadata.generate(this.store.count(), this.store.averageProgress());
    return this.report(
      action,
      [record],
      null,
      record.progress,
      record.blockers,
      validation,
      started,
    );
  }

  private filterRecords(input: ExecutiveReportingRuntimeInput) {
    return this.store.list().filter((r) => {
      if (input.businessId?.trim() && r.businessId !== input.businessId.trim()) return false;
      if (input.missionId?.trim() && r.missionId !== input.missionId.trim()) return false;
      if (input.entityType?.toString().trim() && r.entityType !== input.entityType.toString().trim()) {
        return false;
      }
      return true;
    });
  }

  private boundaryFail(
    action: ExecutiveReportingRuntimeRunReport["action"],
    input: ExecutiveReportingRuntimeInput,
    config: ExecutiveReportingRuntimeConfiguration,
    started: number,
    requireEntity = false,
  ) {
    const validation = this.validator.validateRecords(null, input, started, requireEntity);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, null, [], validation, started);
  }

  private disabledReport(
    action: ExecutiveReportingRuntimeRunReport["action"],
    config: ExecutiveReportingRuntimeConfiguration,
    started: number,
    message: string,
  ) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, null, [], validation, started);
  }

  private hasBoundary(input: ExecutiveReportingRuntimeInput) {
    return (
      input.executeWorkerLogic === true ||
      input.replaceMonitoringRuntime === true ||
      input.replaceMissionCoordination === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: ExecutiveReportingRuntimeConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastReportType: string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `ert-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EXECUTIVE_REPORTING_RUNTIME_ID,
      engineVersion: "PILLOW-ERT-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...ERT_CAPABILITIES],
      totalReportRecords: this.store.count(),
      workerReports: this.store.countByEntity("worker"),
      departmentReports: this.store.countByEntity("department"),
      factoryReports: this.store.countByEntity("factory"),
      executiveReports: this.store.countByEntity("executive_component"),
      openBlockerCount: this.store.openBlockers().length,
      averageProgress: this.store.averageProgress(),
      lastReportType: lastReportType ?? this.getLatestRecord()?.reportType ?? null,
      metadataVersion: ERT_METADATA_VERSION,
    };
  }

  private report(
    action: ExecutiveReportingRuntimeRunReport["action"],
    records: ReportRecord[],
    summary: ExecutiveSummary | null,
    averageProgress: number | null,
    openBlockers: string[],
    validation: ExecutiveReportingRuntimeRunReport["validation"],
    started: number,
  ): ExecutiveReportingRuntimeRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      reportingRunReportId: `ert-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      summary: summary
        ? {
            ...summary,
            openBlockers: [...summary.openBlockers],
            openRisks: [...summary.openRisks],
            completionBreakdown: { ...summary.completionBreakdown },
            entityBreakdown: { ...summary.entityBreakdown },
          }
        : null,
      averageProgress,
      openBlockers: [...openBlockers],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: ERT_METADATA_VERSION,
    };
  }
}
