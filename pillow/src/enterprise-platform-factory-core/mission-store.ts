import type {
  EnterprisePlatformFactoryReport,
  EnterprisePlatformMission,
} from "./types.js";

/** Authoritative in-memory Enterprise Platform Mission store — orchestration only. */
export class MissionStore {
  private missions = new Map<string, EnterprisePlatformMission>();
  private reports = new Map<string, EnterprisePlatformFactoryReport>();
  private latestMissionId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    factoryMissionId: string;
    action: string;
    details: string;
  }> = [];

  seed(missions: EnterprisePlatformMission[]) {
    this.missions.clear();
    this.latestMissionId = null;
    this.auditTrail = [];
    for (const mission of missions) {
      this.missions.set(mission.factoryMissionId, cloneMission(mission));
      this.latestMissionId = mission.factoryMissionId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        factoryMissionId: mission.factoryMissionId,
        action: "seed",
        details: `seeded enterprise platform mission platform=${mission.platformId}`,
      });
    }
  }

  count() {
    return this.missions.size;
  }

  list() {
    return [...this.missions.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneMission);
  }

  listReports() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneReport);
  }

  get(missionId: string) {
    const mission = this.missions.get(missionId);
    return mission ? cloneMission(mission) : null;
  }

  getReport(reportMissionId: string) {
    const report = this.reports.get(reportMissionId);
    return report ? cloneReport(report) : null;
  }

  getLatestMissionId() {
    return this.latestMissionId;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  saveCanonical(mission: EnterprisePlatformMission, action = "save") {
    this.missions.set(mission.factoryMissionId, cloneMission(mission));
    this.latestMissionId = mission.factoryMissionId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      factoryMissionId: mission.factoryMissionId,
      action,
      details: `status=${mission.currentStatus} stage=${mission.currentLifecycleStage} approval=${mission.approvalStatus}`,
    });
    return cloneMission(mission);
  }

  saveReport(report: EnterprisePlatformFactoryReport, action = "save_report") {
    this.reports.set(report.factoryMissionId, cloneReport(report));
    this.latestReportId = report.factoryMissionId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      factoryMissionId: report.factoryMissionId,
      action,
      details: `report stage=${report.currentLifecycleStage} approval=${report.approvalStatus}`,
    });
    return cloneReport(report);
  }

  markRegistered(missionId: string, missionCoordinationRef: string) {
    const current = this.missions.get(missionId);
    if (!current) return null;
    const updated: EnterprisePlatformMission = {
      ...cloneMission(current),
      missionCoordinationRef,
      currentStatus: "active",
    };
    return this.saveCanonical(updated, "register_mission");
  }

  markSubmitted(missionId: string, executiveReportId: string) {
    const current = this.missions.get(missionId);
    if (!current) return null;
    const updated: EnterprisePlatformMission = {
      ...cloneMission(current),
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

function cloneMission(mission: EnterprisePlatformMission): EnterprisePlatformMission {
  return {
    ...mission,
    platformPortfolio: [...mission.platformPortfolio],
    activePlatforms: [...mission.activePlatforms],
    assignedWorkers: [...mission.assignedWorkers],
    assignedWorkerRoles: [...mission.assignedWorkerRoles],
    activeDependencies: [...mission.activeDependencies],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
  };
}

function cloneReport(report: EnterprisePlatformFactoryReport): EnterprisePlatformFactoryReport {
  return {
    ...report,
    platformPortfolio: [...report.platformPortfolio],
    activePlatforms: [...report.activePlatforms],
    assignedWorkers: [...report.assignedWorkers],
    assignedWorkerRoles: [...report.assignedWorkerRoles],
    activeDependencies: [...report.activeDependencies],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: [...report.preservedDecisions],
  };
}
