import type { EmpireBuilderFactoryCoreConfiguration } from "./configuration.js";
import { MissionBuilder } from "./mission-builder.js";
import { MissionStore } from "./mission-store.js";
import { HealthMonitor, MissionValidator, RecoveryManager } from "./mission-validator.js";
import { appendEbfLog } from "./ebf-logging.js";
import {
  EBF_CAPABILITIES,
  EBF_METADATA_VERSION,
  EMPIRE_BUILDER_FACTORY_CORE_ID,
} from "./paths.js";
import type {
  BusinessBuildMissionRecord,
  EmpireBuilderFactoryCatalog,
  EmpireBuilderFactoryEngineRecord,
  EmpireBuilderFactoryInput,
  EmpireBuilderFactoryRunReport,
  OperationalState,
} from "./types.js";

export class EmpireBuilderFactoryManager {
  private engineRecord: EmpireBuilderFactoryEngineRecord | null = null;
  private seeded = false;
  private catalog: EmpireBuilderFactoryCatalog | null = null;
  private readonly store = new MissionStore();
  private readonly builder = new MissionBuilder();
  private readonly validator = new MissionValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: EmpireBuilderFactoryCoreConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedMissions);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
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

  getMissions() {
    return this.store.list();
  }

  getLatestMissionId() {
    return this.store.getLatestMissionId();
  }

  connect(
    _input: Record<string, unknown>,
    config: EmpireBuilderFactoryCoreConfiguration,
  ): EmpireBuilderFactoryRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendEbfLog({
      event: "connect",
      details: "Empire Builder Factory Core connected; mission-container mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `ebf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Empire Builder Factory Core is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EBF_METADATA_VERSION,
      },
      started,
    );
  }

  acceptCommand(input: EmpireBuilderFactoryInput, config: EmpireBuilderFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.acceptanceRulesEnabled) {
      return this.disabled(
        "accept_command",
        config,
        !config.enabled
          ? "Empire Builder Factory Core is disabled"
          : "Acceptance rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail("accept_command", input, config, started);
    if (!input.originalCommand?.trim()) {
      return this.disabled("accept_command", config, "originalCommand is required");
    }
    const mission = this.builder.buildMission({
      input: {
        ...input,
        currentStatus: input.currentStatus ?? "drafted",
        requiredNextStep: input.requiredNextStep ?? "classify_business_type",
      },
      config,
      prepared: false,
    });
    this.store.save(mission);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const validation = this.validator.validateMissions(
      [mission],
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", mission);
    appendEbfLog({
      event: "accept_command",
      details: `mission=${mission.businessBuildMissionId} command=${mission.originalCommand}`,
    });
    return this.report("accept_command", this.getCatalog(), [mission], mission, validation, started);
  }

  createMission(input: EmpireBuilderFactoryInput, config: EmpireBuilderFactoryCoreConfiguration) {
    return this.createOrPrepare("create_mission", input, config, true);
  }

  classifyBusinessType(
    input: EmpireBuilderFactoryInput,
    config: EmpireBuilderFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.classificationRulesEnabled) {
      return this.disabled(
        "classify_business_type",
        config,
        !config.enabled
          ? "Empire Builder Factory Core is disabled"
          : "Classification rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("classify_business_type", input, config, started);
    }
    if (!input.originalCommand?.trim() && !input.businessBuildMissionId?.trim()) {
      return this.disabled(
        "classify_business_type",
        config,
        "originalCommand or businessBuildMissionId is required",
      );
    }

    const existing = input.businessBuildMissionId
      ? this.store.get(input.businessBuildMissionId)
      : null;
    const command = input.originalCommand?.trim() || existing?.originalCommand || "";
    const businessType = this.builder.classifyBusinessType(command, config, input.businessType);
    const mission = this.builder.buildMission({
      input: {
        ...input,
        originalCommand: command,
        businessType,
        businessBuildMissionId: existing?.businessBuildMissionId ?? input.businessBuildMissionId,
        traceabilityReference: input.traceabilityReference ?? existing?.traceabilityReference,
        currentStatus: "classified",
        requiredNextStep: "capture_mission_objective",
        approvalStatus: input.approvalStatus ?? existing?.approvalStatus,
      },
      config,
      prepared: false,
    });
    this.store.save(mission);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const validation = this.validator.validateMissions(
      [mission],
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", mission);
    appendEbfLog({
      event: "classify_business_type",
      details: `mission=${mission.businessBuildMissionId} type=${mission.businessType}`,
    });
    return this.report(
      "classify_business_type",
      this.getCatalog(),
      [mission],
      mission,
      validation,
      started,
    );
  }

  prepareMission(input: EmpireBuilderFactoryInput, config: EmpireBuilderFactoryCoreConfiguration) {
    if (!config.preparationRulesEnabled) {
      return this.disabled("prepare_mission", config, "Preparation rules are disabled");
    }
    return this.createOrPrepare("prepare_mission", input, config, true);
  }

  produce(input: EmpireBuilderFactoryInput, config: EmpireBuilderFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("produce", input, config, started);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const missions = this.store.list();
    const latest = missions[missions.length - 1] ?? null;
    const validation = this.validator.validateMissions(
      missions.length ? missions : null,
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
    appendEbfLog({
      event: "produce",
      details: `missions=${this.store.count()}`,
    });
    return this.report("produce", this.getCatalog(), missions, latest, validation, started);
  }

  list(config: EmpireBuilderFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const missions = this.store.list();
    const latest = missions[missions.length - 1] ?? null;
    const validation = this.validator.validateMissions(
      missions.length ? missions : null,
      { validated: true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", latest);
    return this.report("list", this.getCatalog(), missions, latest, validation, started);
  }

  validate(input: EmpireBuilderFactoryInput, config: EmpireBuilderFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const missions = this.store.list();
    const latest = missions[missions.length - 1] ?? null;
    const validation = this.validator.validateMissions(
      missions.length ? missions : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", latest);
    return this.report("validate", this.getCatalog(), missions, latest, validation, started);
  }

  diagnostics(config: EmpireBuilderFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Empire Builder Factory Core is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendEbfLog({
      event: "diagnostics",
      details: `missions=${this.store.count()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private createOrPrepare(
    action: EmpireBuilderFactoryRunReport["action"],
    input: EmpireBuilderFactoryInput,
    config: EmpireBuilderFactoryCoreConfiguration,
    prepared: boolean,
  ): EmpireBuilderFactoryRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled) {
      return this.disabled(action, config, "Empire Builder Factory Core is disabled");
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const existing = input.businessBuildMissionId
      ? this.store.get(input.businessBuildMissionId)
      : null;
    const command = input.originalCommand?.trim() || existing?.originalCommand || "";
    if (!command) {
      return this.disabled(action, config, "originalCommand is required to create a mission");
    }

    const mission = this.builder.buildMission({
      input: {
        ...input,
        originalCommand: command,
        businessBuildMissionId: existing?.businessBuildMissionId ?? input.businessBuildMissionId,
        traceabilityReference:
          input.traceabilityReference ??
          existing?.traceabilityReference ??
          input.grandKingCommandId,
        approvalStatus:
          input.approvalStatus ??
          existing?.approvalStatus ??
          config.defaultApprovalStatus,
        currentStatus: prepared ? "ready_for_q2_workers" : input.currentStatus,
        requiredNextStep: prepared ? "hand_off_to_q2_02" : input.requiredNextStep,
      },
      config,
      prepared,
    });
    this.store.save(mission);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const validation = this.validator.validateMissions(
      [mission],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", mission);
    appendEbfLog({
      event: action,
      details: `mission=${mission.businessBuildMissionId} type=${mission.businessType} approval=${mission.approvalStatus}`,
    });
    return this.report(action, this.getCatalog(), [mission], mission, validation, started);
  }

  private boundaryFail(
    action: EmpireBuilderFactoryRunReport["action"],
    input: EmpireBuilderFactoryInput,
    config: EmpireBuilderFactoryCoreConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateMissions(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: EmpireBuilderFactoryRunReport["action"],
    config: EmpireBuilderFactoryCoreConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: EmpireBuilderFactoryInput) {
    return (
      input.interpretDetailedBusinessStrategy === true ||
      input.generateBusinessModels === true ||
      input.researchMarkets === true ||
      input.assignWorkers === true ||
      input.executeBusinesses === true ||
      input.launchBusinesses === true ||
      input.implementQ202OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: EmpireBuilderFactoryCoreConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: BusinessBuildMissionRecord | null = null,
  ) {
    const mission = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `ebf-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EMPIRE_BUILDER_FACTORY_CORE_ID,
      engineVersion: "PILLOW-EBF-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...EBF_CAPABILITIES],
      totalMissions: this.store.count(),
      lastBusinessType: mission?.businessType ?? null,
      lastMissionId: mission?.businessBuildMissionId ?? this.store.getLatestMissionId(),
      metadataVersion: EBF_METADATA_VERSION,
    };
  }

  private report(
    action: EmpireBuilderFactoryRunReport["action"],
    catalog: EmpireBuilderFactoryCatalog | null,
    missions: BusinessBuildMissionRecord[],
    latestMission: BusinessBuildMissionRecord | null,
    validation: EmpireBuilderFactoryRunReport["validation"],
    started: number,
  ): EmpireBuilderFactoryRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      factoryRunReportId: `ebf-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      missions,
      latestMission,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: EBF_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: EmpireBuilderFactoryCatalog): EmpireBuilderFactoryCatalog {
  return {
    ...catalog,
    businessTypes: [...catalog.businessTypes],
    missions: catalog.missions.map((m) => ({ ...m })),
  };
}
