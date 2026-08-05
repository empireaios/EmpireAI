import type { WorkerHandle, WorkerProbeResult } from "./types.js";

/**
 * Read-only runtime probe. Tries getState / getEngineRecord / getCockpitSnapshot /
 * validateForSupervisorSync when a runtime handle is injected. Reachability is
 * only true when a real call resolved without throwing.
 */
export async function probeWorker(
  workerKey: string,
  worker?: WorkerHandle,
): Promise<WorkerProbeResult> {
  if (!worker) {
    return { workerKey, reachable: false, evidence: "No injected runtime handle" };
  }
  const handle = worker as Record<string, unknown>;
  const method = [
    "getState",
    "getEngineRecord",
    "getCockpitSnapshot",
    "validateForSupervisorSync",
    "diagnostics",
    "getReports",
  ].find((name) => typeof handle[name] === "function");
  if (!method) {
    return { workerKey, reachable: false, evidence: "Runtime exposes no supported read-only probe" };
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
