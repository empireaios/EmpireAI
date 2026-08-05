import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Q9_MISSIONS } from "./mission-catalog.js";
import type { MissionEvidence, Q9Mission } from "./types.js";

const SESSION_PATH = "pillow/src/session.ts";
const REGISTRY_PATH = "pillow/src/orchestrator/subsystem-registry.ts";
const Q911_TYPES_PATH = "pillow/src/capital-risk-worker/types.ts";

function readRepoText(root: string, relativePath: string): string {
  const absolute = join(root, relativePath);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
}

function detectQ911Contract(root: string): boolean {
  const text = readRepoText(root, Q911_TYPES_PATH);
  return text.includes("Q911ConsumableContract");
}

/** Collects repository evidence for a single Q9-01..Q9-10 mission. */
export function collectMissionEvidence(
  root: string,
  mission: Q9Mission,
  sessionText: string,
  registryText: string,
  q911Present: boolean,
): MissionEvidence {
  const engineExists = existsSync(join(root, mission.enginePath));
  const configExists = existsSync(join(root, mission.configPath));
  const governanceExists = existsSync(join(root, mission.governancePath));
  const bridgeExists = existsSync(join(root, mission.bridgePath));
  const testExists = existsSync(join(root, mission.testPath));
  const auditDir = join(root, mission.auditPath);
  const evidenceJsonPath = join(auditDir, "CERTIFICATION_EVIDENCE.json");

  let finalPass = false;
  let finalPassSource: MissionEvidence["finalPassSource"] = "none";
  let deferred = false;
  let evidenceContradiction: string | null = null;

  if (existsSync(evidenceJsonPath)) {
    try {
      const parsed = JSON.parse(readFileSync(evidenceJsonPath, "utf8")) as Record<string, unknown>;
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
  const q911ContractPresent = mission.missionId === "Q9-10" ? q911Present : true;

  const evidence = [
    `engine=${engineExists}`,
    `config=${configExists}`,
    `governance=${governanceExists}`,
    `bridge=${bridgeExists}`,
    `test=${testExists}`,
    `session=${sessionReferenced}`,
    `registry=${registryReferenced}`,
    `finalPass=${finalPass}(${finalPassSource})`,
    mission.missionId === "Q9-10" ? `q911Contract=${q911ContractPresent}` : null,
    evidenceContradiction ? `contradiction=${evidenceContradiction}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  return {
    missionId: mission.missionId,
    engineExists,
    configExists,
    governanceExists,
    bridgeExists,
    testExists,
    sessionReferenced,
    registryReferenced,
    finalPass,
    finalPassSource,
    q911ContractPresent,
    deferred,
    evidenceContradiction,
    evidence,
  };
}

/** Collects repository evidence for every Q9-01..Q9-10 mission in one pass. */
export function collectRepositoryEvidence(root: string): Map<string, MissionEvidence> {
  const sessionText = readRepoText(root, SESSION_PATH);
  const registryText = readRepoText(root, REGISTRY_PATH);
  const q911Present = detectQ911Contract(root);
  return new Map(
    Q9_MISSIONS.map((mission) => [
      mission.missionId,
      collectMissionEvidence(root, mission, sessionText, registryText, q911Present),
    ]),
  );
}
