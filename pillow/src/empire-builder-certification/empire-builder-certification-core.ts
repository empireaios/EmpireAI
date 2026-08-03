import type { EmpireBuilderCertificationConfiguration } from "./configuration.js";
import { CertificationStore } from "./certification-store.js";
import {
  CertificationValidator,
  EmpireBuilderCertificationMetadataGenerator,
  HealthMonitor,
  RecoveryManager,
} from "./certification-validator.js";
import { EmpireBuilderCertifier } from "./factory-certifier.js";
import { appendEbcLog } from "./ebc-logging.js";
import {
  EBC_CAPABILITIES,
  EBC_METADATA_VERSION,
  EMPIRE_BUILDER_CERTIFICATION_ID,
} from "./paths.js";
import type {
  CertificationLevel,
  EmpireBuilderCertificationEngineRecord,
  EmpireBuilderCertificationInput,
  EmpireBuilderCertificationReport,
  EmpireBuilderCertificationRunReport,
  OperationalState,
} from "./types.js";

export class EmpireBuilderCertificationCore {
  private engineRecord: EmpireBuilderCertificationEngineRecord | null = null;
  private seeded = false;
  private readonly store = new CertificationStore();
  private readonly certifier = new EmpireBuilderCertifier();
  private readonly validator = new CertificationValidator();
  private readonly metadata = new EmpireBuilderCertificationMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: EmpireBuilderCertificationConfiguration) {
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
    config: EmpireBuilderCertificationConfiguration,
  ): EmpireBuilderCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendEbcLog({
      event: "connect",
      details: "Empire Builder Certification connected; acceptance-gate mode",
    });
    return this.report(
      "connect",
      [],
      null,
      false,
      false,
      [],
      {
        validationReportId: `ebc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Empire Builder Certification is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EBC_METADATA_VERSION,
      },
      started,
    );
  }

  certifyFactory(
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
  ) {
    return this.runCertify("certify_factory", input, config);
  }

  verifyComponent(
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
  ) {
    if (!config.componentRulesEnabled) {
      return this.disabled("verify_component", config, "Component rules are disabled");
    }
    return this.runCertify("verify_component", input, config);
  }

  verifyIntegration(
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
  ) {
    if (!config.integrationRulesEnabled) {
      return this.disabled("verify_integration", config, "Integration rules are disabled");
    }
    return this.runCertify("verify_integration", input, config);
  }

  verifyGovernance(
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
  ) {
    if (!config.governanceRulesEnabled) {
      return this.disabled("verify_governance", config, "Governance rules are disabled");
    }
    return this.runCertify("verify_governance", input, config);
  }

  verifyTraceability(
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
  ) {
    return this.runCertify("verify_traceability", input, config);
  }

  assessReadiness(
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
  ) {
    if (!config.readinessRulesEnabled) {
      return this.disabled("assess_readiness", config, "Readiness rules are disabled");
    }
    return this.runCertify("assess_readiness", input, config);
  }

  produceReport(
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
  ) {
    return this.runCertify("produce_report", input, config);
  }

  list(config: EmpireBuilderCertificationConfiguration) {
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
      latest?.q2ProductionReady ?? false,
      latest?.q3ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  validate(
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
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
            ["No empire builder certification reports yet"],
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
      latest?.q2ProductionReady ?? false,
      latest?.q3ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: EmpireBuilderCertificationConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Empire Builder Certification is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendEbcLog({
      event: "diagnostics",
      details: `reports=${this.store.count()} certified=${this.store.countByResult("certified")} failed=${this.store.failedCount()}`,
    });
    const latest = this.getLatestReport();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.finalCertificationResult ?? null,
      latest?.q2ProductionReady ?? false,
      latest?.q3ReadinessConfirmed ?? false,
      latest?.componentsFailed ?? [],
      validation,
      started,
    );
  }

  private runCertify(
    action: EmpireBuilderCertificationRunReport["action"],
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
  ): EmpireBuilderCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.certificationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Empire Builder Certification is disabled"
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
      certificationReport.q2ProductionReady,
      certificationReport.q3ReadinessConfirmed,
    );
    appendEbcLog({
      event: action,
      details: `id=${certificationReport.certificationId} result=${certificationReport.finalCertificationResult} ready=${certificationReport.q2ProductionReady}`,
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
      certificationReport.q2ProductionReady,
      certificationReport.q3ReadinessConfirmed,
      certificationReport.componentsFailed,
      validation,
      started,
    );
  }

  private disabled(
    action: EmpireBuilderCertificationRunReport["action"],
    config: EmpireBuilderCertificationConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, false, false, [], validation, started);
  }

  private hasBoundary(input: EmpireBuilderCertificationInput) {
    return (
      input.executeBusinessImplementation === true ||
      input.modifyFactoryComponents === true ||
      input.repairFailuresAutomatically === true ||
      input.beginQ3Implementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: EmpireBuilderCertificationConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastFinalResult: CertificationLevel | string | null = null,
    q2ProductionReady = false,
    q3ReadinessConfirmed = false,
  ) {
    const latest = this.getLatestReport();
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `ebc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EMPIRE_BUILDER_CERTIFICATION_ID,
      engineVersion: "PILLOW-EBC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...EBC_CAPABILITIES],
      totalCertificationReports: this.store.count(),
      certifiedCount:
        this.store.countByResult("certified") +
        this.store.countByResult("certified_with_warnings"),
      failedCount: this.store.failedCount(),
      lastFinalResult: lastFinalResult ?? latest?.finalCertificationResult ?? null,
      q2ProductionReady: q2ProductionReady || latest?.q2ProductionReady || false,
      q3ReadinessConfirmed: q3ReadinessConfirmed || latest?.q3ReadinessConfirmed || false,
      metadataVersion: EBC_METADATA_VERSION,
    };
  }

  private report(
    action: EmpireBuilderCertificationRunReport["action"],
    reports: EmpireBuilderCertificationReport[],
    finalCertificationResult: CertificationLevel | string | null,
    q2ProductionReady: boolean,
    q3ReadinessConfirmed: boolean,
    componentsFailed: string[],
    validation: EmpireBuilderCertificationRunReport["validation"],
    started: number,
  ): EmpireBuilderCertificationRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      certificationRunReportId: `ebc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      reports,
      finalCertificationResult,
      q2ProductionReady,
      q3ReadinessConfirmed,
      componentsFailed: [...componentsFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: EBC_METADATA_VERSION,
    };
  }
}
