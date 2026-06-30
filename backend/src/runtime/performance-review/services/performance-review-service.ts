import fs from "node:fs";
import path from "node:path";
import {
  BACKEND_SRC,
  listDirectories,
  listFilesRecursive,
  readText,
} from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import type { PerformanceReview } from "../models/performance-review.js";

type ReviewItem = PerformanceReview["items"][number];

const HEAVY_QUERY_PATTERNS = [
  { pattern: /SELECT \*/g, label: "SELECT * wildcard queries" },
  { pattern: /\.all\(\s*\{/g, label: "SQLite .all() unbounded fetch" },
  { pattern: /listFilesRecursive/g, label: "Recursive filesystem scan" },
  { pattern: /readdirSync/g, label: "Synchronous directory reads" },
  { pattern: /JSON\.parse\(.*record_json/g, label: "JSON blob hydration per row" },
];

const SLOW_API_HINTS = [
  { pattern: /buildExecutiveVisualDebate/g, label: "Executive visual debate (12-chief synthesis)" },
  { pattern: /runExecutiveDebate/g, label: "Executive Council debate engine" },
  { pattern: /scanPlaceholdersInDir/g, label: "Full-tree placeholder scan" },
  { pattern: /for \(const entry of fs\.readdirSync\(routesDir/g, label: "Runtime route enumeration at request time" },
];

function scanPatternHits(
  dir: string,
  patterns: Array<{ pattern: RegExp; label: string }>,
): Array<{ label: string; fileCount: number; sampleFiles: string[] }> {
  const hits = new Map<string, string[]>();
  for (const file of listFilesRecursive(dir, ".ts").slice(0, 500)) {
    const content = readText(file);
    for (const { pattern, label } of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        const list = hits.get(label) ?? [];
        list.push(path.relative(BACKEND_SRC, file));
        hits.set(label, list);
      }
    }
  }
  return [...hits.entries()].map(([label, files]) => ({
    label,
    fileCount: files.length,
    sampleFiles: files.slice(0, 3),
  }));
}

function findLargePayloadModules(): string[] {
  const runtimeDir = path.join(BACKEND_SRC, "runtime");
  const large: string[] = [];
  for (const mod of listDirectories(runtimeDir).slice(0, 120)) {
    const serviceDir = path.join(runtimeDir, mod, "services");
    if (!fs.existsSync(serviceDir)) continue;
    for (const f of fs.readdirSync(serviceDir).filter((n) => n.endsWith("-service.ts"))) {
      const lines = readText(path.join(serviceDir, f)).split("\n").length;
      if (lines > 200) large.push(`${mod}/${f} (${lines} lines)`);
    }
  }
  return large.slice(0, 10);
}

/** REAL-093 — Architecture performance review (repo-scanner patterns, no profiling). */
export function buildPerformanceReview(
  workspaceId: string,
  companyId: string,
): PerformanceReview {
  const items: ReviewItem[] = [];
  const queryHits = scanPatternHits(BACKEND_SRC, HEAVY_QUERY_PATTERNS);
  const apiHits = scanPatternHits(BACKEND_SRC, SLOW_API_HINTS);
  const largeModules = findLargePayloadModules();
  const runtimeCount = listDirectories(path.join(BACKEND_SRC, "runtime")).length;

  for (const hit of queryHits) {
    const severity = hit.fileCount >= 5 ? "BLOCKED" : hit.fileCount >= 2 ? "PENDING" : "READY";
    const score = Math.max(35, 95 - hit.fileCount * 12);
    items.push({
      itemId: `query-${hit.label.replace(/\s+/g, "-").toLowerCase()}`,
      label: `Heavy query hint: ${hit.label}`,
      score,
      status: severity as ReviewItem["status"],
      recommendation: hit.fileCount >= 3
        ? "Add pagination, column projection, or caching — avoid unbounded reads on hot paths"
        : "Monitor at scale — pattern acceptable for admin/inspection routes only",
      evidence: `${hit.fileCount} files · samples: ${hit.sampleFiles.join(", ") || "none"}`,
      why: "Unbounded queries become latency bottlenecks when live commerce data grows",
    });
  }

  for (const hit of apiHits) {
    items.push({
      itemId: `api-${hit.label.replace(/\s+/g, "-").toLowerCase()}`,
      label: `Slow API pattern: ${hit.label}`,
      score: Math.max(40, 90 - hit.fileCount * 15),
      status: hit.fileCount >= 2 ? "PENDING" : "READY",
      recommendation: "Cache debate/scan results per workspace; defer full-tree scans to background ESIS jobs",
      evidence: `${hit.fileCount} call sites · ${hit.sampleFiles.join(", ")}`,
      why: "Mission Home dashboards must stay responsive during Grand King review sessions",
    });
  }

  for (const mod of largeModules) {
    items.push({
      itemId: `payload-${mod.split("/")[0]}`,
      label: `Large payload module: ${mod.split("/")[0]}`,
      score: 55,
      status: "PENDING",
      recommendation: "Split dashboard response into lazy-loaded sections or paginated sub-resources",
      evidence: mod,
      why: "Oversized service builders increase serialization cost and TTFB on dashboard routes",
    });
  }

  items.push({
    itemId: "runtime-module-scale",
    label: "Runtime module cardinality",
    score: runtimeCount > 90 ? 50 : 80,
    status: runtimeCount > 90 ? "PENDING" : "READY",
    recommendation: runtimeCount > 90
      ? "Group related runtime modules under shared health endpoints; lazy-register routes"
      : "Module count manageable — maintain route-level caching headers",
    evidence: `${runtimeCount} runtime modules · ${PROGRAM_CATALOG.length} PROGRAM_CATALOG entries`,
    why: "High module count increases cold-start and route registration overhead on serverless deploys",
  });

  const avgScore = Math.round(items.reduce((s, i) => s + i.score, 0) / Math.max(items.length, 1));

  return {
    moduleId: "performance-review",
    missionId: "REAL-093",
    workspaceId,
    companyId,
    summary: `REAL-093 — ${queryHits.length} query patterns · ${apiHits.length} API patterns · ${largeModules.length} large modules · architecture review only (no profiling)`,
    items,
    reusedModules: ["empire-self-inspection", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
