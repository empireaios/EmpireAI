import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Q10_RUNTIMES } from "./runtime-catalog.js";
import type { RuntimeEvidence, Q10Runtime } from "./types.js";

const SESSION_PATH = "pillow/src/session.ts";
const REGISTRY_PATH = "pillow/src/orchestrator/subsystem-registry.ts";
const Q1014_TYPES_PATH = "pillow/src/audit-runtime/types.ts";

function readRepoText(root: string, relativePath: string): string {
  const absolute = join(root, relativePath);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
}

function detectQ1014Contract(root: string): boolean {
  const text = readRepoText(root, Q1014_TYPES_PATH);
  return text.includes("Q1014ConsumableContract");
}

/**
 * A runtime's certification evidence is considered "certified" only when
 * observed CERTIFICATION_EVIDENCE.json or markdown explicitly says so.
 * Q10 evidence uses certificationStatus === "passed" or decision === "Certified";
 * markdown certification matrices use "PASS" cells (or "FINAL PASS" for
 * cross-series compatibility with the Q9-11 pattern).
 */
function detectCertified(auditDir: string): { certified: boolean; source: RuntimeEvidence["certifiedSource"]; deferred: boolean; evidenceContradiction: string | null; missionMismatch: string | null } {
  const evidenceJsonPath = join(auditDir, "CERTIFICATION_EVIDENCE.json");
  let certified = false;
  let source: RuntimeEvidence["certifiedSource"] = "none";
  let deferred = false;
  let evidenceContradiction: string | null = null;

  if (existsSync(evidenceJsonPath)) {
    try {
      const parsed = JSON.parse(readFileSync(evidenceJsonPath, "utf8")) as Record<string, unknown>;
      const certificationStatus = String(parsed.certificationStatus ?? "").toLowerCase();
      const decision = String(parsed.decision ?? "");
      if (certificationStatus === "passed" || decision === "Certified") {
        certified = true;
        source = "json";
      } else if (certificationStatus.includes("deferred") || decision === "Deferred") {
        deferred = true;
      }
      return { certified, source, deferred, evidenceContradiction, missionMismatch: null };
    } catch {
      return {
        certified,
        source,
        deferred,
        evidenceContradiction: "CERTIFICATION_EVIDENCE.json present but is not valid JSON",
        missionMismatch: null,
      };
    }
  }

  if (existsSync(auditDir)) {
    for (const file of readdirSync(auditDir)) {
      if (!file.endsWith(".md")) continue;
      const text = readFileSync(join(auditDir, file), "utf8");
      if (text.includes("FINAL PASS") || /\|\s*PASS\s*\|/i.test(text)) {
        certified = true;
        source = "markdown";
        break;
      }
      if (/deferred/i.test(text)) deferred = true;
    }
  }
  return { certified, source, deferred, evidenceContradiction, missionMismatch: null };
}

/** Collects repository evidence for a single Q10-01..Q10-13 runtime. */
export function collectRuntimeEvidence(
  root: string,
  runtime: Q10Runtime,
  sessionText: string,
  registryText: string,
  q1014Present: boolean,
): RuntimeEvidence {
  const engineExists = existsSync(join(root, runtime.enginePath));
  const configExists = existsSync(join(root, runtime.configPath));
  const governanceExists = existsSync(join(root, runtime.governancePath));
  const bridgeExists = existsSync(join(root, runtime.bridgePath));
  const testExists = existsSync(join(root, runtime.testPath));
  const auditDir = join(root, runtime.auditPath);

  const { certified, source, deferred, evidenceContradiction } = detectCertified(auditDir);

  const sessionReferenced =
    sessionText.includes(runtime.dependencyKey) || sessionText.includes(runtime.modulePath);
  const registryReferenced = registryText.includes(`"${runtime.subsystemId}"`);
  const q1014ContractPresent = runtime.missionId === "Q10-13" ? q1014Present : true;

  const evidence = [
    `engine=${engineExists}`,
    `config=${configExists}`,
    `governance=${governanceExists}`,
    `bridge=${bridgeExists}`,
    `test=${testExists}`,
    `session=${sessionReferenced}`,
    `registry=${registryReferenced}`,
    `certified=${certified}(${source})`,
    runtime.missionId === "Q10-13" ? `q1014Contract=${q1014ContractPresent}` : null,
    evidenceContradiction ? `contradiction=${evidenceContradiction}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  return {
    missionId: runtime.missionId,
    engineExists,
    configExists,
    governanceExists,
    bridgeExists,
    testExists,
    sessionReferenced,
    registryReferenced,
    certified,
    certifiedSource: source,
    q1014ContractPresent,
    deferred,
    evidenceContradiction,
    evidence,
  };
}

/** Collects repository evidence for every Q10-01..Q10-13 runtime in one pass. */
export function collectRepositoryEvidence(root: string): Map<string, RuntimeEvidence> {
  const sessionText = readRepoText(root, SESSION_PATH);
  const registryText = readRepoText(root, REGISTRY_PATH);
  const q1014Present = detectQ1014Contract(root);
  return new Map(
    Q10_RUNTIMES.map((runtime) => [
      runtime.missionId,
      collectRuntimeEvidence(root, runtime, sessionText, registryText, q1014Present),
    ]),
  );
}
