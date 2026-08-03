import type { MonitoredWorker, MonitoringAlert, MonitoringRecord } from "./types.js";

/** Authoritative in-memory Worker Monitoring store — observe/report only. */
export class MonitoringStore {
  private workers = new Map<string, MonitoredWorker>();
  private records: MonitoringRecord[] = [];
  private alerts: MonitoringAlert[] = [];
  private latestMonitoringId: string | null = null;

  seed(params: { workers: MonitoredWorker[]; records: MonitoringRecord[] }) {
    this.workers.clear();
    this.records = [];
    this.alerts = [];
    this.latestMonitoringId = null;
    const fresh = new Date().toISOString();
    for (const worker of params.workers) {
      const keepStale =
        worker.workerId === "wkr-offline-01" || worker.workerId === "wkr-commerce-01";
      this.workers.set(
        worker.workerId,
        cloneWorker({
          ...worker,
          lastHeartbeatAt: keepStale ? worker.lastHeartbeatAt : fresh,
        }),
      );
    }
    for (const record of params.records) {
      this.records.push(cloneRecord(record));
      this.alerts.push(...record.alerts.map((a) => ({ ...a, reportedToPillow: true as const })));
      this.latestMonitoringId = record.monitoringId;
    }
  }

  listWorkers() {
    return [...this.workers.values()]
      .sort((a, b) => a.workerId.localeCompare(b.workerId))
      .map(cloneWorker);
  }

  listActiveWorkers() {
    return this.listWorkers().filter((w) => w.active);
  }

  listRecords() {
    return this.records
      .slice()
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneRecord);
  }

  listAlerts() {
    return this.alerts.map((a) => ({ ...a, reportedToPillow: true as const }));
  }

  workerCount() {
    return this.workers.size;
  }

  recordCount() {
    return this.records.length;
  }

  alertCount() {
    return this.alerts.length;
  }

  getWorker(workerId: string) {
    const worker = this.workers.get(workerId);
    return worker ? cloneWorker(worker) : null;
  }

  getLatestMonitoringId() {
    return this.latestMonitoringId;
  }

  upsertWorker(worker: MonitoredWorker) {
    this.workers.set(worker.workerId, cloneWorker(worker));
    return cloneWorker(worker);
  }

  saveRecord(record: MonitoringRecord) {
    this.records.push(cloneRecord(record));
    this.alerts.push(...record.alerts.map((a) => ({ ...a, reportedToPillow: true as const })));
    this.latestMonitoringId = record.monitoringId;
    return cloneRecord(record);
  }
}

function cloneWorker(worker: MonitoredWorker): MonitoredWorker {
  return { ...worker, neverExecuteWorkerTasks: true };
}

function cloneRecord(record: MonitoringRecord): MonitoringRecord {
  return {
    ...record,
    alerts: record.alerts.map((a) => ({ ...a, reportedToPillow: true as const })),
    events: [...record.events],
  };
}
