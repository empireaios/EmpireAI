import type { WorkerLifecycleConfiguration } from "./configuration.js";
import { LifecycleBuilder } from "./lifecycle-builder.js";
import { LifecycleStore } from "./lifecycle-store.js";
import {
  HealthMonitor,
  LifecycleValidator,
  RecoveryManager,
  WorkerLifecycleMetadataGenerator,
} from "./lifecycle-validator.js";
import { appendWlcLog } from "./wlc-logging.js";
import {
  LIFECYCLE_EVENTS,
  WLC_CAPABILITIES,
  WLC_METADATA_VERSION,
  WORKER_LIFECYCLE_ID,
} from "./paths.js";
import type {
  LifecycleDecision,
  LifecycleEvent,
  LifecycleRecord,
  OperationalState,
  WorkerLifecycleCatalog,
  WorkerLifecycleEngineRecord,
  WorkerLifecycleInput,
  WorkerLifecycleProfile,
  WorkerLifecycleRunReport,
} from "./types.js";

export class WorkerLifecycleCore {
  private engineRecord: WorkerLifecycleEngineRecord | null = null;
  private seeded = false;
  private catalog: WorkerLifecycleCatalog | null = null;
  private readonly store = new LifecycleStore();
  private readonly builder = new LifecycleBuilder();
  private readonly validator = new LifecycleValidator();
  private readonly metadata = new WorkerLifecycleMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkerLifecycleConfiguration) {
    if (this.seeded) return;
    this.store.seed({
      profiles: config.seedProfiles,
      records: config.seedRecords,
    });
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listProfiles(),
      this.store.listRecords(),
    );
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

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getProfiles() {
    return this.store.listProfiles();
  }

  getRecords() {
    return this.store.listRecords();
  }

  getLatestLifecycleId() {
    return this.store.getLatestLifecycleId();
  }

  connect(
    _input: Record<string, unknown>,
    config: WorkerLifecycleConfiguration,
  ): WorkerLifecycleRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWlcLog({
      event: "connect",
      details: "Worker Lifecycle connected; govern-transitions mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      this.store.listProfiles(),
      [],
      null,
      [],
      {
        validationReportId: `wlc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Worker Lifecycle is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WLC_METADATA_VERSION,
      },
      started,
    );
  }

  create(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    return this.transition("create", "create", input, config);
  }

  onboard(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    return this.transition("onboard", "onboard", input, config);
  }

  configure(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    return this.transition("configure", "configure", input, config);
  }

  activate(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    // Production activation requires certification first when still configured/onboarding.
    const profile = this.store.getProfile(input.workerId?.trim() || "");
    if (profile?.currentState === "configured") {
      const certifyInput = { ...input, lifecycleEvent: "certify" as const, approvedBy: input.approvedBy ?? "pillow" };
      const certifyReport = this.transition("activate", "certify", certifyInput, config, true);
      if (certifyReport.validation.decision === "fail") return certifyReport;
    }
    return this.transition("activate", "activate", input, config);
  }

  suspend(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    return this.transition("suspend", "suspend", input, config);
  }

  resume(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    return this.transition("resume", "resume", input, config);
  }

  replace(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    return this.transition("replace", "replace", { ...input, approvedBy: input.approvedBy ?? null }, config);
  }

  retire(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    return this.transition("retire", "retire", { ...input, approvedBy: input.approvedBy ?? null }, config);
  }

  archive(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    return this.transition("archive", "archive", input, config);
  }

  audit(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    if (!config.auditRulesEnabled) {
      return this.disabled("audit", config, "Audit rules are disabled");
    }
    return this.transition("audit", "audit", input, config);
  }

  restore(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    if (!config.restorationRulesEnabled) {
      return this.disabled("restore", config, "Restoration rules are disabled");
    }
    return this.transition("restore", "restore", { ...input, approvedBy: input.approvedBy ?? null }, config);
  }

  produce(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce", input, config, started);
    }
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listProfiles(),
      this.store.listRecords(),
    );
    const evaluation = this.builder.evaluate(
      input,
      config,
      this.store.listProfiles(),
      this.store.listRecords(),
    );
    const validation = this.validator.validateCatalog(
      this.catalog,
      this.store.listProfiles(),
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.lifecycleDecision,
    );
    appendWlcLog({
      event: "produce",
      details: `workers=${this.store.profileCount()} records=${this.store.recordCount()}`,
    });
    this.metadata.generate(this.store.profileCount(), this.store.recordCount());
    return this.report(
      "produce",
      this.getCatalog(),
      this.store.listProfiles(),
      this.store.listRecords(),
      evaluation.lifecycleDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  list(config: WorkerLifecycleConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listProfiles(),
      this.store.listRecords(),
    );
    const records = this.store.listRecords();
    const validation =
      records.length === 0
        ? this.validator.validateCatalog(
            this.catalog,
            this.store.listProfiles(),
            { validated: true },
            started,
          )
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      this.getCatalog(),
      this.store.listProfiles(),
      records,
      "valid",
      [],
      validation,
      started,
    );
  }

  validate(input: WorkerLifecycleInput, config: WorkerLifecycleConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listProfiles(),
      this.store.listRecords(),
    );
    const records = this.store.listRecords();
    const validation = this.validator.validateRecords(
      records.length ? records : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      this.getCatalog(),
      this.store.listProfiles(),
      records,
      validation.decision === "fail" ? "invalid" : "valid",
      [],
      validation,
      started,
    );
  }

  diagnostics(config: WorkerLifecycleConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listProfiles(),
      this.store.listRecords(),
    );
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Worker Lifecycle is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWlcLog({
      event: "diagnostics",
      details: `workers=${this.store.profileCount()} records=${this.store.recordCount()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listProfiles(),
      this.store.listRecords(),
      null,
      [],
      validation,
      started,
    );
  }

  private transition(
    action: WorkerLifecycleRunReport["action"],
    event: LifecycleEvent,
    input: WorkerLifecycleInput,
    config: WorkerLifecycleConfiguration,
    silentIntermediate = false,
  ): WorkerLifecycleRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.transitionRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Worker Lifecycle is disabled" : "Transition rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    if (!(LIFECYCLE_EVENTS as readonly string[]).includes(event)) {
      return this.disabled(action, config, `Unsupported lifecycle event: ${event}`);
    }

    const workerId =
      input.workerId?.trim() ||
      (event === "create" ? `wkr-life-${Date.now()}` : "") ||
      this.store.listProfiles()[0]?.workerId ||
      "";
    const existing = this.store.getProfile(workerId);
    const workerName =
      input.workerName?.trim() || existing?.workerName || workerId || "Unnamed Worker";
    const plan = this.builder.planTransition(event, existing, {
      ...input,
      workerId,
      lifecycleEvent: event,
    });

    if (plan.errors.length) {
      const validation = this.validator.validateRecords(
        null,
        { ...input, validated: input.validated ?? true },
        started,
        plan.errors,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed", "invalid");
      if (!silentIntermediate) {
        appendWlcLog({
          event: action,
          details: `failed event=${event} errors=${plan.errors.join("|")}`,
        });
      }
      return this.report(
        action,
        this.getCatalog(),
        this.store.listProfiles(),
        [],
        "invalid",
        plan.errors,
        validation,
        started,
      );
    }

    const record = this.builder.buildRecord({
      input: { ...input, workerId },
      event,
      previousState: plan.previousState,
      newState: plan.newState,
      workerId,
      workerName,
    });
    this.store.applyTransition({
      workerId,
      workerName,
      newState: plan.newState,
      record,
      certified: plan.newState === "certified" ? true : undefined,
    });
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listProfiles(),
      this.store.listRecords(),
    );
    const evaluation = this.builder.evaluate(
      { ...input, workerId, lifecycleEvent: event },
      config,
      this.store.listProfiles(),
      this.store.listRecords(),
    );
    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation.lifecycleDecision,
    );
    if (!silentIntermediate) {
      appendWlcLog({
        event: action,
        details: `id=${record.lifecycleId} worker=${workerId} ${plan.previousState}->${plan.newState}`,
      });
    }
    this.metadata.generate(this.store.profileCount(), this.store.recordCount());
    return this.report(
      action,
      this.getCatalog(),
      this.store.listProfiles(),
      [record],
      evaluation.lifecycleDecision,
      evaluation.rulesFailed,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: WorkerLifecycleRunReport["action"],
    input: WorkerLifecycleInput,
    config: WorkerLifecycleConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateRecords(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listProfiles(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private disabled(
    action: WorkerLifecycleRunReport["action"],
    config: WorkerLifecycleConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      this.store.listProfiles(),
      [],
      null,
      [],
      validation,
      started,
    );
  }

  private hasBoundary(input: WorkerLifecycleInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkerRegistry === true ||
      input.replaceWorkforceCertificationMonitor === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.permanentlyDelete === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkerLifecycleConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastLifecycleDecision: LifecycleDecision | string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wlc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKER_LIFECYCLE_ID,
      engineVersion: "PILLOW-WLC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WLC_CAPABILITIES],
      totalWorkers: this.store.profileCount(),
      totalRecords: this.store.recordCount(),
      lastLifecycleDecision,
      metadataVersion: WLC_METADATA_VERSION,
    };
  }

  private report(
    action: WorkerLifecycleRunReport["action"],
    catalog: WorkerLifecycleCatalog | null,
    profiles: WorkerLifecycleProfile[],
    records: LifecycleRecord[],
    lifecycleDecision: LifecycleDecision | string | null,
    rulesFailed: string[],
    validation: WorkerLifecycleRunReport["validation"],
    started: number,
  ): WorkerLifecycleRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      lifecycleRunReportId: `wlc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      profiles,
      records,
      lifecycleDecision,
      rulesFailed: [...rulesFailed],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WLC_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: WorkerLifecycleCatalog): WorkerLifecycleCatalog {
  return {
    ...catalog,
    states: [...catalog.states],
    profiles: catalog.profiles.map((p) => ({
      ...p,
      history: p.history.map((h) => ({
        ...h,
        supportingEvidence: [...h.supportingEvidence],
      })),
      neverPermanentlyDeleted: true,
    })),
    records: catalog.records.map((r) => ({
      ...r,
      supportingEvidence: [...r.supportingEvidence],
    })),
  };
}
