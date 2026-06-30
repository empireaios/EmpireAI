import { randomUUID } from "node:crypto";

import {
  classifyLearningCandidate,
  createExecutiveLearningEngine,
  buildExecutiveLearningReasoningBundle,
  type ConversationLearningInput,
  type ExecutiveKnowledgeEntry,
  type ExecutiveLearningReasoningBundle,
  type LearningReviewStats,
  type PendingExecutiveLearning,
} from "@empireai/pillow";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import { SqliteExecutiveLearningRepository } from "./repository/sqlite-executive-learning-repository.js";

const SESSION_CONTEXT_TTL_MS = 4 * 60 * 60 * 1000;

export interface ObserveConversationInput extends ConversationLearningInput {
  actor?: string;
}

export interface ReviewLearningInput {
  learningId: string;
  workspaceId: string;
  actor: string;
  notes?: string;
}

export interface EditLearningInput {
  learningId: string;
  workspaceId: string;
  actor: string;
  title?: string;
  description?: string;
  category?: PendingExecutiveLearning["category"];
}

export interface MergeLearningsInput {
  workspaceId: string;
  actor: string;
  sourceLearningIds: string[];
  targetTitle: string;
  targetDescription: string;
}

let repository = new SqliteExecutiveLearningRepository();
const engine = createExecutiveLearningEngine();

export function resetExecutiveLearningRepository(): void {
  repository = new SqliteExecutiveLearningRepository();
}

export function ensureExecutiveLearningTables(): void {
  repository.ensureTables();
}

export function observeExecutiveConversation(
  input: ObserveConversationInput,
  auditLogger?: AuditLogger,
): PendingExecutiveLearning[] {
  repository.ensureTables();
  const pending = repository.listPending(input.workspaceId);
  const approvedTitles = repository
    .listApprovedKnowledge(input.workspaceId)
    .map((item) => item.title);

  const pipeline = engine.runPipeline(input, pending, approvedTitles);
  const created: PendingExecutiveLearning[] = [];
  const now = new Date().toISOString();

  for (const candidate of pipeline.candidates) {
    const classification = classifyLearningCandidate(candidate);
    const learningId = randomUUID();
    const record: PendingExecutiveLearning = {
      learningId,
      workspaceId: input.workspaceId,
      title: candidate.title,
      description: candidate.description,
      category: candidate.category,
      status:
        candidate.category === "A"
          ? "pending_confirmation"
          : classification.initialStatus === "pending_approval"
            ? "pending_approval"
            : "pending_confirmation",
      observation: candidate.observation.observation,
      evidence: candidate.observation.evidence,
      confidence: candidate.confidence,
      reasoningAreas: candidate.reasoningAreas,
      impactSummary: candidate.impactSummary,
      source: "conversation",
      sessionId: input.sessionId,
      requestId: input.requestId,
      discoveredAt: now,
      updatedAt: now,
      expiresAt: null,
      requiresGrandKingApproval: candidate.requiresGrandKingApproval,
    };
    repository.savePending(record);
    created.push(record);
  }

  for (const sessionItem of pipeline.sessionContext) {
    const learningId = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_CONTEXT_TTL_MS).toISOString();
    const record: PendingExecutiveLearning = {
      learningId,
      workspaceId: input.workspaceId,
      title: sessionItem.title,
      description: sessionItem.description,
      category: "D",
      status: "expired",
      observation: sessionItem.observation.observation,
      evidence: sessionItem.observation.evidence,
      confidence: sessionItem.confidence,
      reasoningAreas: sessionItem.reasoningAreas,
      impactSummary: sessionItem.impactSummary,
      source: "conversation",
      sessionId: input.sessionId,
      requestId: input.requestId,
      discoveredAt: now,
      updatedAt: now,
      expiresAt,
      requiresGrandKingApproval: false,
    };
    repository.savePending(record);
    created.push(record);
  }

  if (created.length > 0) {
    auditLogger?.write({
      action: "pillow.learning.observe",
      actor: input.actor ?? "pillow-host",
      workspaceId: input.workspaceId,
      correlationId: input.requestId,
      metadata: {
        sessionId: input.sessionId,
        candidateCount: created.length,
        durableCount: pipeline.candidates.length,
        sessionContextCount: pipeline.sessionContext.length,
      },
    });
  }

  return created;
}

export function getLearningReviewStats(workspaceId: string): LearningReviewStats {
  repository.ensureTables();
  repository.expireSessionContext(workspaceId);
  const all = repository.listAll(workspaceId);
  return {
    newLearnings: all.filter((item) =>
      ["pending_confirmation", "pending_approval"].includes(item.status),
    ).length,
    pendingConfirmation: all.filter((item) => item.status === "pending_confirmation").length,
    rejected: all.filter((item) => item.status === "rejected").length,
    approved: repository.listApprovedKnowledge(workspaceId).length,
    archived: all.filter((item) => item.status === "archived").length,
    expired: all.filter((item) => item.status === "expired").length,
  };
}

export function listPendingLearnings(workspaceId: string): PendingExecutiveLearning[] {
  repository.ensureTables();
  repository.expireSessionContext(workspaceId);
  return repository.listPending(workspaceId);
}

export function listExecutiveKnowledgeBase(workspaceId: string): ExecutiveKnowledgeEntry[] {
  repository.ensureTables();
  return repository.listApprovedKnowledge(workspaceId);
}

export function approveExecutiveLearning(
  input: ReviewLearningInput,
  auditLogger?: AuditLogger,
): ExecutiveKnowledgeEntry | null {
  repository.ensureTables();
  const pending = repository.getPending(input.learningId, input.workspaceId);
  if (!pending) return null;
  if (pending.category === "D") {
    throw new Error("Temporary session context cannot be promoted to Executive Knowledge Base");
  }

  const now = new Date().toISOString();
  const knowledge: ExecutiveKnowledgeEntry = {
    learningId: pending.learningId,
    workspaceId: pending.workspaceId,
    title: pending.title,
    category: pending.category,
    description: pending.description,
    source: pending.source,
    confidence: pending.confidence,
    discoveredAt: pending.discoveredAt,
    approvedAt: now,
    approvedBy: input.actor,
    status: "approved",
    supersededBy: null,
    reasoningAreas: pending.reasoningAreas,
    affectedReasoningAreas: pending.reasoningAreas,
  };

  repository.promoteToKnowledge(pending.learningId, knowledge);
  auditLogger?.write({
    action: "pillow.learning.approve",
    actor: input.actor,
    workspaceId: input.workspaceId,
    correlationId: pending.requestId ?? pending.learningId,
    metadata: { learningId: pending.learningId, category: pending.category },
  });
  return knowledge;
}

export function rejectExecutiveLearning(
  input: ReviewLearningInput,
  auditLogger?: AuditLogger,
): PendingExecutiveLearning | null {
  repository.ensureTables();
  const updated = repository.updateStatus(
    input.learningId,
    input.workspaceId,
    "rejected",
    input.notes,
  );
  if (updated) {
    auditLogger?.write({
      action: "pillow.learning.reject",
      actor: input.actor,
      workspaceId: input.workspaceId,
      correlationId: input.learningId,
      metadata: { notes: input.notes ?? null },
    });
  }
  return updated;
}

export function editExecutiveLearning(
  input: EditLearningInput,
): PendingExecutiveLearning | null {
  repository.ensureTables();
  return repository.editPending(input);
}

export function mergeExecutiveLearnings(
  input: MergeLearningsInput,
  auditLogger?: AuditLogger,
): PendingExecutiveLearning | null {
  repository.ensureTables();
  const merged = repository.mergePending(input);
  if (merged) {
    auditLogger?.write({
      action: "pillow.learning.merge",
      actor: input.actor,
      workspaceId: input.workspaceId,
      correlationId: merged.learningId,
      metadata: { sourceLearningIds: input.sourceLearningIds },
    });
  }
  return merged;
}

export function archiveExecutiveLearning(
  input: ReviewLearningInput,
  auditLogger?: AuditLogger,
): PendingExecutiveLearning | ExecutiveKnowledgeEntry | null {
  repository.ensureTables();
  const knowledge = repository.getKnowledge(input.learningId, input.workspaceId);
  if (knowledge) {
    const archived = repository.archiveKnowledge(input.learningId, input.workspaceId);
    auditLogger?.write({
      action: "pillow.learning.archive",
      actor: input.actor,
      workspaceId: input.workspaceId,
      correlationId: input.learningId,
      metadata: {},
    });
    return archived;
  }
  return repository.updateStatus(input.learningId, input.workspaceId, "archived", input.notes);
}

export function buildReasoningBundleForWorkspace(input: {
  workspaceId: string;
  currentObjective: string | null;
  executiveConstitutionSummary: string;
  executivePerspectives?: string[];
}): ExecutiveLearningReasoningBundle {
  repository.ensureTables();
  repository.expireSessionContext(input.workspaceId);
  const approved = repository.listApprovedKnowledge(input.workspaceId);
  const sessionContext = repository
    .listPending(input.workspaceId)
    .filter((item) => item.category === "D" && item.status !== "expired");

  return buildExecutiveLearningReasoningBundle({
    currentObjective: input.currentObjective,
    executiveConstitutionSummary: input.executiveConstitutionSummary,
    approvedKnowledge: approved,
    pendingSessionContext: sessionContext,
    executivePerspectives: input.executivePerspectives,
  });
}
