import type { DigitalProductsFactoryCoreConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type DigitalProductsFactoryCoreDependencies,
} from "./integrations.js";
import { appendDpfLog } from "./dpf-logging.js";
import {
  DIGITAL_PRODUCTS_FACTORY_CORE_ID,
  DPF_CAPABILITIES,
  DPF_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import { MissionBuilder } from "./mission-builder.js";
import { MissionStore } from "./mission-store.js";
import { HealthMonitor, MissionValidator, RecoveryManager } from "./mission-validator.js";
import type {
  DigitalProductBusinessMission,
  DigitalProductsFactoryCoreCatalog,
  DigitalProductsFactoryCoreEngineRecord,
  DigitalProductsFactoryCoreInput,
  DigitalProductsFactoryCoreRunReport,
  DigitalProductsFactoryReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class DigitalProductsFactoryManager {
  private engineRecord: DigitalProductsFactoryCoreEngineRecord | null = null;
  private seeded = false;
  private catalog: DigitalProductsFactoryCoreCatalog | null = null;
  private readonly store = new MissionStore();
  private readonly builder = new MissionBuilder();
  private readonly validator = new MissionValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: DigitalProductsFactoryCoreDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: DigitalProductsFactoryCoreConfiguration) {
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
    config: DigitalProductsFactoryCoreConfiguration,
  ): DigitalProductsFactoryCoreRunReport {
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
    appendDpfLog({
      event: "connect",
      details: `Digital Products Factory Core connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      null,
      {
        validationReportId: `dpf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Digital Products Factory Core is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: DPF_METADATA_VERSION,
      },
      started,
    );
  }

  createDigitalProductBusinessMission(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    return this.runMissionAction(
      "create_digital_product_business_mission",
      input,
      config,
      () => {
        const mission = this.builder.buildMission(input, config);
        mission.currentStatus = "active";
        this.store.saveCanonical(mission, "create_digital_product_business_mission");
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

  registerDigitalProductBusiness(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    return this.runMissionAction(
      "register_digital_product_business",
      input,
      config,
      () => {
        const mission = this.resolveMission(input);
        if (!mission) {
          throw new Error(
            "No digital product mission available for business registration",
          );
        }
        const updated = this.builder.registerBusiness(mission, input);
        this.store.saveCanonical(updated, "register_digital_product_business");
        return updated;
      },
    );
  }

  coordinateProductCreation(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_product_creation", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No digital product mission available for product creation");
      }
      const updated = this.builder.applyProductCreation(mission);
      this.store.saveCanonical(updated, "coordinate_product_creation");
      return updated;
    });
  }

  coordinateDesignBranding(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_design_branding", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No digital product mission available for design branding");
      }
      const updated = this.builder.applyDesignBranding(mission);
      this.store.saveCanonical(updated, "coordinate_design_branding");
      return updated;
    });
  }

  coordinateSalesPage(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (input.buildSalesPages === true) {
      const validation = this.validator.finalize(
        "fail",
        ["Digital Products Factory Core must never build sales pages"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "coordinate_sales_page",
        this.getCatalog(),
        [],
        null,
        null,
        validation,
        started,
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("coordinate_sales_page", input, config, started);
    }
    return this.runMissionAction("coordinate_sales_page", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No digital product mission available for sales page coordination");
      }
      const updated = this.builder.applySalesPageCoordination(mission);
      this.store.saveCanonical(updated, "coordinate_sales_page");
      return updated;
    });
  }

  coordinateCheckout(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (input.processPayments === true) {
      const validation = this.validator.finalize(
        "fail",
        ["Digital Products Factory Core must never process payments"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "coordinate_checkout",
        this.getCatalog(),
        [],
        null,
        null,
        validation,
        started,
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("coordinate_checkout", input, config, started);
    }
    return this.runMissionAction("coordinate_checkout", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No digital product mission available for checkout coordination");
      }
      const updated = this.builder.applyCheckoutCoordination(mission);
      this.store.saveCanonical(updated, "coordinate_checkout");
      return updated;
    });
  }

  coordinateFulfilment(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_fulfilment", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No digital product mission available for fulfilment");
      }
      if (mission.approvalStatus !== "approved") {
        const blocked = this.builder.applyFulfilmentCoordination(
          mission,
          "blocked_pending_approval",
        );
        this.store.saveCanonical(blocked, "coordinate_fulfilment");
        throw new Error("Cannot coordinate fulfilment without approved status");
      }
      const fulfilmentStatus = input.fulfilmentStatus ?? "coordinating";
      const safeStatus =
        fulfilmentStatus === "fulfilled_signal" || fulfilmentStatus === "coordinating"
          ? fulfilmentStatus
          : "coordinating";
      const updated = this.builder.applyFulfilmentCoordination(mission, safeStatus);
      this.store.saveCanonical(updated, "coordinate_fulfilment");
      return updated;
    });
  }

  coordinateCustomerDelivery(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_customer_delivery", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No digital product mission available for customer delivery");
      }
      const updated = this.builder.applyCustomerDelivery(mission);
      this.store.saveCanonical(updated, "coordinate_customer_delivery");
      return updated;
    });
  }

  coordinateAnalytics(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_analytics", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No digital product mission available for analytics");
      }
      const analyticsStatus = input.analyticsStatus ?? "collecting";
      const updated = this.builder.applyAnalytics(mission, analyticsStatus);
      this.store.saveCanonical(updated, "coordinate_analytics");
      return updated;
    });
  }

  coordinateLearning(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_learning", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No digital product mission available for learning");
      }
      const learningStatus = input.learningStatus ?? "analyzing";
      const updated = this.builder.applyLearning(mission, learningStatus);
      this.store.saveCanonical(updated, "coordinate_learning");
      return updated;
    });
  }

  trackBusinessLifecycle(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("track_business_lifecycle", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No digital product mission available for lifecycle tracking");
      }
      const targetStage = input.currentPipelineStage ?? mission.currentPipelineStage;
      const updated = this.builder.advanceStage(mission, targetStage);
      this.store.saveCanonical(updated, "track_business_lifecycle");
      return updated;
    });
  }

  /** Alias for trackBusinessLifecycle. */
  manageLifecycle(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    const result = this.trackBusinessLifecycle(input, config);
    return {
      ...result,
      action: "manage_lifecycle" as const,
      durationMs: Date.now() - started,
    };
  }

  coordinateWorkers(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    return this.runMissionAction("coordinate_workers", input, config, () => {
      const mission = this.resolveMission(input);
      if (!mission) {
        throw new Error("No digital product mission available for worker coordination");
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
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);

    if (input.bypassApproval === true) {
      const existing = this.resolveMission(input);
      let blockedMission: DigitalProductBusinessMission | null = null;
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
        ["Digital Products Factory Core must never bypass approval"],
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
        "No digital product mission available for approval",
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
    appendDpfLog({
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
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
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
        "No digital product mission available for report production",
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
    appendDpfLog({
      event: "produce_report",
      details: `mission=${mission.factoryMissionId} stage=${report.currentPipelineStage}`,
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

  submitReport(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
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
        "No digital product mission available for report submission",
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

  list(config: DigitalProductsFactoryCoreConfiguration) {
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
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
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

  diagnostics(config: DigitalProductsFactoryCoreConfiguration) {
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
      config.enabled ? [] : ["Digital Products Factory Core is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendDpfLog({ event: "diagnostics", details: `missions=${this.store.count()}` });
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
    action: DigitalProductsFactoryCoreRunReport["action"],
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
    mutate: () => DigitalProductBusinessMission,
  ): DigitalProductsFactoryCoreRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.missionRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Digital Products Factory Core is disabled"
          : "Mission rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    let mission: DigitalProductBusinessMission;
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
    appendDpfLog({
      event: action,
      details: `mission=${mission.factoryMissionId} stage=${mission.currentPipelineStage}`,
    });
    return this.report(action, this.getCatalog(), [mission], mission, null, validation, started);
  }

  private resolveMission(
    input: DigitalProductsFactoryCoreInput,
  ): DigitalProductBusinessMission | null {
    if (input.factoryMissionId) {
      return this.store.get(input.factoryMissionId);
    }
    const latestId = this.store.getLatestMissionId();
    return latestId ? this.store.get(latestId) : null;
  }

  private boundaryFail(
    action: DigitalProductsFactoryCoreRunReport["action"],
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateMissions(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, null, validation, started);
  }

  private disabled(
    action: DigitalProductsFactoryCoreRunReport["action"],
    config: DigitalProductsFactoryCoreConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, null, validation, started);
  }

  private hasBoundary(input: DigitalProductsFactoryCoreInput) {
    return (
      input.createEbooks === true ||
      input.createCourses === true ||
      input.buildSalesPages === true ||
      input.processPayments === true ||
      input.bypassApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ502OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: DigitalProductsFactoryCoreConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: DigitalProductBusinessMission | null = null,
  ) {
    const mission = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `dpf-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: DIGITAL_PRODUCTS_FACTORY_CORE_ID,
      engineVersion: "PILLOW-DPF-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...DPF_CAPABILITIES],
      totalMissions: this.store.count(),
      lastProductType: mission?.productType ?? null,
      lastPipelineType: mission?.pipelineType ?? null,
      lastMissionId: mission?.factoryMissionId ?? this.store.getLatestMissionId(),
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: DPF_METADATA_VERSION,
    };
  }

  private report(
    action: DigitalProductsFactoryCoreRunReport["action"],
    catalog: DigitalProductsFactoryCoreCatalog | null,
    missions: DigitalProductBusinessMission[],
    latestMission: DigitalProductBusinessMission | null,
    latestReport: DigitalProductsFactoryReport | null,
    validation: DigitalProductsFactoryCoreRunReport["validation"],
    started: number,
  ): DigitalProductsFactoryCoreRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      digitalProductsFactoryRunReportId: `dpf-run-${Date.now()}`,
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
      metadataVersion: DPF_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: DigitalProductsFactoryCoreCatalog,
): DigitalProductsFactoryCoreCatalog {
  return {
    ...catalog,
    productTypes: [...catalog.productTypes],
    pipelineTypes: [...catalog.pipelineTypes],
    missions: catalog.missions.map((mission) => ({
      ...mission,
      productPortfolio: [...mission.productPortfolio],
      activeProducts: [...mission.activeProducts],
      assignedWorkers: [...mission.assignedWorkers],
      assignedWorkerRoles: [...mission.assignedWorkerRoles],
      preservedDecisions: [...mission.preservedDecisions],
      traceabilityRefs: [...mission.traceabilityRefs],
    })),
    reports: catalog.reports.map((report) => ({
      ...report,
      productPortfolio: [...report.productPortfolio],
      activeProducts: [...report.activeProducts],
      assignedWorkers: [...report.assignedWorkers],
      assignedWorkerRoles: [...report.assignedWorkerRoles],
      traceabilityRefs: [...report.traceabilityRefs],
      preservedDecisions: [...report.preservedDecisions],
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
