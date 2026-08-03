import type { BusinessRiskWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type BusinessRiskWorkerDependencies,
} from "./integrations.js";
import { appendBrwLog } from "./brw-logging.js";
import {
  BRW_CAPABILITIES,
  BRW_METADATA_VERSION,
  BUSINESS_RISK_WORKER_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import { RiskBuilder } from "./risk-builder.js";
import { RiskStore } from "./risk-store.js";
import { HealthMonitor, RecoveryManager, RiskValidator } from "./risk-validator.js";
import type {
  BusinessRiskReport,
  BusinessRiskWorkerCatalog,
  BusinessRiskWorkerEngineRecord,
  BusinessRiskWorkerInput,
  BusinessRiskWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class RiskManager {
  private engineRecord: BusinessRiskWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: BusinessRiskWorkerCatalog | null = null;
  private readonly store = new RiskStore();
  private readonly builder = new RiskBuilder();
  private readonly validator = new RiskValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingBlueprint: BusinessRiskWorkerInput["businessBlueprint"] = null;
  private pendingLaunchPlan: BusinessRiskWorkerInput["launchPlan"] = null;

  bindIntegrations(deps: BusinessRiskWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: BusinessRiskWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.seeded = true;
    this.ensureRecord("connected", config);
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

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getReports() {
    return this.store.list();
  }

  getLatestReportId() {
    return this.store.getLatestReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: BusinessRiskWorkerConfiguration,
  ): BusinessRiskWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendBrwLog({
      event: "connect",
      details: `Business Risk Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `brw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Business Risk Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: BRW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveBlueprint(input: BusinessRiskWorkerInput, config: BusinessRiskWorkerConfiguration) {
    this.pendingBlueprint = input.businessBlueprint ?? this.pendingBlueprint;
    return this.runAssess("receive_blueprint", input, config);
  }

  receiveLaunchPlan(input: BusinessRiskWorkerInput, config: BusinessRiskWorkerConfiguration) {
    this.pendingLaunchPlan = input.launchPlan ?? this.pendingLaunchPlan;
    return this.runAssess("receive_launch_plan", input, config);
  }

  identifyRisks(input: BusinessRiskWorkerInput, config: BusinessRiskWorkerConfiguration) {
    return this.runAssess("identify_risks", input, config);
  }

  scoreRisks(input: BusinessRiskWorkerInput, config: BusinessRiskWorkerConfiguration) {
    return this.runAssess("score_risks", input, config);
  }

  recommendMitigations(input: BusinessRiskWorkerInput, config: BusinessRiskWorkerConfiguration) {
    return this.runAssess("recommend_mitigations", input, config);
  }

  produceRiskReport(input: BusinessRiskWorkerInput, config: BusinessRiskWorkerConfiguration) {
    return this.runAssess("produce_risk_report", input, config);
  }

  submitRiskReport(input: BusinessRiskWorkerInput, config: BusinessRiskWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_risk_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_risk_report",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let report =
      (input.riskReportId ? this.store.get(input.riskReportId) : null) ??
      this.store.list().at(-1) ??
      null;
    if (!report) {
      const generated = this.runAssess("produce_risk_report", input, config);
      report = generated.latestReport;
      if (!report || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitRiskReport(report);
    if (submission.submitted && submission.executiveReportId) {
      report =
        this.store.markSubmitted(report.riskReportId, submission.executiveReportId) ?? report;
    }

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateReports(
      report ? [report] : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) {
      validation.warnings.push(submission.details);
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendBrwLog({
      event: "submit_risk_report",
      details: `report=${report?.riskReportId ?? "none"} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_risk_report",
      this.getCatalog(),
      report ? [report] : [],
      report,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: BusinessRiskWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), reports, latest, validation, started);
  }

  validate(input: BusinessRiskWorkerInput, config: BusinessRiskWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("validate", this.getCatalog(), reports, latest, validation, started);
  }

  diagnostics(config: BusinessRiskWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Business Risk Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendBrwLog({ event: "diagnostics", details: `reports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runAssess(
    action: BusinessRiskWorkerRunReport["action"],
    input: BusinessRiskWorkerInput,
    config: BusinessRiskWorkerConfiguration,
  ): BusinessRiskWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.assessmentRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Business Risk Worker is disabled"
          : "Assessment rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const merged: BusinessRiskWorkerInput = {
      ...input,
      businessBlueprint: input.businessBlueprint ?? this.pendingBlueprint,
      launchPlan: input.launchPlan ?? this.pendingLaunchPlan,
    };
    if (merged.businessBlueprint) this.pendingBlueprint = merged.businessBlueprint;
    if (merged.launchPlan) this.pendingLaunchPlan = merged.launchPlan;

    if (!merged.businessBlueprint && action !== "receive_blueprint") {
      return this.disabled(
        action,
        config,
        "Business risk assessment requires an approved Business Blueprint from Q2-06",
      );
    }
    if (!merged.launchPlan && action !== "receive_blueprint" && action !== "receive_launch_plan") {
      return this.disabled(
        action,
        config,
        "Business risk assessment requires a Launch Plan from Q2-07",
      );
    }

    // Allow receive_blueprint / receive_launch_plan with only one payload; produce requires both.
    if (
      (action === "receive_blueprint" || action === "receive_launch_plan") &&
      !(merged.businessBlueprint && merged.launchPlan)
    ) {
      const partialValidation = this.validator.finalize(
        "partial",
        [],
        [
          action === "receive_blueprint"
            ? "Blueprint received; awaiting Launch Plan for full assessment"
            : "Launch Plan received; awaiting Business Blueprint for full assessment",
        ],
        started,
      );
      this.ensureRecord("active", config, "partial");
      appendBrwLog({
        event: action,
        details: "partial_inputs_pending_full_assessment",
      });
      return this.report(action, this.getCatalog(), [], null, partialValidation, started);
    }

    const report = this.builder.assess(merged, config);
    this.store.saveCanonical(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateReports(
      [report],
      { ...merged, validated: merged.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendBrwLog({
      event: action,
      details: `report=${report.riskReportId} risks=${report.risks.length} portfolio=${report.overallPortfolioRiskRating}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: BusinessRiskWorkerRunReport["action"],
    input: BusinessRiskWorkerInput,
    config: BusinessRiskWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: BusinessRiskWorkerRunReport["action"],
    config: BusinessRiskWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: BusinessRiskWorkerInput) {
    return (
      input.removeRisksAutomatically === true ||
      input.approveBusiness === true ||
      input.rejectBusiness === true ||
      input.launchBusiness === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ209OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: BusinessRiskWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: BusinessRiskReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `brw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: BUSINESS_RISK_WORKER_ID,
      engineVersion: "PILLOW-BRW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...BRW_CAPABILITIES],
      totalRiskReports: this.store.count(),
      lastBusinessType: report?.businessType ?? null,
      lastRiskReportId: report?.riskReportId ?? this.store.getLatestReportId(),
      lastPortfolioRiskRating: report?.overallPortfolioRiskRating ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: BRW_METADATA_VERSION,
    };
  }

  private report(
    action: BusinessRiskWorkerRunReport["action"],
    catalog: BusinessRiskWorkerCatalog | null,
    reports: BusinessRiskReport[],
    latestReport: BusinessRiskReport | null,
    validation: BusinessRiskWorkerRunReport["validation"],
    started: number,
  ): BusinessRiskWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      riskRunReportId: `brw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      reports,
      latestReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: BRW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: BusinessRiskWorkerCatalog): BusinessRiskWorkerCatalog {
  return {
    ...catalog,
    riskCategories: [...catalog.riskCategories],
    reports: catalog.reports.map((report) => ({
      ...report,
      risks: report.risks.map((risk) => ({
        ...risk,
        supportingEvidence: risk.supportingEvidence.map((e) => ({ ...e })),
      })),
      prioritizedRiskIds: [...report.prioritizedRiskIds],
      facts: [...report.facts],
      assumptions: [...report.assumptions],
      missingInformation: [...report.missingInformation],
      preservedDecisions: [...report.preservedDecisions],
      traceabilityRefs: [...report.traceabilityRefs],
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
