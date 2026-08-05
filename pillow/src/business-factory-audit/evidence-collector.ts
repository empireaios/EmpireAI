import type { RegisteredWorkerRecord, WorkerDiscoveryResult } from "./types.js";

function safeCall<T>(fn: (() => T) | undefined | null): T | null {
  if (typeof fn !== "function") return null;
  try {
    return fn();
  } catch {
    return null;
  }
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
}

function normalizeWorkerRecord(raw: Record<string, unknown>): RegisteredWorkerRecord {
  return {
    workerId: String(raw.workerId ?? ""),
    workerName: typeof raw.workerName === "string" ? raw.workerName : null,
    workerType: typeof raw.workerType === "string" ? raw.workerType : null,
    department: typeof raw.department === "string" ? raw.department : null,
    factory: typeof raw.factory === "string" ? raw.factory : null,
    role: typeof raw.role === "string" ? raw.role : null,
    reportingLine: toStringArray(raw.reportingLine),
    governingAuthority: typeof raw.governingAuthority === "string" ? raw.governingAuthority : null,
    skillProfile: toStringArray(raw.skillProfile),
    approvedTools: toStringArray(raw.approvedTools),
    authorityLevel: typeof raw.authorityLevel === "string" ? raw.authorityLevel : null,
    certificationStatus: typeof raw.certificationStatus === "string" ? raw.certificationStatus : null,
    operationalStatus: typeof raw.operationalStatus === "string" ? raw.operationalStatus : null,
  };
}

/**
 * Discovers workers strictly from an injected workerRegistry.listWorkers()
 * call. Absence of an injected registry is reported as zero discovered
 * workers — never invented. Used to match workers to a factory via
 * `worker.factory` for the per-factory worker-verification dimension.
 */
export function collectWorkerDiscovery(
  listWorkers: (() => Array<Record<string, unknown>>) | null | undefined,
): WorkerDiscoveryResult {
  const registryInjected = typeof listWorkers === "function";
  const rawWorkers = registryInjected ? safeCall(listWorkers) ?? [] : [];
  const workers: RegisteredWorkerRecord[] = rawWorkers
    .map((w) => normalizeWorkerRecord(w as Record<string, unknown>))
    .filter((w) => w.workerId.length > 0);

  return {
    discoveredAt: new Date().toISOString(),
    registryInjected,
    discoveredCount: workers.length,
    workers,
    evidence: [
      `registryInjected=${registryInjected}`,
      `discoveredCount=${workers.length}`,
      registryInjected
        ? "discovered from injected workerRegistry.listWorkers()"
        : "no workerRegistry injected — zero workers discovered, none invented",
    ],
  };
}
