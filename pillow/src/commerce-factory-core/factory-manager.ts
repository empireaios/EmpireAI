import type { CommerceFactoryCoreConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type CommerceFactoryCoreDependencies,
} from "./integrations.js";
import { appendCmfLog } from "./cmf-logging.js";
import {
  CMF_CAPABILITIES,
  CMF_METADATA_VERSION,
  COMMERCE_FACTORY_CORE_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import { MissionBuilder } from "./mission-builder.js";
import { MissionStore } from "./mission-store.js";
import { HealthMonitor, MissionValidator, RecoveryManager } from "./mission-validator.js";
import type {
  CommerceBuildMission,
  CommerceFactoryCoreCatalog,
  CommerceFactoryCoreEngineRecord,
  CommerceFactoryCoreInput,
  CommerceFactoryCoreRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class CommerceFactoryManager {
  private engineRecord: CommerceFactoryCoreEngineRecord | null = null;
  private seeded = false;
  private catalog: CommerceFactoryCoreCatalog | null = null;
  private readonly store = new MissionStore();
  private readonly builder = new MissionBuilder();
  private readonly validator = new MissionValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingBlueprint: CommerceFactoryCoreInput["businessBlueprint"] = null;
  private pendingApprovalPack: CommerceFactoryCoreInput["businessApprovalPack"] = null;
  private pendingGrandKingApproved: boolean | null = null;

  bindIntegrations(deps: CommerceFactoryCoreDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: CommerceFactoryCoreConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedMissions);
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

  getMissions() {
    return this.store.list();
  }

  getLatestMissionId() {
    return this.store.getLatestMissionId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: CommerceFactoryCoreConfiguration,
  ): CommerceFactoryCoreRunReport {
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
    appendCmfLog({
      event: "connect",
      details: `Commerce Factory Core connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `cmf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Commerce Factory Core is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CMF_METADATA_VERSION,
      },
      started,
    );
  }

  receiveBlueprint(input: CommerceFactoryCoreInput, config: CommerceFactoryCoreConfiguration) {
    this.pendingBlueprint = input.businessBlueprint ?? this.pendingBlueprint;
    return this.runMission("receive_blueprint", input, config, { allowPartial: true });
  }

  receiveApprovalPack(input: CommerceFactoryCoreInput, config: CommerceFactoryCoreConfiguration) {
    this.pendingApprovalPack = input.businessApprovalPack ?? this.pendingApprovalPack;
    if (input.grandKingApproved != null) {
      this.pendingGrandKingApproved = input.grandKingApproved;
    }
    return this.runMission("receive_approval_pack", input, config, { allowPartial: true });
  }

  verifyApproval(input: CommerceFactoryCoreInput, config: CommerceFactoryCoreConfiguration) {
    return this.runMission("verify_approval", input, config);
  }

  verifyBlueprint(input: CommerceFactoryCoreInput, config: CommerceFactoryCoreConfiguration) {
    return this.runMission("verify_blueprint", input, config);
  }

  verifyPrerequisites(input: CommerceFactoryCoreInput, config: CommerceFactoryCoreConfiguration) {
    return this.runMission("verify_prerequisites", input, config);
  }

  createMission(input: CommerceFactoryCoreInput, config: CommerceFactoryCoreConfiguration) {
    return this.runMission("create_mission", input, config);
  }

  classifyCommerceType(input: CommerceFactoryCoreInput, config: CommerceFactoryCoreConfiguration) {
    return this.runMission("classify_commerce_type", input, config);
  }

  produceMission(input: CommerceFactoryCoreInput, config: CommerceFactoryCoreConfiguration) {
    return this.runMission("produce_mission", input, config);
  }

  registerMission(input: CommerceFactoryCoreInput, config: CommerceFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("register_mission", input, config, started);
    }
    if (!config.missionCoordinationEnabled) {
      return this.disabled(
        "register_mission",
        config,
        "Mission coordination registration is disabled",
      );
    }

    let mission =
      (input.commerceBuildMissionId
        ? this.store.get(input.commerceBuildMissionId)
        : null) ??
      this.store.list().at(-1) ??
      null;

    if (!mission) {
      const generated = this.runMission("create_mission", input, config);
      mission = generated.latestMission;
      if (!mission || generated.validation.decision === "fail") return generated;
    }

    if (mission.approvalStatus !== "approved") {
      return this.disabled(
        "register_mission",
        config,
        "Cannot register an unapproved Commerce Build Mission",
      );
    }

    const registration = this.integrations.registerMission(mission);
    if (registration.registered && registration.missionCoordinationRef) {
      mission =
        this.store.markRegistered(
          mission.commerceBuildMissionId,
          registration.missionCoordinationRef,
        ) ?? mission;
    }

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateMissions(
      mission ? [mission] : null,
      { ...input, validated: input.validated ?? true },
      started,
      { requireReadyMission: true },
    );
    if (!registration.registered) {
      validation.warnings.push(registration.details);
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      mission,
    );
    appendCmfLog({
      event: "register_mission",
      details: `mission=${mission?.commerceBuildMissionId ?? "none"} registered=${registration.registered}`,
    });
    return this.report(
      "register_mission",
      this.getCatalog(),
      mission ? [mission] : [],
      mission,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  submitMission(input: CommerceFactoryCoreInput, config: CommerceFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_mission", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_mission",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let mission =
      (input.commerceBuildMissionId
        ? this.store.get(input.commerceBuildMissionId)
        : null) ??
      this.store.list().at(-1) ??
      null;

    if (!mission) {
      const generated = this.runMission("produce_mission", input, config);
      mission = generated.latestMission;
      if (!mission || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitMission(mission);
    if (submission.submitted && submission.executiveReportId) {
      mission =
        this.store.markSubmitted(mission.commerceBuildMissionId, submission.executiveReportId) ??
        mission;
    }

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateMissions(
      mission ? [mission] : null,
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
      mission,
    );
    return this.report(
      "submit_mission",
      this.getCatalog(),
      mission ? [mission] : [],
      mission,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: CommerceFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const missions = this.store.list();
    const latest = missions[missions.length - 1] ?? null;
    const validation = this.validator.validateMissions(
      missions.length ? missions : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), missions, latest, validation, started);
  }

  validate(input: CommerceFactoryCoreInput, config: CommerceFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
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
    return this.report("validate", this.getCatalog(), missions, latest, validation, started);
  }

  diagnostics(config: CommerceFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Commerce Factory Core is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendCmfLog({ event: "diagnostics", details: `missions=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runMission(
    action: CommerceFactoryCoreRunReport["action"],
    input: CommerceFactoryCoreInput,
    config: CommerceFactoryCoreConfiguration,
    options: { allowPartial?: boolean } = {},
  ): CommerceFactoryCoreRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.missionRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Commerce Factory Core is disabled"
          : "Mission rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const merged: CommerceFactoryCoreInput = {
      ...input,
      businessBlueprint: input.businessBlueprint ?? this.pendingBlueprint,
      businessApprovalPack: input.businessApprovalPack ?? this.pendingApprovalPack,
      grandKingApproved:
        input.grandKingApproved ?? this.pendingGrandKingApproved ?? undefined,
    };
    if (merged.businessBlueprint) this.pendingBlueprint = merged.businessBlueprint;
    if (merged.businessApprovalPack) this.pendingApprovalPack = merged.businessApprovalPack;
    if (merged.grandKingApproved != null) {
      this.pendingGrandKingApproved = merged.grandKingApproved;
    }

    if (
      options.allowPartial &&
      (!(merged.businessBlueprint && merged.businessApprovalPack))
    ) {
      const missing = [
        !merged.businessBlueprint ? "business_blueprint" : "",
        !merged.businessApprovalPack ? "business_approval_pack" : "",
      ].filter(Boolean);
      const partialValidation = this.validator.finalize(
        "partial",
        [],
        [`Received partial inputs; still missing: ${missing.join(", ")}`],
        started,
      );
      this.ensureRecord("active", config, "partial");
      return this.report(action, this.getCatalog(), [], null, partialValidation, started);
    }

    if (!merged.businessBlueprint || !merged.businessApprovalPack) {
      return this.disabled(
        action,
        config,
        "Commerce Build Mission requires an approved Business Blueprint and Business Approval Pack",
      );
    }

    const mission = this.builder.buildMission(merged, config);
    this.store.saveCanonical(mission, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    // Reject incomplete/unapproved as validation fail for create/produce actions
    const hardReject =
      mission.approvalStatus !== "approved" &&
      ["create_mission", "produce_mission", "classify_commerce_type", "verify_prerequisites"].includes(
        action,
      );

    const validation = this.validator.validateMissions(
      [mission],
      { ...merged, validated: merged.validated ?? true },
      started,
      { requireReadyMission: hardReject },
    );

    if (hardReject && mission.approvalStatus !== "approved") {
      for (const item of mission.missingPrerequisites) {
        if (!validation.errors.includes(item)) validation.errors.push(item);
      }
      validation.decision = "fail";
    }

    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      mission,
    );
    appendCmfLog({
      event: action,
      details: `mission=${mission.commerceBuildMissionId} status=${mission.currentStatus} category=${mission.commerceCategory}`,
    });
    return this.report(action, this.getCatalog(), [mission], mission, validation, started);
  }

  private boundaryFail(
    action: CommerceFactoryCoreRunReport["action"],
    input: CommerceFactoryCoreInput,
    config: CommerceFactoryCoreConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateMissions(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: CommerceFactoryCoreRunReport["action"],
    config: CommerceFactoryCoreConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: CommerceFactoryCoreInput) {
    return (
      input.buildStores === true ||
      input.importProducts === true ||
      input.configureMarketplaces === true ||
      input.executeCommerceImplementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ302OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: CommerceFactoryCoreConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: CommerceBuildMission | null = null,
  ) {
    const mission = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `cmf-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: COMMERCE_FACTORY_CORE_ID,
      engineVersion: "PILLOW-CMF-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...CMF_CAPABILITIES],
      totalMissions: this.store.count(),
      lastBusinessType: mission?.businessType ?? null,
      lastCommerceCategory: mission?.commerceCategory ?? null,
      lastMissionId: mission?.commerceBuildMissionId ?? this.store.getLatestMissionId(),
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: CMF_METADATA_VERSION,
    };
  }

  private report(
    action: CommerceFactoryCoreRunReport["action"],
    catalog: CommerceFactoryCoreCatalog | null,
    missions: CommerceBuildMission[],
    latestMission: CommerceBuildMission | null,
    validation: CommerceFactoryCoreRunReport["validation"],
    started: number,
  ): CommerceFactoryCoreRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      commerceFactoryRunReportId: `cmf-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      missions,
      latestMission,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: CMF_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: CommerceFactoryCoreCatalog): CommerceFactoryCoreCatalog {
  return {
    ...catalog,
    commerceCategories: [...catalog.commerceCategories],
    missions: catalog.missions.map((mission) => ({
      ...mission,
      missingPrerequisites: [...mission.missingPrerequisites],
      preservedDecisions: [...mission.preservedDecisions],
      traceabilityRefs: [...mission.traceabilityRefs],
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
