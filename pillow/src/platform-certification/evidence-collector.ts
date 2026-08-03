import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PLATFORM_MISSIONS } from "./mission-catalog.js";
export type RepositoryEvidence = { moduleExists: boolean; finalPass: boolean; registrationFound: boolean; sourceExportFound: boolean; evidence: string };
export function collectRepositoryEvidence(root: string) {
  const sessionPath = join(root, "pillow", "src", "session.ts");
  const registryPath = join(root, "pillow", "src", "orchestrator", "subsystem-registry.ts");
  const session = existsSync(sessionPath) ? readFileSync(sessionPath, "utf8") : "";
  const registry = existsSync(registryPath) ? readFileSync(registryPath, "utf8") : "";
  return new Map(PLATFORM_MISSIONS.map((m) => {
    const moduleExists = existsSync(join(root, m.implementationLocation));
    const audit = join(root, m.auditPath);
    let finalPass = false;
    if (existsSync(audit)) for (const file of readdirSync(audit)) {
      const path = join(audit, file);
      if (file.endsWith(".md") && readFileSync(path, "utf8").includes("FINAL PASS")) { finalPass = true; break; }
    }
    const sourceExportFound = session.includes(m.missionName) || session.includes(m.dependencyKey);
    const registrationFound = registry.includes(m.subsystemId) || registry.includes(m.missionName);
    return [m.missionId, { moduleExists, finalPass, registrationFound, sourceExportFound,
      evidence: `module=${moduleExists}; prior FINAL PASS=${finalPass}; session reference=${sourceExportFound}; registry reference=${registrationFound}` }] as const;
  }));
}
