import type { DigitalProductsCertificationConfiguration } from "./configuration.js";
import { CertificationStore } from "./certification-store.js";
import {
  CertificationValidator,
  DigitalProductsCertificationMetadataGenerator,
  HealthMonitor,
  RecoveryManager,
} from "./certification-validator.js";
import { DigitalProductsCertifier } from "./factory-certifier.js";
import { IntegrationCoordinator } from "./integrations.js";
import { appendDpcLog, getDpcLogs } from "./dpc-logging.js";
import {
  DPC_CAPABILITIES,
  DPC_METADATA_VERSION,
  DIGITAL_PRODUCTS_CERTIFICATION_ID,
} from "./paths.js";
import type {
  CertificationStatus,
  DigitalProductsCertificationEngineRecord,
  DigitalProductsCertificationInput,
  DigitalProductsCertificationReport,
  DigitalProductsCertificationRunReport,
  OperationalState,
} from "./types.js";

export class DigitalProductsCertificationCore {
  private engineRecord: DigitalProductsCertificationEngineRecord | null = null;
  private seeded = false;
  private repositoryRoot?: string;
  private readonly store = new CertificationStore();
  private readonly certifier = new DigitalProductsCertifier();
  private readonly validator = new CertificationValidator();
  private readonly metadata = new DigitalProductsCertificationMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: Parameters<IntegrationCoordinator["bindIntegrations"]>[0]) {
    this.integrations.bindIntegrations(deps);
  }

  ensureSeeded(config: DigitalProductsCertificationConfiguration) {
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
    return getDpcLogs(limit);
  }

  connect(
    _input: Record<string, unknown>,
    config: DigitalProductsCertificationConfiguration,
  ): DigitalProductsCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendDpcLog({
      event: "connect",
      details: "Digital Products Certification connected; acceptance-gate mode",
    });
    return this.report(
      "connect",
      [],
      null,
      false,
      false,
      [],
      {
        validationReportId: `dpc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Digital Products Certification is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: DPC_METADATA_VERSION,
      },
      started,
    );
  }

  certifyFactory(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    return this.runCertify("certify_factory", input, config);
  }

  verifyWorkerRegistration(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    return this.runCertify("verify_worker_registration", input, config);
  }

  verifyWorkerInvocation(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    return this.runCertify("verify_worker_invocation", input, config);
  }

  verifyWorkerDependencies(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    return this.runCertify("verify_worker_dependencies", input, config);
  }

  verifyEndToEndWorkflow(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    return this.runCertify("verify_end_to_end_workflow", input, config);
  }

  verifyReportGeneration(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    return this.runCertify("verify_report_generation", input, config);
  }

  verifyExecutiveReportingIntegration(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    return this.runCertify("verify_executive_reporting", input, config);
  }

  verifyGovernanceCompliance(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    if (!config.governanceRulesEnabled) {
      return this.disabled("verify_governance", config, "Governance rules are disabled");
    }
    return this.runCertify("verify_governance", input, config);
  }

  verifyFailureHandlingAndRecovery(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    return this.runCertify("verify_failure_recovery", input, config);
  }

  verifyAuditTrailCompleteness(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    return this.runCertify("verify_audit_trail", input, config);
  }

  assessReadiness(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    if (!config.readinessRulesEnabled) {
      return this.disabled("assess_readiness", config, "Readiness rules are disabled");
    }
    return this.runCertify("assess_readiness", input, config);
  }

  produceReport(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    return this.runCertify("produce_report", input, config);
  }

  submitReport(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    const reports = this.store.list();
    const latest = reports[reports.length - 1];
    if (!latest) {
      const certifyResult = this.runCertify("submit_report", input, config);
      return certifyResult;
    }
    const submitResult = this.integrations.submitReport(reports);
    if (submitResult.submitted && submitResult.executiveReportId) {
      const updated = this.store.save({
        ...latest,
        submittedToExecutiveReporting: true,
        executiveReportId: submitResult.executiveReportId,
      });
      const validation = this.validator.finalize(
        submitResult.submitted ? "pass" : "partial",
        [],
        submitResult.submitted ? [] : [submitResult.details],
        started,
      );
      return this.report(
        "submit_report",
        [updated],
        updated.certificationStatus,
        updated.q5ProductionReady,
        false,
        updated.outstandingIssues
          .filter((i) => i.status === "Failed")
          .map((i) => i.issueId),
        validation,
        started,
        submitResult,
      );
    }
    const validation = this.validator.finalize(
      "partial",
      [],
      [submitResult.details],
      started,
    );
    return this.report(
      "submit_report",
      reports,
      latest.certificationStatus,
      latest.q5ProductionReady,
      false,
      [],
      validation,
      started,
      submitResult,
    );
  }

  list(config: DigitalProductsCertificationConfiguration) {
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
      latest?.certificationStatus ?? null,
      latest?.q5ProductionReady ?? false,
      false,
      latest?.outstandingIssues.filter((i) => i.status === "Failed").map((i) => i.issueId) ?? [],
      validation,
      started,
    );
  }

  validate(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
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
            ["No digital products certification reports yet"],
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
      latest?.certificationStatus ?? null,
      latest?.q5ProductionReady ?? false,
      false,
      latest?.outstandingIssues.filter((i) => i.status === "Failed").map((i) => i.issueId) ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: DigitalProductsCertificationConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Digital Products Certification is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendDpcLog({
      event: "diagnostics",
      details: `reports=${this.store.count()} certified=${this.store.countByStatus("Certified")} failed=${this.store.failedCount()}`,
    });
    const latest = this.getLatestReport();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.certificationStatus ?? null,
      latest?.q5ProductionReady ?? false,
      false,
      latest?.outstandingIssues.filter((i) => i.status === "Failed").map((i) => i.issueId) ?? [],
      validation,
      started,
    );
  }

  private runCertify(
    action: DigitalProductsCertificationRunReport["action"],
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
  ): DigitalProductsCertificationRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.certificationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Digital Products Certification is disabled"
          : "Certification rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateReports(null, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], null, false, false, [], validation, started);
    }

    const evaluation = this.certifier.evaluate(input, config, this.repositoryRoot);
    const certificationReport = this.store.buildReport({
      input,
      evaluation,
      validationStatus:
        evaluation.certificationStatus === "Certified"
          ? "passed"
          : evaluation.certificationStatus === "Failed"
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
      certificationReport.certificationStatus,
      certificationReport.q5ProductionReady,
    );
    appendDpcLog({
      event: action,
      details: `id=${certificationReport.certificationId} status=${certificationReport.certificationStatus} ready=${certificationReport.q5ProductionReady}`,
    });
    this.metadata.generate(
      this.store.count(),
      this.store.countByStatus("Certified") +
        this.store.countByStatus("Conditionally Certified"),
    );
    return this.report(
      action,
      [certificationReport],
      certificationReport.certificationStatus,
      certificationReport.q5ProductionReady,
      false,
      evaluation.componentsFailed,
      validation,
      started,
    );
  }

  private disabled(
    action: DigitalProductsCertificationRunReport["action"],
    config: DigitalProductsCertificationConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, false, false, [], validation, started);
  }

  private hasBoundary(input: DigitalProductsCertificationInput) {
    return (
      input.automaticallyFixFailures === true ||
      input.automaticallyCertifyIncompleteWork === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.beginQ6Implementation === true ||
      input.assumeImplementation === true ||
      input.implementQ601OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: DigitalProductsCertificationConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastCertificationStatus: CertificationStatus | string | null = null,
    q5ProductionReady = false,
  ) {
    const latest = this.getLatestReport();
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `dpc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: DIGITAL_PRODUCTS_CERTIFICATION_ID,
      engineVersion: "PILLOW-DPC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...DPC_CAPABILITIES],
      totalCertificationReports: this.store.count(),
      certifiedCount:
        this.store.countByStatus("Certified") +
        this.store.countByStatus("Conditionally Certified"),
      failedCount: this.store.failedCount(),
      lastCertificationStatus: lastCertificationStatus ?? latest?.certificationStatus ?? null,
      q5ProductionReady: q5ProductionReady || latest?.q5ProductionReady || false,
      q6ReadinessConfirmed: false,
      metadataVersion: DPC_METADATA_VERSION,
    };
  }

  private report(
    action: DigitalProductsCertificationRunReport["action"],
    reports: DigitalProductsCertificationReport[],
    certificationStatus: CertificationStatus | string | null,
    q5ProductionReady: boolean,
    q6ReadinessConfirmed: boolean,
    componentsFailed: string[],
    validation: DigitalProductsCertificationRunReport["validation"],
    started: number,
    submitResult?: DigitalProductsCertificationRunReport["submitResult"],
  ): DigitalProductsCertificationRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      certificationRunReportId: `dpc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      reports,
      certificationStatus,
      q5ProductionReady,
      q6ReadinessConfirmed: false,
      componentsFailed: [...componentsFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: DPC_METADATA_VERSION,
      submitResult: submitResult ?? null,
    };
  }
}
