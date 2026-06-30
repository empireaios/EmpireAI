import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { ContextSourceDescriptor, ContextTask } from "./types.js";
import { sourcesForTask } from "./catalog.js";

export function selectSourcesForTask(
  task: ContextTask,
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
): ContextSourceDescriptor[] {
  const base = sourcesForTask(task);
  const seenPaths = new Set(base.map((s) => s.path));
  const extras: ContextSourceDescriptor[] = [];

  if (
    task === "continue_ux" ||
    task === "review_executive_audit" ||
    task === "generate_cursor_mission"
  ) {
    const latestAudit = pickLatestExecutiveAudit(bootstrap);
    if (latestAudit && !seenPaths.has(latestAudit.relativePath)) {
      seenPaths.add(latestAudit.relativePath);
      extras.push({
        id: `executive_audit:${latestAudit.id}`,
        path: latestAudit.relativePath,
        description: `Latest executive audit: ${latestAudit.id}`,
        maxBytes: 10_000,
      });
    }
  }

  if (task === "continue_ux") {
    addIntelligenceEntityPaths(
      intelligence,
      ["ux", "global_component"],
      extras,
      seenPaths,
      2_000,
    );
  }

  if (task === "generate_cursor_mission") {
    addIntelligenceEntityPaths(intelligence, ["pillow"], extras, seenPaths, 2_000);
  }

  return dedupeSources([...base, ...extras]);
}

function pickLatestExecutiveAudit(bootstrap: EmpireBootstrapContext) {
  const audits = bootstrap.knownExecutiveAudits;
  if (audits.length === 0) return null;
  return [...audits].sort((a, b) => {
    const ta = a.modifiedAt ?? "";
    const tb = b.modifiedAt ?? "";
    return tb.localeCompare(ta);
  })[0];
}

function addIntelligenceEntityPaths(
  intelligence: RepositoryIntelligenceContext,
  classifications: string[],
  extras: ContextSourceDescriptor[],
  seenPaths: Set<string>,
  maxBytes: number,
): void {
  for (const entity of intelligence.entities) {
    if (!classifications.includes(entity.classification)) continue;
    if (!entity.path || entity.path.includes("#") || seenPaths.has(entity.path)) continue;
    if (!entity.path.endsWith(".md") && !entity.path.endsWith(".ts")) continue;
    seenPaths.add(entity.path);
    extras.push({
      id: `entity:${entity.id}`,
      path: entity.path,
      description: entity.label,
      maxBytes,
    });
  }
}

function dedupeSources(sources: ContextSourceDescriptor[]): ContextSourceDescriptor[] {
  const byPath = new Map<string, ContextSourceDescriptor>();
  for (const s of sources) {
    const existing = byPath.get(s.path);
    if (!existing || s.maxBytes > existing.maxBytes) {
      byPath.set(s.path, s);
    }
  }
  return [...byPath.values()];
}

export function estimateTokens(byteLength: number): number {
  return Math.ceil(byteLength / 4);
}
