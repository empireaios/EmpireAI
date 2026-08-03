import type { WorkerHandle, WorkerProbeResult } from "./types.js";
export async function probeWorker(workerKey: string, worker?: WorkerHandle): Promise<WorkerProbeResult> {
  if (!worker) return { workerKey, reachable: false, evidence: "No injected worker handle" };
  const handle = worker as Record<string, unknown>;
  const method = ["getState", "getCockpitSnapshot", "diagnostics"].find((name) => typeof handle[name] === "function");
  if (!method) return { workerKey, reachable: false, evidence: "Worker exposes no supported read-only probe" };
  try { await (handle[method] as () => unknown)(); return { workerKey, reachable: true, evidence: `${method} completed` }; }
  catch (error) { return { workerKey, reachable: false, evidence: `${method} threw`, error: error instanceof Error ? error.message : String(error) }; }
}
