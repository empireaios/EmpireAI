import type { ExecutiveAuditEngineConfiguration } from "./configuration.js";
import { appendExaLog } from "./exa-logging.js";
import { AuditInspector } from "./audit-inspector.js";
import { AuditReportBuilder } from "./audit-report-builder.js";
import {
  AuditMetadataGenerator,
  AuditValidator,
  HealthMonitor,
  RecoveryManager,
} from "./audit-validator.js";
import {
  EXA_CAPABILITIES,
  EXA_METADATA_VERSION,
  EXECUTIVE_AUDIT_ENGINE_ID,
} from "./paths.js";
import type {
  AuditReport,
  ExecutiveAuditEngineRecord,
  ExecutiveAuditInput,
  ExecutiveAuditRunReport,
  OperationalState,
} from "./types.js";

export class ExecutiveAuditManager {
  private engineRecord: ExecutiveAuditEngineRecord | null = null;
  private reports: AuditReport[] = [];
  private readonly inspector = new AuditInspector();
  private readonly builder = new AuditReportBuilder();
  private readonly validator = new AuditValidator();
  private readonly metadata = new AuditMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getReports() {
    return this.reports.map((r) => this.clone(r));
  }

  getLatestReport() {
    const reports = this.getReports();
    return reports[reports.length - 1] ?? null;
  }

  connect(
    _input: Record<string, unknown>,
    config: ExecutiveAuditEngineConfiguration,
  ): ExecutiveAuditRunReport {
    const started = Date.now();
    this.ensureRecord("connected", config);
    appendExaLog({ event: "connect", details: "Executive Audit Engine connected; inspect-only mode" });
    return this.report("connect", [], {
      validationReportId: `exa-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Executive Audit Engine is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: EXA_METADATA_VERSION,
    }, started);
  }

  auditExecutiveDecision(input: ExecutiveAuditInput, config: ExecutiveAuditEngineConfiguration) {
    return this.run("audit_executive_decision", { ...input, auditType: input.auditType ?? "decision_audit" }, config);
  }

  auditMissionOutput(input: ExecutiveAuditInput, config: ExecutiveAuditEngineConfiguration) {
    return this.run("audit_mission_output", { ...input, auditType: input.auditType ?? "mission_audit" }, config);
  }

  auditWorkforceAction(input: ExecutiveAuditInput, config: ExecutiveAuditEngineConfiguration) {
    return this.run("audit_workforce_action", { ...input, auditType: input.auditType ?? "workforce_audit" }, config);
  }

  auditGovernance(input: ExecutiveAuditInput, config: ExecutiveAuditEngineConfiguration) {
    return this.run("audit_governance", { ...input, auditType: input.auditType ?? "governance_audit" }, config);
  }

  auditApproval(input: ExecutiveAuditInput, config: ExecutiveAuditEngineConfiguration) {
    return this.run("audit_approval", { ...input, auditType: input.auditType ?? "approval_audit" }, config);
  }

  auditBusinessState(input: ExecutiveAuditInput, config: ExecutiveAuditEngineConfiguration) {
    return this.run("audit_business_state", { ...input, auditType: input.auditType ?? "business_audit" }, config);
  }

  auditExecutionMemory(input: ExecutiveAuditInput, config: ExecutiveAuditEngineConfiguration) {
    return this.run("audit_execution_memory", { ...input, auditType: input.auditType ?? "memory_audit" }, config);
  }

  auditDecisionRecommendations(input: ExecutiveAuditInput, config: ExecutiveAuditEngineConfiguration) {
    return this.run(
      "audit_decision_recommendations",
      { ...input, auditType: input.auditType ?? "decision_audit" },
      config,
    );
  }

  auditRecommendationQuality(input: ExecutiveAuditInput, config: ExecutiveAuditEngineConfiguration) {
    return this.run(
      "audit_recommendation_quality",
      {
        ...input,
        auditType: input.auditType ?? "decision_audit",
        recommendationHints: input.recommendationHints ?? input.decisionHints ?? ["recommendation quality review"],
      },
      config,
    );
  }

  runAudit(input: ExecutiveAuditInput, config: ExecutiveAuditEngineConfiguration) {
    return this.run("run_audit", input, config);
  }

  validateAudits(input: ExecutiveAuditInput, config: ExecutiveAuditEngineConfiguration) {
    const started = Date.now();
    this.ensureRecord("active", config);
    const validation = this.validator.validateReports(
      this.reports,
      Object.keys(input).length ? input : { validated: true, summary: "validate stored audits" },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    appendExaLog({ event: "validate_audits", details: `decision=${validation.decision}` });
    return this.report("validate_audits", this.getReports().slice(-5), validation, started);
  }

  diagnostics(config: ExecutiveAuditEngineConfiguration) {
    const started = Date.now();
    this.ensureRecord("active", config);
    const validation = this.reports.length
      ? this.validator.validateReports(this.reports, { validated: true, summary: "diagnostics" }, started)
      : {
          validationReportId: `exa-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Executive Audit Engine is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: EXA_METADATA_VERSION,
        };
    appendExaLog({
      event: "health_information",
      details: `audits=${this.reports.length}; violations=${this.violationCount()}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report("diagnostics", this.getReports().slice(-20), validation, started);
  }

  private run(
    action: ExecutiveAuditRunReport["action"],
    input: ExecutiveAuditInput,
    config: ExecutiveAuditEngineConfiguration,
  ): ExecutiveAuditRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    appendExaLog({
      event: "inspect_target",
      details: `action=${action}; type=${input.auditType ?? "auto"}; objectId=${input.objectId ?? "generated"}`,
    });

    const decision = this.validator.decide(input);
    if (
      decision === "fail" ||
      !config.enabled ||
      !config.inspectionRulesEnabled ||
      !config.reportingRulesEnabled
    ) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateReports(null, input, started);
      appendExaLog({
        event: "validation_failure",
        details: `action=${action}; errors=${validation.errors.join("|")}`,
      });
      return this.report(action, [], validation, started);
    }

    const status = decision === "partial" ? "partial" : "passed";
    const inspection = this.inspector.inspect(input, config.auditTypes);
    const auditReport = this.builder.build(inspection, status);
    this.reports.push(auditReport);
    this.ensureRecord("active", config);

    const validation = this.validator.validateReports([auditReport], input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    appendExaLog({
      event: "produce_audit_report",
      details: `auditId=${auditReport.auditId}; status=${auditReport.auditStatus}; violations=${auditReport.violations.length}; correctionsExecuted=false`,
    });
    this.metadata.generate(this.reports.length, this.violationCount());
    return this.report(action, [auditReport], validation, started);
  }

  private violationCount() {
    return this.reports.reduce((sum, r) => sum + r.violations.length, 0);
  }

  private ensureRecord(state: OperationalState, config: ExecutiveAuditEngineConfiguration) {
    const latest = this.reports[this.reports.length - 1]?.validationStatus ?? "pending";
    const mapped =
      latest === "passed" ? "passed" : latest === "partial" ? "partial" : latest === "failed" ? "failed" : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `exa-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EXECUTIVE_AUDIT_ENGINE_ID,
      engineVersion: "PILLOW-EXA-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...EXA_CAPABILITIES],
      totalAudits: this.reports.length,
      violationCount: this.violationCount(),
      metadataVersion: EXA_METADATA_VERSION,
    };
  }

  private report(
    action: ExecutiveAuditRunReport["action"],
    reports: AuditReport[],
    validation: ExecutiveAuditRunReport["validation"],
    started: number,
  ): ExecutiveAuditRunReport {
    return {
      auditRunReportId: `exa-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      reports: reports.map((r) => this.clone(r)),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: EXA_METADATA_VERSION,
    };
  }

  private clone(report: AuditReport): AuditReport {
    return {
      ...report,
      findings: [...report.findings],
      violations: [...report.violations],
      recommendations: [...report.recommendations],
      correctiveActions: [...report.correctiveActions],
      evidence: [...report.evidence],
    };
  }
}
