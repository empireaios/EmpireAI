import type {
  KingPromise,
  PromiseLifecycleRecord,
  PromiseModifyInput,
  PromiseProgressInput,
  PromiseRegisterInput,
} from "../models/king-promise.js";
import { isTerminalPromiseStatus } from "../models/king-promise.js";
import { CANONICAL_ENTITY_IDS } from "../../identity-registry/models/identity-entity.js";
import { captureSoulRuntimeEvent } from "../../soul-runtime/services/soul-runtime-engine.js";
import { createDefaultPromises } from "./promise-default-promises.js";
import {
  createPromiseLifecycleRecord,
  getPromiseRepository,
} from "../repositories/sqlite-promise-repository.js";

export class PromiseNotFoundError extends Error {
  constructor(promiseId: string) {
    super(`Promise not found: ${promiseId}`);
    this.name = "PromiseNotFoundError";
  }
}

export class PromiseConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromiseConflictError";
  }
}

function recordLifecycle(
  input: Omit<PromiseLifecycleRecord, "lifecycleId" | "createdAt">,
): PromiseLifecycleRecord {
  return getPromiseRepository().appendLifecycle(createPromiseLifecycleRecord(input));
}

function capturePromiseSoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  promiseId: string,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "promises",
      title,
      summary,
      source: "system",
      actor,
      payload: { promiseId },
    });
  } catch {
    // Soul runtime capture is best-effort during promise operations.
  }
}

function assertMutable(promise: KingPromise): void {
  if (isTerminalPromiseStatus(promise.status)) {
    throw new PromiseConflictError(
      `Promise ${promise.promiseId} is ${promise.status} — terminal promises are immutable except for audit`,
    );
  }
}

/** Idempotent seed of default promises to the King. */
export function initializePromiseRegister(workspaceId: string): KingPromise[] {
  const repository = getPromiseRepository();
  const existing = repository.listPromises(workspaceId);
  if (existing.length > 0) {
    return existing;
  }

  const promises = createDefaultPromises(workspaceId);
  for (const promise of promises) {
    repository.savePromise(promise);
    recordLifecycle({
      promiseId: promise.promiseId,
      workspaceId,
      event: "REGISTERED",
      summary: `Promise registered to King: ${promise.title}`,
      actor: "promise-register",
      metadata: {
        status: promise.status,
        progressPercent: String(promise.progressPercent),
      },
    });
  }

  return promises;
}

export function registerPromise(input: PromiseRegisterInput): KingPromise {
  const repository = getPromiseRepository();
  if (repository.getPromiseById(input.promiseId)) {
    throw new PromiseConflictError(`Promise already registered: ${input.promiseId}`);
  }

  const timestamp = new Date().toISOString();
  const promise: KingPromise = {
    promiseId: input.promiseId,
    workspaceId: input.workspaceId,
    title: input.title,
    statement: input.statement,
    madeToKingId: input.madeToKingId ?? CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT,
    status: "PENDING",
    progressPercent: 0,
    dependencies: input.dependencies ?? [],
    version: 1,
    metadata: input.metadata ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  repository.savePromise(promise);
  recordLifecycle({
    promiseId: promise.promiseId,
    workspaceId: input.workspaceId,
    event: "REGISTERED",
    summary: `Promise registered: ${promise.title}`,
    actor: input.actor ?? "system",
    metadata: { status: "PENDING", progressPercent: "0" },
  });
  capturePromiseSoulRuntime(
    input.workspaceId,
    promise.title,
    promise.statement,
    input.actor ?? "system",
    promise.promiseId,
  );

  return promise;
}

export function modifyPromise(input: PromiseModifyInput): KingPromise {
  const repository = getPromiseRepository();
  const existing = repository.getPromiseById(input.promiseId);
  if (!existing) {
    throw new PromiseNotFoundError(input.promiseId);
  }
  assertMutable(existing);

  const updated: KingPromise = {
    ...existing,
    title: input.title ?? existing.title,
    statement: input.statement ?? existing.statement,
    metadata: { ...existing.metadata, ...input.metadata },
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.savePromise(updated);
  recordLifecycle({
    promiseId: updated.promiseId,
    workspaceId: updated.workspaceId,
    event: "MODIFIED",
    summary: `Promise modified: ${updated.title} → v${updated.version}`,
    actor: input.actor ?? "system",
    metadata: { version: String(updated.version) },
  });

  return updated;
}

export function updatePromiseProgress(input: PromiseProgressInput): KingPromise {
  const repository = getPromiseRepository();
  const existing = repository.getPromiseById(input.promiseId);
  if (!existing) {
    throw new PromiseNotFoundError(input.promiseId);
  }
  assertMutable(existing);

  const progressPercent = Math.max(0, Math.min(100, input.progressPercent));
  const status =
    input.status ??
    (progressPercent >= 100
      ? "IN_PROGRESS"
      : progressPercent > 0
        ? "IN_PROGRESS"
        : existing.status);

  const updated: KingPromise = {
    ...existing,
    status: status === "PENDING" && progressPercent > 0 ? "IN_PROGRESS" : status,
    progressPercent,
    progressNotes: input.progressNotes ?? existing.progressNotes,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.savePromise(updated);
  recordLifecycle({
    promiseId: updated.promiseId,
    workspaceId: updated.workspaceId,
    event: "PROGRESS_UPDATED",
    summary: `Progress updated: ${updated.title} → ${progressPercent}%`,
    actor: input.actor ?? "system",
    metadata: {
      progressPercent: String(progressPercent),
      status: updated.status,
    },
  });

  return updated;
}

export function addPromiseDependency(
  promiseId: string,
  dependencyId: string,
  actor = "system",
): KingPromise {
  const repository = getPromiseRepository();
  const existing = repository.getPromiseById(promiseId);
  if (!existing) {
    throw new PromiseNotFoundError(promiseId);
  }
  assertMutable(existing);

  if (dependencyId === promiseId) {
    throw new PromiseConflictError("Promise cannot depend on itself");
  }

  const dependency = repository.getPromiseById(dependencyId);
  if (!dependency) {
    throw new PromiseNotFoundError(dependencyId);
  }

  if (existing.dependencies.includes(dependencyId)) {
    return existing;
  }

  const updated: KingPromise = {
    ...existing,
    dependencies: [...existing.dependencies, dependencyId],
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.savePromise(updated);
  recordLifecycle({
    promiseId,
    workspaceId: updated.workspaceId,
    event: "DEPENDENCY_ADDED",
    summary: `Dependency added: ${dependencyId}`,
    actor,
    metadata: { dependencyId },
  });

  return updated;
}

export function removePromiseDependency(
  promiseId: string,
  dependencyId: string,
  actor = "system",
): KingPromise {
  const repository = getPromiseRepository();
  const existing = repository.getPromiseById(promiseId);
  if (!existing) {
    throw new PromiseNotFoundError(promiseId);
  }
  assertMutable(existing);

  const updated: KingPromise = {
    ...existing,
    dependencies: existing.dependencies.filter((id) => id !== dependencyId),
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.savePromise(updated);
  recordLifecycle({
    promiseId,
    workspaceId: updated.workspaceId,
    event: "DEPENDENCY_REMOVED",
    summary: `Dependency removed: ${dependencyId}`,
    actor,
    metadata: { dependencyId },
  });

  return updated;
}

export function fulfillPromise(
  promiseId: string,
  actor = "system",
  notes?: string,
): KingPromise {
  const repository = getPromiseRepository();
  const existing = repository.getPromiseById(promiseId);
  if (!existing) {
    throw new PromiseNotFoundError(promiseId);
  }

  if (existing.status === "FULFILLED") {
    return existing;
  }

  if (existing.status === "OBSOLETE" || existing.status === "SUPERSEDED") {
    throw new PromiseConflictError(`Cannot fulfill ${existing.status} promise`);
  }

  for (const depId of existing.dependencies) {
    const dep = repository.getPromiseById(depId);
    if (dep && dep.status !== "FULFILLED") {
      throw new PromiseConflictError(
        `Unresolved dependency ${depId} (${dep.status}) blocks fulfillment`,
      );
    }
  }

  const timestamp = new Date().toISOString();
  const updated: KingPromise = {
    ...existing,
    status: "FULFILLED",
    progressPercent: 100,
    progressNotes: notes ?? existing.progressNotes,
    fulfilledAt: timestamp,
    version: existing.version + 1,
    updatedAt: timestamp,
  };

  repository.savePromise(updated);
  recordLifecycle({
    promiseId,
    workspaceId: updated.workspaceId,
    event: "FULFILLED",
    summary: notes ?? `Promise fulfilled: ${updated.title}`,
    actor,
    metadata: { progressPercent: "100" },
  });
  capturePromiseSoulRuntime(
    updated.workspaceId,
    updated.title,
    notes ?? "Promise fulfilled",
    actor,
    promiseId,
  );

  return updated;
}

export function markPromiseObsolete(
  promiseId: string,
  actor = "system",
  reason?: string,
): KingPromise {
  const repository = getPromiseRepository();
  const existing = repository.getPromiseById(promiseId);
  if (!existing) {
    throw new PromiseNotFoundError(promiseId);
  }

  if (existing.status === "OBSOLETE") {
    return existing;
  }

  const updated: KingPromise = {
    ...existing,
    status: "OBSOLETE",
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.savePromise(updated);
  recordLifecycle({
    promiseId,
    workspaceId: updated.workspaceId,
    event: "OBSOLETED",
    summary: reason ?? `Promise marked obsolete: ${updated.title}`,
    actor,
    metadata: { previousStatus: existing.status },
  });
  capturePromiseSoulRuntime(
    updated.workspaceId,
    updated.title,
    reason ?? "Promise marked obsolete",
    actor,
    promiseId,
  );

  return updated;
}

export function supersedePromise(
  promiseId: string,
  supersededBy: string,
  actor = "system",
): KingPromise {
  const repository = getPromiseRepository();
  const existing = repository.getPromiseById(promiseId);
  const replacement = repository.getPromiseById(supersededBy);

  if (!existing) {
    throw new PromiseNotFoundError(promiseId);
  }
  if (!replacement) {
    throw new PromiseNotFoundError(supersededBy);
  }

  const updated: KingPromise = {
    ...existing,
    status: "SUPERSEDED",
    supersededBy,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.savePromise(updated);
  recordLifecycle({
    promiseId,
    workspaceId: updated.workspaceId,
    event: "SUPERSEDED",
    summary: `Promise superseded by ${supersededBy}`,
    actor,
    metadata: { supersededBy },
  });
  capturePromiseSoulRuntime(
    updated.workspaceId,
    updated.title,
    `Superseded by ${replacement.title}`,
    actor,
    promiseId,
  );

  return updated;
}

export function getPromise(promiseId: string): KingPromise | null {
  return getPromiseRepository().getPromiseById(promiseId);
}

export function listPromises(workspaceId: string, status?: KingPromise["status"]): KingPromise[] {
  initializePromiseRegister(workspaceId);
  return getPromiseRepository().listPromises(workspaceId, status);
}

export function listPromiseLifecycle(promiseId: string, limit = 100): PromiseLifecycleRecord[] {
  return getPromiseRepository().listLifecycle(promiseId, limit);
}

export function listWorkspacePromiseLifecycle(
  workspaceId: string,
  limit = 100,
): PromiseLifecycleRecord[] {
  return getPromiseRepository().listWorkspaceLifecycle(workspaceId, limit);
}

export function getPromiseDependencyGraph(workspaceId: string): {
  promises: KingPromise[];
  edges: Array<{ from: string; to: string }>;
} {
  const promises = listPromises(workspaceId);
  const edges = promises.flatMap((promise) =>
    promise.dependencies.map((depId) => ({ from: promise.promiseId, to: depId })),
  );
  return { promises, edges };
}
