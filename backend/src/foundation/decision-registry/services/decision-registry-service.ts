import type {
  DecisionLifecycleRecord,
  DecisionModifyInput,
  DecisionRecordInput,
  EmpireDecision,
} from "../models/empire-decision.js";
import { isTerminalDecisionStatus } from "../models/empire-decision.js";
import { captureSoulRuntimeEvent } from "../../soul-runtime/services/soul-runtime-engine.js";
import { createDefaultDecisions } from "./decision-default-decisions.js";
import {
  createDecisionLifecycleRecord,
  getDecisionRepository,
} from "../repositories/sqlite-decision-repository.js";

export class DecisionNotFoundError extends Error {
  constructor(decisionId: string) {
    super(`Decision not found: ${decisionId}`);
    this.name = "DecisionNotFoundError";
  }
}

export class DecisionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecisionConflictError";
  }
}

function recordLifecycle(
  input: Omit<DecisionLifecycleRecord, "lifecycleId" | "createdAt">,
): DecisionLifecycleRecord {
  return getDecisionRepository().appendLifecycle(createDecisionLifecycleRecord(input));
}

function captureDecisionSoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  decisionId: string,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "architectureUpdates",
      title,
      summary,
      source: "system",
      actor,
      payload: { decisionId },
    });
  } catch {
    // Soul runtime capture is best-effort during decision operations.
  }
}

function assertMutable(decision: EmpireDecision): void {
  if (isTerminalDecisionStatus(decision.status)) {
    throw new DecisionConflictError(
      `Decision ${decision.decisionId} is ${decision.status} — terminal decisions are immutable`,
    );
  }
}

/** Idempotent seed of default Empire architectural decisions. */
export function initializeDecisionRegistry(workspaceId: string): EmpireDecision[] {
  const repository = getDecisionRepository();
  const existing = repository.listDecisions(workspaceId);
  if (existing.length > 0) {
    return existing;
  }

  const decisions = createDefaultDecisions(workspaceId);
  for (const entry of decisions) {
    repository.saveDecision(entry);
    recordLifecycle({
      decisionId: entry.decisionId,
      workspaceId,
      event: "RECORDED",
      summary: `Decision recorded: ${entry.title}`,
      actor: "decision-registry",
      metadata: {
        category: entry.category,
        approver: entry.approver,
        approvedAt: entry.approvedAt,
      },
    });
    recordLifecycle({
      decisionId: entry.decisionId,
      workspaceId,
      event: "APPROVED",
      summary: `Decision approved by ${entry.approver}`,
      actor: entry.approver,
      metadata: { approvedAt: entry.approvedAt },
    });
  }

  return decisions;
}

export function recordDecision(input: DecisionRecordInput): EmpireDecision {
  const repository = getDecisionRepository();
  if (repository.getDecisionById(input.decisionId)) {
    throw new DecisionConflictError(`Decision already recorded: ${input.decisionId}`);
  }

  const timestamp = new Date().toISOString();
  const approvedAt = input.approvedAt ?? timestamp;

  const entry: EmpireDecision = {
    decisionId: input.decisionId,
    workspaceId: input.workspaceId,
    title: input.title,
    category: input.category,
    decision: input.decision,
    reason: input.reason,
    alternatives: input.alternatives ?? [],
    tradeoffs: input.tradeoffs ?? [],
    approver: input.approver,
    approvedAt,
    status: "APPROVED",
    version: 1,
    metadata: input.metadata ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  repository.saveDecision(entry);
  recordLifecycle({
    decisionId: entry.decisionId,
    workspaceId: input.workspaceId,
    event: "RECORDED",
    summary: `Decision recorded: ${entry.title}`,
    actor: input.actor ?? input.approver,
    metadata: { category: entry.category, approver: entry.approver },
  });
  recordLifecycle({
    decisionId: entry.decisionId,
    workspaceId: input.workspaceId,
    event: "APPROVED",
    summary: `Approved by ${entry.approver} at ${approvedAt}`,
    actor: input.approver,
    metadata: { approvedAt },
  });
  captureDecisionSoulRuntime(
    input.workspaceId,
    entry.title,
    entry.reason,
    input.actor ?? input.approver,
    entry.decisionId,
  );

  return entry;
}

export function proposeDecision(
  input: Omit<DecisionRecordInput, "approvedAt"> & { status?: "PROPOSED" },
): EmpireDecision {
  const repository = getDecisionRepository();
  if (repository.getDecisionById(input.decisionId)) {
    throw new DecisionConflictError(`Decision already exists: ${input.decisionId}`);
  }

  const timestamp = new Date().toISOString();
  const entry: EmpireDecision = {
    decisionId: input.decisionId,
    workspaceId: input.workspaceId,
    title: input.title,
    category: input.category,
    decision: input.decision,
    reason: input.reason,
    alternatives: input.alternatives ?? [],
    tradeoffs: input.tradeoffs ?? [],
    approver: input.approver,
    approvedAt: timestamp,
    status: "PROPOSED",
    version: 1,
    metadata: input.metadata ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  repository.saveDecision(entry);
  recordLifecycle({
    decisionId: entry.decisionId,
    workspaceId: input.workspaceId,
    event: "RECORDED",
    summary: `Decision proposed: ${entry.title}`,
    actor: input.actor ?? input.approver,
    metadata: { status: "PROPOSED" },
  });

  return entry;
}

export function approveDecision(decisionId: string, approver: string, actor?: string): EmpireDecision {
  const repository = getDecisionRepository();
  const existing = repository.getDecisionById(decisionId);
  if (!existing) {
    throw new DecisionNotFoundError(decisionId);
  }
  if (existing.status !== "PROPOSED") {
    throw new DecisionConflictError(`Decision is ${existing.status}, not PROPOSED`);
  }

  const approvedAt = new Date().toISOString();
  const updated: EmpireDecision = {
    ...existing,
    status: "APPROVED",
    approver,
    approvedAt,
    version: existing.version + 1,
    updatedAt: approvedAt,
  };

  repository.saveDecision(updated);
  recordLifecycle({
    decisionId,
    workspaceId: updated.workspaceId,
    event: "APPROVED",
    summary: `Decision approved by ${approver}`,
    actor: actor ?? approver,
    metadata: { approvedAt },
  });
  captureDecisionSoulRuntime(
    updated.workspaceId,
    updated.title,
    updated.reason,
    actor ?? approver,
    decisionId,
  );

  return updated;
}

export function modifyDecision(input: DecisionModifyInput): EmpireDecision {
  const repository = getDecisionRepository();
  const existing = repository.getDecisionById(input.decisionId);
  if (!existing) {
    throw new DecisionNotFoundError(input.decisionId);
  }
  assertMutable(existing);
  if (existing.status === "PROPOSED") {
    // Proposed decisions can be modified before approval.
  } else if (existing.status !== "APPROVED") {
    throw new DecisionConflictError(`Cannot modify ${existing.status} decision`);
  }

  const updated: EmpireDecision = {
    ...existing,
    title: input.title ?? existing.title,
    decision: input.decision ?? existing.decision,
    reason: input.reason ?? existing.reason,
    alternatives: input.alternatives ?? existing.alternatives,
    tradeoffs: input.tradeoffs ?? existing.tradeoffs,
    metadata: { ...existing.metadata, ...input.metadata },
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.saveDecision(updated);
  recordLifecycle({
    decisionId: updated.decisionId,
    workspaceId: updated.workspaceId,
    event: "MODIFIED",
    summary: `Decision modified: ${updated.title} → v${updated.version}`,
    actor: input.actor ?? "system",
    metadata: { version: String(updated.version) },
  });

  return updated;
}

export function supersedeDecision(
  decisionId: string,
  supersededBy: string,
  actor = "system",
): EmpireDecision {
  const repository = getDecisionRepository();
  const existing = repository.getDecisionById(decisionId);
  const replacement = repository.getDecisionById(supersededBy);

  if (!existing) {
    throw new DecisionNotFoundError(decisionId);
  }
  if (!replacement) {
    throw new DecisionNotFoundError(supersededBy);
  }

  const updated: EmpireDecision = {
    ...existing,
    status: "SUPERSEDED",
    supersededBy,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.saveDecision(updated);
  recordLifecycle({
    decisionId,
    workspaceId: updated.workspaceId,
    event: "SUPERSEDED",
    summary: `Decision superseded by ${supersededBy}`,
    actor,
    metadata: { supersededBy },
  });

  return updated;
}

export function deprecateDecision(
  decisionId: string,
  actor = "system",
  reason?: string,
): EmpireDecision {
  const repository = getDecisionRepository();
  const existing = repository.getDecisionById(decisionId);
  if (!existing) {
    throw new DecisionNotFoundError(decisionId);
  }

  const updated: EmpireDecision = {
    ...existing,
    status: "DEPRECATED",
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.saveDecision(updated);
  recordLifecycle({
    decisionId,
    workspaceId: updated.workspaceId,
    event: "DEPRECATED",
    summary: reason ?? `Decision deprecated: ${updated.title}`,
    actor,
    metadata: { previousStatus: existing.status },
  });

  return updated;
}

export function getDecision(decisionId: string): EmpireDecision | null {
  return getDecisionRepository().getDecisionById(decisionId);
}

export function listDecisions(
  workspaceId: string,
  filters?: { status?: EmpireDecision["status"]; category?: EmpireDecision["category"] },
): EmpireDecision[] {
  initializeDecisionRegistry(workspaceId);
  return getDecisionRepository().listDecisions(
    workspaceId,
    filters?.status,
    filters?.category,
  );
}

export function listDecisionLifecycle(decisionId: string, limit = 100): DecisionLifecycleRecord[] {
  return getDecisionRepository().listLifecycle(decisionId, limit);
}

export function listWorkspaceDecisionLifecycle(
  workspaceId: string,
  limit = 100,
): DecisionLifecycleRecord[] {
  return getDecisionRepository().listWorkspaceLifecycle(workspaceId, limit);
}
