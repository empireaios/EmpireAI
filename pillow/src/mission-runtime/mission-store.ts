import type {
  Checkpoint,
  ExecutionTimelineEntry,
  LifecycleTransition,
  MissionInstance,
  MissionRuntimeReport,
  RecoveryRecord,
  RetryRecord,
} from "./types.js";

let sequence = 0;

export function resetMsrSequenceForTesting() {
  sequence = 0;
}

export function nextMsrId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export class MissionStore {
  private missions = new Map<string, MissionInstance>();
  private transitions: LifecycleTransition[] = [];
  private checkpoints: Checkpoint[] = [];
  private retries: RetryRecord[] = [];
  private recoveries: RecoveryRecord[] = [];
  private timeline: ExecutionTimelineEntry[] = [];
  private reports: MissionRuntimeReport[] = [];
  private auditTrail: string[] = [];

  saveMission(mission: MissionInstance) {
    this.missions.set(mission.missionId, {
      ...mission,
      dependencyMissionIds: [...mission.dependencyMissionIds],
      workers: [...mission.workers],
      traceabilityRefs: [...mission.traceabilityRefs],
    });
    this.auditTrail.push(`mission_saved:${mission.missionId}@${mission.updatedAt}`);
    return mission;
  }

  getMission(missionId: string) {
    const mission = this.missions.get(missionId);
    return mission
      ? {
          ...mission,
          dependencyMissionIds: [...mission.dependencyMissionIds],
          workers: [...mission.workers],
          traceabilityRefs: [...mission.traceabilityRefs],
        }
      : null;
  }

  listMissions() {
    return [...this.missions.values()].map((m) => ({
      ...m,
      dependencyMissionIds: [...m.dependencyMissionIds],
      workers: [...m.workers],
      traceabilityRefs: [...m.traceabilityRefs],
    }));
  }

  saveTransition(transition: LifecycleTransition) {
    this.transitions.push({ ...transition });
    this.auditTrail.push(`transition:${transition.transitionId}@${transition.timestamp}`);
    return transition;
  }

  listTransitions(missionId?: string) {
    const list = missionId
      ? this.transitions.filter((t) => t.missionId === missionId)
      : this.transitions;
    return list.map((t) => ({ ...t }));
  }

  saveCheckpoint(checkpoint: Checkpoint) {
    this.checkpoints.push({ ...checkpoint, payload: { ...checkpoint.payload } });
    this.auditTrail.push(`checkpoint:${checkpoint.checkpointId}@${checkpoint.timestamp}`);
    return checkpoint;
  }

  listCheckpoints(missionId?: string) {
    const list = missionId
      ? this.checkpoints.filter((c) => c.missionId === missionId)
      : this.checkpoints;
    return list.map((c) => ({ ...c, payload: { ...c.payload } }));
  }

  saveRetry(retry: RetryRecord) {
    this.retries.push({ ...retry });
    this.auditTrail.push(`retry:${retry.retryId}@${retry.timestamp}`);
    return retry;
  }

  listRetries(missionId?: string) {
    const list = missionId ? this.retries.filter((r) => r.missionId === missionId) : this.retries;
    return list.map((r) => ({ ...r }));
  }

  saveRecovery(recovery: RecoveryRecord) {
    this.recoveries.push({ ...recovery });
    this.auditTrail.push(`recovery:${recovery.recoveryId}@${recovery.timestamp}`);
    return recovery;
  }

  listRecoveries(missionId?: string) {
    const list = missionId
      ? this.recoveries.filter((r) => r.missionId === missionId)
      : this.recoveries;
    return list.map((r) => ({ ...r }));
  }

  appendTimeline(entry: ExecutionTimelineEntry) {
    this.timeline.push({ ...entry, notes: [...entry.notes] });
    this.auditTrail.push(`timeline:${entry.entryId}@${entry.timestamp}`);
    return entry;
  }

  listTimeline(missionId?: string) {
    const list = missionId
      ? this.timeline.filter((e) => e.entryId.startsWith(missionId) || e.label.includes(missionId))
      : this.timeline;
    return list.map((e) => ({ ...e, notes: [...e.notes] }));
  }

  saveReport(report: MissionRuntimeReport) {
    this.reports.push({
      ...report,
      executionTimeline: report.executionTimeline.map((e) => ({ ...e, notes: [...e.notes] })),
      activeWorkers: [...report.activeWorkers],
      dependencies: report.dependencies.map((d) => ({ ...d })),
      checkpoints: report.checkpoints.map((c) => ({ ...c, payload: { ...c.payload } })),
      retryHistory: report.retryHistory.map((r) => ({ ...r })),
      recoveryHistory: report.recoveryHistory.map((r) => ({ ...r })),
      supportingEvidence: [...report.supportingEvidence],
      outstandingIssues: [...report.outstandingIssues],
    });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
    return report;
  }

  listReports() {
    return this.reports.map((r) => ({
      ...r,
      executionTimeline: r.executionTimeline.map((e) => ({ ...e, notes: [...e.notes] })),
      activeWorkers: [...r.activeWorkers],
      dependencies: r.dependencies.map((d) => ({ ...d })),
      checkpoints: r.checkpoints.map((c) => ({ ...c, payload: { ...c.payload } })),
      retryHistory: r.retryHistory.map((r) => ({ ...r })),
      recoveryHistory: r.recoveryHistory.map((r) => ({ ...r })),
      supportingEvidence: [...r.supportingEvidence],
      outstandingIssues: [...r.outstandingIssues],
    }));
  }

  getHistory() {
    return {
      missions: this.listMissions(),
      transitions: this.listTransitions(),
      checkpoints: this.listCheckpoints(),
      retries: this.listRetries(),
      recoveries: this.listRecoveries(),
      timeline: this.timeline.map((e) => ({ ...e, notes: [...e.notes] })),
      reports: this.listReports(),
    };
  }

  getAuditTrail() {
    return [...this.auditTrail];
  }
}
