import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, relative, sep } from "node:path";
import type { RepositoryIntelligenceEngineConfiguration } from "./configuration.js";
import { SOURCE_EXTENSIONS } from "./paths.js";
import type { ArchitectureLayer, RepositoryStructureDiscovery, SourceType } from "./types.js";

export type ScannedFile = {
  relativePath: string;
  absolutePath: string;
  size: number;
  layer: ArchitectureLayer;
  extension: string;
  sourceType: SourceType;
  content?: string;
};

const EXCLUDE_SET = new Set<string>();

function toPosix(path: string): string {
  return path.split(sep).join("/");
}

export function classifyArchitectureLayer(relativePath: string): ArchitectureLayer {
  const normalized = toPosix(relativePath).toLowerCase();
  if (normalized.includes("/validation/tests/") || normalized.includes("/tests/") || normalized.endsWith(".test.ts")) {
    return "tests";
  }
  if (normalized.startsWith("pillow/")) return "pillow";
  if (normalized.startsWith("backend/")) return "backend";
  if (normalized.startsWith("empireai-web/")) return "web";
  if (normalized.startsWith("config/")) return "config";
  if (normalized.startsWith("docs/governance/")) return "governance_docs";
  return "other";
}

function classifySourceType(extension: string): SourceType {
  if (extension === ".ts" || extension === ".tsx") return "typescript";
  if (extension === ".js" || extension === ".jsx" || extension === ".mjs" || extension === ".cjs") return "javascript";
  if (extension === ".json") return "json";
  if (extension === ".md") return "markdown";
  return "other";
}

function shouldExclude(relativePath: string, excludeDirs: string[]): boolean {
  const parts = toPosix(relativePath).split("/");
  for (const part of parts) {
    if (excludeDirs.includes(part)) return true;
  }
  return false;
}

function walkDirectory(
  repositoryRoot: string,
  currentDir: string,
  relativeDir: string,
  config: RepositoryIntelligenceEngineConfiguration,
  depth: number,
  files: ScannedFile[],
): void {
  if (depth > config.maxDepth || files.length >= config.maxFiles) return;

  let entries: string[];
  try {
    entries = readdirSync(currentDir);
  } catch {
    return;
  }

  entries.sort();
  for (const entry of entries) {
    if (files.length >= config.maxFiles) break;
    const absolutePath = join(currentDir, entry);
    const relativePath = relativeDir ? join(relativeDir, entry) : entry;
    const posixRelative = toPosix(relativePath);

    if (shouldExclude(posixRelative, config.excludeDirs)) continue;

    let stats;
    try {
      stats = statSync(absolutePath);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      walkDirectory(repositoryRoot, absolutePath, posixRelative, config, depth + 1, files);
      continue;
    }

    if (!stats.isFile()) continue;

    const extension = extname(entry).toLowerCase();
    const layer = classifyArchitectureLayer(posixRelative);
    const sourceType = classifySourceType(extension);
    const scanned: ScannedFile = {
      relativePath: posixRelative,
      absolutePath,
      size: stats.size,
      layer,
      extension,
      sourceType,
    };

    if (SOURCE_EXTENSIONS.includes(extension as (typeof SOURCE_EXTENSIONS)[number]) || extension === ".json" || extension === ".md") {
      try {
        scanned.content = readFileSync(absolutePath, "utf8");
      } catch {
        /* skip unreadable */
      }
    }

    files.push(scanned);
  }
}

export function scanRepository(
  repositoryRoot: string,
  config: RepositoryIntelligenceEngineConfiguration,
): { files: ScannedFile[]; discovery: RepositoryStructureDiscovery } {
  EXCLUDE_SET.clear();
  for (const dir of config.excludeDirs) EXCLUDE_SET.add(dir);

  const files: ScannedFile[] = [];
  for (const root of config.includeRoots) {
    const absoluteRoot = join(repositoryRoot, root);
    try {
      if (!statSync(absoluteRoot).isDirectory()) continue;
    } catch {
      continue;
    }
    walkDirectory(repositoryRoot, absoluteRoot, toPosix(root), config, 0, files);
    if (files.length >= config.maxFiles) break;
  }

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  const fingerprint = computeRepositoryFingerprint(files);
  const repositoryVersion = fingerprint.slice(0, 16);

  const discovery: RepositoryStructureDiscovery = {
    discoveredAt: new Date().toISOString(),
    includeRoots: [...config.includeRoots],
    excludeDirs: [...config.excludeDirs],
    files: files.map((file) => ({
      relativePath: file.relativePath,
      size: file.size,
      layer: file.layer,
    })),
    repositoryFingerprint: fingerprint,
    repositoryVersion,
    totalFiles: files.length,
    readOnly: true,
  };

  return { files, discovery };
}

export function computeRepositoryFingerprint(
  files: Array<{ relativePath: string; size: number }>,
): string {
  const payload = files
    .map((file) => `${file.relativePath}:${file.size}`)
    .sort((a, b) => a.localeCompare(b))
    .join("\n");
  return createHash("sha256").update(payload).digest("hex");
}

export function resolveRelativeImport(fromFile: string, specifier: string, repositoryRoot: string): string | null {
  if (!specifier.startsWith(".")) return null;
  const fromDir = toPosix(fromFile).split("/").slice(0, -1);
  const parts = [...fromDir, ...specifier.split("/")];
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") {
      resolved.pop();
      continue;
    }
    resolved.push(part);
  }
  const base = resolved.join("/");
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
    `${base}/index.js`,
  ];
  for (const candidate of candidates) {
    try {
      const absolute = normalize(join(repositoryRoot, candidate));
      statSync(absolute);
      return toPosix(candidate);
    } catch {
      /* continue */
    }
  }
  return base;
}

export const IMPORT_SPECIFIER_PATTERN =
  /(?:import\s+(?:type\s+)?(?:[\w*{}\s,$]+\s+from\s+)?|export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from\s+|require\s*\(\s*)['"]([^'"]+)['"]/g;

export const EXPORT_NAME_PATTERN =
  /export\s+(?:async\s+)?(?:function|class|const|let|var|type|interface|enum)\s+([A-Za-z0-9_$]+)/g;

export const MISSION_ID_PATTERN = /\b(Q\d{1,2}-\d{2,3}|PILLOW-[A-Z]+-\d{3})\b/g;

export const ENGINE_ID_PATTERN = /\b(PILLOW-[A-Z]+-\d{3})\b/g;

export function extractImportSpecifiers(content: string): string[] {
  const specifiers: string[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(IMPORT_SPECIFIER_PATTERN.source, "g");
  while ((match = pattern.exec(content)) !== null) {
    specifiers.push(match[1]!);
  }
  return specifiers;
}

export function extractExportNames(content: string): string[] {
  const names: string[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(EXPORT_NAME_PATTERN.source, "g");
  while ((match = pattern.exec(content)) !== null) {
    names.push(match[1]!);
  }
  return names;
}
