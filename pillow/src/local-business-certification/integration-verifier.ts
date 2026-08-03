import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Q7_MISSIONS } from "./mission-catalog.js";
import type { IntegrationCheckRow, IntegrationVerification, WorkerProbeResult } from "./types.js";

const SESSION_PATH = "pillow/src/session.ts";

/** Expands the launch pack's aggregate wiring flag into its 9 individual dependency keys. */
const SPECIAL_BIND_EXPANSIONS: Record<string, string[]> = {
  bindsQ701ThroughQ709: Q7_MISSIONS.filter((m) => m.missionId !== "Q7-10").map(
    (m) => m.dependencyKey,
  ),
};

function decapitalize(value: string): string {
  return value.length ? value[0]!.toLowerCase() + value.slice(1) : value;
}

/** Reads the `wiring` block of a mission's CERTIFICATION_EVIDENCE.json and returns expected dependencyKeys. */
function expectedBindsFromEvidenceJson(root: string, auditPath: string): string[] {
  const evidencePath = join(root, auditPath, "CERTIFICATION_EVIDENCE.json");
  if (!existsSync(evidencePath)) return [];
  try {
    const parsed = JSON.parse(readFileSync(evidencePath, "utf8")) as {
      wiring?: Record<string, unknown>;
    };
    const wiring = parsed.wiring ?? {};
    const keys: string[] = [];
    for (const [key, value] of Object.entries(wiring)) {
      if (!key.startsWith("binds") || value !== true) continue;
      if (SPECIAL_BIND_EXPANSIONS[key]) {
        keys.push(...SPECIAL_BIND_EXPANSIONS[key]!);
        continue;
      }
      keys.push(decapitalize(key.slice("binds".length)));
    }
    return Array.from(new Set(keys));
  } catch {
    return [];
  }
}

/** Extracts the `<dependencyKey>.bindIntegrations({ ... })` block text from session.ts, if present. */
function extractBindBlock(sessionText: string, dependencyKey: string): string | null {
  const marker = `${dependencyKey}.bindIntegrations({`;
  const start = sessionText.indexOf(marker);
  if (start === -1) return null;
  const end = sessionText.indexOf("});", start);
  return end === -1 ? sessionText.slice(start, start + 2000) : sessionText.slice(start, end);
}

/**
 * Verifies integration wiring among Q7-01..Q7-10 workers purely from
 * repository text evidence (session.ts bind blocks cross-checked against
 * each mission's own recorded wiring evidence) plus optional runtime
 * handshake results already computed by worker-probe.
 */
export function verifyIntegrations(
  root: string,
  probes: Map<string, WorkerProbeResult>,
): IntegrationVerification {
  const sessionPath = join(root, SESSION_PATH);
  const sessionText = existsSync(sessionPath) ? readFileSync(sessionPath, "utf8") : "";

  const rows: IntegrationCheckRow[] = Q7_MISSIONS.map((mission) => {
    const expectedBinds = expectedBindsFromEvidenceJson(root, mission.auditPath);
    const block = extractBindBlock(sessionText, mission.dependencyKey);
    const observedBinds = expectedBinds.filter((key) => block?.includes(key));
    const missingBinds = expectedBinds.filter((key) => !observedBinds.includes(key));
    const registryReferenced = sessionText.includes(mission.dependencyKey);
    const probe = probes.get(mission.missionId);
    const runtimeHandshake: IntegrationCheckRow["runtimeHandshake"] = probe?.reachable
      ? "bound"
      : probe
        ? "unavailable"
        : "ready";
    const allBound = missingBinds.length === 0;
    return {
      missionId: mission.missionId,
      missionName: mission.missionName,
      registryReferenced,
      expectedBinds,
      observedBinds,
      missingBinds,
      allBound,
      runtimeHandshake,
      evidence: expectedBinds.length
        ? `expected=[${expectedBinds.join(",")}] observed=[${observedBinds.join(",")}]`
        : "no declared upstream binds for this mission",
    };
  });

  const allBound = rows.every((row) => row.allBound);
  return {
    verifiedAt: new Date().toISOString(),
    rows,
    allBound,
    evidence: rows.map((row) => `${row.missionId}: ${row.evidence}`),
  };
}
