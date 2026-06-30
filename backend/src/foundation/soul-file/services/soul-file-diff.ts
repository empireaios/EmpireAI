import type { SoulFileDiffEntry, SoulFileDiffResult, SoulFileDocument } from "../models/soul-file-document.js";

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function diffScalars(path: string, before: unknown, after: unknown, entries: SoulFileDiffEntry[]) {
  const beforeText = stringify(before);
  const afterText = stringify(after);
  if (beforeText !== afterText) {
    entries.push({
      path,
      before: beforeText || null,
      after: afterText || null,
    });
  }
}

function diffObject(
  path: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  entries: SoulFileDiffEntry[],
) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    diffScalars(`${path}.${key}`, before[key], after[key], entries);
  }
}

/** Computes a field-level diff between two Soul File versions. */
export function diffSoulFileVersions(
  before: SoulFileDocument,
  after: SoulFileDocument,
): SoulFileDiffResult {
  const entries: SoulFileDiffEntry[] = [];

  diffObject("identity", before.identity, after.identity, entries);
  diffObject("continuity", before.continuity, after.continuity, entries);
  diffObject("operationalState", before.operationalState, after.operationalState, entries);
  diffObject("runtimeMemory", before.runtimeMemory, after.runtimeMemory, entries);
  diffObject("metadata", before.metadata, after.metadata, entries);

  if (before.versionLabel !== after.versionLabel) {
    entries.push({
      path: "versionLabel",
      before: before.versionLabel,
      after: after.versionLabel,
    });
  }

  const summary =
    entries.length === 0
      ? `No changes between v${before.version} and v${after.version}`
      : `${entries.length} change(s) from v${before.version} to v${after.version}`;

  return {
    fromVersion: before.version,
    toVersion: after.version,
    entries,
    summary,
  };
}
