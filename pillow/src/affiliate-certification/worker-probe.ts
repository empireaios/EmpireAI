import type { WorkerHandle, WorkerProbeResult } from "./types.js";

/**
 * Read-only runtime probe. Tries, in order, getState / diagnostics /
 * getCockpitSnapshot / getReports — the first supported method observed is
 * invoked. Reachability is only ever true when a real call resolved without
 * throwing; absence of an injected handle is always reported honestly.
 */
export async function probeWorker(
  workerKey: string,
  worker?: WorkerHandle,
): Promise<WorkerProbeResult> {
  if (!worker) {
    return { workerKey, reachable: false, evidence: "No injected worker handle" };
  }
  const handle = worker as Record<string, unknown>;
  const method = ["getState", "diagnostics", "getCockpitSnapshot", "getReports"].find(
    (name) => typeof handle[name] === "function",
  );
  if (!method) {
    return { workerKey, reachable: false, evidence: "Worker exposes no supported read-only probe" };
  }
  try {
    await (handle[method] as () => unknown)();
    return { workerKey, reachable: true, evidence: `${method} completed` };
  } catch (error) {
    return {
      workerKey,
      reachable: false,
      evidence: `${method} threw`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
