import type { AuditRuntimeConfiguration } from "./configuration.js";
import {
  AudrtIntegrationCoordinator,
  type AuditRuntimeDependencies,
} from "./integrations.js";
import { appendAudrtLog } from "./audrt-logging.js";
import { AuditStore } from "./audit-store.js";
import { AuditValidator } from "./audit-validator.js";
import { EventRecorder } from "./event-recorder.js";
import { WorkerActionRecorder } from "./worker-action-recorder.js";
import { MissionLifecycleRecorder } from "./mission-lifecycle-recorder.js";
import { ApprovalRecorder } from "./approval-recorder.js";
import { RecoveryRecorder } from "./recovery-recorder.js";
import { SchedulingRecorder } from "./scheduling-recorder.js";
import { EvidenceCapturer } from "./evidence-capturer.js";
import { IntegrityVerifier } from "./integrity-verifier.js";
import { AuditQueryEngine } from "./audit-query-engine.js";
import { MetricsCollector } from "./metrics-collector.js";
import { ReportBuilder } from "./report-builder.js";
import {
  AUDIT_RUNTIME_ID,
  AUDRT_CAPABILITIES,
  AUDRT_METADATA_VERSION,
  AUDRT_SEED_CLOCK_UTC,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  AuditRecord,
  AudrtEngineRecord,
  AudrtInput,
  AudrtRunReport,
  AudrtValidationReport,
  IntegrationHandshake,
  Q1014ConsumableContract,
} from "./types.js";

export class AuditRuntimeManager {
  private engineRecord: AudrtEngineRecord | null = null;
  private seeded = false;
  private lastConfig: AuditRuntimeConfiguration | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new AuditValidator();
  private readonly eventRecorder = new EventRecorder();
  private readonly workerActionRecorder = new WorkerActionRecorder();
  private readonly missionLifecycleRecorder = new MissionLifecycleRecorder();
  private readonly approvalRecorder = new ApprovalRecorder();
  private readonly recoveryRecorder = new RecoveryRecorder();
  private readonly schedulingRecorder = new SchedulingRecorder();
  private readonly evidenceCapturer = new EvidenceCapturer();
  private readonly integrityVerifier = new IntegrityVerifier();
  private readonly queryEngine = new AuditQueryEngine();
  private readonly metricsCollector = new MetricsCollector();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new AudrtIntegrationCoordinator();

  constructor() {
    this.integrations.setRecordAuditEvent((payload) => this.recordAuditEvent(payload));
  }

  bindIntegrations(deps: AuditRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  /** Exposes recordAuditEvent for AuditRuntimeHandle presence compatibility. */
  getRecordAuditEventHandle() {
    return this.integrations;
  }

  /**
   * Compatibility adapter matching AuditRuntimeHandle.recordAuditEvent used by other runtimes.
   */
  recordAuditEvent(payload: unknown) {
    const input = (payload && typeof payload === "object"
      ? (payload as AudrtInput)
      : {}) as AudrtInput;
    if (!this.lastConfig) {
      return { recorded: false, errors: ["Audit Runtime not seeded — call initialize/connect first"] };
    }
    const config = this.lastConfig;
    const started = Date.now();
    const normalized: AudrtInput = {
      ...input,
      validated: input.validated !== false,
      category: input.category ?? "runtime_event",
      actionPerformed: input.actionPerformed ?? "record_audit_event",
    };
    const validation = this.validator.validateInput(normalized, started);
    if (validation.decision === "fail") {
      return { recorded: false, errors: validation.errors };
    }
    const record = this.eventRecorder.record(this.store, normalized, config);
    this.ensureRecord("recording", config);
    return { recorded: true, auditRecordId: record.auditRecordId, record };
  }

  ensureSeeded(config: AuditRuntimeConfiguration) {
    this.lastConfig = config;
    if (this.seeded) return;
    this.seeded = true;

    const seedBase = {
      timestamp: AUDRT_SEED_CLOCK_UTC,
      factoryId: config.factory,
      validated: true as const,
    };

    this.workerActionRecorder.record(
      this.store,
      {
        ...seedBase,
        auditRecordId: "audrt-seed-worker-01",
        eventId: "audrt-seed-evt-worker-01",
        workerId: config.workerId,
        missionId: "Q10-13",
        actionPerformed: "seed_worker_action",
        decision: "recorded",
        currentStatus: "recorded",
        supportingEvidence: ["evid://audrt/seed/worker-01"],
        auditReference: "audit://audrt/seed/worker-01",
        runtimeComponent: "audit-runtime",
      },
      config,
    );

    this.missionLifecycleRecorder.record(
      this.store,
      {
        ...seedBase,
        auditRecordId: "audrt-seed-mission-01",
        eventId: "audrt-seed-evt-mission-01",
        workerId: config.workerId,
        missionId: "Q10-12",
        actionPerformed: "seed_mission_lifecycle",
        decision: "recorded",
        currentStatus: "recorded",
        supportingEvidence: ["evid://audrt/seed/mission-01"],
        auditReference: "audit://audrt/seed/mission-01",
        runtimeComponent: "mission-runtime",
      },
      config,
    );

    this.approvalRecorder.record(
      this.store,
      {
        ...seedBase,
        auditRecordId: "audrt-seed-approval-01",
        eventId: "audrt-seed-evt-approval-01",
        workerId: config.workerId,
        missionId: "Q10-10",
        actionPerformed: "seed_approval_decision",
        decision: "structurally_noted",
        currentStatus: "recorded",
        supportingEvidence: ["evid://audrt/seed/approval-01"],
        auditReference: "audit://audrt/seed/approval-01",
        runtimeComponent: "approval-runtime",
      },
      config,
    );

    this.recoveryRecorder.record(
      this.store,
      {
        ...seedBase,
        auditRecordId: "audrt-seed-recovery-01",
        eventId: "audrt-seed-evt-recovery-01",
        workerId: config.workerId,
        missionId: "Q10-11",
        actionPerformed: "seed_recovery_event",
        decision: "recorded",
        currentStatus: "recorded",
        supportingEvidence: ["evid://audrt/seed/recovery-01"],
        auditReference: "audit://audrt/seed/recovery-01",
        runtimeComponent: "recovery-runtime",
      },
      config,
    );

    this.schedulingRecorder.record(
      this.store,
      {
        ...seedBase,
        auditRecordId: "audrt-seed-scheduling-01",
        eventId: "audrt-seed-evt-scheduling-01",
        workerId: config.workerId,
        missionId: "Q10-12",
        actionPerformed: "seed_scheduling_activity",
        decision: "recorded",
        currentStatus: "recorded",
        supportingEvidence: ["evid://audrt/seed/scheduling-01"],
        auditReference: "audit://audrt/seed/scheduling-01",
        runtimeComponent: "scheduling-runtime",
      },
      config,
    );

    this.ensureRecord("active", config);
    appendAudrtLog({
      event: "seed_records",
      details: `Seeded 5 structural audit records from ${AUDRT_SEED_CLOCK_UTC} — evidence refs only, fabricated=false`,
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

  getStore() {
    return this.store;
  }

  getQ1014ConsumableContract(config: AuditRuntimeConfiguration): Q1014ConsumableContract {
    return this.reportBuilder.buildQ1014ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    appendAudrtLog({
      event: "connect",
      details: `Audit Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction(
      "connect",
      started,
      { validated: true },
      config,
      null,
      this.store.list(),
      null,
      null,
      handshakes,
    );
  }

  recordEvent(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateRecord(
      { ...input, category: input.category ?? "runtime_event" },
      started,
    );
    if (validation.decision === "fail") {
      return this.failReport("record_event", started, validation, config);
    }
    const record = this.eventRecorder.record(this.store, input, config);
    this.ensureRecord("recording", config);
    appendAudrtLog({
      event: "record_event",
      details: `${record.auditRecordId}:${record.category}`,
    });
    return this.reportAction("record_event", started, input, config, record, [record], null, null);
  }

  recordWorkerAction(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateRecord(
      { ...input, category: "worker_action", actionPerformed: input.actionPerformed ?? "worker_action" },
      started,
    );
    if (validation.decision === "fail") {
      return this.failReport("record_worker_action", started, validation, config);
    }
    const record = this.workerActionRecorder.record(this.store, input, config);
    this.ensureRecord("recording", config);
    appendAudrtLog({
      event: "record_worker_action",
      details: `${record.auditRecordId}:${record.actionPerformed}`,
    });
    return this.reportAction(
      "record_worker_action",
      started,
      input,
      config,
      record,
      [record],
      null,
      null,
    );
  }

  recordMissionLifecycle(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateRecord(
      {
        ...input,
        category: "mission_lifecycle",
        actionPerformed: input.actionPerformed ?? "mission_lifecycle",
      },
      started,
    );
    if (validation.decision === "fail") {
      return this.failReport("record_mission_lifecycle", started, validation, config);
    }
    const record = this.missionLifecycleRecorder.record(this.store, input, config);
    this.ensureRecord("recording", config);
    appendAudrtLog({
      event: "record_mission_lifecycle",
      details: `${record.auditRecordId}:${record.missionId}`,
    });
    return this.reportAction(
      "record_mission_lifecycle",
      started,
      input,
      config,
      record,
      [record],
      null,
      null,
    );
  }

  recordApproval(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateRecord(
      {
        ...input,
        category: "approval_decision",
        actionPerformed: input.actionPerformed ?? "approval_decision",
      },
      started,
    );
    if (validation.decision === "fail") {
      return this.failReport("record_approval", started, validation, config);
    }
    const record = this.approvalRecorder.record(this.store, input, config);
    this.ensureRecord("recording", config);
    appendAudrtLog({
      event: "record_approval",
      details: `${record.auditRecordId}:${record.decision}`,
    });
    return this.reportAction("record_approval", started, input, config, record, [record], null, null);
  }

  recordRecovery(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateRecord(
      {
        ...input,
        category: "recovery_event",
        actionPerformed: input.actionPerformed ?? "recovery_event",
      },
      started,
    );
    if (validation.decision === "fail") {
      return this.failReport("record_recovery", started, validation, config);
    }
    const record = this.recoveryRecorder.record(this.store, input, config);
    this.ensureRecord("recording", config);
    appendAudrtLog({
      event: "record_recovery",
      details: `${record.auditRecordId}:${record.actionPerformed}`,
    });
    return this.reportAction("record_recovery", started, input, config, record, [record], null, null);
  }

  recordScheduling(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateRecord(
      {
        ...input,
        category: "scheduling_activity",
        actionPerformed: input.actionPerformed ?? "scheduling_activity",
      },
      started,
    );
    if (validation.decision === "fail") {
      return this.failReport("record_scheduling", started, validation, config);
    }
    const record = this.schedulingRecorder.record(this.store, input, config);
    this.ensureRecord("recording", config);
    appendAudrtLog({
      event: "record_scheduling",
      details: `${record.auditRecordId}:${record.actionPerformed}`,
    });
    return this.reportAction(
      "record_scheduling",
      started,
      input,
      config,
      record,
      [record],
      null,
      null,
    );
  }

  attachEvidence(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateEvidence(input, started);
    if (validation.decision === "fail") {
      return this.failReport("attach_evidence", started, validation, config);
    }
    const record = this.evidenceCapturer.attach(this.store, input, config);
    this.ensureRecord("recording", config);
    appendAudrtLog({
      event: "attach_evidence",
      details: `${record.auditRecordId}:refs=${record.supportingEvidence.length}`,
    });
    return this.reportAction("attach_evidence", started, input, config, record, [record], null, null);
  }

  query(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("query", started, validation, config);
    }
    const records = this.queryEngine.query(this.store, input.query ?? {
      category: input.category,
      missionId: input.missionId,
      workerId: input.workerId,
      factoryId: input.factoryId,
    });
    this.ensureRecord("querying", config);
    appendAudrtLog({
      event: "query",
      details: `results=${records.length}`,
    });
    return this.reportAction("query", started, input, config, null, records, null, null);
  }

  verifyIntegrity(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("verify_integrity", started, validation, config);
    }
    const verification = this.integrityVerifier.verifyAll(this.store.list());
    this.ensureRecord("verifying", config);
    appendAudrtLog({
      event: "verify_integrity",
      details: `allPassed=${verification.allPassed}:checked=${verification.totalChecked}`,
    });
    return this.reportAction(
      "verify_integrity",
      started,
      input,
      config,
      null,
      this.store.list(),
      verification,
      null,
    );
  }

  exportRecords(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("export_records", started, validation, config);
    }
    const records = this.queryEngine.export(this.store, input.query ?? {});
    this.ensureRecord("active", config);
    appendAudrtLog({
      event: "export_records",
      details: `exported=${records.length}`,
    });
    return this.reportAction("export_records", started, input, config, null, records, null, null);
  }

  produceReport(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_report", started, validation, config);
    }
    const verification = this.integrityVerifier.verifyAll(this.store.list());
    const outstandingIssues: string[] = [];
    if (!verification.allPassed) {
      outstandingIssues.push(`integrity_failures=${verification.failedCount}`);
    }
    const report = this.reportBuilder.buildAuditRuntimeReport(
      this.store,
      this.metricsCollector,
      config,
      {
        auditStatus: verification.allPassed ? "passed" : "failed",
        outstandingIssues,
        confidenceScore: verification.allPassed ? 92 : 55,
      },
    );
    this.store.saveReport(report);
    this.ensureRecord("reporting", config);
    if (this.engineRecord) {
      this.engineRecord = { ...this.engineRecord, lastReportId: report.reportId };
    }
    appendAudrtLog({
      event: "produce_report",
      details: report.reportId,
    });
    return this.reportAction(
      "produce_report",
      started,
      input,
      config,
      null,
      this.store.list(),
      verification,
      report,
    );
  }

  submitReport(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("submit_report", started, validation, config);
    }
    let report = this.store.listReports().at(-1) ?? null;
    if (!report) {
      const produced = this.produceReport(input, config);
      report = produced.auditRuntimeReport;
    }
    if (report) {
      this.integrations.submitReport(report);
    }
    this.ensureRecord("reporting", config);
    appendAudrtLog({
      event: "submit_report",
      details: report?.reportId ?? "none",
    });
    return this.reportAction(
      "submit_report",
      started,
      input,
      config,
      null,
      this.store.list(),
      null,
      report,
    );
  }

  list(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("list", started, validation, config);
    }
    const records = this.store.list().sort((a, b) => {
      const ts = a.timestamp.localeCompare(b.timestamp);
      return ts !== 0 ? ts : a.auditRecordId.localeCompare(b.auditRecordId);
    });
    this.ensureRecord("active", config);
    return this.reportAction("list", started, input, config, null, records, null, null);
  }

  validate(input: AudrtInput, config: AuditRuntimeConfiguration): AudrtRunReport {
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
      null,
      [],
      validation,
    );
  }

  diagnostics(_input: Record<string, unknown>, config: AuditRuntimeConfiguration): AudrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    const diag = this.reportBuilder.buildDiagnostics(this.store, handshakes);
    appendAudrtLog({
      event: "diagnostics",
      details: diag.diagnosticsId,
    });
    return this.reportAction(
      "diagnostics",
      started,
      { validated: true },
      config,
      null,
      this.store.list(),
      null,
      null,
      handshakes,
    );
  }

  private ensureRecord(state: AudrtEngineRecord["operationalState"], config: AuditRuntimeConfiguration) {
    const metrics = this.metricsCollector.collect(this.store);
    this.engineRecord = {
      engineId: AUDIT_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus: "healthy",
      totalAuditRecords: metrics.totalAuditRecords,
      totalReports: metrics.totalReports,
      lastReportId: this.engineRecord?.lastReportId ?? null,
      supportedCapabilities: [...AUDRT_CAPABILITIES],
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: AUDRT_METADATA_VERSION,
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: AudrtValidationReport,
    config: AuditRuntimeConfiguration,
  ): AudrtRunReport {
    this.ensureRecord("failed", config);
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      record: null,
      records: [],
      integrityVerification: null,
      auditRuntimeReport: null,
      q1014Contract: action === "get_q1014_contract" ? this.getQ1014ConsumableContract(config) : null,
      integrationHandshakes: [],
      errors: [...validation.errors],
      warnings: [...validation.warnings],
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: AudrtInput,
    config: AuditRuntimeConfiguration,
    record: AuditRecord | null,
    records: AuditRecord[],
    integrityVerification: AudrtRunReport["integrityVerification"],
    auditRuntimeReport: AudrtRunReport["auditRuntimeReport"],
    handshakes: IntegrationHandshake[] = [],
    validationOverride?: AudrtValidationReport,
  ): AudrtRunReport {
    const validation =
      validationOverride ?? this.validator.validateInput({ ...input, validated: true }, started);
    const decision =
      validation.decision === "fail"
        ? "fail"
        : validation.errors.length
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
      record,
      records,
      integrityVerification,
      auditRuntimeReport,
      q1014Contract: null,
      integrationHandshakes: handshakes,
      errors: [...validation.errors],
      warnings: [...validation.warnings],
    };
  }
}
