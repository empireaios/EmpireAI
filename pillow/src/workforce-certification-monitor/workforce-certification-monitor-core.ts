import type { WorkforceCertificationMonitorConfiguration } from "./configuration.js";
import { CertificationStore } from "./certification-store.js";
import {
  CertificationValidator,
  HealthMonitor,
  RecoveryManager,
  WorkforceCertificationMonitorMetadataGenerator,
} from "./certification-validator.js";
import { Certifier } from "./certifier.js";
import { appendWcmLog } from "./wcm-logging.js";
import {
  WORKFORCE_CERTIFICATION_MONITOR_ID,
  WCM_CAPABILITIES,
  WCM_METADATA_VERSION,
} from "./paths.js";
import type {
  CertificationRecord,
  CertificationStatus,
  OperationalState,
  WorkforceCertificationMonitorEngineRecord,
  WorkforceCertificationMonitorInput,
  WorkforceCertificationMonitorRunReport,
} from "./types.js";

export class WorkforceCertificationMonitorCore {
  private engineRecord: WorkforceCertificationMonitorEngineRecord | null = null;
  private seeded = false;
  private lastMonitorCycleAt: string | null = null;
  private readonly store = new CertificationStore();
  private readonly certifier = new Certifier();
  private readonly validator = new CertificationValidator();
  private readonly metadata = new WorkforceCertificationMonitorMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkforceCertificationMonitorConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedCertifications);
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

  connect(
    _input: Record<string, unknown>,
    config: WorkforceCertificationMonitorConfiguration,
  ): WorkforceCertificationMonitorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWcmLog({
      event: "connect",
      details: "Workforce Certification Monitor connected; certify-only mode",
    });
    return this.report(
      "connect",
      [],
      null,
      [],
      false,
      {
        validationReportId: `wcm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Workforce Certification Monitor is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WCM_METADATA_VERSION,
      },
      started,
    );
  }

  certifyWorker(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    return this.runCertify("certify_worker", input, config, true);
  }

  monitorWorkforce(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.monitoringRulesEnabled) {
      return this.disabled(
        "monitor_workforce",
        config,
        !config.enabled
          ? "Workforce Certification Monitor is disabled"
          : "Monitoring rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, false);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("monitor_workforce", [], null, [], true, validation, started);
    }

    const cycleId = `wcm-cycle-${Date.now()}`;
    this.lastMonitorCycleAt = new Date().toISOString();
    const workers = this.resolveWorkers(input);
    const records: CertificationRecord[] = [];
    const issues: string[] = [];

    for (const worker of workers) {
      const evaluation = this.certifier.evaluate(worker, config);
      const record = this.store.buildRecord({
        input: worker,
        workerId: evaluation.workerId,
        workerName: evaluation.workerName,
        department: evaluation.department,
        certificationStatus: evaluation.certificationStatus,
        availabilityStatus: evaluation.availabilityStatus,
        capabilityStatus: evaluation.capabilityStatus,
        toolAccessStatus: evaluation.toolAccessStatus,
        governanceStatus: evaluation.governanceStatus,
        runtimeHealth: evaluation.runtimeHealth,
        qualityCompliance: evaluation.qualityCompliance,
        selfCritiqueCompliance: evaluation.selfCritiqueCompliance,
        dependencyHealth: evaluation.dependencyHealth,
        certificationIssues: evaluation.certificationIssues,
        recommendedAction: evaluation.recommendedAction,
        checksPerformed: evaluation.checksPerformed,
        checksFailed: evaluation.checksFailed,
        registered: evaluation.registered,
        reachable: evaluation.reachable,
        monitorCycleId: cycleId,
        validationStatus:
          evaluation.certificationStatus === "certified"
            ? "passed"
            : evaluation.certificationStatus === "provisionally_certified"
              ? "partial"
              : "failed",
      });
      records.push(record);
      issues.push(...record.certificationIssues);
    }

    const validation = this.validator.validateRecords(
      records.length ? records : null,
      { ...input, validated: input.validated ?? true },
      started,
      false,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      records[records.length - 1]?.certificationStatus ?? null,
    );
    appendWcmLog({
      event: "monitor_workforce",
      details: `cycle=${cycleId} workers=${records.length} failures=${issues.length}`,
    });
    this.metadata.generate(this.store.count(), this.store.countByStatus("certified"));
    return this.report(
      "monitor_workforce",
      records,
      records[records.length - 1]?.certificationStatus ?? null,
      unique(issues),
      issues.length > 0,
      validation,
      started,
    );
  }

  verifyAvailability(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    if (!config.availabilityRulesEnabled) {
      return this.disabled("verify_availability", config, "Availability rules are disabled");
    }
    return this.runCertify("verify_availability", input, config, true);
  }

  verifyReachability(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    if (!config.reachabilityRulesEnabled) {
      return this.disabled("verify_reachability", config, "Reachability rules are disabled");
    }
    return this.runCertify("verify_reachability", input, config, true);
  }

  verifyCapabilities(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    if (!config.capabilityRulesEnabled) {
      return this.disabled("verify_capabilities", config, "Capability rules are disabled");
    }
    return this.runCertify("verify_capabilities", input, config, true);
  }

  verifyToolAccess(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    if (!config.toolAccessRulesEnabled) {
      return this.disabled("verify_tool_access", config, "Tool access rules are disabled");
    }
    return this.runCertify("verify_tool_access", input, config, true);
  }

  verifyGovernance(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    if (!config.governanceRulesEnabled) {
      return this.disabled("verify_governance", config, "Governance rules are disabled");
    }
    return this.runCertify("verify_governance", input, config, true);
  }

  verifyQualityCompliance(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    if (!config.qualityRulesEnabled) {
      return this.disabled(
        "verify_quality_compliance",
        config,
        "Quality compliance rules are disabled",
      );
    }
    return this.runCertify("verify_quality_compliance", input, config, true);
  }

  verifySelfCritiqueCompliance(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    if (!config.selfCritiqueRulesEnabled) {
      return this.disabled(
        "verify_self_critique_compliance",
        config,
        "Self-critique compliance rules are disabled",
      );
    }
    return this.runCertify("verify_self_critique_compliance", input, config, true);
  }

  detectFailures(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("detect_failures", [], null, [], true, validation, started);
    }

    const failing = this.store
      .list()
      .filter(
        (r) =>
          r.certificationStatus === "decertified" ||
          r.certificationStatus === "suspended" ||
          r.certificationStatus === "offline" ||
          r.certificationIssues.length > 0,
      );
    const issues = unique(failing.flatMap((r) => r.certificationIssues));
    const validation = this.validator.finalize(
      "pass",
      [],
      failing.length ? [`${failing.length} certification failure(s) detected`] : [],
      started,
    );
    this.ensureRecord("active", config);
    appendWcmLog({
      event: "detect_failures",
      details: `failing=${failing.length} issues=${issues.length}`,
    });
    return this.report(
      "detect_failures",
      failing,
      failing[failing.length - 1]?.certificationStatus ?? null,
      issues,
      failing.length > 0,
      validation,
      started,
    );
  }

  decertifyWorker(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    return this.runCertify(
      "decertify_worker",
      {
        ...input,
        forceStatus: "decertified",
        certifiedIssues: unique([
          ...(input.certifiedIssues ?? []),
          "explicit_decertification",
        ]),
      },
      config,
      true,
    );
  }

  recertifyWorker(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    return this.runCertify(
      "recertify_worker",
      {
        ...input,
        registered: input.registered ?? true,
        available: input.available ?? true,
        reachable: input.reachable ?? true,
        capabilitiesRegistered: input.capabilitiesRegistered ?? true,
        requiredToolsAccessible: input.requiredToolsAccessible ?? true,
        governanceCompliant: input.governanceCompliant ?? true,
        qualityStandardCompliant: input.qualityStandardCompliant ?? true,
        selfCritiqueCompliant: input.selfCritiqueCompliant ?? true,
        runtimeHealthy: input.runtimeHealthy ?? true,
        dependenciesHealthy: input.dependenciesHealthy ?? true,
        executiveReady: input.executiveReady ?? true,
        forceStatus: input.forceStatus ?? "certified",
        certifiedIssues: [],
      },
      config,
      true,
    );
  }

  list(config: WorkforceCertificationMonitorConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["Certification catalog is empty"], started)
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      records,
      latest?.certificationStatus ?? null,
      latest?.certificationIssues ?? [],
      (latest?.certificationIssues.length ?? 0) > 0,
      validation,
      started,
    );
  }

  validate(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.finalize("pass", [], ["No certification records yet"], started)
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
      latest?.certificationStatus ?? null,
      latest?.certificationIssues ?? [],
      (latest?.certificationIssues.length ?? 0) > 0,
      validation,
      started,
    );
  }

  diagnostics(config: WorkforceCertificationMonitorConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Workforce Certification Monitor is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWcmLog({
      event: "diagnostics",
      details: `records=${this.store.count()} certified=${this.store.countByStatus("certified")} decertified=${this.store.countByStatus("decertified")}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.certificationStatus ?? null,
      latest?.certificationIssues ?? [],
      (latest?.certificationIssues.length ?? 0) > 0,
      validation,
      started,
    );
  }

  private runCertify(
    action: WorkforceCertificationMonitorRunReport["action"],
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
    requireWorker: boolean,
  ): WorkforceCertificationMonitorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.validationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Workforce Certification Monitor is disabled"
          : "Validation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, requireWorker);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], null, [], true, validation, started);
    }

    const evaluation = this.certifier.evaluate(input, config);
    const record = this.store.buildRecord({
      input,
      workerId: evaluation.workerId,
      workerName: evaluation.workerName,
      department: evaluation.department,
      certificationStatus: evaluation.certificationStatus,
      availabilityStatus: evaluation.availabilityStatus,
      capabilityStatus: evaluation.capabilityStatus,
      toolAccessStatus: evaluation.toolAccessStatus,
      governanceStatus: evaluation.governanceStatus,
      runtimeHealth: evaluation.runtimeHealth,
      qualityCompliance: evaluation.qualityCompliance,
      selfCritiqueCompliance: evaluation.selfCritiqueCompliance,
      dependencyHealth: evaluation.dependencyHealth,
      certificationIssues: evaluation.certificationIssues,
      recommendedAction: evaluation.recommendedAction,
      checksPerformed: evaluation.checksPerformed,
      checksFailed: evaluation.checksFailed,
      registered: evaluation.registered,
      reachable: evaluation.reachable,
      validationStatus:
        evaluation.certificationStatus === "certified"
          ? "passed"
          : evaluation.certificationStatus === "provisionally_certified"
            ? "partial"
            : "failed",
    });

    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
      requireWorker,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      record.certificationStatus,
    );
    appendWcmLog({
      event: action,
      details: `id=${record.certificationId} worker=${record.workerId} status=${record.certificationStatus}`,
    });
    this.metadata.generate(this.store.count(), this.store.countByStatus("certified"));
    return this.report(
      action,
      [record],
      record.certificationStatus,
      record.certificationIssues,
      record.certificationIssues.length > 0 ||
        record.certificationStatus === "decertified" ||
        record.certificationStatus === "suspended",
      validation,
      started,
    );
  }

  private resolveWorkers(
    input: WorkforceCertificationMonitorInput,
  ): WorkforceCertificationMonitorInput[] {
    if (input.workers?.length) return input.workers;
    if (input.workerId?.trim()) return [input];
    const latest = this.store.listLatestWorkers();
    if (latest.length) {
      return latest.map((r) => ({
        workerId: r.workerId,
        workerName: r.workerName,
        department: r.department,
        registered: r.registered,
        available: r.availabilityStatus === "available",
        reachable: r.reachable,
        capabilitiesRegistered: r.capabilityStatus === "capabilities_registered",
        requiredToolsAccessible: r.toolAccessStatus === "tools_accessible",
        governanceCompliant: r.governanceStatus === "governance_compliant",
        qualityStandardCompliant: r.qualityCompliance === "quality_compliant",
        selfCritiqueCompliant: r.selfCritiqueCompliance === "self_critique_compliant",
        runtimeHealthy: r.runtimeHealth === "healthy",
        dependenciesHealthy: r.dependencyHealth === "dependencies_healthy",
        executiveReady: r.certificationStatus === "certified",
        validated: true,
      }));
    }
    return [{ workerId: "worker-unspecified", validated: true }];
  }

  private disabled(
    action: WorkforceCertificationMonitorRunReport["action"],
    config: WorkforceCertificationMonitorConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, [], true, validation, started);
  }

  private hasBoundary(input: WorkforceCertificationMonitorInput) {
    return (
      input.executeWorkerTasks === true ||
      input.repairWorkersAutomatically === true ||
      input.replaceWorkerQualityStandard === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkforceCertificationMonitorConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastStatus: CertificationStatus | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wcm-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKFORCE_CERTIFICATION_MONITOR_ID,
      engineVersion: "PILLOW-WCM-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WCM_CAPABILITIES],
      totalCertificationRecords: this.store.count(),
      certifiedCount: this.store.countByStatus("certified"),
      decertifiedCount: this.store.countByStatus("decertified"),
      failureCount: this.store.failureCount(),
      lastMonitorCycleAt: this.lastMonitorCycleAt,
      lastStatus: lastStatus ?? this.getLatestRecord()?.certificationStatus ?? null,
      metadataVersion: WCM_METADATA_VERSION,
    };
  }

  private report(
    action: WorkforceCertificationMonitorRunReport["action"],
    records: CertificationRecord[],
    certificationStatus: CertificationStatus | string | null,
    certificationIssues: string[],
    failureDetected: boolean,
    validation: WorkforceCertificationMonitorRunReport["validation"],
    started: number,
  ): WorkforceCertificationMonitorRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      certificationRunReportId: `wcm-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      certificationStatus,
      certificationIssues: [...certificationIssues],
      failureDetected,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WCM_METADATA_VERSION,
    };
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
