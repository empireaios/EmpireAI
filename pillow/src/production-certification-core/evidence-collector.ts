import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FACTORY_KEYS, Q10_RUNTIME_IDS } from "./paths.js";
import type {
  DiscoveredFactory,
  DiscoveredRuntime,
  DiscoveredWorker,
  FactoryDiscoveryResult,
  RuntimeDiscoveryResult,
  WorkerDiscoveryResult,
  WorkerHandle,
  WorkerProbeResult,
} from "./types.js";

const SHARED_RUNTIME_CORE_PATHS = "pillow/src/shared-runtime-core/paths.ts";

function readRepoText(root: string, relativePath: string): string {
  const absolute = join(root, relativePath);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
}

function safeCall<T>(fn: (() => T) | undefined | null): T | null {
  if (typeof fn !== "function") return null;
  try {
    return fn();
  } catch {
    return null;
  }
}

/**
 * Discovers factories from an injected sharedRuntimeCore.listFactories() call
 * plus repository evidence (the FACTORY_KEYS catalog literally defined in
 * shared-runtime-core/paths.ts). Never invents a factory absent from both
 * sources.
 */
export function collectFactoryDiscovery(
  root: string,
  listFactories?: (() => Array<Record<string, unknown>>) | null,
): FactoryDiscoveryResult {
  const repositoryText = readRepoText(root, SHARED_RUNTIME_CORE_PATHS);
  const injectedFactories = safeCall(listFactories) ?? [];
  const injectedKeys = new Set(
    injectedFactories
      .map((f) => String((f as Record<string, unknown>).factoryKey ?? ""))
      .filter((key) => key.length > 0),
  );

  const factories: DiscoveredFactory[] = FACTORY_KEYS.map((factoryKey) => {
    const repositoryEvidence = repositoryText.includes(`"${factoryKey}"`);
    const injected = injectedKeys.has(factoryKey);
    return {
      factoryKey,
      injected,
      repositoryEvidence,
      evidence: `injected=${injected}; repositoryEvidence=${repositoryEvidence}`,
    };
  });

  const discoveredCount = factories.filter((f) => f.injected || f.repositoryEvidence).length;
  return {
    discoveredAt: new Date().toISOString(),
    source: injectedFactories.length > 0 ? "injected" : discoveredCount > 0 ? "repository" : "none",
    totalCatalog: FACTORY_KEYS.length,
    discoveredCount,
    factories,
    evidence: factories.map((f) => `${f.factoryKey}: ${f.evidence}`),
  };
}

/**
 * Discovers workers strictly from an injected workerRegistry.listWorkers()
 * call. Absence of an injected registry is reported as zero discovered
 * workers — never invented. Seed worker count is recorded as structural
 * evidence only, it never substitutes for real discovery.
 */
export function collectWorkerDiscovery(
  listWorkers: (() => Array<Record<string, unknown>>) | null | undefined,
  seedWorkerCount: number,
): WorkerDiscoveryResult {
  const registryInjected = typeof listWorkers === "function";
  const rawWorkers = registryInjected ? safeCall(listWorkers) ?? [] : [];
  const workers: DiscoveredWorker[] = rawWorkers
    .map((w) => ({
      workerId: String((w as Record<string, unknown>).workerId ?? ""),
      workerName: ((w as Record<string, unknown>).workerName as string | undefined) ?? null,
      evidence: "discovered from injected workerRegistry.listWorkers()",
    }))
    .filter((w) => w.workerId.length > 0);

  return {
    discoveredAt: new Date().toISOString(),
    registryInjected,
    discoveredCount: workers.length,
    seedWorkerCount,
    workers,
    evidence: [
      `registryInjected=${registryInjected}`,
      `discoveredCount=${workers.length}`,
      `seedWorkerCount(structural evidence only)=${seedWorkerCount}`,
    ],
  };
}

/**
 * Discovers the Q10-01..Q10-13 runtime pipeline from repository evidence
 * (engine.ts presence) plus optional injected handle reachability.
 */
export function collectRuntimeDiscovery(
  root: string,
  handles: Map<string, WorkerHandle | undefined>,
  probes: Map<string, WorkerProbeResult>,
): RuntimeDiscoveryResult {
  const runtimes: DiscoveredRuntime[] = Q10_RUNTIME_IDS.map((runtime) => {
    const enginePath = `pillow/src/${runtime.runtimeName}/engine.ts`;
    const repositoryEvidence = existsSync(join(root, enginePath));
    const injected = Boolean(handles.get(runtime.missionId));
    const probe = probes.get(runtime.missionId);
    const reachable = Boolean(probe?.reachable);
    return {
      missionId: runtime.missionId,
      runtimeName: runtime.runtimeName,
      injected,
      reachable,
      repositoryEvidence,
      evidence: `injected=${injected}; reachable=${reachable}; repositoryEvidence=${repositoryEvidence} (${enginePath})`,
    };
  });

  const discoveredCount = runtimes.filter((r) => r.injected || r.repositoryEvidence).length;
  return {
    discoveredAt: new Date().toISOString(),
    totalCatalog: Q10_RUNTIME_IDS.length,
    discoveredCount,
    runtimes,
    evidence: runtimes.map((r) => `${r.missionId}: ${r.evidence}`),
  };
}

export function readRepositoryText(root: string, relativePath: string): string {
  return readRepoText(root, relativePath);
}

export function repositoryFileExists(root: string, relativePath: string): boolean {
  return existsSync(join(root, relativePath));
}
