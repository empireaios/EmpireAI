import { SRTC_METADATA_VERSION } from "./paths.js";
import type { RuntimeStore } from "./runtime-store.js";
import type { SharedRuntimeCoreDependencies } from "./integrations.js";
import type { WorkerRegistration } from "./types.js";

export class WorkerRegistryBridge {
  private injectedRegistry: SharedRuntimeCoreDependencies["workerRegistry"] | null = null;

  constructor(private readonly store: RuntimeStore) {}

  bindWorkerRegistry(workerRegistry: SharedRuntimeCoreDependencies["workerRegistry"]) {
    this.injectedRegistry = workerRegistry ?? null;
  }

  register(worker: WorkerRegistration): WorkerRegistration {
    if (worker.fabricated !== false) {
      throw new Error(`Worker ${worker.workerId} rejected: fabricated must be false`);
    }
    return this.store.registerWorker({
      ...worker,
      metadataVersion: worker.metadataVersion || SRTC_METADATA_VERSION,
      fabricated: false,
      neverReplaceFactoryLogic: true,
      neverReplaceWorkerLogic: true,
      neverExecuteBusinessSpecificDecisions: true,
      neverFabricateRuntimeState: true,
      neverImplementQ1002OrLater: true,
      structuralSignalOnly: true,
    });
  }

  registerMany(workers: WorkerRegistration[]) {
    return workers.map((w) => this.register(w));
  }

  discoverFromInjectedRegistry(): WorkerRegistration[] {
    const discovered: WorkerRegistration[] = [];
    const registry = this.injectedRegistry;
    if (!registry) return discovered;

    const now = new Date().toISOString();
    const candidates: Array<{ workerId: string; workerName?: string; factoryKey?: string; missionId?: string }> = [];

    if (typeof registry.listWorkers === "function") {
      try {
        const listed = registry.listWorkers() as Array<Record<string, unknown>>;
        for (const item of listed) {
          candidates.push({
            workerId: String(item.workerId ?? item.id ?? ""),
            workerName: String(item.workerName ?? item.label ?? item.name ?? "unknown"),
            factoryKey: String(item.factoryKey ?? item.factory ?? "unknown"),
            missionId: String(item.missionId ?? "unknown"),
          });
        }
      } catch {
        /* discovery is best-effort */
      }
    } else if (typeof registry.getWorkers === "function") {
      try {
        const listed = registry.getWorkers() as Array<Record<string, unknown>>;
        for (const item of listed) {
          candidates.push({
            workerId: String(item.workerId ?? item.id ?? ""),
            workerName: String(item.workerName ?? item.label ?? item.name ?? "unknown"),
            factoryKey: String(item.factoryKey ?? item.factory ?? "unknown"),
            missionId: String(item.missionId ?? "unknown"),
          });
        }
      } catch {
        /* discovery is best-effort */
      }
    }

    for (const candidate of candidates) {
      if (!candidate.workerId) continue;
      discovered.push({
        workerId: candidate.workerId,
        workerName: candidate.workerName ?? candidate.workerId,
        factoryKey: candidate.factoryKey ?? "unknown",
        missionId: candidate.missionId ?? "unknown",
        registeredAt: now,
        healthStatus: "unknown",
        fabricated: false,
        evidencePresent: false,
        notes: ["Discovered from injected workerRegistry — health not probed"],
        metadataVersion: SRTC_METADATA_VERSION,
      });
    }
    return discovered;
  }

  list(): WorkerRegistration[] {
    return this.store.listWorkers();
  }
}
