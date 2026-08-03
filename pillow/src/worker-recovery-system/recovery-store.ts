import type { RecoverableWorker, RecoveryRecord } from "./types.js";

/** Authoritative in-memory Worker Recovery store — continuity only. */
export class RecoveryStore {
  private workers = new Map<string, RecoverableWorker>();
  private records: RecoveryRecord[] = [];
  private latestRecoveryId: string | null = null;
  private escalationCount = 0;

  seed(params: { workers: RecoverableWorker[]; records: RecoveryRecord[] }) {
    this.workers.clear();
    this.records = [];
    this.latestRecoveryId = null;
    this.escalationCount = 0;
    for (const worker of params.workers) {
      this.workers.set(worker.workerId, cloneWorker(worker));
    }
    for (const record of params.records) {
      this.records.push(cloneRecord(record));
      this.latestRecoveryId = record.recoveryId;
      if (record.escalationStatus === "escalated") this.escalationCount += 1;
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

  getEscalationCount() {
    return this.escalationCount;
  }

  getWorker(workerId: string) {
    const worker = this.workers.get(workerId);
    return worker ? cloneWorker(worker) : null;
  }

  getLatestRecoveryId() {
    return this.latestRecoveryId;
  }

  upsertWorker(worker: RecoverableWorker) {
    this.workers.set(worker.workerId, cloneWorker(worker));
    return cloneWorker(worker);
  }

  saveRecord(record: RecoveryRecord) {
    this.records.push(cloneRecord(record));
    this.latestRecoveryId = record.recoveryId;
    if (record.escalationStatus === "escalated") this.escalationCount += 1;
    return cloneRecord(record);
  }
}

function cloneWorker(worker: RecoverableWorker): RecoverableWorker {
  return {
    ...worker,
    duplicateExecutionPrevented: true,
    neverExecuteWorkerBusinessLogic: true,
  };
}

function cloneRecord(record: RecoveryRecord): RecoveryRecord {
  return {
    ...record,
    supportingEvidence: [...record.supportingEvidence],
    optionsConsidered: record.optionsConsidered.map((o) => ({ ...o })),
  };
}
