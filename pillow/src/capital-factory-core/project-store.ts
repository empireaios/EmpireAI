import type { CapitalProject, CapitalFactoryReport } from "./types.js";

/** Authoritative in-memory Capital Project store — orchestration only. */
export class AfcProjectStore {
  private projects = new Map<string, CapitalProject>();
  private reports = new Map<string, CapitalFactoryReport>();
  private latestProjectId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    factoryProjectId: string;
    capitalBusinessId: string;
    action: string;
    details: string;
  }> = [];

  seed(projects: CapitalProject[]) {
    this.projects.clear();
    this.latestProjectId = null;
    this.auditTrail = [];
    for (const project of projects) {
      this.projects.set(project.factoryProjectId, cloneProject(project));
      this.latestProjectId = project.factoryProjectId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        factoryProjectId: project.factoryProjectId,
        capitalBusinessId: project.capitalBusinessId,
        action: "seed",
        details: `seeded capital project niche=${project.capitalCategory}`,
      });
    }
  }

  count() {
    return this.projects.size;
  }

  list() {
    return [...this.projects.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneProject);
  }

  listReports() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneReport);
  }

  get(factoryProjectId: string) {
    const project = this.projects.get(factoryProjectId);
    return project ? cloneProject(project) : null;
  }

  getByBusinessId(capitalBusinessId: string) {
    for (const project of this.projects.values()) {
      if (project.capitalBusinessId === capitalBusinessId) {
        return cloneProject(project);
      }
    }
    return null;
  }

  getReport(capitalBusinessId: string) {
    const report = this.reports.get(capitalBusinessId);
    return report ? cloneReport(report) : null;
  }

  getLatestProjectId() {
    return this.latestProjectId;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  saveCanonical(project: CapitalProject, action = "save") {
    this.projects.set(project.factoryProjectId, cloneProject(project));
    this.latestProjectId = project.factoryProjectId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      factoryProjectId: project.factoryProjectId,
      capitalBusinessId: project.capitalBusinessId,
      action,
      details: `status=${project.currentStatus} lifecycle=${project.lifecycleStatus} readiness=${project.readinessStatus}`,
    });
    return cloneProject(project);
  }

  saveReport(report: CapitalFactoryReport, action = "save_report") {
    // Reports are keyed by capitalBusinessId (stable across a project's lifecycle).
    this.reports.set(report.capitalBusinessId, cloneReport(report));
    this.latestReportId = report.capitalBusinessId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      factoryProjectId: report.capitalBusinessId,
      capitalBusinessId: report.capitalBusinessId,
      action,
      details: `report lifecycle=${report.lifecycleStatus} readiness=${report.readinessStatus} confidence=${report.confidenceScore}`,
    });
    return cloneReport(report);
  }

  markSubmitted(capitalBusinessId: string, factoryProjectId: string, executiveReportId: string) {
    const current = this.projects.get(factoryProjectId);
    if (!current) return null;
    const updated: CapitalProject = {
      ...cloneProject(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    this.saveCanonical(updated, "submit_report");
    const report = this.reports.get(capitalBusinessId);
    if (report) {
      this.saveReport(
        {
          ...cloneReport(report),
          submittedToExecutiveReporting: true,
          executiveReportId,
        },
        "submit_report",
      );
    }
    return updated;
  }
}

function cloneProject(project: CapitalProject): CapitalProject {
  return {
    ...project,
    workerStatusMatrix: project.workerStatusMatrix.map((e) => ({ ...e })),
    dependencyGraph: project.dependencyGraph.map((e) => ({ ...e })),
    outstandingTasks: [...project.outstandingTasks],
    risks: [...project.risks],
    metadata: { ...project.metadata },
    traceabilityRefs: [...project.traceabilityRefs],
    progressSummary: { ...project.progressSummary },
  };
}

function cloneReport(report: CapitalFactoryReport): CapitalFactoryReport {
  return {
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
  };
}
