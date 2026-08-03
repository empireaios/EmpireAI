import type { CommerceBuildMission } from "./types.js";

/** Authoritative in-memory Commerce Build Mission store — prepare only. */
export class MissionStore {
  private missions = new Map<string, CommerceBuildMission>();
  private latestMissionId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    commerceBuildMissionId: string;
    action: string;
    details: string;
  }> = [];

  seed(missions: CommerceBuildMission[]) {
    this.missions.clear();
    this.latestMissionId = null;
    this.auditTrail = [];
    for (const mission of missions) {
      this.missions.set(mission.commerceBuildMissionId, clone(mission));
      this.latestMissionId = mission.commerceBuildMissionId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        commerceBuildMissionId: mission.commerceBuildMissionId,
        action: "seed",
        details: `seeded commerce mission blueprint=${mission.businessBlueprintId}`,
      });
    }
  }

  count() {
    return this.missions.size;
  }

  list() {
    return [...this.missions.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(missionId: string) {
    const mission = this.missions.get(missionId);
    return mission ? clone(mission) : null;
  }

  getLatestMissionId() {
    return this.latestMissionId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  saveCanonical(mission: CommerceBuildMission, action = "save") {
    for (const [id, existing] of this.missions) {
      if (
        existing.businessBlueprintId === mission.businessBlueprintId &&
        existing.businessApprovalPackId === mission.businessApprovalPackId &&
        id !== mission.commerceBuildMissionId
      ) {
        this.missions.delete(id);
        this.auditTrail.push({
          timestamp: new Date().toISOString(),
          commerceBuildMissionId: id,
          action: "supersede",
          details: `superseded_by=${mission.commerceBuildMissionId}`,
        });
      }
    }
    this.missions.set(mission.commerceBuildMissionId, clone(mission));
    this.latestMissionId = mission.commerceBuildMissionId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      commerceBuildMissionId: mission.commerceBuildMissionId,
      action,
      details: `status=${mission.currentStatus} category=${mission.commerceCategory} approval=${mission.approvalStatus}`,
    });
    return clone(mission);
  }

  markRegistered(missionId: string, missionCoordinationRef: string) {
    const current = this.missions.get(missionId);
    if (!current) return null;
    const updated: CommerceBuildMission = {
      ...clone(current),
      missionCoordinationRef,
      currentStatus: "ready_for_q3_workers",
      requiredNextStep: "hand_off_to_q3_02",
    };
    return this.saveCanonical(updated, "register_mission");
  }

  markSubmitted(missionId: string, executiveReportId: string) {
    const current = this.missions.get(missionId);
    if (!current) return null;
    const updated: CommerceBuildMission = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.saveCanonical(updated, "submit_mission");
  }
}

function clone(mission: CommerceBuildMission): CommerceBuildMission {
  return {
    ...mission,
    missingPrerequisites: [...mission.missingPrerequisites],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
  };
}
