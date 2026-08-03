import type { LocalBusinessFactoryCoreConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type LocalBusinessFactoryCoreDependencies,
} from "./integrations.js";
import { appendLbfcLog } from "./lbfc-logging.js";
import {
  INTEGRATION_TARGETS,
  LBFC_CAPABILITIES,
  LBFC_METADATA_VERSION,
  LOCAL_BUSINESS_FACTORY_CORE_ID,
} from "./paths.js";
import { MissionBuilder } from "./mission-builder.js";
import { MissionStore } from "./mission-store.js";
import { HealthMonitor, MissionValidator, RecoveryManager } from "./mission-validator.js";
import type {
  IntegrationHandshake,
  LocalBusinessFactoryCoreCatalog,
  LocalBusinessFactoryCoreEngineRecord,
  LocalBusinessFactoryCoreInput,
  LocalBusinessFactoryCoreRunReport,
  LocalBusinessFactoryReport,
  LocalBusinessProject,
  OperationalState,
} from "./types.js";

export class LocalBusinessFactoryManager {
  private engineRecord: LocalBusinessFactoryCoreEngineRecord | null = null;
  private seeded = false;
  private catalog: LocalBusinessFactoryCoreCatalog | null = null;
  private readonly store = new MissionStore();
  private readonly builder = new MissionBuilder();
  private readonly validator = new MissionValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: LocalBusinessFactoryCoreDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: LocalBusinessFactoryCoreConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedProjects);
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

  getProjects() {
    return this.store.list();
  }

  getReports() {
    return this.store.listReports();
  }

  getLatestProjectId() {
    return this.store.getLatestProjectId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: LocalBusinessFactoryCoreConfiguration,
  ): LocalBusinessFactoryCoreRunReport {
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
    appendLbfcLog({
      event: "connect",
      details: `Local Business Factory Core connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      null,
      {
        validationReportId: `lbfc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Local Business Factory Core is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: LBFC_METADATA_VERSION,
      },
      started,
    );
  }

  registerLocalBusinessProject(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    return this.runProjectAction("register_local_business_project", input, config, () => {
      const existing = this.resolveProject(input);
      let project: LocalBusinessProject;
      if (existing) {
        project = this.builder.registerLocalBusinessProject(existing, input);
      } else {
        project = this.builder.buildProject(input, config);
        project = this.builder.registerLocalBusinessProject(project, input);
      }
      this.store.saveCanonical(project, "register_local_business_project");
      if (config.missionCoordinationEnabled) {
        const registration = this.integrations.registerMission(project);
        if (registration.registered && registration.missionCoordinationRef) {
          this.store.markRegistered(
            project.factoryMissionId,
            registration.missionCoordinationRef,
          );
        }
      }
      return this.store.get(project.factoryMissionId)!;
    });
  }

  coordinateLifecycle(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    return this.runProjectAction("coordinate_lifecycle", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error("No local business project available for lifecycle coordination");
      }
      const targetStage = input.currentLifecycleStage ?? project.currentLifecycleStage;
      const updated = this.builder.advanceStage(project, targetStage);
      this.store.saveCanonical(updated, "coordinate_lifecycle");
      return updated;
    });
  }

  trackProjectProgress(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    const result = this.coordinateLifecycle(input, config);
    return {
      ...result,
      action: "track_project_progress" as const,
      durationMs: Date.now() - started,
    };
  }

  coordinateWorkers(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    return this.runProjectAction("coordinate_workers", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error("No local business project available for worker coordination");
      }
      const requestedWorkers = input.assignedWorkers ?? [];
      const requestedRoles = input.assignedWorkerRoles ?? [];
      const assignment = this.integrations.assignWorkers(
        project,
        requestedWorkers,
        requestedRoles,
      );
      const updated = this.builder.assignWorkers(
        project,
        assignment.assignedWorkers,
        assignment.assignedWorkerRoles,
      );
      this.store.saveCanonical(updated, "coordinate_workers");
      return updated;
    });
  }

  assignWorkers(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    const result = this.coordinateWorkers(input, config);
    return {
      ...result,
      action: "assign_workers" as const,
      durationMs: Date.now() - started,
    };
  }

  coordinateApproval(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);

    if (input.bypassGrandKingApproval === true || input.bypassApproval === true) {
      const existing = this.resolveProject(input);
      let blockedProject: LocalBusinessProject | null = null;
      if (existing) {
        blockedProject = this.builder.applyApproval(
          existing,
          "blocked_bypass_attempt",
          false,
        );
        this.store.saveCanonical(blockedProject, "coordinate_approval");
      }
      const validation = this.validator.finalize(
        "fail",
        ["Local Business Factory Core must never bypass Grand King approval"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed", blockedProject);
      return this.report(
        "coordinate_approval",
        this.getCatalog(),
        blockedProject ? [blockedProject] : [],
        blockedProject,
        null,
        validation,
        started,
      );
    }

    if (this.hasBoundary(input)) {
      return this.boundaryFail("coordinate_approval", input, config, started);
    }

    const project = this.resolveProject(input);
    if (!project) {
      return this.disabled(
        "coordinate_approval",
        config,
        "No local business project available for approval",
      );
    }

    let approvalStatus = input.approvalStatus ?? project.approvalStatus;
    const grandKingApproved =
      input.grandKingApproved === true ||
      project.preservedDecisions.includes("grand_king_approved=true");

    if (approvalStatus === "approved") {
      if (!grandKingApproved && config.requireGrandKingApproval) {
        const validation = this.validator.finalize(
          "fail",
          ["Cannot approve without Grand King approval"],
          [],
          started,
        );
        this.recovery.recordFailure();
        this.ensureRecord("failed", config, "failed", project);
        return this.report(
          "coordinate_approval",
          this.getCatalog(),
          [project],
          project,
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

    const updated = this.builder.applyApproval(project, approvalStatus, grandKingApproved);
    this.store.saveCanonical(updated, "coordinate_approval");
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const validation = this.validator.validateProjects(
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
    appendLbfcLog({
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

  coordinateLaunchReadiness(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    return this.runProjectAction("coordinate_launch_readiness", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error("No local business project available for launch readiness");
      }
      const launchReadiness = input.launchReadiness ?? "in_progress";
      const safeStatus =
        launchReadiness === "ready" ||
        launchReadiness === "blocked" ||
        launchReadiness === "launched" ||
        launchReadiness === "in_progress" ||
        launchReadiness === "not_started"
          ? launchReadiness
          : "in_progress";
      const updated = this.builder.applyLaunchReadiness(project, safeStatus);
      this.store.saveCanonical(updated, "coordinate_launch_readiness");
      return updated;
    });
  }

  coordinateCustomerAcquisition(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    return this.runProjectAction("coordinate_customer_acquisition", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error(
          "No local business project available for customer acquisition coordination",
        );
      }
      const status = input.customerAcquisitionStatus ?? "coordinating";
      const safeStatus =
        status === "active" ||
        status === "paused" ||
        status === "completed" ||
        status === "blocked" ||
        status === "coordinating" ||
        status === "not_started"
          ? status
          : "coordinating";
      const updated = this.builder.applyCustomerAcquisition(project, safeStatus);
      this.store.saveCanonical(updated, "coordinate_customer_acquisition");
      return updated;
    });
  }

  coordinateFulfilment(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    return this.runProjectAction("coordinate_fulfilment", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error("No local business project available for fulfilment coordination");
      }
      const updated = this.builder.applyFulfilment(project);
      this.store.saveCanonical(updated, "coordinate_fulfilment");
      return updated;
    });
  }

  coordinateOngoingOperations(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    return this.runProjectAction("coordinate_ongoing_operations", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error(
          "No local business project available for ongoing operations coordination",
        );
      }
      // Never fabricate operational success — only use explicitly supplied observed status.
      const operationalStatus = input.operationalStatus ?? "coordinating";
      const updated = this.builder.applyOngoingOperations(project, operationalStatus);
      this.store.saveCanonical(updated, "coordinate_ongoing_operations");
      return updated;
    });
  }

  produceReport(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    const project = this.resolveProject(input);
    if (!project) {
      return this.disabled(
        "produce_report",
        config,
        "No local business project available for report production",
      );
    }

    const report = this.builder.buildReport(project);
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
      project,
    );
    appendLbfcLog({
      event: "produce_report",
      details: `mission=${project.factoryMissionId} stage=${report.currentLifecycleStage}`,
    });
    return this.report(
      "produce_report",
      this.getCatalog(),
      [project],
      project,
      report,
      validation,
      started,
    );
  }

  produceLocalBusinessFactoryReport(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    const result = this.produceReport(input, config);
    return {
      ...result,
      action: "produce_local_business_factory_report" as const,
      durationMs: Date.now() - started,
    };
  }

  submitReport(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
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

    const project = this.resolveProject(input);
    if (!project) {
      return this.disabled(
        "submit_report",
        config,
        "No local business project available for report submission",
      );
    }

    let report =
      this.store.getReport(project.factoryMissionId) ??
      this.builder.buildReport(project);

    const submission = this.integrations.submitReport(report);
    if (submission.submitted && submission.executiveReportId) {
      this.store.markSubmitted(project.factoryMissionId, submission.executiveReportId);
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
      project,
    );
    return this.report(
      "submit_report",
      this.getCatalog(),
      [project],
      project,
      report,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: LocalBusinessFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const projects = this.store.list();
    const latest = projects[projects.length - 1] ?? null;
    const latestReport = latest
      ? this.store.getReport(latest.factoryMissionId)
      : null;
    const validation = this.validator.validateProjects(
      projects.length ? projects : null,
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
      projects,
      latest,
      latestReport,
      validation,
      started,
    );
  }

  validate(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const projects = this.store.list();
    const latest = projects[projects.length - 1] ?? null;
    const latestReport = latest
      ? this.store.getReport(latest.factoryMissionId)
      : null;
    const validation = this.validator.validateProjects(
      projects.length ? projects : null,
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
      projects,
      latest,
      latestReport,
      validation,
      started,
    );
  }

  diagnostics(config: LocalBusinessFactoryCoreConfiguration) {
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
      config.enabled ? [] : ["Local Business Factory Core is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendLbfcLog({ event: "diagnostics", details: `projects=${this.store.count()}` });
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

  runDiagnostics(config: LocalBusinessFactoryCoreConfiguration) {
    return this.diagnostics(config);
  }

  private runProjectAction(
    action: LocalBusinessFactoryCoreRunReport["action"],
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
    mutate: () => LocalBusinessProject,
  ): LocalBusinessFactoryCoreRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.missionRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Local Business Factory Core is disabled"
          : "Mission rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    let project: LocalBusinessProject;
    try {
      project = mutate();
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
    const validation = this.validator.validateProjects(
      [project],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      project,
    );
    appendLbfcLog({
      event: action,
      details: `mission=${project.factoryMissionId} stage=${project.currentLifecycleStage}`,
    });
    return this.report(action, this.getCatalog(), [project], project, null, validation, started);
  }

  private resolveProject(
    input: LocalBusinessFactoryCoreInput,
  ): LocalBusinessProject | null {
    if (input.factoryMissionId) {
      return this.store.get(input.factoryMissionId);
    }
    if (input.businessProjectId) {
      return this.store.getByProjectId(input.businessProjectId);
    }
    const latestId = this.store.getLatestProjectId();
    return latestId ? this.store.get(latestId) : null;
  }

  private boundaryFail(
    action: LocalBusinessFactoryCoreRunReport["action"],
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateProjects(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, null, validation, started);
  }

  private disabled(
    action: LocalBusinessFactoryCoreRunReport["action"],
    config: LocalBusinessFactoryCoreConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, null, validation, started);
  }

  private hasBoundary(input: LocalBusinessFactoryCoreInput) {
    return (
      input.performSpecialistWork === true ||
      input.replaceQ7Workers === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.fabricateOperationalStatus === true ||
      input.implementQ702OrLater === true ||
      input.modifyUnrelatedFactories === true ||
      input.overrideApprovedArchitecture === true ||
      (!!input.missionId &&
        /^(Q7-0[2-9]|Q7-\d{2,}|Q[8-9]-\d+)/i.test(input.missionId.trim()))
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: LocalBusinessFactoryCoreConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: LocalBusinessProject | null = null,
  ) {
    const project = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `lbfc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: LOCAL_BUSINESS_FACTORY_CORE_ID,
      engineVersion: "PILLOW-LBFC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...LBFC_CAPABILITIES],
      totalProjects: this.store.count(),
      lastBusinessCategory: project?.businessCategory ?? null,
      lastProjectId: project?.businessProjectId ?? this.store.getLatestProjectId(),
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: LBFC_METADATA_VERSION,
    };
  }

  private report(
    action: LocalBusinessFactoryCoreRunReport["action"],
    catalog: LocalBusinessFactoryCoreCatalog | null,
    projects: LocalBusinessProject[],
    latestProject: LocalBusinessProject | null,
    latestReport: LocalBusinessFactoryReport | null,
    validation: LocalBusinessFactoryCoreRunReport["validation"],
    started: number,
  ): LocalBusinessFactoryCoreRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      localBusinessFactoryRunReportId: `lbfc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      projects,
      latestProject,
      latestReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: LBFC_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: LocalBusinessFactoryCoreCatalog,
): LocalBusinessFactoryCoreCatalog {
  return {
    ...catalog,
    businessCategories: [...catalog.businessCategories],
    lifecycleStages: [...catalog.lifecycleStages],
    projects: catalog.projects.map((project) => ({
      ...project,
      assignedWorkers: [...project.assignedWorkers],
      assignedWorkerRoles: [...project.assignedWorkerRoles],
      outstandingIssues: [...project.outstandingIssues],
      preservedDecisions: [...project.preservedDecisions],
      traceabilityRefs: [...project.traceabilityRefs],
    })),
    reports: catalog.reports.map((report) => ({
      ...report,
      assignedWorkers: [...report.assignedWorkers],
      assignedWorkerRoles: [...report.assignedWorkerRoles],
      outstandingIssues: [...report.outstandingIssues],
      preservedDecisions: [...report.preservedDecisions],
      traceabilityRefs: [...report.traceabilityRefs],
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
