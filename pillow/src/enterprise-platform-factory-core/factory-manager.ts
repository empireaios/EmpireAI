import type { EnterprisePlatformFactoryCoreConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type EnterprisePlatformFactoryCoreDependencies,
} from "./integrations.js";
import { appendEpfcLog } from "./epfc-logging.js";
import {
  ENTERPRISE_PLATFORM_FACTORY_CORE_ID,
  EPFC_CAPABILITIES,
  EPFC_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import { MissionBuilder } from "./mission-builder.js";
import { MissionStore } from "./mission-store.js";
import { HealthMonitor, MissionValidator, RecoveryManager } from "./mission-validator.js";
import type {
  EnterprisePlatformFactoryCoreCatalog,
  EnterprisePlatformFactoryCoreEngineRecord,
  EnterprisePlatformFactoryCoreInput,
  EnterprisePlatformFactoryCoreRunReport,
  EnterprisePlatformFactoryReport,
  EnterprisePlatformMission,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class EnterprisePlatformFactoryManager {
  private engineRecord: EnterprisePlatformFactoryCoreEngineRecord | null = null;
  private seeded = false;
  private catalog: EnterprisePlatformFactoryCoreCatalog | null = null;
  private readonly store = new MissionStore();
  private readonly builder = new MissionBuilder();
  private readonly validator = new MissionValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: EnterprisePlatformFactoryCoreDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: EnterprisePlatformFactoryCoreConfiguration) {
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
    config: EnterprisePlatformFactoryCoreConfiguration,
  ): EnterprisePlatformFactoryCoreRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    this.ensureRecord("connected", config);
    appendEpfcLog({
      event: "connect",
      details: `Enterprise Platform Factory Core connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      null,
      {
        validationReportId: `epfc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Enterprise Platform Factory Core is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EPFC_METADATA_VERSION,
      },
      started,
    );
  }

  createEnterprisePlatformMission(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    return this.runMissionAction(
      "create_enterprise_platform_mission",
      input,
      config,
      () => {
        const mission = this.builder.buildMission(input, config);
        mission.currentStatus = "active";
        this.store.saveCanonical(mission, "create_enterprise_platform_mission");
        if (config.missionCoordinationEnabled) {
          const registration = this.integrations.registerMission(mission);
          if (registration.registered && registration.missionCoordinationRef) {
            this.store.markRegistered(
              mission.factoryMissionId,
              registration.missionCoordinationRef,
            );
          }
        }
        return this.store.get(mission.factoryMissionId)!;
      },
    );
  }

  registerSoftwarePlatform(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("register_software_platform", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No enterprise platform mission available for platform registration");
      }
      const updated = this.builder.registerSoftwarePlatform(mission, input);
      this.store.saveCanonical(updated, "register_software_platform");
      return updated;
    });
  }

  coordinateSoftwareDevelopmentLifecycle(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    return this.runMissionAction(
      "coordinate_software_development_lifecycle",
      input,
      config,
      () => {
        const mission = this.resolveMission(input);
        if (!mission) {
          throw new Error("No enterprise platform mission available for SDLC coordination");
        }
        const updated = this.builder.applySoftwareDevelopment(mission);
        this.store.saveCanonical(updated, "coordinate_software_development_lifecycle");
        return updated;
      },
    );
  }

  coordinateArchitectureDecisions(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_architecture_decisions", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No enterprise platform mission available for architecture coordination");
      }
      const updated = this.builder.applyArchitecture(mission);
      this.store.saveCanonical(updated, "coordinate_architecture_decisions");
      return updated;
    });
  }

  coordinateImplementationWorkers(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_implementation_workers", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No enterprise platform mission available for implementation coordination");
      }
      let updated = this.builder.applyImplementation(mission);
      const requestedWorkers = input.assignedWorkers ?? [];
      const requestedRoles = input.assignedWorkerRoles ?? [];
      if (requestedWorkers.length || requestedRoles.length) {
        const assignment = this.integrations.assignWorkers(
          updated,
          requestedWorkers,
          requestedRoles,
        );
        updated = this.builder.assignWorkers(
          updated,
          assignment.assignedWorkers,
          assignment.assignedWorkerRoles,
        );
      }
      this.store.saveCanonical(updated, "coordinate_implementation_workers");
      return updated;
    });
  }

  coordinateTestingWorkflows(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_testing_workflows", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No enterprise platform mission available for testing coordination");
      }
      const testingStatus = input.testingStatus ?? "in_progress";
      const safeStatus =
        testingStatus === "passed" ||
        testingStatus === "failed" ||
        testingStatus === "blocked" ||
        testingStatus === "in_progress"
          ? testingStatus
          : "in_progress";
      const updated = this.builder.applyTesting(mission, safeStatus);
      this.store.saveCanonical(updated, "coordinate_testing_workflows");
      return updated;
    });
  }

  coordinateDeploymentWorkflows(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_deployment_workflows", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No enterprise platform mission available for deployment coordination");
      }
      if (mission.approvalStatus !== "approved") {
        throw new Error("Cannot coordinate deployment without approved status");
      }
      const deploymentStatus = input.deploymentStatus ?? "deploying";
      const safeStatus =
        deploymentStatus === "deployed" ||
        deploymentStatus === "failed" ||
        deploymentStatus === "rolled_back" ||
        deploymentStatus === "deploying" ||
        deploymentStatus === "ready"
          ? deploymentStatus
          : "deploying";
      const updated = this.builder.applyDeployment(mission, safeStatus);
      this.store.saveCanonical(updated, "coordinate_deployment_workflows");
      return updated;
    });
  }

  coordinateProductionOperations(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_production_operations", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No enterprise platform mission available for production operations");
      }
      const updated = this.builder.applyProductionOperations(mission);
      this.store.saveCanonical(updated, "coordinate_production_operations");
      return updated;
    });
  }

  trackPlatformLifecycle(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("track_platform_lifecycle", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No enterprise platform mission available for lifecycle tracking");
      }
      const targetStage = input.currentLifecycleStage ?? mission.currentLifecycleStage;
      const updated = this.builder.advanceStage(mission, targetStage);
      this.store.saveCanonical(updated, "track_platform_lifecycle");
      return updated;
    });
  }

  manageLifecycle(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    const result = this.trackPlatformLifecycle(input, config);
    return {
      ...result,
      action: "manage_lifecycle" as const,
      durationMs: Date.now() - started,
    };
  }

  coordinateWorkers(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_workers", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No enterprise platform mission available for worker coordination");
      }
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

  coordinateApproval(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);

    if (input.bypassGrandKingApproval === true || input.bypassApproval === true) {
      const existing = this.resolveMission(input);
      let blockedMission: EnterprisePlatformMission | null = null;
      if (existing) {
        blockedMission = this.builder.applyApproval(
          existing,
          "blocked_bypass_attempt",
          false,
        );
        this.store.saveCanonical(blockedMission, "coordinate_approval");
      }
      const validation = this.validator.finalize(
        "fail",
        ["Enterprise Platform Factory Core must never bypass Grand King approval"],
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
      return this.disabled(
        "coordinate_approval",
        config,
        "No enterprise platform mission available for approval",
      );
    }

    let approvalStatus = input.approvalStatus ?? mission.approvalStatus;
    const grandKingApproved =
      input.grandKingApproved === true ||
      mission.preservedDecisions.includes("grand_king_approved=true");

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
    const validation = this.validator.validateMissions(
      [updated],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendEpfcLog({
      event: "coordinate_approval",
      details: `mission=${updated.factoryMissionId} approval=${updated.approvalStatus}`,
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

  produceReport(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    const mission = this.resolveMission(input);
    if (!mission) {
      return this.disabled(
        "produce_report",
        config,
        "No enterprise platform mission available for report production",
      );
    }

    const report = this.builder.buildReport(mission);
    this.store.saveReport(report, "produce_report");
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const validation = this.validator.validateReport(
      report,
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
    appendEpfcLog({
      event: "produce_report",
      details: `mission=${mission.factoryMissionId} stage=${report.currentLifecycleStage}`,
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

  produceEnterprisePlatformFactoryReport(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    const result = this.produceReport(input, config);
    return {
      ...result,
      action: "produce_enterprise_platform_factory_report" as const,
      durationMs: Date.now() - started,
    };
  }

  submitReport(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_report",
        config,
        "Executive reporting submission is disabled",
      );
    }

    const mission = this.resolveMission(input);
    if (!mission) {
      return this.disabled(
        "submit_report",
        config,
        "No enterprise platform mission available for report submission",
      );
    }

    let report =
      this.store.getReport(mission.factoryMissionId) ??
      this.builder.buildReport(mission);

    const submission = this.integrations.submitReport(report);
    if (submission.submitted && submission.executiveReportId) {
      this.store.markSubmitted(mission.factoryMissionId, submission.executiveReportId);
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
    const validation = this.validator.validateReport(
      report,
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

  list(config: EnterprisePlatformFactoryCoreConfiguration) {
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
    const latestReport = latest
      ? this.store.getReport(latest.factoryMissionId)
      : null;
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
    return this.report(
      "list",
      this.getCatalog(),
      missions,
      latest,
      latestReport,
      validation,
      started,
    );
  }

  validate(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
  ) {
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
    const latestReport = latest
      ? this.store.getReport(latest.factoryMissionId)
      : null;
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
    return this.report(
      "validate",
      this.getCatalog(),
      missions,
      latest,
      latestReport,
      validation,
      started,
    );
  }

  diagnostics(config: EnterprisePlatformFactoryCoreConfiguration) {
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
      config.enabled ? [] : ["Enterprise Platform Factory Core is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendEpfcLog({ event: "diagnostics", details: `missions=${this.store.count()}` });
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
    action: EnterprisePlatformFactoryCoreRunReport["action"],
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
    mutate: () => EnterprisePlatformMission,
  ): EnterprisePlatformFactoryCoreRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.missionRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Enterprise Platform Factory Core is disabled"
          : "Mission rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    let mission: EnterprisePlatformMission;
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
    appendEpfcLog({
      event: action,
      details: `mission=${mission.factoryMissionId} stage=${mission.currentLifecycleStage}`,
    });
    return this.report(action, this.getCatalog(), [mission], mission, null, validation, started);
  }

  private resolveMission(
    input: EnterprisePlatformFactoryCoreInput,
  ): EnterprisePlatformMission | null {
    if (input.factoryMissionId) {
      return this.store.get(input.factoryMissionId);
    }
    const latestId = this.store.getLatestMissionId();
    return latestId ? this.store.get(latestId) : null;
  }

  private boundaryFail(
    action: EnterprisePlatformFactoryCoreRunReport["action"],
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateMissions(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, null, validation, started);
  }

  private disabled(
    action: EnterprisePlatformFactoryCoreRunReport["action"],
    config: EnterprisePlatformFactoryCoreConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, null, validation, started);
  }

  private hasBoundary(input: EnterprisePlatformFactoryCoreInput) {
    return (
      input.buildFrontend === true ||
      input.buildBackend === true ||
      input.designDatabases === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ602OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: EnterprisePlatformFactoryCoreConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: EnterprisePlatformMission | null = null,
  ) {
    const mission = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `epfc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: ENTERPRISE_PLATFORM_FACTORY_CORE_ID,
      engineVersion: "PILLOW-EPFC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...EPFC_CAPABILITIES],
      totalMissions: this.store.count(),
      lastPlatformType: mission?.platformType ?? null,
      lastPipelineType: mission?.pipelineType ?? null,
      lastMissionId: mission?.factoryMissionId ?? this.store.getLatestMissionId(),
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: EPFC_METADATA_VERSION,
    };
  }

  private report(
    action: EnterprisePlatformFactoryCoreRunReport["action"],
    catalog: EnterprisePlatformFactoryCoreCatalog | null,
    missions: EnterprisePlatformMission[],
    latestMission: EnterprisePlatformMission | null,
    latestReport: EnterprisePlatformFactoryReport | null,
    validation: EnterprisePlatformFactoryCoreRunReport["validation"],
    started: number,
  ): EnterprisePlatformFactoryCoreRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      enterprisePlatformFactoryRunReportId: `epfc-run-${Date.now()}`,
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
      metadataVersion: EPFC_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: EnterprisePlatformFactoryCoreCatalog,
): EnterprisePlatformFactoryCoreCatalog {
  return {
    ...catalog,
    platformTypes: [...catalog.platformTypes],
    pipelineTypes: [...catalog.pipelineTypes],
    missions: catalog.missions.map((mission) => ({
      ...mission,
      platformPortfolio: [...mission.platformPortfolio],
      activePlatforms: [...mission.activePlatforms],
      assignedWorkers: [...mission.assignedWorkers],
      assignedWorkerRoles: [...mission.assignedWorkerRoles],
      activeDependencies: [...mission.activeDependencies],
      preservedDecisions: [...mission.preservedDecisions],
      traceabilityRefs: [...mission.traceabilityRefs],
    })),
    reports: catalog.reports.map((report) => ({
      ...report,
      platformPortfolio: [...report.platformPortfolio],
      activePlatforms: [...report.activePlatforms],
      assignedWorkers: [...report.assignedWorkers],
      assignedWorkerRoles: [...report.assignedWorkerRoles],
      activeDependencies: [...report.activeDependencies],
      traceabilityRefs: [...report.traceabilityRefs],
      preservedDecisions: [...report.preservedDecisions],
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
