import type { CommerceCertificationConfiguration } from "./configuration.js";
import { CertificationStore } from "./certification-store.js";
import {
  CertificationValidator,
  CommerceCertificationMetadataGenerator,
  HealthMonitor,
  RecoveryManager,
} from "./certification-validator.js";
import { CommerceCertifier } from "./factory-certifier.js";
import { appendCmcLog, getCmcLogs } from "./cmc-logging.js";
import {
  CMC_CAPABILITIES,
  CMC_METADATA_VERSION,
  COMMERCE_CERTIFICATION_ID,
} from "./paths.js";
import type {
  CertificationLevel,
  CommerceCertificationEngineRecord,
  CommerceCertificationInput,
  CommerceCertificationReport,
  CommerceCertificationRunReport,
  OperationalState,
} from "./types.js";

export class CommerceCertificationCore {
  private engineRecord: CommerceCertificationEngineRecord | null = null;
  private seeded = false;
  private readonly store = new CertificationStore();
  private readonly certifier = new CommerceCertifier();
  private readonly validator = new CertificationValidator();
  private readonly metadata = new CommerceCertificationMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: CommerceCertificationConfiguration) {
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

  getReports() {
    return this.store.list();
  }

  getLatestReport() {
    const reports = this.getReports();
    return reports[reports.length - 1] ?? null;
  }

  getAuditTrail(limit = 50) {
    return getCmcLogs(limit);
  }

  connect(
    _input: Record<string, unknown>,
    config: CommerceCertificationConfiguration,
  ): CommerceCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendCmcLog({
      event: "connect",
      details: "Commerce Certification connected; acceptance-gate mode",
    });
    return this.report(
      "connect",
      [],
      null,
      false,
      false,
      [],
      {
        validationReportId: `cmc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Commerce Certification is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CMC_METADATA_VERSION,
      },
      started,
    );
  }

  certifyFactory(
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
  ) {
    return this.runCertify("certify_factory", input, config);
  }

  verifyComponent(
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
  ) {
    if (!config.componentRulesEnabled) {
      return this.disabled("verify_component", config, "Component rules are disabled");
    }
    return this.runCertify("verify_component", input, config);
  }

  verifyIntegration(
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
  ) {
    if (!config.integrationRulesEnabled) {
      return this.disabled("verify_integration", config, "Integration rules are disabled");
    }
    return this.runCertify("verify_integration", input, config);
  }

  verifyGovernance(
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
  ) {
    if (!config.governanceRulesEnabled) {
      return this.disabled("verify_governance", config, "Governance rules are disabled");
    }
    return this.runCertify("verify_governance", input, config);
  }

  verifyTraceability(
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
  ) {
    return this.runCertify("verify_traceability", input, config);
  }

  assessReadiness(
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
  ) {
    if (!config.readinessRulesEnabled) {
      return this.disabled("assess_readiness", config, "Readiness rules are disabled");
    }
    return this.runCertify("assess_readiness", input, config);
  }

  produceReport(
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
  ) {
    return this.runCertify("produce_report", input, config);
  }

  list(config: CommerceCertificationConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation =
      reports.length === 0
        ? this.validator.finalize("pass", [], ["Certification catalog is empty"], started)
        : this.validator.validateReports(reports, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      reports,
      latest?.finalCertificationResult ?? null,
      latest?.q3ProductionReady ?? false,
      latest?.q4ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  validate(
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation =
      reports.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.finalize(
            "pass",
            [],
            ["No commerce certification reports yet"],
            started,
          )
        : this.validator.validateReports(
            reports.length ? reports : null,
            { ...input, validated: input.validated ?? true },
            started,
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      reports,
      latest?.finalCertificationResult ?? null,
      latest?.q3ProductionReady ?? false,
      latest?.q4ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: CommerceCertificationConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Commerce Certification is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendCmcLog({
      event: "diagnostics",
      details: `reports=${this.store.count()} certified=${this.store.countByResult("certified")} failed=${this.store.failedCount()}`,
    });
    const latest = this.getLatestReport();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.finalCertificationResult ?? null,
      latest?.q3ProductionReady ?? false,
      latest?.q4ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  private runCertify(
    action: CommerceCertificationRunReport["action"],
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
  ): CommerceCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.certificationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Commerce Certification is disabled"
          : "Certification rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateReports(null, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], null, false, false, [], validation, started);
    }

    const evaluation = this.certifier.evaluate(input, config);
    const certificationReport = this.store.buildReport({
      input,
      evaluation,
      validationStatus:
        evaluation.finalCertificationResult === "certified"
          ? "passed"
          : evaluation.finalCertificationResult === "failed_certification"
            ? "failed"
            : "partial",
    });

    const validation = this.validator.validateReports(
      [certificationReport],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      certificationReport.finalCertificationResult,
      certificationReport.q3ProductionReady,
      certificationReport.q4ReadinessConfirmed,
    );
    appendCmcLog({
      event: action,
      details: `id=${certificationReport.certificationId} result=${certificationReport.finalCertificationResult} ready=${certificationReport.q3ProductionReady}`,
    });
    this.metadata.generate(
      this.store.count(),
      this.store.countByResult("certified") +
        this.store.countByResult("certified_with_warnings"),
    );
    return this.report(
      action,
      [certificationReport],
      certificationReport.finalCertificationResult,
      certificationReport.q3ProductionReady,
      certificationReport.q4ReadinessConfirmed,
      certificationReport.componentsFailed,
      validation,
      started,
    );
  }

  private disabled(
    action: CommerceCertificationRunReport["action"],
    config: CommerceCertificationConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, false, false, [], validation, started);
  }

  private hasBoundary(input: CommerceCertificationInput) {
    return (
      input.operateLiveCommerceBusiness === true ||
      input.modifyCommerceFactoryComponents === true ||
      input.repairFailuresAutomatically === true ||
      input.beginQ4Implementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: CommerceCertificationConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastFinalResult: CertificationLevel | string | null = null,
    q3ProductionReady = false,
    q4ReadinessConfirmed = false,
  ) {
    const latest = this.getLatestReport();
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `cmc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: COMMERCE_CERTIFICATION_ID,
      engineVersion: "PILLOW-CMC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...CMC_CAPABILITIES],
      totalCertificationReports: this.store.count(),
      certifiedCount:
        this.store.countByResult("certified") +
        this.store.countByResult("certified_with_warnings"),
      failedCount: this.store.failedCount(),
      lastFinalResult: lastFinalResult ?? latest?.finalCertificationResult ?? null,
      q3ProductionReady: q3ProductionReady || latest?.q3ProductionReady || false,
      q4ReadinessConfirmed: q4ReadinessConfirmed || latest?.q4ReadinessConfirmed || false,
      metadataVersion: CMC_METADATA_VERSION,
    };
  }

  private report(
    action: CommerceCertificationRunReport["action"],
    reports: CommerceCertificationReport[],
    finalCertificationResult: CertificationLevel | string | null,
    q3ProductionReady: boolean,
    q4ReadinessConfirmed: boolean,
    componentsFailed: string[],
    validation: CommerceCertificationRunReport["validation"],
    started: number,
  ): CommerceCertificationRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      certificationRunReportId: `cmc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      reports,
      finalCertificationResult,
      q3ProductionReady,
      q4ReadinessConfirmed,
      componentsFailed: [...componentsFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: CMC_METADATA_VERSION,
    };
  }
}
