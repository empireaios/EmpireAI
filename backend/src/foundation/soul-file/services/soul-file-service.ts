import { randomUUID } from "node:crypto";

import {
  createDefaultSoulFileDocument,
  createEmptyRuntimeMemory,
  normalizeSoulFileDocument,
  type SoulFileChangeType,
  type SoulFileDocument,
  type SoulFileExportResult,
  type SoulFileRuntimeMemory,
  type SoulRuntimeEntry,
  type SoulRuntimeMemoryKey,
} from "../models/soul-file-document.js";
import type { SoulFileRepository } from "../repositories/soul-file-repository.js";
import { getSoulFileRepository } from "../repositories/sqlite-soul-file-repository.js";
import { diffSoulFileVersions } from "./soul-file-diff.js";
import { attachSoulFileChecksum, validateSoulFileIntegrity } from "./soul-file-integrity.js";
import {
  exportSoulFileJson,
  exportSoulFileMarkdown,
  finalizeImportedSoulFile,
  parseSoulFileJson,
  parseSoulFileMarkdown,
} from "./soul-file-serializer.js";

export class SoulFileNotFoundError extends Error {
  constructor(message = "Soul File not found for workspace") {
    super(message);
    this.name = "SoulFileNotFoundError";
  }
}

export class SoulFileIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SoulFileIntegrityError";
  }
}

function bumpVersionLabel(current: string): string {
  const parts = current.split(".").map((part) => Number(part));
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    return `${parts[0]}.${parts[1]}.${(parts[2] ?? 0) + 1}`;
  }
  return current;
}

function recordChange(
  repository: SoulFileRepository,
  input: {
    workspaceId: string;
    fromVersion: number | null;
    toVersion: number;
    changeType: SoulFileChangeType;
    summary: string;
    actor: string;
  },
) {
  repository.appendChange({
    changeId: randomUUID(),
    workspaceId: input.workspaceId,
    fromVersion: input.fromVersion,
    toVersion: input.toVersion,
    changeType: input.changeType,
    summary: input.summary,
    actor: input.actor,
    createdAt: new Date().toISOString(),
  });
}

/** Initializes the Soul File for a workspace — idempotent if already exists. */
export function initializeSoulFile(
  workspaceId: string,
  actor = "system",
): SoulFileDocument {
  const repository = getSoulFileRepository();
  const existing = repository.getLatestSnapshot(workspaceId);
  if (existing) {
    return normalizeSoulFileDocument(existing);
  }

  const timestamp = new Date().toISOString();
  const base = createDefaultSoulFileDocument(workspaceId);
  const document = attachSoulFileChecksum({
    ...base,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  repository.saveSnapshot(document);
  recordChange(repository, {
    workspaceId,
    fromVersion: null,
    toVersion: document.version,
    changeType: "INITIALIZE",
    summary: "Soul File initialized — Empire identity established",
    actor,
  });

  return document;
}

/** Returns the latest Soul File for a workspace, initializing if needed. */
export function getSoulFile(workspaceId: string): SoulFileDocument {
  const repository = getSoulFileRepository();
  const latest = repository.getLatestSnapshot(workspaceId);
  if (!latest) {
    return initializeSoulFile(workspaceId);
  }
  return normalizeSoulFileDocument(latest);
}

export type EvolveSoulFileInput = {
  workspaceId: string;
  actor?: string;
  identity?: Partial<SoulFileDocument["identity"]>;
  continuity?: Partial<SoulFileDocument["continuity"]>;
  operationalState?: Partial<SoulFileDocument["operationalState"]>;
  runtimeMemory?: Partial<SoulFileRuntimeMemory>;
  metadata?: Record<string, string>;
  summary?: string;
  changeType?: SoulFileChangeType;
};

const RUNTIME_MEMORY_LIMIT = 200;

function mergeRuntimeMemory(
  current: SoulFileRuntimeMemory,
  incoming?: Partial<SoulFileRuntimeMemory>,
): SoulFileRuntimeMemory {
  if (!incoming) return current;

  const merged = { ...current };
  for (const key of Object.keys(incoming) as SoulRuntimeMemoryKey[]) {
    const entries = incoming[key];
    if (!entries?.length) continue;
    const existingIds = new Set(merged[key].map((entry) => entry.entryId));
    const appended = entries.filter((entry) => !existingIds.has(entry.entryId));
    merged[key] = [...merged[key], ...appended].slice(-RUNTIME_MEMORY_LIMIT);
  }
  return merged;
}

/** Evolves the Soul File — continuous living identity, not a backup restore. */
export function evolveSoulFile(input: EvolveSoulFileInput): SoulFileDocument {
  const repository = getSoulFileRepository();
  const current = getSoulFile(input.workspaceId);
  const timestamp = new Date().toISOString();
  const nextVersion = current.version + 1;
  const nextVersionLabel = bumpVersionLabel(current.versionLabel);

  const evolved = attachSoulFileChecksum({
    ...current,
    version: nextVersion,
    versionLabel: nextVersionLabel,
    identity: { ...current.identity, ...input.identity },
    continuity: {
      ...current.continuity,
      ...input.continuity,
      lastEvolutionAt: timestamp,
    },
    operationalState: { ...current.operationalState, ...input.operationalState },
    runtimeMemory: mergeRuntimeMemory(current.runtimeMemory, input.runtimeMemory),
    metadata: { ...current.metadata, ...input.metadata },
    updatedAt: timestamp,
  });

  repository.saveSnapshot(evolved);

  const diff = diffSoulFileVersions(current, evolved);
  recordChange(repository, {
    workspaceId: input.workspaceId,
    fromVersion: current.version,
    toVersion: evolved.version,
    changeType: input.changeType ?? "EVOLVE",
    summary: input.summary ?? diff.summary,
    actor: input.actor ?? "system",
  });

  return evolved;
}

export type CaptureSoulRuntimeInput = {
  workspaceId: string;
  memoryKey: SoulRuntimeMemoryKey;
  entry: Omit<SoulRuntimeEntry, "entryId" | "recordedAt"> & {
    entryId?: string;
    recordedAt?: string;
  };
  actor?: string;
  operationalState?: Partial<SoulFileDocument["operationalState"]>;
  continuity?: Partial<SoulFileDocument["continuity"]>;
  metadata?: Record<string, string>;
};

/** Appends a runtime memory entry and evolves the Soul File automatically. */
export function captureSoulRuntimeMemory(input: CaptureSoulRuntimeInput): SoulFileDocument {
  const entry: SoulRuntimeEntry = {
    entryId: input.entry.entryId ?? randomUUID(),
    title: input.entry.title,
    summary: input.entry.summary,
    correlationId: input.entry.correlationId,
    source: input.entry.source,
    payload: input.entry.payload ?? {},
    recordedAt: input.entry.recordedAt ?? new Date().toISOString(),
  };

  return evolveSoulFile({
    workspaceId: input.workspaceId,
    actor: input.actor ?? "soul-runtime",
    runtimeMemory: { [input.memoryKey]: [entry] },
    operationalState: input.operationalState,
    continuity: input.continuity,
    metadata: input.metadata,
    summary: `Runtime capture: ${input.memoryKey} — ${entry.title}`,
    changeType: "RUNTIME_CAPTURE",
  });
}

/** Exports Soul File in JSON or Markdown format for Grand King's dashboard download. */
export function exportSoulFile(
  workspaceId: string,
  format: "json" | "markdown",
): SoulFileExportResult {
  const document = getSoulFile(workspaceId);
  return format === "json" ? exportSoulFileJson(document) : exportSoulFileMarkdown(document);
}

export type ImportSoulFileInput = {
  workspaceId: string;
  format: "json" | "markdown";
  content: string;
  actor?: string;
};

/** Imports Soul File content — validates integrity and records evolution. */
export function importSoulFile(input: ImportSoulFileInput): SoulFileDocument {
  const repository = getSoulFileRepository();
  const current = getSoulFile(input.workspaceId);
  const timestamp = new Date().toISOString();

  let importedPayload: Omit<SoulFileDocument, "checksum">;
  if (input.format === "json") {
    const parsed = parseSoulFileJson(input.content);
    const integrity = validateSoulFileIntegrity(parsed);
    if (!integrity.valid) {
      throw new SoulFileIntegrityError(integrity.message);
    }
    importedPayload = {
      ...parsed,
      soulFileId: current.soulFileId,
      workspaceId: input.workspaceId,
      version: current.version + 1,
      versionLabel: bumpVersionLabel(current.versionLabel),
      createdAt: current.createdAt,
      updatedAt: timestamp,
    };
  } else {
    importedPayload = {
      ...parseSoulFileMarkdown(input.content),
      soulFileId: current.soulFileId,
      workspaceId: input.workspaceId,
      version: current.version + 1,
      versionLabel: bumpVersionLabel(current.versionLabel),
      createdAt: current.createdAt,
      updatedAt: timestamp,
    };
  }

  const document = finalizeImportedSoulFile(importedPayload);
  repository.saveSnapshot(document);

  const diff = diffSoulFileVersions(current, document);
  recordChange(repository, {
    workspaceId: input.workspaceId,
    fromVersion: current.version,
    toVersion: document.version,
    changeType: input.format === "json" ? "IMPORT_JSON" : "IMPORT_MARKDOWN",
    summary: diff.summary,
    actor: input.actor ?? "system",
  });

  return document;
}

/** Validates Soul File integrity for workspace or raw document. */
export function verifySoulFileIntegrity(
  workspaceIdOrDocument: string | SoulFileDocument,
) {
  if (typeof workspaceIdOrDocument === "string") {
    const document = getSoulFile(workspaceIdOrDocument);
    return validateSoulFileIntegrity(document);
  }
  return validateSoulFileIntegrity(workspaceIdOrDocument);
}

export function diffSoulFile(
  workspaceId: string,
  fromVersion: number,
  toVersion: number,
) {
  const repository = getSoulFileRepository();
  const before = repository.getSnapshotByVersion(workspaceId, fromVersion);
  const after = repository.getSnapshotByVersion(workspaceId, toVersion);

  if (!before || !after) {
    throw new SoulFileNotFoundError(
      `Soul File versions v${fromVersion} and/or v${toVersion} not found`,
    );
  }

  return diffSoulFileVersions(before, after);
}

export function listSoulFileVersions(workspaceId: string): SoulFileDocument[] {
  return getSoulFileRepository().listSnapshots(workspaceId);
}

export function getSoulFileByVersion(
  workspaceId: string,
  version: number,
): SoulFileDocument | null {
  return getSoulFileRepository().getSnapshotByVersion(workspaceId, version);
}

export function listSoulFileChangeHistory(workspaceId: string, limit = 50) {
  return getSoulFileRepository().listChanges(workspaceId, limit);
}
