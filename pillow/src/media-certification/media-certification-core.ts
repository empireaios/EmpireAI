import type { MediaCertificationConfiguration } from "./configuration.js";
import { CertificationStore } from "./certification-store.js";
import {
  CertificationValidator,
  MediaCertificationMetadataGenerator,
  HealthMonitor,
  RecoveryManager,
} from "./certification-validator.js";
import { MediaCertifier } from "./factory-certifier.js";
import { appendMdcLog, getMdcLogs } from "./mdc-logging.js";
import {
  MDC_CAPABILITIES,
  MDC_METADATA_VERSION,
  MEDIA_CERTIFICATION_ID,
} from "./paths.js";
import type {
  CertificationLevel,
  MediaCertificationEngineRecord,
  MediaCertificationInput,
  MediaCertificationReport,
  MediaCertificationRunReport,
  OperationalState,
} from "./types.js";

export class MediaCertificationCore {
  private engineRecord: MediaCertificationEngineRecord | null = null;
  private seeded = false;
  private readonly store = new CertificationStore();
  private readonly certifier = new MediaCertifier();
  private readonly validator = new CertificationValidator();
  private readonly metadata = new MediaCertificationMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: MediaCertificationConfiguration) {
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
    return getMdcLogs(limit);
  }

  connect(
    _input: Record<string, unknown>,
    config: MediaCertificationConfiguration,
  ): MediaCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendMdcLog({
      event: "connect",
      details: "Media Certification connected; acceptance-gate mode",
    });
    return this.report(
      "connect",
      [],
      null,
      false,
      false,
      [],
      {
        validationReportId: `mdc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Media Certification is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: MDC_METADATA_VERSION,
      },
      started,
    );
  }

  certifyFactory(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
  ) {
    return this.runCertify("certify_factory", input, config);
  }

  verifyComponent(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
  ) {
    if (!config.componentRulesEnabled) {
      return this.disabled("verify_component", config, "Component rules are disabled");
    }
    return this.runCertify("verify_component", input, config);
  }

  verifyIntegration(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
  ) {
    if (!config.integrationRulesEnabled) {
      return this.disabled("verify_integration", config, "Integration rules are disabled");
    }
    return this.runCertify("verify_integration", input, config);
  }

  verifyGovernance(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
  ) {
    if (!config.governanceRulesEnabled) {
      return this.disabled("verify_governance", config, "Governance rules are disabled");
    }
    return this.runCertify("verify_governance", input, config);
  }

  verifyTraceability(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
  ) {
    return this.runCertify("verify_traceability", input, config);
  }

  verifyAutonomousOperation(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
  ) {
    return this.runCertify("verify_autonomous_operation", input, config);
  }

  assessReadiness(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
  ) {
    if (!config.readinessRulesEnabled) {
      return this.disabled("assess_readiness", config, "Readiness rules are disabled");
    }
    return this.runCertify("assess_readiness", input, config);
  }

  produceReport(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
  ) {
    return this.runCertify("produce_report", input, config);
  }

  list(config: MediaCertificationConfiguration) {
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
      latest?.q4ProductionReady ?? false,
      latest?.q5ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  validate(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
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
            ["No media certification reports yet"],
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
      latest?.q4ProductionReady ?? false,
      latest?.q5ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: MediaCertificationConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Media Certification is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendMdcLog({
      event: "diagnostics",
      details: `reports=${this.store.count()} certified=${this.store.countByResult("certified")} failed=${this.store.failedCount()}`,
    });
    const latest = this.getLatestReport();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.finalCertificationResult ?? null,
      latest?.q4ProductionReady ?? false,
      latest?.q5ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  private runCertify(
    action: MediaCertificationRunReport["action"],
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
  ): MediaCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.certificationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Media Certification is disabled"
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
      certificationReport.q4ProductionReady,
      certificationReport.q5ReadinessConfirmed,
    );
    appendMdcLog({
      event: action,
      details: `id=${certificationReport.certificationId} result=${certificationReport.finalCertificationResult} ready=${certificationReport.q4ProductionReady}`,
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
      certificationReport.q4ProductionReady,
      certificationReport.q5ReadinessConfirmed,
      certificationReport.componentsFailed,
      validation,
      started,
    );
  }

  private disabled(
    action: MediaCertificationRunReport["action"],
    config: MediaCertificationConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, false, false, [], validation, started);
  }

  private hasBoundary(input: MediaCertificationInput) {
    return (
      input.publishMedia === true ||
      input.modifyMediaFactoryComponents === true ||
      input.repairFailuresAutomatically === true ||
      input.beginQ5Implementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: MediaCertificationConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastFinalResult: CertificationLevel | string | null = null,
    q4ProductionReady = false,
    q5ReadinessConfirmed = false,
  ) {
    const latest = this.getLatestReport();
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `mdc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MEDIA_CERTIFICATION_ID,
      engineVersion: "PILLOW-MDC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...MDC_CAPABILITIES],
      totalCertificationReports: this.store.count(),
      certifiedCount:
        this.store.countByResult("certified") +
        this.store.countByResult("certified_with_warnings"),
      failedCount: this.store.failedCount(),
      lastFinalResult: lastFinalResult ?? latest?.finalCertificationResult ?? null,
      q4ProductionReady: q4ProductionReady || latest?.q4ProductionReady || false,
      q5ReadinessConfirmed: q5ReadinessConfirmed || latest?.q5ReadinessConfirmed || false,
      metadataVersion: MDC_METADATA_VERSION,
    };
  }

  private report(
    action: MediaCertificationRunReport["action"],
    reports: MediaCertificationReport[],
    finalCertificationResult: CertificationLevel | string | null,
    q4ProductionReady: boolean,
    q5ReadinessConfirmed: boolean,
    componentsFailed: string[],
    validation: MediaCertificationRunReport["validation"],
    started: number,
  ): MediaCertificationRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      certificationRunReportId: `mdc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      reports,
      finalCertificationResult,
      q4ProductionReady,
      q5ReadinessConfirmed,
      componentsFailed: [...componentsFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: MDC_METADATA_VERSION,
    };
  }
}
