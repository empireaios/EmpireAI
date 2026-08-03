import type { WorkerRecord } from "./types.js";

/** Authoritative in-memory Worker Registry store — register/query only. */
export class RegistryStore {
  private workers = new Map<string, WorkerRecord>();
  private latestWorkerId: string | null = null;

  seed(workers: WorkerRecord[]) {
    this.workers.clear();
    this.latestWorkerId = null;
    for (const worker of workers) {
      this.workers.set(worker.workerId, cloneWorker(worker));
      this.latestWorkerId = worker.workerId;
    }
  }

  listWorkers() {
    return [...this.workers.values()]
      .sort((a, b) => a.workerId.localeCompare(b.workerId))
      .map(cloneWorker);
  }

  workerCount() {
    return this.workers.size;
  }

  departmentCount() {
    return new Set(this.listWorkers().map((w) => w.department)).size;
  }

  factoryCount() {
    return new Set(this.listWorkers().map((w) => w.factory)).size;
  }

  existingIds() {
    return new Set(this.workers.keys());
  }

  registerWorker(worker: WorkerRecord) {
    this.workers.set(worker.workerId, cloneWorker(worker));
    this.latestWorkerId = worker.workerId;
    return this.getWorker(worker.workerId)!;
  }

  getWorker(workerId: string) {
    const worker = this.workers.get(workerId);
    return worker ? cloneWorker(worker) : null;
  }

  getLatestWorkerId() {
    return this.latestWorkerId;
  }

  queryByDepartment(department: string) {
    const key = department.trim().toLowerCase();
    return this.listWorkers().filter((w) => w.department.toLowerCase() === key);
  }

  queryByRole(role: string) {
    const key = role.trim().toLowerCase();
    return this.listWorkers().filter((w) => w.role.toLowerCase() === key);
  }

  queryByFactory(factory: string) {
    const key = factory.trim().toLowerCase();
    return this.listWorkers().filter((w) => w.factory.toLowerCase() === key);
  }

  updateStatus(workerId: string, operationalStatus: string, changeSummary?: string) {
    const current = this.workers.get(workerId);
    if (!current) return null;
    const timestamp = new Date().toISOString();
    const nextVersion = (current.versionHistory.at(-1)?.version ?? 0) + 1;
    const updated: WorkerRecord = {
      ...cloneWorker(current),
      operationalStatus,
      lastUpdated: timestamp,
      versionHistory: [
        ...current.versionHistory.map((v) => ({ ...v })),
        {
          version: nextVersion,
          updatedAt: timestamp,
          changeSummary: changeSummary?.trim() || `status=${operationalStatus}`,
        },
      ],
    };
    this.workers.set(workerId, updated);
    this.latestWorkerId = workerId;
    return cloneWorker(updated);
  }
}

function cloneWorker(worker: WorkerRecord): WorkerRecord {
  return {
    ...worker,
    reportingLine: [...worker.reportingLine],
    skillProfile: [...worker.skillProfile],
    approvedTools: [...worker.approvedTools],
    versionHistory: worker.versionHistory.map((v) => ({ ...v })),
  };
}
