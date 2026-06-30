import { randomUUID } from "node:crypto";

import type { GovernancePolicyRule } from "../../empire-governance/models/governance-policy.js";
import type {
  Doctrine,
  DoctrineLifecycleRecord,
  DoctrineModifyInput,
  DoctrinePublishInput,
} from "../models/doctrine.js";
import { createDefaultDoctrines } from "./doctrine-default-doctrines.js";
import { compileExecutableDoctrinePolicies } from "./doctrine-policy-compiler.js";
import {
  createDoctrineLifecycleRecord,
  getDoctrineRepository,
} from "../repositories/sqlite-doctrine-repository.js";
import { captureSoulRuntimeEvent } from "../../soul-runtime/services/soul-runtime-engine.js";

export class DoctrineNotFoundError extends Error {
  constructor(doctrineId: string) {
    super(`Doctrine not found: ${doctrineId}`);
    this.name = "DoctrineNotFoundError";
  }
}

export class DoctrineConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DoctrineConflictError";
  }
}

function recordLifecycle(
  input: Omit<DoctrineLifecycleRecord, "lifecycleId" | "createdAt">,
): DoctrineLifecycleRecord {
  return getDoctrineRepository().appendLifecycle(createDoctrineLifecycleRecord(input));
}

function captureDoctrineSoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  doctrineId: string,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "doctrineUpdates",
      title,
      summary,
      source: "system",
      actor,
      payload: { doctrineId },
    });
  } catch {
    // Soul runtime is best-effort during doctrine operations.
  }
}

/** Idempotent seed of default Empire doctrines. */
export function initializeDoctrines(workspaceId: string): Doctrine[] {
  const repository = getDoctrineRepository();
  const existing = repository.listDoctrines(workspaceId);
  if (existing.length > 0) {
    return existing;
  }

  const doctrines = createDefaultDoctrines(workspaceId);
  for (const doctrine of doctrines) {
    repository.saveDoctrine(doctrine);
    recordLifecycle({
      doctrineId: doctrine.doctrineId,
      workspaceId,
      event: "CREATED",
      summary: `Doctrine created: ${doctrine.title}`,
      actor: "doctrine-engine",
      metadata: { version: String(doctrine.version) },
    });
  }

  return doctrines;
}

export function publishDoctrine(input: DoctrinePublishInput): Doctrine {
  const repository = getDoctrineRepository();
  if (repository.getDoctrineById(input.doctrineId)) {
    throw new DoctrineConflictError(`Doctrine already exists: ${input.doctrineId}`);
  }

  const timestamp = new Date().toISOString();
  const doctrine: Doctrine = {
    doctrineId: input.doctrineId,
    workspaceId: input.workspaceId,
    title: input.title,
    statement: input.statement,
    status: "ACTIVE",
    version: 1,
    executablePolicy: input.executablePolicy,
    referenceCount: 0,
    metadata: input.metadata ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  repository.saveDoctrine(doctrine);
  recordLifecycle({
    doctrineId: doctrine.doctrineId,
    workspaceId: input.workspaceId,
    event: "CREATED",
    summary: `Doctrine published: ${doctrine.title}`,
    actor: input.actor ?? "system",
    metadata: { version: "1" },
  });
  captureDoctrineSoulRuntime(
    input.workspaceId,
    doctrine.title,
    doctrine.statement,
    input.actor ?? "system",
    doctrine.doctrineId,
  );

  return doctrine;
}

export function modifyDoctrine(input: DoctrineModifyInput): Doctrine {
  const repository = getDoctrineRepository();
  const existing = repository.getDoctrineById(input.doctrineId);
  if (!existing) {
    throw new DoctrineNotFoundError(input.doctrineId);
  }
  if (existing.status !== "ACTIVE") {
    throw new DoctrineConflictError(`Cannot modify ${existing.status} doctrine`);
  }

  const updated: Doctrine = {
    ...existing,
    title: input.title ?? existing.title,
    statement: input.statement ?? existing.statement,
    executablePolicy: input.executablePolicy ?? existing.executablePolicy,
    metadata: { ...existing.metadata, ...input.metadata },
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.saveDoctrine(updated);
  recordLifecycle({
    doctrineId: updated.doctrineId,
    workspaceId: updated.workspaceId,
    event: "MODIFIED",
    summary: `Doctrine modified: ${updated.title} → v${updated.version}`,
    actor: input.actor ?? "system",
    metadata: { version: String(updated.version) },
  });
  captureDoctrineSoulRuntime(
    updated.workspaceId,
    updated.title,
    `Modified to v${updated.version}: ${updated.statement}`,
    input.actor ?? "system",
    updated.doctrineId,
  );

  return updated;
}

export function deprecateDoctrine(
  doctrineId: string,
  actor = "system",
  reason?: string,
): Doctrine {
  const repository = getDoctrineRepository();
  const existing = repository.getDoctrineById(doctrineId);
  if (!existing) {
    throw new DoctrineNotFoundError(doctrineId);
  }

  const updated: Doctrine = {
    ...existing,
    status: "DEPRECATED",
    updatedAt: new Date().toISOString(),
  };

  repository.saveDoctrine(updated);
  recordLifecycle({
    doctrineId,
    workspaceId: updated.workspaceId,
    event: "DEPRECATED",
    summary: reason ?? `Doctrine deprecated: ${updated.title}`,
    actor,
    metadata: { version: String(updated.version) },
  });
  captureDoctrineSoulRuntime(
    updated.workspaceId,
    updated.title,
    reason ?? "Doctrine deprecated",
    actor,
    doctrineId,
  );

  return updated;
}

export function supersedeDoctrine(
  doctrineId: string,
  supersededBy: string,
  actor = "system",
): Doctrine {
  const repository = getDoctrineRepository();
  const existing = repository.getDoctrineById(doctrineId);
  const replacement = repository.getDoctrineById(supersededBy);

  if (!existing) {
    throw new DoctrineNotFoundError(doctrineId);
  }
  if (!replacement) {
    throw new DoctrineNotFoundError(supersededBy);
  }

  const updated: Doctrine = {
    ...existing,
    status: "SUPERSEDED",
    supersededBy,
    updatedAt: new Date().toISOString(),
  };

  repository.saveDoctrine(updated);
  recordLifecycle({
    doctrineId,
    workspaceId: updated.workspaceId,
    event: "SUPERSEDED",
    summary: `Doctrine superseded by ${supersededBy}`,
    actor,
    metadata: { supersededBy, version: String(updated.version) },
  });
  captureDoctrineSoulRuntime(
    updated.workspaceId,
    updated.title,
    `Superseded by ${replacement.title}`,
    actor,
    doctrineId,
  );

  return updated;
}

export function recordDoctrineReference(
  doctrineId: string,
  context: { actor?: string; correlationId?: string; module?: string; action?: string },
): Doctrine {
  const repository = getDoctrineRepository();
  const existing = repository.getDoctrineById(doctrineId);
  if (!existing) {
    throw new DoctrineNotFoundError(doctrineId);
  }

  const updated: Doctrine = {
    ...existing,
    referenceCount: existing.referenceCount + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.saveDoctrine(updated);
  recordLifecycle({
    doctrineId,
    workspaceId: updated.workspaceId,
    event: "REFERENCED",
    summary: `Doctrine referenced during ${context.module ?? "system"}:${context.action ?? "evaluate"}`,
    actor: context.actor ?? "system",
    correlationId: context.correlationId,
    metadata: {
      module: context.module ?? "",
      action: context.action ?? "",
      referenceCount: String(updated.referenceCount),
    },
  });

  return updated;
}

export function getDoctrine(doctrineId: string): Doctrine | null {
  return getDoctrineRepository().getDoctrineById(doctrineId);
}

export function listDoctrines(workspaceId: string, status?: Doctrine["status"]): Doctrine[] {
  initializeDoctrines(workspaceId);
  return getDoctrineRepository().listDoctrines(workspaceId, status);
}

export function listDoctrineLifecycle(doctrineId: string, limit = 100): DoctrineLifecycleRecord[] {
  return getDoctrineRepository().listLifecycle(doctrineId, limit);
}

export function listWorkspaceDoctrineLifecycle(
  workspaceId: string,
  limit = 100,
): DoctrineLifecycleRecord[] {
  return getDoctrineRepository().listWorkspaceLifecycle(workspaceId, limit);
}

/** Returns active doctrine policies merged into governance enforcement. */
export function getExecutableDoctrinePolicies(workspaceId: string): GovernancePolicyRule[] {
  initializeDoctrines(workspaceId);
  const active = getDoctrineRepository()
    .listDoctrines(workspaceId)
    .filter((doctrine) => doctrine.status === "ACTIVE");
  return compileExecutableDoctrinePolicies(active);
}

export function recordDoctrineReferencesFromVerdict(
  workspaceId: string,
  policyId?: string,
  context?: { actor?: string; correlationId?: string; module?: string; action?: string },
): void {
  if (!policyId?.startsWith("policy:doctrine:")) {
    return;
  }

  const match = policyId.match(/^policy:(doctrine:[^:]+):v\d+$/);
  const doctrineId = match?.[1];
  if (!doctrineId) {
    return;
  }

  recordDoctrineReference(doctrineId, {
    actor: context?.actor,
    correlationId: context?.correlationId,
    module: context?.module,
    action: context?.action,
  });
}
