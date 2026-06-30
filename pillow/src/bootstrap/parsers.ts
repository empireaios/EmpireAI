import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RepositoryReader } from "./repository-reader.js";
import type {
  EnhancementSummary,
  ExecutiveAuditSummary,
  KnownActiveWork,
  KnownBacklog,
  RealOwnerSummary,
} from "./types.js";
import { EXECUTIVE_AUDIT_GLOB_PATTERNS } from "./catalog.js";

const execFileAsync = promisify(execFile);

export async function resolveRepositoryVersion(
  repositoryRoot: string,
): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--short", "HEAD"],
      { cwd: repositoryRoot, timeout: 3000 },
    );
    const sha = stdout.trim();
    return sha.length > 0 ? sha : null;
  } catch {
    return null;
  }
}

export function parseJourneyPosition(journeyText: string | null): string | null {
  if (!journeyText) return null;
  const positionMatch = journeyText.match(
    /Current Position[^\n]*\n[^\n]*?([^\n|]+(?:\|[^\n|]+)*)/i,
  );
  if (positionMatch?.[1]) {
    return positionMatch[1].trim();
  }
  const pillowRow = journeyText.match(
    /\|\s*(PILLOW-\d{3})[^\n]*\|\s*([^|]+)\|/,
  );
  if (pillowRow) {
    return `${pillowRow[1]} — ${pillowRow[2]?.trim() ?? ""}`;
  }
  return null;
}

export function parseCurrentMission(
  journeyText: string | null,
  statusText: string | null,
): string | null {
  if (statusText) {
    const statusMission = statusText.match(
      /(?:Current Mission|Active Mission|Pillow Program)[^\n]*:\s*([^\n]+)/i,
    );
    if (statusMission?.[1]) return statusMission[1].trim();
  }
  if (journeyText) {
    const pillowInProgress = journeyText.match(
      /\|\s*(PILLOW-\d{3})[^\n]*\|\s*[^|]*🟡[^|]*\|/,
    );
    if (pillowInProgress?.[1]) return pillowInProgress[1];

    const pillowNext = journeyText.match(
      /\|\s*(PILLOW-\d{3})[^\n]*\|\s*[^|]*🔵[^|]*\|/,
    );
    if (pillowNext?.[1]) return pillowNext[1];

    const inProgress = journeyText.match(
      /\|\s*(PILLOW-\d{3}|UX-\d{3}|REAL-\d{3})[^\n]*\|\s*[^|]*🟡[^|]*\|/,
    );
    if (inProgress?.[1]) return inProgress[1];
  }
  return null;
}

export function parseAdrCount(decisionsText: string | null): number {
  if (!decisionsText) return 0;
  const matches = decisionsText.match(/ADR-\d{3}/g);
  return matches ? new Set(matches).size : 0;
}

export function parseKnownBacklog(
  journeyText: string | null,
  reader: RepositoryReader,
): KnownBacklog {
  const closedReleases: string[] = [];
  let activeRelease: string | null = null;

  if (journeyText) {
    if (/BL-A[^\n]*closed|BL-A[^\n]*✅/i.test(journeyText)) {
      closedReleases.push("BL-A");
    }
    if (/BL-B[^\n]*closed|BL-B[^\n]*✅/i.test(journeyText)) {
      closedReleases.push("BL-B");
    }
    if (/BL-C[^\n]*(?:active|opened|🟡)/i.test(journeyText)) {
      activeRelease = "BL-C";
    }
  }

  void reader; // backlog also validated via artifact catalog

  return { activeRelease, closedReleases };
}

export function parseKnownActiveWork(
  journeyText: string | null,
  statusText: string | null,
): KnownActiveWork {
  const nextMissions: string[] = [];
  let currentMission: string | null = null;

  if (journeyText) {
    const pillowRows = [
      ...journeyText.matchAll(/\|\s*(PILLOW-\d{3})[^\n]*\|[^\n]+\|/g),
    ];
    for (const row of pillowRows) {
      const id = row[1];
      if (!id) continue;
      const line = row[0];
      if (/🟡|in progress/i.test(line)) {
        currentMission = id;
      } else if (/🔵|not started/i.test(line)) {
        nextMissions.push(id);
      }
    }
  }

  if (!currentMission) {
    currentMission = parseCurrentMission(journeyText, statusText);
  }

  return {
    pillowProgram: "PILLOW-001…006 per PILLOW_ARCHITECTURE_CONTRACT.md",
    currentMission,
    nextMissions: nextMissions.slice(0, 5),
  };
}

export function discoverRealOwners(
  journeyText: string | null,
  runtimeModules: string[],
): RealOwnerSummary[] {
  const owners: RealOwnerSummary[] = [];
  const seen = new Set<string>();

  if (journeyText) {
    for (const match of journeyText.matchAll(/\|\s*(REAL-\d{3})[^\n]*\|[^\n]+\|/g)) {
      const missionId = match[1];
      if (!missionId || seen.has(missionId)) continue;
      seen.add(missionId);
      const hint = match[0].split("|")[2]?.trim() ?? missionId;
      owners.push({ missionId, hint, source: "journey" });
    }
  }

  for (const moduleName of runtimeModules) {
    const syntheticId = moduleName.startsWith("REAL-")
      ? moduleName
      : moduleName.replace(/^real-/i, "REAL-");
    if (seen.has(syntheticId)) continue;
    seen.add(syntheticId);
    owners.push({
      missionId: syntheticId,
      hint: `backend/src/runtime/${moduleName}`,
      source: "runtime_module",
    });
  }

  return owners.sort((a, b) => a.missionId.localeCompare(b.missionId));
}

export async function discoverExecutiveAudits(
  reader: RepositoryReader,
): Promise<ExecutiveAuditSummary[]> {
  const rootFiles = await reader.listFiles(".");
  const audits: ExecutiveAuditSummary[] = [];

  for (const file of rootFiles) {
    const matchesPattern = EXECUTIVE_AUDIT_GLOB_PATTERNS.some((pattern) =>
      pattern.endsWith("_")
        ? file.startsWith(pattern)
        : file === pattern || file.includes("EXECUTIVE_AUDIT"),
    );
    if (
      matchesPattern ||
      file.endsWith("_VALIDATION_REPORT.md") ||
      file.endsWith("_DIFFERENCE_REPORT.md") ||
      file.includes("COMBINED_EXECUTIVE_AUDIT")
    ) {
      const absolutePath = reader.resolve(file);
      let modifiedAt: string | null = null;
      try {
        const { stat } = await import("node:fs/promises");
        const fileStat = await stat(absolutePath);
        modifiedAt = fileStat.mtime.toISOString();
      } catch {
        /* ignore */
      }
      audits.push({
        id: file.replace(/\.md$/i, ""),
        relativePath: file,
        modifiedAt,
      });
    }
  }

  return audits.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export async function discoverEnhancements(
  reader: RepositoryReader,
  journeyText: string | null,
): Promise<EnhancementSummary> {
  const registerPath = "docs/governance/UX_ENHANCEMENT_REGISTER.md";
  const registerText = await reader.readText(registerPath);

  if (registerText) {
    const items: EnhancementSummary["items"] = [];
    for (const match of registerText.matchAll(
      /\|\s*(UX-ENH-\d+|GC-\d{2})[^\n]*\|[^\n]+\|/g,
    )) {
      const id = match[1];
      if (!id) continue;
      items.push({ id, label: match[0].split("|")[2]?.trim() ?? id });
    }
    return { source: "ux_enhancement_register", items };
  }

  const items: EnhancementSummary["items"] = [];
  if (journeyText) {
    for (const match of journeyText.matchAll(
      /\|\s*(GC-\d{2}|UX-ENH-\d+)[^\n]*\|[^\n]+\|/g,
    )) {
      const id = match[1];
      if (!id) continue;
      items.push({ id, label: match[0].split("|")[2]?.trim() ?? id });
    }
  }

  return { source: "journey_fallback", items };
}

export async function discoverRuntimeModules(
  reader: RepositoryReader,
): Promise<string[]> {
  return reader.listSubdirs("backend/src/runtime");
}

export async function discoverExtraDoctrines(
  reader: RepositoryReader,
): Promise<string[]> {
  const rootFiles = await reader.listFiles(".");
  return rootFiles
    .filter(
      (f) =>
        f.startsWith("EMPIREAI_") &&
        f.endsWith(".md") &&
        (f.includes("DOCTRINE") || f.includes("RECOVERY")),
    )
    .sort();
}
