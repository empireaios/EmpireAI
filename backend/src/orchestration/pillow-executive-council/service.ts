import { randomUUID } from "node:crypto";

import {
  runPillowExecutiveCouncil,
  type CeoExecutiveRecommendation,
  type ExecutiveCouncilInput,
  type PillowExecutiveCouncilResult,
  type PillowExecutiveDebateSession,
  type RecommendationStatus,
} from "@empireai/pillow";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import { SqlitePillowExecutiveCouncilRepository } from "./repository/sqlite-pillow-executive-council-repository.js";

let repository = new SqlitePillowExecutiveCouncilRepository();

export function resetPillowExecutiveCouncilRepository(): void {
  repository = new SqlitePillowExecutiveCouncilRepository();
}

export function ensurePillowExecutiveCouncilTables(): void {
  repository.ensureTables();
}

export interface RunCouncilForProposalInput extends ExecutiveCouncilInput {
  workspaceId: string;
  sessionId: string;
  requestId: string;
  actor?: string;
}

export interface StoredExecutiveCouncilRecord {
  recordId: string;
  workspaceId: string;
  sessionId: string;
  requestId: string;
  debateId: string;
  recommendationId: string;
  debate: PillowExecutiveDebateSession;
  publicRecommendation: CeoExecutiveRecommendation;
  status: RecommendationStatus;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
}

export function runAndStoreExecutiveCouncil(
  input: RunCouncilForProposalInput,
  auditLogger?: AuditLogger,
): PillowExecutiveCouncilResult {
  repository.ensureTables();
  const result = runPillowExecutiveCouncil(input);
  const now = new Date().toISOString();

  const record: StoredExecutiveCouncilRecord = {
    recordId: randomUUID(),
    workspaceId: input.workspaceId,
    sessionId: input.sessionId,
    requestId: input.requestId,
    debateId: result.debate.debateId,
    recommendationId: result.publicRecommendation.recommendationId,
    debate: result.debate,
    publicRecommendation: result.publicRecommendation,
    status: "awaiting_grand_king",
    createdAt: now,
    updatedAt: now,
    decidedAt: null,
    decidedBy: null,
  };

  repository.save(record);

  auditLogger?.write({
    action: "pillow.executive_council.debate",
    actor: input.actor ?? "pillow-host",
    workspaceId: input.workspaceId,
    correlationId: input.requestId,
    metadata: {
      debateId: record.debateId,
      recommendationId: record.recommendationId,
      topic: input.topic,
      dissentCount: result.debate.dissents.length,
    },
  });

  return result;
}

export function getCouncilRecordByRequest(
  workspaceId: string,
  requestId: string,
): StoredExecutiveCouncilRecord | null {
  repository.ensureTables();
  return repository.getByRequest(workspaceId, requestId);
}

export function getCouncilDebate(
  workspaceId: string,
  debateId: string,
): PillowExecutiveDebateSession | null {
  repository.ensureTables();
  const record = repository.getByDebateId(workspaceId, debateId);
  return record?.debate ?? null;
}

export function decideExecutiveRecommendation(input: {
  workspaceId: string;
  recommendationId: string;
  outcome: "approved" | "rejected" | "deferred";
  actor: string;
  notes?: string;
}, auditLogger?: AuditLogger): StoredExecutiveCouncilRecord | null {
  repository.ensureTables();
  const record = repository.getByRecommendationId(input.workspaceId, input.recommendationId);
  if (!record) return null;

  const status: RecommendationStatus =
    input.outcome === "approved"
      ? "approved"
      : input.outcome === "rejected"
        ? "rejected"
        : "deferred";

  const updated: StoredExecutiveCouncilRecord = {
    ...record,
    status,
    publicRecommendation: { ...record.publicRecommendation, status },
    debate: {
      ...record.debate,
      pillowRecommendation: { ...record.debate.pillowRecommendation, status },
    },
    updatedAt: new Date().toISOString(),
    decidedAt: new Date().toISOString(),
    decidedBy: input.actor,
  };

  repository.save(updated);

  auditLogger?.write({
    action: "pillow.executive_council.decide",
    actor: input.actor,
    workspaceId: input.workspaceId,
    correlationId: input.recommendationId,
    metadata: { outcome: input.outcome, notes: input.notes ?? null, cursorSovereignty: "no_auto_dispatch" },
  });

  return updated;
}

export function listPendingRecommendations(workspaceId: string): StoredExecutiveCouncilRecord[] {
  repository.ensureTables();
  return repository.listByStatus(workspaceId, "awaiting_grand_king");
}
