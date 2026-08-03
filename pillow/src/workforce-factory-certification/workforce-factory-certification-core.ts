import type { WorkforceFactoryCertificationConfiguration } from "./configuration.js";
import { CertificationStore } from "./certification-store.js";
import {
  CertificationValidator,
  HealthMonitor,
  RecoveryManager,
  WorkforceFactoryCertificationMetadataGenerator,
} from "./certification-validator.js";
import { WorkforceFactoryCertifier } from "./factory-certifier.js";
import { appendWfcLog } from "./wfc-logging.js";
import {
  WFC_CAPABILITIES,
  WFC_METADATA_VERSION,
  WORKFORCE_FACTORY_CERTIFICATION_ID,
} from "./paths.js";
import type {
  CertificationLevel,
  OperationalState,
  WorkforceFactoryCertificationEngineRecord,
  WorkforceFactoryCertificationInput,
  WorkforceFactoryCertificationReport,
  WorkforceFactoryCertificationRunReport,
} from "./types.js";

export class WorkforceFactoryCertificationCore {
  private engineRecord: WorkforceFactoryCertificationEngineRecord | null = null;
  private seeded = false;
  private readonly store = new CertificationStore();
  private readonly certifier = new WorkforceFactoryCertifier();
  private readonly validator = new CertificationValidator();
  private readonly metadata = new WorkforceFactoryCertificationMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkforceFactoryCertificationConfiguration) {
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
    config: WorkforceFactoryCertificationConfiguration,
  ): WorkforceFactoryCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWfcLog({
      event: "connect",
      details: "Workforce Factory Certification connected; acceptance-gate mode",
    });
    return this.report(
      "connect",
      [],
      null,
      false,
      false,
      [],
      {
        validationReportId: `wfc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Workforce Factory Certification is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WFC_METADATA_VERSION,
      },
      started,
    );
  }

  certifyFactory(
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
  ) {
    return this.runCertify("certify_factory", input, config);
  }

  verifyComponent(
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
  ) {
    if (!config.componentRulesEnabled) {
      return this.disabled("verify_component", config, "Component rules are disabled");
    }
    return this.runCertify("verify_component", input, config);
  }

  verifyIntegration(
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
  ) {
    if (!config.integrationRulesEnabled) {
      return this.disabled("verify_integration", config, "Integration rules are disabled");
    }
    return this.runCertify("verify_integration", input, config);
  }

  verifyGovernance(
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
  ) {
    if (!config.governanceRulesEnabled) {
      return this.disabled("verify_governance", config, "Governance rules are disabled");
    }
    return this.runCertify("verify_governance", input, config);
  }

  assessReadiness(
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
  ) {
    if (!config.readinessRulesEnabled) {
      return this.disabled("assess_readiness", config, "Readiness rules are disabled");
    }
    return this.runCertify("assess_readiness", input, config);
  }

  produceReport(
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
  ) {
    return this.runCertify("produce_report", input, config);
  }

  list(config: WorkforceFactoryCertificationConfiguration) {
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
      latest?.q1ProductionReady ?? false,
      latest?.q2ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  validate(
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation =
      reports.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.finalize("pass", [], ["No workforce factory certification reports yet"], started)
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
      latest?.q1ProductionReady ?? false,
      latest?.q2ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: WorkforceFactoryCertificationConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Workforce Factory Certification is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWfcLog({
      event: "diagnostics",
      details: `reports=${this.store.count()} certified=${this.store.countByResult("certified")} failed=${this.store.failedCount()}`,
    });
    const latest = this.getLatestReport();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.finalCertificationResult ?? null,
      latest?.q1ProductionReady ?? false,
      latest?.q2ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  private runCertify(
    action: WorkforceFactoryCertificationRunReport["action"],
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
  ): WorkforceFactoryCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.certificationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Workforce Factory Certification is disabled"
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
      certificationReport.q1ProductionReady,
      certificationReport.q2ReadinessConfirmed,
    );
    appendWfcLog({
      event: action,
      details: `id=${certificationReport.certificationId} result=${certificationReport.finalCertificationResult} ready=${certificationReport.q1ProductionReady}`,
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
      certificationReport.q1ProductionReady,
      certificationReport.q2ReadinessConfirmed,
      certificationReport.componentsFailed,
      validation,
      started,
    );
  }

  private disabled(
    action: WorkforceFactoryCertificationRunReport["action"],
    config: WorkforceFactoryCertificationConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, false, false, [], validation, started);
  }

  private hasBoundary(input: WorkforceFactoryCertificationInput) {
    return (
      input.executeWorkerTasks === true ||
      input.modifyWorkforceComponents === true ||
      input.repairFailuresAutomatically === true ||
      input.beginQ2Implementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkforceFactoryCertificationConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastFinalResult: CertificationLevel | string | null = null,
    q1ProductionReady = false,
    q2ReadinessConfirmed = false,
  ) {
    const latest = this.getLatestReport();
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wfc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKFORCE_FACTORY_CERTIFICATION_ID,
      engineVersion: "PILLOW-WFC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WFC_CAPABILITIES],
      totalCertificationReports: this.store.count(),
      certifiedCount:
        this.store.countByResult("certified") +
        this.store.countByResult("certified_with_warnings"),
      failedCount: this.store.failedCount(),
      lastFinalResult: lastFinalResult ?? latest?.finalCertificationResult ?? null,
      q1ProductionReady: q1ProductionReady || latest?.q1ProductionReady || false,
      q2ReadinessConfirmed: q2ReadinessConfirmed || latest?.q2ReadinessConfirmed || false,
      metadataVersion: WFC_METADATA_VERSION,
    };
  }

  private report(
    action: WorkforceFactoryCertificationRunReport["action"],
    reports: WorkforceFactoryCertificationReport[],
    finalCertificationResult: CertificationLevel | string | null,
    q1ProductionReady: boolean,
    q2ReadinessConfirmed: boolean,
    componentsFailed: string[],
    validation: WorkforceFactoryCertificationRunReport["validation"],
    started: number,
  ): WorkforceFactoryCertificationRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      certificationRunReportId: `wfc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      reports,
      finalCertificationResult,
      q1ProductionReady,
      q2ReadinessConfirmed,
      componentsFailed: [...componentsFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WFC_METADATA_VERSION,
    };
  }
}
