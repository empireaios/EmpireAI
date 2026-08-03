import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Q7_MISSIONS } from "./mission-catalog.js";
import type { MissionEvidence, Q7Mission } from "./types.js";

const SESSION_PATH = "pillow/src/session.ts";
const REGISTRY_PATH = "pillow/src/orchestrator/subsystem-registry.ts";

function readRepoText(root: string, relativePath: string): string {
  const absolute = join(root, relativePath);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
}

/**
 * Collects repository evidence for a single Q7-01..Q7-10 mission. Every
 * boolean here is a directly observed filesystem/text fact — nothing is
 * inferred or assumed when a file is absent.
 */
export function collectMissionEvidence(
  root: string,
  mission: Q7Mission,
  sessionText: string,
  registryText: string,
): MissionEvidence {
  const moduleExists = existsSync(join(root, mission.modulePath));
  const auditDir = join(root, mission.auditPath);
  const evidenceJsonPath = join(auditDir, "CERTIFICATION_EVIDENCE.json");

  let finalPass = false;
  let finalPassSource: MissionEvidence["finalPassSource"] = "none";
  let deferred = false;
  let evidenceContradiction: string | null = null;

  if (existsSync(evidenceJsonPath)) {
    try {
      const parsed = JSON.parse(readFileSync(evidenceJsonPath, "utf8")) as Record<
        string,
        unknown
      >;
      const status = String(parsed.status ?? "").toUpperCase();
      if (status === "FINAL PASS") {
        finalPass = true;
        finalPassSource = "json";
      } else if (status.includes("DEFERRED")) {
        deferred = true;
      }
      if (typeof parsed.missionId === "string" && parsed.missionId !== mission.missionId) {
        evidenceContradiction = `CERTIFICATION_EVIDENCE.json declares missionId ${parsed.missionId}, expected ${mission.missionId}`;
      }
    } catch {
      evidenceContradiction = "CERTIFICATION_EVIDENCE.json present but is not valid JSON";
    }
  }

  if (!finalPass && !evidenceContradiction && existsSync(auditDir)) {
    for (const file of readdirSync(auditDir)) {
      if (!file.endsWith(".md")) continue;
      const text = readFileSync(join(auditDir, file), "utf8");
      if (text.includes("FINAL PASS")) {
        finalPass = true;
        finalPassSource = "markdown";
        break;
      }
      if (/deferred/i.test(text)) deferred = true;
    }
  }

  const sessionReferenced =
    sessionText.includes(mission.dependencyKey) || sessionText.includes(mission.modulePath);
  const registryReferenced = registryText.includes(`"${mission.subsystemId}"`);
  const configExists = existsSync(join(root, mission.configPath));
  const governanceExists = existsSync(join(root, mission.governancePath));

  const evidence = `module=${moduleExists}; finalPass=${finalPass}(${finalPassSource}); session=${sessionReferenced}; registry=${registryReferenced}; config=${configExists}; governance=${governanceExists}${evidenceContradiction ? `; contradiction=${evidenceContradiction}` : ""}`;

  return {
    missionId: mission.missionId,
    moduleExists,
    finalPass,
    finalPassSource,
    sessionReferenced,
    registryReferenced,
    configExists,
    governanceExists,
    deferred,
    evidenceContradiction,
    evidence,
  };
}

/** Collects repository evidence for every Q7-01..Q7-10 mission in one pass. */
export function collectRepositoryEvidence(root: string): Map<string, MissionEvidence> {
  const sessionText = readRepoText(root, SESSION_PATH);
  const registryText = readRepoText(root, REGISTRY_PATH);
  return new Map(
    Q7_MISSIONS.map((mission) => [
      mission.missionId,
      collectMissionEvidence(root, mission, sessionText, registryText),
    ]),
  );
}
