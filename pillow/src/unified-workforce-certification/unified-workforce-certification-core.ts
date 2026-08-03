import type { UnifiedWorkforceCertificationConfiguration } from "./configuration.js";
import { CertificationStore } from "./certification-store.js";
import {
  CertificationValidator,
  HealthMonitor,
  RecoveryManager,
  UnifiedWorkforceCertificationMetadataGenerator,
} from "./certification-validator.js";
import { FactoryCertifier } from "./factory-certifier.js";
import { appendUwcLog } from "./uwc-logging.js";
import {
  UNIFIED_WORKFORCE_CERTIFICATION_ID,
  UWC_CAPABILITIES,
  UWC_METADATA_VERSION,
} from "./paths.js";
import type {
  CertificationLevel,
  OperationalState,
  UnifiedCertificationReport,
  UnifiedWorkforceCertificationEngineRecord,
  UnifiedWorkforceCertificationInput,
  UnifiedWorkforceCertificationRunReport,
} from "./types.js";

export class UnifiedWorkforceCertificationCore {
  private engineRecord: UnifiedWorkforceCertificationEngineRecord | null = null;
  private seeded = false;
  private readonly store = new CertificationStore();
  private readonly certifier = new FactoryCertifier();
  private readonly validator = new CertificationValidator();
  private readonly metadata = new UnifiedWorkforceCertificationMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: UnifiedWorkforceCertificationConfiguration) {
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

  connect(
    _input: Record<string, unknown>,
    config: UnifiedWorkforceCertificationConfiguration,
  ): UnifiedWorkforceCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendUwcLog({
      event: "connect",
      details: "Unified Workforce Certification connected; acceptance-gate mode",
    });
    return this.report(
      "connect",
      [],
      null,
      false,
      [],
      {
        validationReportId: `uwc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Unified Workforce Certification is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: UWC_METADATA_VERSION,
      },
      started,
    );
  }

  certifyFactory(
    input: UnifiedWorkforceCertificationInput,
    config: UnifiedWorkforceCertificationConfiguration,
  ) {
    return this.runCertify("certify_factory", input, config);
  }

  verifyComponent(
    input: UnifiedWorkforceCertificationInput,
    config: UnifiedWorkforceCertificationConfiguration,
  ) {
    if (!config.componentRulesEnabled) {
      return this.disabled("verify_component", config, "Component rules are disabled");
    }
    return this.runCertify("verify_component", input, config);
  }

  verifyIntegration(
    input: UnifiedWorkforceCertificationInput,
    config: UnifiedWorkforceCertificationConfiguration,
  ) {
    if (!config.integrationRulesEnabled) {
      return this.disabled("verify_integration", config, "Integration rules are disabled");
    }
    return this.runCertify("verify_integration", input, config);
  }

  assessReadiness(
    input: UnifiedWorkforceCertificationInput,
    config: UnifiedWorkforceCertificationConfiguration,
  ) {
    if (!config.readinessRulesEnabled) {
      return this.disabled("assess_readiness", config, "Readiness rules are disabled");
    }
    return this.runCertify("assess_readiness", input, config);
  }

  produceReport(
    input: UnifiedWorkforceCertificationInput,
    config: UnifiedWorkforceCertificationConfiguration,
  ) {
    return this.runCertify("produce_report", input, config);
  }

  list(config: UnifiedWorkforceCertificationConfiguration) {
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
      latest?.q0ProductionReady ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  validate(
    input: UnifiedWorkforceCertificationInput,
    config: UnifiedWorkforceCertificationConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation =
      reports.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.finalize("pass", [], ["No unified certification reports yet"], started)
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
      latest?.q0ProductionReady ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: UnifiedWorkforceCertificationConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Unified Workforce Certification is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendUwcLog({
      event: "diagnostics",
      details: `reports=${this.store.count()} certified=${this.store.countByResult("certified")} failed=${this.store.failedCount()}`,
    });
    const latest = this.getLatestReport();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.finalCertificationResult ?? null,
      latest?.q0ProductionReady ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  private runCertify(
    action: UnifiedWorkforceCertificationRunReport["action"],
    input: UnifiedWorkforceCertificationInput,
    config: UnifiedWorkforceCertificationConfiguration,
  ): UnifiedWorkforceCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.certificationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Unified Workforce Certification is disabled"
          : "Certification rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateReports(null, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], null, false, [], validation, started);
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
      certificationReport.q0ProductionReady,
    );
    appendUwcLog({
      event: action,
      details: `id=${certificationReport.certificationId} result=${certificationReport.finalCertificationResult} ready=${certificationReport.q0ProductionReady}`,
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
      certificationReport.q0ProductionReady,
      certificationReport.componentsFailed,
      validation,
      started,
    );
  }

  private disabled(
    action: UnifiedWorkforceCertificationRunReport["action"],
    config: UnifiedWorkforceCertificationConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, false, [], validation, started);
  }

  private hasBoundary(input: UnifiedWorkforceCertificationInput) {
    return (
      input.executeWorkerTasks === true ||
      input.modifyExecutiveComponents === true ||
      input.repairFailuresAutomatically === true ||
      input.beginQ1Implementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: UnifiedWorkforceCertificationConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastFinalResult: CertificationLevel | string | null = null,
    q0ProductionReady = false,
  ) {
    const latest = this.getLatestReport();
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `uwc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: UNIFIED_WORKFORCE_CERTIFICATION_ID,
      engineVersion: "PILLOW-UWC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...UWC_CAPABILITIES],
      totalCertificationReports: this.store.count(),
      certifiedCount:
        this.store.countByResult("certified") +
        this.store.countByResult("certified_with_warnings"),
      failedCount: this.store.failedCount(),
      lastFinalResult: lastFinalResult ?? latest?.finalCertificationResult ?? null,
      q0ProductionReady: q0ProductionReady || latest?.q0ProductionReady || false,
      metadataVersion: UWC_METADATA_VERSION,
    };
  }

  private report(
    action: UnifiedWorkforceCertificationRunReport["action"],
    reports: UnifiedCertificationReport[],
    finalCertificationResult: CertificationLevel | string | null,
    q0ProductionReady: boolean,
    componentsFailed: string[],
    validation: UnifiedWorkforceCertificationRunReport["validation"],
    started: number,
  ): UnifiedWorkforceCertificationRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      certificationRunReportId: `uwc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      reports,
      finalCertificationResult,
      q0ProductionReady,
      componentsFailed: [...componentsFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: UWC_METADATA_VERSION,
    };
  }
}
