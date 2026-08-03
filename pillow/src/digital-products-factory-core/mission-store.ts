import type {
  DigitalProductBusinessMission,
  DigitalProductsFactoryReport,
} from "./types.js";

/** Authoritative in-memory Digital Product Business Mission store — orchestration only. */
export class MissionStore {
  private missions = new Map<string, DigitalProductBusinessMission>();
  private reports = new Map<string, DigitalProductsFactoryReport>();
  private latestMissionId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    factoryMissionId: string;
    action: string;
    details: string;
  }> = [];

  seed(missions: DigitalProductBusinessMission[]) {
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
        details: `seeded digital product mission business=${mission.businessId}`,
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

  saveCanonical(mission: DigitalProductBusinessMission, action = "save") {
    this.missions.set(mission.factoryMissionId, cloneMission(mission));
    this.latestMissionId = mission.factoryMissionId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      factoryMissionId: mission.factoryMissionId,
      action,
      details: `status=${mission.currentStatus} stage=${mission.currentPipelineStage} approval=${mission.approvalStatus}`,
    });
    return cloneMission(mission);
  }

  saveReport(report: DigitalProductsFactoryReport, action = "save_report") {
    this.reports.set(report.factoryMissionId, cloneReport(report));
    this.latestReportId = report.factoryMissionId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      factoryMissionId: report.factoryMissionId,
      action,
      details: `report stage=${report.currentPipelineStage} approval=${report.approvalStatus}`,
    });
    return cloneReport(report);
  }

  markRegistered(missionId: string, missionCoordinationRef: string) {
    const current = this.missions.get(missionId);
    if (!current) return null;
    const updated: DigitalProductBusinessMission = {
      ...cloneMission(current),
      missionCoordinationRef,
      currentStatus: "active",
    };
    return this.saveCanonical(updated, "register_mission");
  }

  markSubmitted(missionId: string, executiveReportId: string) {
    const current = this.missions.get(missionId);
    if (!current) return null;
    const updated: DigitalProductBusinessMission = {
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

function cloneMission(
  mission: DigitalProductBusinessMission,
): DigitalProductBusinessMission {
  return {
    ...mission,
    productPortfolio: [...mission.productPortfolio],
    activeProducts: [...mission.activeProducts],
    assignedWorkers: [...mission.assignedWorkers],
    assignedWorkerRoles: [...mission.assignedWorkerRoles],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
  };
}

function cloneReport(report: DigitalProductsFactoryReport): DigitalProductsFactoryReport {
  return {
    ...report,
    productPortfolio: [...report.productPortfolio],
    activeProducts: [...report.activeProducts],
    assignedWorkers: [...report.assignedWorkers],
    assignedWorkerRoles: [...report.assignedWorkerRoles],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: [...report.preservedDecisions],
  };
}
