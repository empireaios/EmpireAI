import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Q10_RUNTIMES } from "./runtime-catalog.js";
import type { IntegrationCheckRow, IntegrationVerification, WorkerProbeResult } from "./types.js";

const SESSION_PATH = "pillow/src/session.ts";

/** Verifies integration wiring from session.ts references + optional runtime probes. */
export function verifyIntegrations(
  root: string,
  probes: Map<string, WorkerProbeResult>,
): IntegrationVerification {
  const sessionPath = join(root, SESSION_PATH);
  const sessionText = existsSync(sessionPath) ? readFileSync(sessionPath, "utf8") : "";

  const rows: IntegrationCheckRow[] = Q10_RUNTIMES.map((runtime) => {
    const registryReferenced = sessionText.includes(runtime.dependencyKey);
    const probe = probes.get(runtime.missionId);
    const runtimeHandshake: IntegrationCheckRow["runtimeHandshake"] = probe?.reachable
      ? "bound"
      : probe
        ? "unavailable"
        : "ready";
    return {
      missionId: runtime.missionId,
      runtimeName: runtime.runtimeName,
      registryReferenced,
      runtimeHandshake,
      allBound: registryReferenced,
      evidence: `session reference=${registryReferenced}; handshake=${runtimeHandshake}`,
    };
  });

  return {
    verifiedAt: new Date().toISOString(),
    rows,
    allBound: rows.every((row) => row.allBound),
    evidence: rows.map((row) => `${row.missionId}: ${row.evidence}`),
  };
}
