import type { SoulRuntimeMemoryKey } from "../../soul-file/models/soul-file-document.js";
import { captureSoulRuntimeEvent } from "../../soul-runtime/services/soul-runtime-engine.js";
import type {
  StrategicMemoryCategory,
  StrategicMemoryEntry,
  StrategicMemoryLifecycleRecord,
  StrategicMemoryRecallInput,
  StrategicMemoryRecordInput,
  StrategicMemorySummary,
} from "../models/strategic-memory.js";
import { STRATEGIC_MEMORY_CATEGORIES, isTerminalMemoryStatus } from "../models/strategic-memory.js";
import { createDefaultStrategicMemories } from "./strategic-memory-default-memories.js";
import {
  createStrategicMemoryLifecycleRecord,
  getStrategicMemoryRepository,
} from "../repositories/sqlite-strategic-memory-repository.js";

export class StrategicMemoryNotFoundError extends Error {
  constructor(memoryId: string) {
    super(`Strategic memory not found: ${memoryId}`);
    this.name = "StrategicMemoryNotFoundError";
  }
}

export class StrategicMemoryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StrategicMemoryConflictError";
  }
}

function recordLifecycle(
  input: Omit<StrategicMemoryLifecycleRecord, "lifecycleId" | "createdAt">,
): StrategicMemoryLifecycleRecord {
  return getStrategicMemoryRepository().appendLifecycle(createStrategicMemoryLifecycleRecord(input));
}

function soulRuntimeKeyForCategory(category: StrategicMemoryCategory): SoulRuntimeMemoryKey {
  switch (category) {
    case "architecture":
      return "architectureUpdates";
    case "capitalLessons":
      return "capitalChanges";
    case "marketingLessons":
    case "successes":
      return "businessMilestones";
    case "failures":
    case "businessLessons":
    case "supplierLessons":
    default:
      return "lessonsLearned";
  }
}

function captureStrategicSoulRuntime(
  workspaceId: string,
  category: StrategicMemoryCategory,
  title: string,
  insight: string,
  actor: string,
  memoryId: string,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: soulRuntimeKeyForCategory(category),
      title,
      summary: insight,
      source: "system",
      actor,
      payload: { memoryId, category },
    });
  } catch {
    // Soul runtime capture is best-effort.
  }
}

function assertMutable(entry: StrategicMemoryEntry): void {
  if (isTerminalMemoryStatus(entry.status)) {
    throw new StrategicMemoryConflictError(
      `Memory ${entry.memoryId} is ${entry.status} — terminal memories are immutable`,
    );
  }
}

function matchesQuery(entry: StrategicMemoryEntry, query: string): boolean {
  const normalized = query.toLowerCase();
  return (
    entry.title.toLowerCase().includes(normalized) ||
    entry.insight.toLowerCase().includes(normalized) ||
    (entry.context?.toLowerCase().includes(normalized) ?? false) ||
    entry.tags.some((tag) => tag.toLowerCase().includes(normalized))
  );
}

/** Idempotent seed of default strategic memories. */
export function initializeStrategicMemory(workspaceId: string): StrategicMemoryEntry[] {
  const repository = getStrategicMemoryRepository();
  const existing = repository.listMemories(workspaceId);
  if (existing.length > 0) {
    return existing;
  }

  const memories = createDefaultStrategicMemories(workspaceId);
  for (const entry of memories) {
    repository.saveMemory(entry);
    recordLifecycle({
      memoryId: entry.memoryId,
      workspaceId,
      event: "RECORDED",
      summary: `Strategic memory recorded: ${entry.title}`,
      actor: "strategic-memory-engine",
      metadata: { category: entry.category, importance: String(entry.importance) },
    });
  }

  return memories;
}

export function recordStrategicMemory(input: StrategicMemoryRecordInput): StrategicMemoryEntry {
  const repository = getStrategicMemoryRepository();
  if (repository.getMemoryById(input.memoryId)) {
    throw new StrategicMemoryConflictError(`Strategic memory already exists: ${input.memoryId}`);
  }

  const timestamp = new Date().toISOString();
  const entry: StrategicMemoryEntry = {
    memoryId: input.memoryId,
    workspaceId: input.workspaceId,
    category: input.category,
    title: input.title,
    insight: input.insight,
    context: input.context,
    tags: input.tags ?? [],
    source: input.source ?? "manual",
    importance: input.importance ?? 3,
    status: "ACTIVE",
    recallCount: 0,
    version: 1,
    metadata: input.metadata ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  repository.saveMemory(entry);
  recordLifecycle({
    memoryId: entry.memoryId,
    workspaceId: input.workspaceId,
    event: "RECORDED",
    summary: `Strategic memory recorded: ${entry.title}`,
    actor: input.actor ?? "system",
    correlationId: input.correlationId,
    metadata: { category: entry.category },
  });
  captureStrategicSoulRuntime(
    input.workspaceId,
    entry.category,
    entry.title,
    entry.insight,
    input.actor ?? "system",
    entry.memoryId,
  );

  return entry;
}

export function modifyStrategicMemory(input: {
  memoryId: string;
  title?: string;
  insight?: string;
  context?: string;
  tags?: string[];
  importance?: number;
  metadata?: Record<string, string>;
  actor?: string;
}): StrategicMemoryEntry {
  const repository = getStrategicMemoryRepository();
  const existing = repository.getMemoryById(input.memoryId);
  if (!existing) {
    throw new StrategicMemoryNotFoundError(input.memoryId);
  }
  assertMutable(existing);

  const updated: StrategicMemoryEntry = {
    ...existing,
    title: input.title ?? existing.title,
    insight: input.insight ?? existing.insight,
    context: input.context ?? existing.context,
    tags: input.tags ?? existing.tags,
    importance: input.importance ?? existing.importance,
    metadata: { ...existing.metadata, ...input.metadata },
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.saveMemory(updated);
  recordLifecycle({
    memoryId: updated.memoryId,
    workspaceId: updated.workspaceId,
    event: "MODIFIED",
    summary: `Strategic memory modified: ${updated.title} → v${updated.version}`,
    actor: input.actor ?? "system",
    metadata: { version: String(updated.version) },
  });

  return updated;
}

export function recallStrategicMemories(input: StrategicMemoryRecallInput): StrategicMemoryEntry[] {
  initializeStrategicMemory(input.workspaceId);
  const repository = getStrategicMemoryRepository();

  let results = repository
    .listMemories(input.workspaceId, input.category, "ACTIVE")
    .filter((entry) => entry.status === "ACTIVE");

  if (input.query) {
    const query = input.query;
    results = results.filter((entry) => matchesQuery(entry, query));
  }

  if (input.tags && input.tags.length > 0) {
    results = results.filter((entry) =>
      input.tags!.some((tag) => entry.tags.includes(tag)),
    );
  }

  results.sort((a, b) => b.importance - a.importance || b.updatedAt.localeCompare(a.updatedAt));

  const limit = input.limit ?? 50;
  const recalled = results.slice(0, limit);

  for (const entry of recalled) {
    const updated: StrategicMemoryEntry = {
      ...entry,
      recallCount: entry.recallCount + 1,
      updatedAt: new Date().toISOString(),
    };
    repository.saveMemory(updated);
    recordLifecycle({
      memoryId: entry.memoryId,
      workspaceId: input.workspaceId,
      event: "RECALLED",
      summary: `Memory recalled during search: ${entry.title}`,
      actor: input.actor ?? "system",
      metadata: {
        query: input.query ?? "",
        category: input.category ?? "",
      },
    });
  }

  return recalled;
}

export function archiveStrategicMemory(
  memoryId: string,
  actor = "system",
  reason?: string,
): StrategicMemoryEntry {
  const repository = getStrategicMemoryRepository();
  const existing = repository.getMemoryById(memoryId);
  if (!existing) {
    throw new StrategicMemoryNotFoundError(memoryId);
  }

  const updated: StrategicMemoryEntry = {
    ...existing,
    status: "ARCHIVED",
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.saveMemory(updated);
  recordLifecycle({
    memoryId,
    workspaceId: updated.workspaceId,
    event: "ARCHIVED",
    summary: reason ?? `Strategic memory archived: ${updated.title}`,
    actor,
    metadata: { previousStatus: existing.status },
  });

  return updated;
}

export function supersedeStrategicMemory(
  memoryId: string,
  supersededBy: string,
  actor = "system",
): StrategicMemoryEntry {
  const repository = getStrategicMemoryRepository();
  const existing = repository.getMemoryById(memoryId);
  const replacement = repository.getMemoryById(supersededBy);

  if (!existing) {
    throw new StrategicMemoryNotFoundError(memoryId);
  }
  if (!replacement) {
    throw new StrategicMemoryNotFoundError(supersededBy);
  }

  const updated: StrategicMemoryEntry = {
    ...existing,
    status: "SUPERSEDED",
    supersededBy,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.saveMemory(updated);
  recordLifecycle({
    memoryId,
    workspaceId: updated.workspaceId,
    event: "SUPERSEDED",
    summary: `Strategic memory superseded by ${supersededBy}`,
    actor,
    metadata: { supersededBy },
  });

  return updated;
}

export function getStrategicMemory(memoryId: string): StrategicMemoryEntry | null {
  return getStrategicMemoryRepository().getMemoryById(memoryId);
}

export function listStrategicMemories(
  workspaceId: string,
  filters?: { category?: StrategicMemoryCategory; status?: StrategicMemoryEntry["status"] },
): StrategicMemoryEntry[] {
  initializeStrategicMemory(workspaceId);
  return getStrategicMemoryRepository().listMemories(
    workspaceId,
    filters?.category,
    filters?.status,
  );
}

export function listStrategicMemoryLifecycle(memoryId: string, limit = 100): StrategicMemoryLifecycleRecord[] {
  return getStrategicMemoryRepository().listLifecycle(memoryId, limit);
}

export function listWorkspaceStrategicMemoryLifecycle(
  workspaceId: string,
  limit = 100,
): StrategicMemoryLifecycleRecord[] {
  return getStrategicMemoryRepository().listWorkspaceLifecycle(workspaceId, limit);
}

export function getStrategicMemorySummary(workspaceId: string): StrategicMemorySummary {
  const memories = listStrategicMemories(workspaceId);
  const byCategory = Object.fromEntries(
    STRATEGIC_MEMORY_CATEGORIES.map((category) => [
      category,
      memories.filter((m) => m.category === category && m.status === "ACTIVE").length,
    ]),
  ) as Record<StrategicMemoryCategory, number>;

  return {
    workspaceId,
    totalMemories: memories.filter((m) => m.status === "ACTIVE").length,
    byCategory,
    computedAt: new Date().toISOString(),
  };
}
