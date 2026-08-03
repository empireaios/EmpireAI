import type {
  LifecycleRecord,
  LifecycleState,
  WorkerLifecycleProfile,
} from "./types.js";

/** Authoritative in-memory Worker Lifecycle store — transition/history only. */
export class LifecycleStore {
  private profiles = new Map<string, WorkerLifecycleProfile>();
  private records: LifecycleRecord[] = [];
  private latestLifecycleId: string | null = null;

  seed(params: { profiles: WorkerLifecycleProfile[]; records: LifecycleRecord[] }) {
    this.profiles.clear();
    this.records = [];
    this.latestLifecycleId = null;
    for (const profile of params.profiles) {
      this.profiles.set(profile.workerId, cloneProfile(profile));
    }
    for (const record of params.records) {
      this.records.push(cloneRecord(record));
      this.latestLifecycleId = record.lifecycleId;
    }
  }

  listProfiles() {
    return [...this.profiles.values()]
      .sort((a, b) => a.workerId.localeCompare(b.workerId))
      .map(cloneProfile);
  }

  listRecords() {
    return this.records
      .slice()
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneRecord);
  }

  profileCount() {
    return this.profiles.size;
  }

  recordCount() {
    return this.records.length;
  }

  getProfile(workerId: string) {
    const profile = this.profiles.get(workerId);
    return profile ? cloneProfile(profile) : null;
  }

  getLatestLifecycleId() {
    return this.latestLifecycleId;
  }

  applyTransition(params: {
    workerId: string;
    workerName: string;
    newState: LifecycleState | string;
    record: LifecycleRecord;
    certified?: boolean;
  }) {
    const existing = this.profiles.get(params.workerId);
    const timestamp = params.record.timestamp;
    const history = existing
      ? [...existing.history.map(cloneRecord), cloneRecord(params.record)]
      : [cloneRecord(params.record)];
    const profile: WorkerLifecycleProfile = {
      workerId: params.workerId,
      workerName: params.workerName,
      currentState: params.newState,
      history,
      createdAt: existing?.createdAt ?? timestamp,
      lastUpdated: timestamp,
      certified:
        params.certified ??
        existing?.certified ??
        ["certified", "active", "busy", "idle"].includes(String(params.newState)),
      neverPermanentlyDeleted: true,
    };
    if (params.newState === "certified") profile.certified = true;
    this.profiles.set(params.workerId, profile);
    this.records.push(cloneRecord(params.record));
    this.latestLifecycleId = params.record.lifecycleId;
    return cloneProfile(profile);
  }
}

function cloneRecord(record: LifecycleRecord): LifecycleRecord {
  return {
    ...record,
    supportingEvidence: [...record.supportingEvidence],
  };
}

function cloneProfile(profile: WorkerLifecycleProfile): WorkerLifecycleProfile {
  return {
    ...profile,
    history: profile.history.map(cloneRecord),
    neverPermanentlyDeleted: true,
  };
}
