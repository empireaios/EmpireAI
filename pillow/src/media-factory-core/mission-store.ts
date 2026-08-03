import type { MediaBusinessMission, MediaFactoryReport } from "./types.js";

/** Authoritative in-memory Media Business Mission store — orchestration only. */
export class MissionStore {
  private missions = new Map<string, MediaBusinessMission>();
  private reports = new Map<string, MediaFactoryReport>();
  private latestMissionId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    mediaMissionId: string;
    action: string;
    details: string;
  }> = [];

  seed(missions: MediaBusinessMission[]) {
    this.missions.clear();
    this.latestMissionId = null;
    this.auditTrail = [];
    for (const mission of missions) {
      this.missions.set(mission.mediaMissionId, cloneMission(mission));
      this.latestMissionId = mission.mediaMissionId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        mediaMissionId: mission.mediaMissionId,
        action: "seed",
        details: `seeded media mission business=${mission.mediaBusinessId}`,
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

  saveCanonical(mission: MediaBusinessMission, action = "save") {
    this.missions.set(mission.mediaMissionId, cloneMission(mission));
    this.latestMissionId = mission.mediaMissionId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      mediaMissionId: mission.mediaMissionId,
      action,
      details: `status=${mission.currentStatus} stage=${mission.currentStage} approval=${mission.approvalStatus}`,
    });
    return cloneMission(mission);
  }

  saveReport(report: MediaFactoryReport, action = "save_report") {
    this.reports.set(report.mediaMissionId, cloneReport(report));
    this.latestReportId = report.mediaMissionId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      mediaMissionId: report.mediaMissionId,
      action,
      details: `report stage=${report.currentStage} approval=${report.approvalStatus}`,
    });
    return cloneReport(report);
  }

  markRegistered(missionId: string, missionCoordinationRef: string) {
    const current = this.missions.get(missionId);
    if (!current) return null;
    const updated: MediaBusinessMission = {
      ...cloneMission(current),
      missionCoordinationRef,
      currentStatus: "active",
    };
    return this.saveCanonical(updated, "register_mission");
  }

  markSubmitted(missionId: string, executiveReportId: string) {
    const current = this.missions.get(missionId);
    if (!current) return null;
    const updated: MediaBusinessMission = {
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

function cloneMission(mission: MediaBusinessMission): MediaBusinessMission {
  return {
    ...mission,
    assignedWorkers: [...mission.assignedWorkers],
    assignedWorkerRoles: [...mission.assignedWorkerRoles],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
  };
}

function cloneReport(report: MediaFactoryReport): MediaFactoryReport {
  return {
    ...report,
    assignedWorkers: [...report.assignedWorkers],
    assignedWorkerRoles: [...report.assignedWorkerRoles],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: [...report.preservedDecisions],
  };
}
