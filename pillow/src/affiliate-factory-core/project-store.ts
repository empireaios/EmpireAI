import type { AffiliateBusinessProject, AffiliateFactoryReport } from "./types.js";

/** Authoritative in-memory Affiliate Business Project store — orchestration only. */
export class AfcProjectStore {
  private projects = new Map<string, AffiliateBusinessProject>();
  private reports = new Map<string, AffiliateFactoryReport>();
  private latestProjectId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    factoryProjectId: string;
    affiliateBusinessId: string;
    action: string;
    details: string;
  }> = [];

  seed(projects: AffiliateBusinessProject[]) {
    this.projects.clear();
    this.latestProjectId = null;
    this.auditTrail = [];
    for (const project of projects) {
      this.projects.set(project.factoryProjectId, cloneProject(project));
      this.latestProjectId = project.factoryProjectId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        factoryProjectId: project.factoryProjectId,
        affiliateBusinessId: project.affiliateBusinessId,
        action: "seed",
        details: `seeded affiliate business project niche=${project.businessCategory}`,
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

  getByBusinessId(affiliateBusinessId: string) {
    for (const project of this.projects.values()) {
      if (project.affiliateBusinessId === affiliateBusinessId) {
        return cloneProject(project);
      }
    }
    return null;
  }

  getReport(affiliateBusinessId: string) {
    const report = this.reports.get(affiliateBusinessId);
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

  saveCanonical(project: AffiliateBusinessProject, action = "save") {
    this.projects.set(project.factoryProjectId, cloneProject(project));
    this.latestProjectId = project.factoryProjectId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      factoryProjectId: project.factoryProjectId,
      affiliateBusinessId: project.affiliateBusinessId,
      action,
      details: `status=${project.currentStatus} lifecycle=${project.lifecycleStatus} readiness=${project.readinessStatus}`,
    });
    return cloneProject(project);
  }

  saveReport(report: AffiliateFactoryReport, action = "save_report") {
    // Reports are keyed by affiliateBusinessId (stable across a project's lifecycle).
    this.reports.set(report.affiliateBusinessId, cloneReport(report));
    this.latestReportId = report.affiliateBusinessId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      factoryProjectId: report.affiliateBusinessId,
      affiliateBusinessId: report.affiliateBusinessId,
      action,
      details: `report lifecycle=${report.lifecycleStatus} readiness=${report.readinessStatus} confidence=${report.confidenceScore}`,
    });
    return cloneReport(report);
  }

  markSubmitted(affiliateBusinessId: string, factoryProjectId: string, executiveReportId: string) {
    const current = this.projects.get(factoryProjectId);
    if (!current) return null;
    const updated: AffiliateBusinessProject = {
      ...cloneProject(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    this.saveCanonical(updated, "submit_report");
    const report = this.reports.get(affiliateBusinessId);
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

function cloneProject(project: AffiliateBusinessProject): AffiliateBusinessProject {
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

function cloneReport(report: AffiliateFactoryReport): AffiliateFactoryReport {
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
