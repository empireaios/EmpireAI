import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Q9_MISSIONS } from "./mission-catalog.js";
import type { IntegrationCheckRow, IntegrationVerification, WorkerProbeResult } from "./types.js";

const SESSION_PATH = "pillow/src/session.ts";

function decapitalize(value: string): string {
  return value.length ? value[0]!.toLowerCase() + value.slice(1) : value;
}

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
      keys.push(decapitalize(key.slice("binds".length)));
    }
    return Array.from(new Set(keys));
  } catch {
    return [];
  }
}

function extractBindBlock(sessionText: string, dependencyKey: string): string | null {
  const marker = `${dependencyKey}.bindIntegrations({`;
  const start = sessionText.indexOf(marker);
  if (start === -1) return null;
  const end = sessionText.indexOf("});", start);
  return end === -1 ? sessionText.slice(start, start + 2000) : sessionText.slice(start, end);
}

/** Verifies integration wiring from session.ts bind blocks + optional runtime probes. */
export function verifyIntegrations(
  root: string,
  probes: Map<string, WorkerProbeResult>,
): IntegrationVerification {
  const sessionPath = join(root, SESSION_PATH);
  const sessionText = existsSync(sessionPath) ? readFileSync(sessionPath, "utf8") : "";

  const rows: IntegrationCheckRow[] = Q9_MISSIONS.map((mission) => {
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
    const allBound =
      registryReferenced &&
      (expectedBinds.length === 0 || missingBinds.length === 0);
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
        ? `expected=[${expectedBinds.join(",")}] observed=[${observedBinds.join(",")}] registry=${registryReferenced}`
        : `session reference=${registryReferenced}`,
    };
  });

  return {
    verifiedAt: new Date().toISOString(),
    rows,
    allBound: rows.every((row) => row.allBound),
    evidence: rows.map((row) => `${row.missionId}: ${row.evidence}`),
  };
}
