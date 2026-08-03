import { MCE_METADATA_VERSION } from "./paths.js";
import type {
  ApprovalCheckpoint,
  CompletionStatus,
  MissionCoordinationEngineInput,
  MissionPhase,
  MissionRecord,
  MissionStatus,
  ValidationStatus,
  WorkerDependency,
} from "./types.js";

/** Authoritative in-memory Mission Coordination store — coordinate only. */
export class MissionStore {
  private records = new Map<string, MissionRecord>();

  seed(records: MissionRecord[]) {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.missionId, clone(record));
    }
  }

  count() {
    return this.records.size;
  }

  activeCount() {
    return this.list().filter((r) =>
      ["planned", "waiting", "ready", "running", "waiting_approval", "blocked", "paused", "recovering"].includes(
        r.missionStatus.toString(),
      ),
    ).length;
  }

  blockedCount() {
    return this.list().filter((r) => r.missionStatus === "blocked").length;
  }

  completedCount() {
    return this.list().filter(
      (r) =>
        r.completionStatus === "completed" ||
        r.completionStatus === "closed" ||
        r.missionStatus === "completed",
    ).length;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(missionId: string) {
    const record = this.records.get(missionId);
    return record ? clone(record) : null;
  }

  save(record: MissionRecord) {
    this.records.set(record.missionId, clone(record));
    return clone(record);
  }

  buildRecord(params: {
    input: MissionCoordinationEngineInput;
    missionName: string;
    missionOwner: string;
    businessId: string;
    missionStatus: MissionStatus | string;
    currentPhase: MissionPhase | string;
    assignedWorkers: string[];
    dependencies: WorkerDependency[];
    approvalCheckpoints: ApprovalCheckpoint[];
    progress: number;
    blockers: string[];
    completionStatus: CompletionStatus;
    validationStatus: ValidationStatus;
    stalled?: boolean;
    phaseHistory?: string[];
    missionId?: string;
    timestamp?: string;
  }): MissionRecord {
    missionSequence += 1;
    const missionId =
      params.missionId?.trim() ||
      params.input.missionId?.trim() ||
      `mce-msn-${Date.now()}-${missionSequence}`;
    const record: MissionRecord = {
      missionId,
      timestamp: params.timestamp ?? new Date().toISOString(),
      businessId: params.businessId,
      missionName: params.missionName,
      missionOwner: params.missionOwner,
      missionStatus: params.missionStatus,
      currentPhase: params.currentPhase,
      assignedWorkers: unique(params.assignedWorkers),
      dependencies: params.dependencies.map((d) => ({
        workerId: d.workerId,
        dependsOn: [...d.dependsOn],
        satisfied: d.satisfied,
      })),
      approvalCheckpoints: params.approvalCheckpoints.map((c) => ({ ...c })),
      progress: clampProgress(params.progress),
      blockers: unique(params.blockers),
      completionStatus: params.completionStatus,
      metadataVersion: MCE_METADATA_VERSION,
      missionTraceId: `mce-trace-${Date.now()}-${missionSequence}`,
      validationStatus: params.validationStatus,
      stalled: params.stalled ?? false,
      phaseHistory: unique(params.phaseHistory ?? [params.currentPhase.toString()]),
      neverExecuteWorkerLogic: true,
      neverReplaceWorkforceOrchestrator: true,
      neverReplaceExecutivePlanner: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerLogicExecuted: false,
      workforceOrchestratorReplaced: false,
      executivePlannerReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveMissionTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let missionSequence = 0;

export function resetMissionSequenceForTesting() {
  missionSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clone(record: MissionRecord): MissionRecord {
  return {
    ...record,
    assignedWorkers: [...record.assignedWorkers],
    blockers: [...record.blockers],
    phaseHistory: [...record.phaseHistory],
    dependencies: record.dependencies.map((d) => ({
      ...d,
      dependsOn: [...d.dependsOn],
    })),
    approvalCheckpoints: record.approvalCheckpoints.map((c) => ({ ...c })),
  };
}
