import type { AffiliateFactoryCoreConfiguration } from "./configuration.js";
import {
  AfcIntegrationCoordinator,
  type AffiliateFactoryCoreDependencies,
} from "./integrations.js";
import { appendAfcLog } from "./afc-logging.js";
import {
  AFC_CAPABILITIES,
  AFC_METADATA_VERSION,
  AFFILIATE_FACTORY_CORE_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import { AfcProjectBuilder } from "./project-builder.js";
import { AfcProjectStore } from "./project-store.js";
import { AfcValidator, HealthMonitor, RecoveryManager } from "./project-validator.js";
import type {
  AfcInput,
  AffiliateBusinessProject,
  AffiliateFactoryCoreCatalog,
  AffiliateFactoryCoreEngineRecord,
  AffiliateFactoryCoreRunReport,
  AffiliateFactoryReport,
  FactoryReadinessSnapshot,
  IntegrationHandshake,
  OperationalState,
  Q802ConsumableContract,
  ReadinessStatus,
} from "./types.js";

const FORBIDDEN_MISSION_ID = /^(Q8-0[2-9]|Q8-\d{2,}|Q9-\d+)/i;

export class AffiliateFactoryManager {
  private engineRecord: AffiliateFactoryCoreEngineRecord | null = null;
  private seeded = false;
  private catalog: AffiliateFactoryCoreCatalog | null = null;
  private readonly store = new AfcProjectStore();
  private readonly builder = new AfcProjectBuilder();
  private readonly validator = new AfcValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new AfcIntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: AffiliateFactoryCoreDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: AffiliateFactoryCoreConfiguration) {
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

  getLatestAffiliateBusinessId() {
    const id = this.store.getLatestProjectId();
    if (!id) return null;
    return this.store.get(id)?.affiliateBusinessId ?? null;
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getQ802ConsumableContract(config: AffiliateFactoryCoreConfiguration): Q802ConsumableContract {
    return this.builder.buildQ802ConsumableContract(config);
  }

  connect(
    _input: Record<string, unknown>,
    config: AffiliateFactoryCoreConfiguration,
  ): AffiliateFactoryCoreRunReport {
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
    appendAfcLog({
      event: "connect",
      details: `Affiliate Factory Core connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      null,
      null,
      {
        validationReportId: `afc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Affiliate Factory Core is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: AFC_METADATA_VERSION,
      },
      started,
    );
  }

  registerAffiliateBusinessProject(
    input: AfcInput,
    config: AffiliateFactoryCoreConfiguration,
  ) {
    return this.runProjectAction("register_affiliate_business_project", input, config, () => {
      const existing = this.resolveProject(input);
      const project = this.builder.registerAffiliateBusinessProject(input, config, existing);
      return this.store.saveCanonical(project, "register_affiliate_business_project");
    });
  }

  coordinateLifecycle(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
    return this.runProjectAction("coordinate_lifecycle", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error("No affiliate business project available for lifecycle coordination");
      }
      const targetStage = input.lifecycleTarget ?? input.currentLifecycleStage ?? project.lifecycleStatus;
      const updated = this.builder.advanceLifecycle(project, targetStage);
      return this.store.saveCanonical(updated, "coordinate_lifecycle");
    });
  }

  trackProjectStatus(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
    return this.runProjectAction("track_project_status", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error("No affiliate business project available for status tracking");
      }
      const target = input.lifecycleTarget ?? input.currentLifecycleStage ?? null;
      const updated = target
        ? this.builder.advanceLifecycle(project, target)
        : this.builder.refreshComputed(project);
      return this.store.saveCanonical(updated, "track_project_status");
    });
  }

  trackProjectProgress(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
    const started = Date.now();
    const result = this.trackProjectStatus(input, config);
    return { ...result, action: "track_project_progress" as const, durationMs: Date.now() - started };
  }

  coordinateWorkers(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
    return this.runProjectAction("coordinate_workers", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error("No affiliate business project available for worker coordination");
      }
      const requestedRoles = input.workerRoles ?? [];
      const requestedWorkers = input.assignedWorkers ?? [];
      this.integrations.coordinateWorkers(project, requestedRoles, requestedWorkers);
      const updated = this.builder.coordinateWorkers(
        project,
        requestedRoles,
        requestedWorkers,
        (input.workerStatusUpdates ?? []).map((u) => ({
          workerRole: u.workerRole,
          workerId: u.workerId ?? null,
          status: u.status ?? null,
          notes: u.notes ?? null,
        })),
      );
      return this.store.saveCanonical(updated, "coordinate_workers");
    });
  }

  assignWorkers(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
    const started = Date.now();
    const result = this.coordinateWorkers(input, config);
    return { ...result, action: "assign_workers" as const, durationMs: Date.now() - started };
  }

  manageWorkerDependencies(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
    return this.runProjectAction("manage_worker_dependencies", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error("No affiliate business project available for dependency management");
      }
      const edges = (input.dependencyEdges ?? []).map((e) => ({
        fromRole: e.fromRole,
        toRole: e.toRole,
        dependencyType: e.dependencyType ?? null,
        notes: e.notes ?? null,
      }));
      const updated = this.builder.manageWorkerDependencies(project, edges);
      return this.store.saveCanonical(updated, "manage_worker_dependencies");
    });
  }

  maintainBusinessMetadata(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
    return this.runProjectAction("maintain_business_metadata", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error("No affiliate business project available for metadata maintenance");
      }
      const updated = this.builder.maintainBusinessMetadata(project, input.metadata ?? {});
      return this.store.saveCanonical(updated, "maintain_business_metadata");
    });
  }

  monitorFactoryReadiness(config: AffiliateFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const projects = this.store.list();
    const readiness = this.buildFactoryReadiness(projects);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Affiliate Factory Core is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendAfcLog({
      event: "monitor_factory_readiness",
      details: `projects=${projects.length} overall=${readiness.overallReadiness}`,
    });
    return this.report(
      "monitor_factory_readiness",
      this.getCatalog(),
      projects,
      projects.at(-1) ?? null,
      null,
      readiness,
      validation,
      started,
    );
  }

  produceExecutiveSummary(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
    return this.runProjectAction("produce_executive_summary", input, config, () => {
      const project = this.resolveProject(input);
      if (!project) {
        throw new Error("No affiliate business project available for executive summary");
      }
      const updated = this.builder.applyExecutiveSummary(project);
      return this.store.saveCanonical(updated, "produce_executive_summary");
    });
  }

  produceReport(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
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
        "No affiliate business project available for report production",
      );
    }

    const validation = this.validator.validateProjects(
      [project],
      { ...input, validated: input.validated ?? true },
      started,
    );
    const report = this.builder.buildReport(project, validation);
    this.store.saveReport(report, "produce_report");
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const reportValidation = this.validator.validateReport(
      report,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (reportValidation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      reportValidation.decision === "fail" ? "failed" : "passed",
      project,
    );
    appendAfcLog({
      event: "produce_report",
      details: `business=${project.affiliateBusinessId} lifecycle=${report.lifecycleStatus}`,
    });
    return this.report(
      "produce_report",
      this.getCatalog(),
      [project],
      project,
      report,
      null,
      reportValidation,
      started,
    );
  }

  produceAffiliateFactoryReport(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
    const started = Date.now();
    const result = this.produceReport(input, config);
    return {
      ...result,
      action: "produce_affiliate_factory_report" as const,
      durationMs: Date.now() - started,
    };
  }

  submitReport(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }

    const project = this.resolveProject(input);
    if (!project) {
      return this.disabled(
        "submit_report",
        config,
        "No affiliate business project available for report submission",
      );
    }

    let report =
      this.store.getReport(project.affiliateBusinessId) ?? this.builder.buildReport(project, null);

    const audit = this.integrations.recordAudit(report);
    let workingProject = project;
    if (audit.audited) {
      workingProject = this.builder.applyAuditStatus(project, "passed");
      this.store.saveCanonical(workingProject, "record_audit");
      report = { ...report, auditStatus: "passed" };
      this.store.saveReport(report, "record_audit");
    } else if (report.auditStatus === "not_audited") {
      report = { ...report, auditStatus: "pending" };
      this.store.saveReport(report, "record_audit_pending");
    }

    const submission = this.integrations.submitReport(report);
    if (submission.submitted && submission.executiveReportId) {
      this.store.markSubmitted(
        project.affiliateBusinessId,
        project.factoryProjectId,
        submission.executiveReportId,
      );
      report = {
        ...report,
        submittedToExecutiveReporting: true,
        executiveReportId: submission.executiveReportId,
      };
      this.store.saveReport(report, "submit_report");
    }
    this.integrations.recordMemory(report);

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
      workingProject,
    );
    return this.report(
      "submit_report",
      this.getCatalog(),
      [workingProject],
      workingProject,
      report,
      null,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: AffiliateFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const projects = this.store.list();
    const latest = projects.at(-1) ?? null;
    const latestReport = latest ? this.store.getReport(latest.affiliateBusinessId) : null;
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
      null,
      validation,
      started,
    );
  }

  validate(input: AfcInput, config: AffiliateFactoryCoreConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.list(),
      this.store.listReports(),
      this.handshakes,
    );
    const projects = this.store.list();
    const latest = projects.at(-1) ?? null;
    const latestReport = latest ? this.store.getReport(latest.affiliateBusinessId) : null;
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
      null,
      validation,
      started,
    );
  }

  diagnostics(config: AffiliateFactoryCoreConfiguration) {
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
      config.enabled ? [] : ["Affiliate Factory Core is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendAfcLog({ event: "diagnostics", details: `projects=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      null,
      null,
      validation,
      started,
    );
  }

  runDiagnostics(config: AffiliateFactoryCoreConfiguration) {
    return this.diagnostics(config);
  }

  private buildFactoryReadiness(projects: AffiliateBusinessProject[]): FactoryReadinessSnapshot {
    const readinessBreakdown: Record<ReadinessStatus, number> = {
      not_ready: 0,
      partial: 0,
      ready: 0,
      blocked: 0,
      unknown: 0,
    };
    for (const project of projects) {
      readinessBreakdown[project.readinessStatus] += 1;
    }
    const overallReadiness: ReadinessStatus =
      projects.length === 0
        ? "unknown"
        : readinessBreakdown.blocked > 0
          ? "blocked"
          : readinessBreakdown.ready === projects.length
            ? "ready"
            : readinessBreakdown.ready > 0 || readinessBreakdown.partial > 0
              ? "partial"
              : readinessBreakdown.unknown === projects.length
                ? "unknown"
                : "not_ready";
    return {
      totalProjects: projects.length,
      readinessBreakdown,
      overallReadiness,
      projects: projects.map((p) => ({
        affiliateBusinessId: p.affiliateBusinessId,
        businessName: p.businessName,
        readinessStatus: p.readinessStatus,
        lifecycleStatus: p.lifecycleStatus,
      })),
    };
  }

  private runProjectAction(
    action: AffiliateFactoryCoreRunReport["action"],
    input: AfcInput,
    config: AffiliateFactoryCoreConfiguration,
    mutate: () => AffiliateBusinessProject,
  ): AffiliateFactoryCoreRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.projectRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Affiliate Factory Core is disabled" : "Project rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    let project: AffiliateBusinessProject;
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
      return this.report(action, this.getCatalog(), [], null, null, null, validation, started);
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
    appendAfcLog({
      event: action,
      details: `business=${project.affiliateBusinessId} lifecycle=${project.lifecycleStatus}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      [project],
      project,
      null,
      null,
      validation,
      started,
    );
  }

  private resolveProject(input: AfcInput): AffiliateBusinessProject | null {
    if (input.factoryProjectId) {
      return this.store.get(input.factoryProjectId);
    }
    if (input.affiliateBusinessId) {
      return this.store.getByBusinessId(input.affiliateBusinessId);
    }
    const latestId = this.store.getLatestProjectId();
    return latestId ? this.store.get(latestId) : null;
  }

  private boundaryFail(
    action: AffiliateFactoryCoreRunReport["action"],
    input: AfcInput,
    config: AffiliateFactoryCoreConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateProjects(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, null, null, validation, started);
  }

  private disabled(
    action: AffiliateFactoryCoreRunReport["action"],
    config: AffiliateFactoryCoreConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, null, null, validation, started);
  }

  private hasBoundary(input: AfcInput) {
    return (
      input.discoverAffiliateProgrammes === true ||
      input.generateAffiliateContent === true ||
      input.launchBusinessesAutomatically === true ||
      input.fabricateWorkerStatus === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ802OrLater === true ||
      (!!input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: AffiliateFactoryCoreConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: AffiliateBusinessProject | null = null,
  ) {
    const project = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `afc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: AFFILIATE_FACTORY_CORE_ID,
      engineVersion: "PILLOW-AFC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...AFC_CAPABILITIES],
      totalProjects: this.store.count(),
      lastBusinessCategory: project?.businessCategory ?? null,
      lastProjectId: project?.affiliateBusinessId ?? this.getLatestAffiliateBusinessId(),
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: AFC_METADATA_VERSION,
    };
  }

  private report(
    action: AffiliateFactoryCoreRunReport["action"],
    catalog: AffiliateFactoryCoreCatalog | null,
    projects: AffiliateBusinessProject[],
    latestProject: AffiliateBusinessProject | null,
    latestReport: AffiliateFactoryReport | null,
    factoryReadiness: FactoryReadinessSnapshot | null,
    validation: AffiliateFactoryCoreRunReport["validation"],
    started: number,
  ): AffiliateFactoryCoreRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      affiliateFactoryRunReportId: `afc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      projects,
      latestProject,
      latestReport,
      factoryReadiness,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: AFC_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: AffiliateFactoryCoreCatalog): AffiliateFactoryCoreCatalog {
  return {
    ...catalog,
    affiliateNiches: [...catalog.affiliateNiches],
    lifecycleStatuses: [...catalog.lifecycleStatuses],
    workerRoles: [...catalog.workerRoles],
    projects: catalog.projects.map((project) => ({
      ...project,
      workerStatusMatrix: project.workerStatusMatrix.map((e) => ({ ...e })),
      dependencyGraph: project.dependencyGraph.map((e) => ({ ...e })),
      outstandingTasks: [...project.outstandingTasks],
      risks: [...project.risks],
      metadata: { ...project.metadata },
      traceabilityRefs: [...project.traceabilityRefs],
      progressSummary: { ...project.progressSummary },
    })),
    reports: catalog.reports.map((report) => ({
      ...report,
      workerStatusMatrix: report.workerStatusMatrix.map((e) => ({ ...e })),
      dependencyGraph: report.dependencyGraph.map((e) => ({ ...e })),
      outstandingTasks: [...report.outstandingTasks],
      risks: [...report.risks],
      metadata: { ...report.metadata },
      traceabilityRefs: [...report.traceabilityRefs],
      progressSummary: { ...report.progressSummary },
      validation: report.validation
        ? {
            ...report.validation,
            errors: [...report.validation.errors],
            warnings: [...report.validation.warnings],
          }
        : null,
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
