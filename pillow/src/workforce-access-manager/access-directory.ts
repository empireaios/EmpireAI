import type { AccessibleWorker, WorkerRuntimeStatus } from "./types.js";

/** Mutable executive-access directory — connection and lifecycle control only. */
export class AccessDirectory {
  private workers = new Map<string, AccessibleWorker>();

  seed(workers: AccessibleWorker[]) {
    this.workers.clear();
    for (const worker of workers) {
      this.workers.set(worker.workerId, {
        ...worker,
        capabilities: [...worker.capabilities],
      });
    }
  }

  list(): AccessibleWorker[] {
    return [...this.workers.values()].map((w) => this.clone(w));
  }

  get(workerId: string): AccessibleWorker | null {
    const worker = this.workers.get(workerId);
    return worker ? this.clone(worker) : null;
  }

  locate(query: {
    workerId?: string | null;
    workerNameHint?: string | null;
    capabilityHints?: string[];
  }): AccessibleWorker[] {
    const id = query.workerId?.trim().toLowerCase();
    const name = query.workerNameHint?.trim().toLowerCase();
    const caps = (query.capabilityHints ?? []).map((c) => c.toLowerCase());

    return this.list().filter((worker) => {
      if (id && worker.workerId.toLowerCase() === id) return true;
      if (name && worker.workerName.toLowerCase().includes(name)) return true;
      if (caps.length > 0 && caps.every((c) => worker.capabilities.some((wc) => wc.toLowerCase().includes(c)))) {
        return true;
      }
      return false;
    });
  }

  connect(workerId: string): AccessibleWorker | null {
    return this.update(workerId, (worker) => ({
      ...worker,
      connectedToPillow: true,
      runtimeStatus: worker.runtimeStatus === "offline" ? "connected" : worker.runtimeStatus === "available" ? "connected" : worker.runtimeStatus,
    }));
  }

  setStatus(workerId: string, runtimeStatus: WorkerRuntimeStatus, connect = true): AccessibleWorker | null {
    return this.update(workerId, (worker) => ({
      ...worker,
      connectedToPillow: connect ? true : worker.connectedToPillow,
      runtimeStatus,
    }));
  }

  connectedCount() {
    return this.list().filter((w) => w.connectedToPillow).length;
  }

  private update(
    workerId: string,
    mutator: (worker: AccessibleWorker) => AccessibleWorker,
  ): AccessibleWorker | null {
    const existing = this.workers.get(workerId);
    if (!existing) return null;
    const updated = mutator({
      ...existing,
      capabilities: [...existing.capabilities],
    });
    this.workers.set(workerId, updated);
    return this.clone(updated);
  }

  private clone(worker: AccessibleWorker): AccessibleWorker {
    return { ...worker, capabilities: [...worker.capabilities] };
  }
}
