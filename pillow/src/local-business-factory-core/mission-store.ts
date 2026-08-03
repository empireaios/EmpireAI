import type {
  LocalBusinessFactoryReport,
  LocalBusinessProject,
} from "./types.js";

/** Authoritative in-memory Local Business Project store — orchestration only. */
export class MissionStore {
  private projects = new Map<string, LocalBusinessProject>();
  private reports = new Map<string, LocalBusinessFactoryReport>();
  private latestProjectId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    factoryMissionId: string;
    businessProjectId: string;
    action: string;
    details: string;
  }> = [];

  seed(projects: LocalBusinessProject[]) {
    this.projects.clear();
    this.latestProjectId = null;
    this.auditTrail = [];
    for (const project of projects) {
      this.projects.set(project.factoryMissionId, cloneProject(project));
      this.latestProjectId = project.factoryMissionId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        factoryMissionId: project.factoryMissionId,
        businessProjectId: project.businessProjectId,
        action: "seed",
        details: `seeded local business project category=${project.businessCategory}`,
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

  get(missionId: string) {
    const project = this.projects.get(missionId);
    return project ? cloneProject(project) : null;
  }

  getByProjectId(businessProjectId: string) {
    for (const project of this.projects.values()) {
      if (project.businessProjectId === businessProjectId) {
        return cloneProject(project);
      }
    }
    return null;
  }

  getReport(reportMissionId: string) {
    const report = this.reports.get(reportMissionId);
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

  saveCanonical(project: LocalBusinessProject, action = "save") {
    this.projects.set(project.factoryMissionId, cloneProject(project));
    this.latestProjectId = project.factoryMissionId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      factoryMissionId: project.factoryMissionId,
      businessProjectId: project.businessProjectId,
      action,
      details: `status=${project.currentStatus} stage=${project.currentLifecycleStage} approval=${project.approvalStatus}`,
    });
    return cloneProject(project);
  }

  saveReport(report: LocalBusinessFactoryReport, action = "save_report") {
    this.reports.set(report.factoryMissionId, cloneReport(report));
    this.latestReportId = report.factoryMissionId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      factoryMissionId: report.factoryMissionId,
      businessProjectId: report.businessProjectId,
      action,
      details: `report stage=${report.currentLifecycleStage} approval=${report.approvalStatus} confidence=${report.confidenceScore}`,
    });
    return cloneReport(report);
  }

  markRegistered(missionId: string, missionCoordinationRef: string) {
    const current = this.projects.get(missionId);
    if (!current) return null;
    const updated: LocalBusinessProject = {
      ...cloneProject(current),
      missionCoordinationRef,
      currentStatus: "active",
    };
    return this.saveCanonical(updated, "register_project");
  }

  markSubmitted(missionId: string, executiveReportId: string) {
    const current = this.projects.get(missionId);
    if (!current) return null;
    const updated: LocalBusinessProject = {
      ...cloneProject(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    this.saveCanonical(updated, "submit_report");
    const report = this.reports.get(missionId);
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

function cloneProject(project: LocalBusinessProject): LocalBusinessProject {
  return {
    ...project,
    assignedWorkers: [...project.assignedWorkers],
    assignedWorkerRoles: [...project.assignedWorkerRoles],
    outstandingIssues: [...project.outstandingIssues],
    preservedDecisions: [...project.preservedDecisions],
    traceabilityRefs: [...project.traceabilityRefs],
  };
}

function cloneReport(report: LocalBusinessFactoryReport): LocalBusinessFactoryReport {
  return {
    ...report,
    assignedWorkers: [...report.assignedWorkers],
    assignedWorkerRoles: [...report.assignedWorkerRoles],
    outstandingIssues: [...report.outstandingIssues],
    preservedDecisions: [...report.preservedDecisions],
    traceabilityRefs: [...report.traceabilityRefs],
  };
}
