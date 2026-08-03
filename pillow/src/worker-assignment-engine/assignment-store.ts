import type { AssignmentRecord, AssignmentWorker, MissionRequirements } from "./types.js";

/** Authoritative in-memory Worker Assignment store — recommendations only. */
export class AssignmentStore {
  private workers = new Map<string, AssignmentWorker>();
  private records: AssignmentRecord[] = [];
  private latestMissionId: string | null = null;
  private latestRequirements: MissionRequirements | null = null;
  private latestAssignmentId: string | null = null;

  seed(params: { workers: AssignmentWorker[]; records: AssignmentRecord[] }) {
    this.workers.clear();
    this.records = [];
    this.latestMissionId = null;
    this.latestRequirements = null;
    this.latestAssignmentId = null;
    for (const worker of params.workers) {
      this.workers.set(worker.workerId, cloneWorker(worker));
    }
    for (const record of params.records) {
      this.records.push(cloneRecord(record));
      this.latestAssignmentId = record.assignmentId;
      this.latestMissionId = record.missionId;
      this.latestRequirements = {
        ...record.missionRequirements,
        requiredSkills: [...record.missionRequirements.requiredSkills],
        requiredTools: [...record.missionRequirements.requiredTools],
        dependencyIds: [...record.missionRequirements.dependencyIds],
      };
    }
  }

  listWorkers() {
    return [...this.workers.values()]
      .sort((a, b) => a.workerId.localeCompare(b.workerId))
      .map(cloneWorker);
  }

  listRecords() {
    return this.records
      .slice()
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneRecord);
  }

  workerCount() {
    return this.workers.size;
  }

  recordCount() {
    return this.records.length;
  }

  getWorker(workerId: string) {
    const worker = this.workers.get(workerId);
    return worker ? cloneWorker(worker) : null;
  }

  getLatestAssignmentId() {
    return this.latestAssignmentId;
  }

  getLatestMissionId() {
    return this.latestMissionId;
  }

  getLatestRequirements() {
    return this.latestRequirements
      ? {
          ...this.latestRequirements,
          requiredSkills: [...this.latestRequirements.requiredSkills],
          requiredTools: [...this.latestRequirements.requiredTools],
          dependencyIds: [...this.latestRequirements.dependencyIds],
        }
      : null;
  }

  submitMission(missionId: string, requirements: MissionRequirements) {
    this.latestMissionId = missionId;
    this.latestRequirements = {
      ...requirements,
      requiredSkills: [...requirements.requiredSkills],
      requiredTools: [...requirements.requiredTools],
      dependencyIds: [...requirements.dependencyIds],
    };
  }

  upsertWorkers(workers: AssignmentWorker[]) {
    for (const worker of workers) {
      this.workers.set(worker.workerId, cloneWorker(worker));
    }
  }

  saveRecord(record: AssignmentRecord) {
    this.records.push(cloneRecord(record));
    this.latestAssignmentId = record.assignmentId;
    this.latestMissionId = record.missionId;
    this.latestRequirements = {
      ...record.missionRequirements,
      requiredSkills: [...record.missionRequirements.requiredSkills],
      requiredTools: [...record.missionRequirements.requiredTools],
      dependencyIds: [...record.missionRequirements.dependencyIds],
    };
    return cloneRecord(record);
  }
}

function cloneWorker(worker: AssignmentWorker): AssignmentWorker {
  return {
    ...worker,
    skills: [...worker.skills],
    approvedTools: [...worker.approvedTools],
    dependencyIds: [...worker.dependencyIds],
    responsibilityDomains: [...worker.responsibilityDomains],
    neverExecuteWorkerTasks: true,
  };
}

function cloneRecord(record: AssignmentRecord): AssignmentRecord {
  return {
    ...record,
    missionRequirements: {
      ...record.missionRequirements,
      requiredSkills: [...record.missionRequirements.requiredSkills],
      requiredTools: [...record.missionRequirements.requiredTools],
      dependencyIds: [...record.missionRequirements.dependencyIds],
    },
    candidateWorkers: [...record.candidateWorkers],
    evaluationCriteria: [...record.evaluationCriteria],
    supportingWorkers: [...record.supportingWorkers],
    riskAssessment: {
      ...record.riskAssessment,
      notes: [...record.riskAssessment.notes],
    },
    evaluations: record.evaluations.map((e) => ({
      ...e,
      factorScores: { ...e.factorScores },
      rejectionReasons: [...e.rejectionReasons],
      evaluationNotes: [...e.evaluationNotes],
    })),
  };
}
