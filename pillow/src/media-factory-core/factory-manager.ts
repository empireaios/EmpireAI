import type { MediaFactoryCoreConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type MediaFactoryCoreDependencies,
} from "./integrations.js";
import { appendMfcLog } from "./mfc-logging.js";
import {
  INTEGRATION_TARGETS,
  MEDIA_FACTORY_CORE_ID,
  MFC_CAPABILITIES,
  MFC_METADATA_VERSION,
} from "./paths.js";
import { MissionBuilder } from "./mission-builder.js";
import { MissionStore } from "./mission-store.js";
import { HealthMonitor, MissionValidator, RecoveryManager } from "./mission-validator.js";
import type {
  MediaBusinessMission,
  MediaFactoryCoreCatalog,
  MediaFactoryCoreEngineRecord,
  MediaFactoryCoreInput,
  MediaFactoryCoreRunReport,
  MediaFactoryReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class MediaFactoryManager {
  private engineRecord: MediaFactoryCoreEngineRecord | null = null;
  private seeded = false;
  private catalog: MediaFactoryCoreCatalog | null = null;
  private readonly store = new MissionStore();
  private readonly builder = new MissionBuilder();
  private readonly validator = new MissionValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: MediaFactoryCoreDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: MediaFactoryCoreConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedMissions);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
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

  getReports() {
    return this.store.listReports();
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
    config: MediaFactoryCoreConfiguration,
  ): MediaFactoryCoreRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    this.ensureRecord("connected", config);
    appendMfcLog({
      event: "connect",
      details: `Media Factory Core connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      null,
      {
        validationReportId: `mfc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Media Factory Core is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: MFC_METADATA_VERSION,
      },
      started,
    );
  }

  createMediaBusinessMission(
    input: MediaFactoryCoreInput,
    config: MediaFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("create_media_business_mission", input, config, () => {
      const mission = this.builder.buildMission(input, config);
      mission.currentStatus = "active";
      this.store.saveCanonical(mission, "create_media_business_mission");
      if (config.missionCoordinationEnabled) {
        const registration = this.integrations.registerMission(mission);
        if (registration.registered && registration.missionCoordinationRef) {
          this.store.markRegistered(mission.mediaMissionId, registration.missionCoordinationRef);
        }
      }
      return this.store.get(mission.mediaMissionId)!;
    });
  }

  registerChannel(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    return this.runMissionAction("register_channel", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) throw new Error("No media mission available for channel registration");
      const updated = this.builder.registerChannel(mission, input);
      this.store.saveCanonical(updated, "register_channel");
      return updated;
    });
  }

  registerPipeline(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    return this.runMissionAction("register_pipeline", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) throw new Error("No media mission available for pipeline registration");
      const updated = this.builder.registerPipeline(mission, input);
      this.store.saveCanonical(updated, "register_pipeline");
      return updated;
    });
  }

  manageLifecycle(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    return this.runMissionAction("manage_lifecycle", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) throw new Error("No media mission available for lifecycle management");
      const targetStage = input.currentStage ?? mission.currentStage;
      const updated = this.builder.advanceStage(mission, targetStage);
      this.store.saveCanonical(updated, "manage_lifecycle");
      return updated;
    });
  }

  coordinateWorkers(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    return this.runMissionAction("coordinate_workers", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) throw new Error("No media mission available for worker coordination");
      const requestedWorkers = input.assignedWorkers ?? [];
      const requestedRoles = input.assignedWorkerRoles ?? [];
      const assignment = this.integrations.assignWorkers(
        mission,
        requestedWorkers,
        requestedRoles,
      );
      const updated = this.builder.assignWorkers(
        mission,
        assignment.assignedWorkers,
        assignment.assignedWorkerRoles,
      );
      this.store.saveCanonical(updated, "coordinate_workers");
      return updated;
    });
  }

  coordinateApproval(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);

    if (input.bypassApproval === true) {
      const existing = this.resolveMission(input);
      let blockedMission: MediaBusinessMission | null = null;
      if (existing) {
        blockedMission = this.builder.applyApproval(existing, "blocked_bypass_attempt", false);
        this.store.saveCanonical(blockedMission, "coordinate_approval");
      }
      const validation = this.validator.finalize(
        "fail",
        ["Media Factory Core must never bypass approval"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed", blockedMission);
      return this.report(
        "coordinate_approval",
        this.getCatalog(),
        blockedMission ? [blockedMission] : [],
        blockedMission,
        null,
        validation,
        started,
      );
    }

    if (this.hasBoundary(input)) {
      return this.boundaryFail("coordinate_approval", input, config, started);
    }

    const mission = this.resolveMission(input);
    if (!mission) {
      return this.disabled("coordinate_approval", config, "No media mission available for approval");
    }

    let approvalStatus = input.approvalStatus ?? mission.approvalStatus;
    const grandKingApproved =
      input.grandKingApproved === true || mission.preservedDecisions.includes("grand_king_approved=true");

    if (approvalStatus === "approved") {
      if (!grandKingApproved && config.requireGrandKingApproval) {
        const validation = this.validator.finalize(
          "fail",
          ["Cannot approve without Grand King approval"],
          [],
          started,
        );
        this.recovery.recordFailure();
        this.ensureRecord("failed", config, "failed", mission);
        return this.report(
          "coordinate_approval",
          this.getCatalog(),
          [mission],
          mission,
          null,
          validation,
          started,
        );
      }
    } else if (approvalStatus === "in_review") {
      approvalStatus = "in_review";
    } else if (input.grandKingApproved === true && approvalStatus === "pending") {
      approvalStatus = "in_review";
    }

    const updated = this.builder.applyApproval(mission, approvalStatus, grandKingApproved);
    this.store.saveCanonical(updated, "coordinate_approval");
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const validation = this.validator.validateMissions([updated], { ...input, validated: input.validated ?? true }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", updated);
    appendMfcLog({
      event: "coordinate_approval",
      details: `mission=${updated.mediaMissionId} approval=${updated.approvalStatus}`,
    });
    return this.report(
      "coordinate_approval",
      this.getCatalog(),
      [updated],
      updated,
      null,
      validation,
      started,
    );
  }

  coordinatePublishing(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("coordinate_publishing", input, config, started);
    }
    if (input.publishDirectly === true) {
      return this.boundaryFail("coordinate_publishing", input, config, started);
    }

    const mission = this.resolveMission(input);
    if (!mission) {
      return this.disabled("coordinate_publishing", config, "No media mission available for publishing");
    }

    if (mission.approvalStatus !== "approved") {
      const blocked = this.builder.applyPublishingCoordination(
        mission,
        "blocked_pending_approval",
      );
      this.store.saveCanonical(blocked, "coordinate_publishing");
      const validation = this.validator.finalize(
        "fail",
        ["Cannot coordinate publishing without approved status"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed", blocked);
      return this.report(
        "coordinate_publishing",
        this.getCatalog(),
        [blocked],
        blocked,
        null,
        validation,
        started,
      );
    }

    const publishingStatus = input.publishingStatus ?? "coordinating";
    const safeStatus =
      publishingStatus === "published_signal" || publishingStatus === "coordinating"
        ? publishingStatus
        : "coordinating";
    const updated = this.builder.applyPublishingCoordination(mission, safeStatus);
    this.store.saveCanonical(updated, "coordinate_publishing");
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const validation = this.validator.validateMissions([updated], { ...input, validated: input.validated ?? true }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", updated);
    appendMfcLog({
      event: "coordinate_publishing",
      details: `mission=${updated.mediaMissionId} publishing=${updated.publishingStatus}`,
    });
    return this.report(
      "coordinate_publishing",
      this.getCatalog(),
      [updated],
      updated,
      null,
      validation,
      started,
    );
  }

  coordinateAnalytics(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    return this.runMissionAction("coordinate_analytics", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) throw new Error("No media mission available for analytics");
      const updated = this.builder.applyAnalytics(mission);
      this.store.saveCanonical(updated, "coordinate_analytics");
      return updated;
    });
  }

  coordinateLearning(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    return this.runMissionAction("coordinate_learning", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) throw new Error("No media mission available for learning");
      const learningStatus = input.learningStatus ?? "analyzing";
      const updated = this.builder.applyLearning(mission, learningStatus);
      this.store.saveCanonical(updated, "coordinate_learning");
      return updated;
    });
  }

  trackProduction(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    return this.runMissionAction("track_production", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) throw new Error("No media mission available for production tracking");
      const productionStatus = input.productionStatus ?? "in_production";
      const updated = this.builder.trackProduction(mission, productionStatus);
      this.store.saveCanonical(updated, "track_production");
      return updated;
    });
  }

  trackPublishing(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    return this.runMissionAction("track_publishing", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) throw new Error("No media mission available for publishing tracking");
      const publishingStatus = input.publishingStatus ?? mission.publishingStatus;
      const updated = this.builder.applyPublishingCoordination(mission, publishingStatus);
      this.store.saveCanonical(updated, "track_publishing");
      return updated;
    });
  }

  produceReport(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    const mission = this.resolveMission(input);
    if (!mission) {
      return this.disabled("produce_report", config, "No media mission available for report production");
    }

    const report = this.builder.buildReport(mission);
    this.store.saveReport(report, "produce_report");
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const validation = this.validator.validateReport(report, { ...input, validated: input.validated ?? true }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", mission);
    appendMfcLog({
      event: "produce_report",
      details: `mission=${mission.mediaMissionId} stage=${report.currentStage}`,
    });
    return this.report(
      "produce_report",
      this.getCatalog(),
      [mission],
      mission,
      report,
      validation,
      started,
    );
  }

  submitReport(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }

    const mission = this.resolveMission(input);
    if (!mission) {
      return this.disabled("submit_report", config, "No media mission available for report submission");
    }

    let report =
      this.store.getReport(mission.mediaMissionId) ?? this.builder.buildReport(mission);

    const submission = this.integrations.submitReport(report);
    if (submission.submitted && submission.executiveReportId) {
      this.store.markSubmitted(mission.mediaMissionId, submission.executiveReportId);
      report = {
        ...report,
        submittedToExecutiveReporting: true,
        executiveReportId: submission.executiveReportId,
      };
      this.store.saveReport(report, "submit_report");
    }

    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const validation = this.validator.validateReport(report, { ...input, validated: input.validated ?? true }, started);
    if (!submission.submitted) {
      validation.warnings.push(submission.details);
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", mission);
    return this.report(
      "submit_report",
      this.getCatalog(),
      [mission],
      mission,
      report,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: MediaFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const missions = this.store.list();
    const latest = missions[missions.length - 1] ?? null;
    const latestReport = latest ? this.store.getReport(latest.mediaMissionId) : null;
    const validation = this.validator.validateMissions(
      missions.length ? missions : null,
      { validated: true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", latest);
    return this.report("list", this.getCatalog(), missions, latest, latestReport, validation, started);
  }

  validate(input: MediaFactoryCoreInput, config: MediaFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const missions = this.store.list();
    const latest = missions[missions.length - 1] ?? null;
    const latestReport = latest ? this.store.getReport(latest.mediaMissionId) : null;
    const validation = this.validator.validateMissions(
      missions.length ? missions : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", latest);
    return this.report("validate", this.getCatalog(), missions, latest, latestReport, validation, started);
  }

  diagnostics(config: MediaFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Media Factory Core is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendMfcLog({ event: "diagnostics", details: `missions=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      null,
      validation,
      started,
    );
  }

  private runMissionAction(
    action: MediaFactoryCoreRunReport["action"],
    input: MediaFactoryCoreInput,
    config: MediaFactoryCoreConfiguration,
    mutate: () => MediaBusinessMission,
  ): MediaFactoryCoreRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.missionRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Media Factory Core is disabled" : "Mission rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    let mission: MediaBusinessMission;
    try {
      mission = mutate();
    } catch (err) {
      const validation = this.validator.finalize(
        "fail",
        [err instanceof Error ? err.message : "Operation failed"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, null, validation, started);
    }

    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const validation = this.validator.validateMissions(
      [mission],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      mission,
    );
    appendMfcLog({
      event: action,
      details: `mission=${mission.mediaMissionId} stage=${mission.currentStage}`,
    });
    return this.report(action, this.getCatalog(), [mission], mission, null, validation, started);
  }

  private resolveMission(input: MediaFactoryCoreInput): MediaBusinessMission | null {
    if (input.mediaMissionId) {
      return this.store.get(input.mediaMissionId);
    }
    const latestId = this.store.getLatestMissionId();
    return latestId ? this.store.get(latestId) : null;
  }

  private boundaryFail(
    action: MediaFactoryCoreRunReport["action"],
    input: MediaFactoryCoreInput,
    config: MediaFactoryCoreConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateMissions(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, null, validation, started);
  }

  private disabled(
    action: MediaFactoryCoreRunReport["action"],
    config: MediaFactoryCoreConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, null, validation, started);
  }

  private hasBoundary(input: MediaFactoryCoreInput) {
    return (
      input.writeScripts === true ||
      input.generateImages === true ||
      input.generateVideos === true ||
      input.publishDirectly === true ||
      input.bypassApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ402OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: MediaFactoryCoreConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: MediaBusinessMission | null = null,
  ) {
    const mission = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `mfc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MEDIA_FACTORY_CORE_ID,
      engineVersion: "PILLOW-MFC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...MFC_CAPABILITIES],
      totalMissions: this.store.count(),
      lastChannelType: mission?.channelType ?? null,
      lastPipelineType: mission?.pipelineType ?? null,
      lastMissionId: mission?.mediaMissionId ?? this.store.getLatestMissionId(),
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: MFC_METADATA_VERSION,
    };
  }

  private report(
    action: MediaFactoryCoreRunReport["action"],
    catalog: MediaFactoryCoreCatalog | null,
    missions: MediaBusinessMission[],
    latestMission: MediaBusinessMission | null,
    latestReport: MediaFactoryReport | null,
    validation: MediaFactoryCoreRunReport["validation"],
    started: number,
  ): MediaFactoryCoreRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      mediaFactoryRunReportId: `mfc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      missions,
      latestMission,
      latestReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: MFC_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: MediaFactoryCoreCatalog): MediaFactoryCoreCatalog {
  return {
    ...catalog,
    channelTypes: [...catalog.channelTypes],
    pipelineTypes: [...catalog.pipelineTypes],
    missions: catalog.missions.map((mission) => ({
      ...mission,
      assignedWorkers: [...mission.assignedWorkers],
      assignedWorkerRoles: [...mission.assignedWorkerRoles],
      preservedDecisions: [...mission.preservedDecisions],
      traceabilityRefs: [...mission.traceabilityRefs],
    })),
    reports: catalog.reports.map((report) => ({
      ...report,
      assignedWorkers: [...report.assignedWorkers],
      assignedWorkerRoles: [...report.assignedWorkerRoles],
      traceabilityRefs: [...report.traceabilityRefs],
      preservedDecisions: [...report.preservedDecisions],
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
