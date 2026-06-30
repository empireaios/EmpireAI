import { randomUUID } from "node:crypto";

import type { LearningRecord } from "../models/learning-record.js";
import { CreateLearningRecordInputSchema } from "../models/learning-record.js";
import type { CreateLearningRecordInput } from "../models/learning-record.js";
import { KNOWLEDGE_SEED_LEARNINGS } from "../data/knowledge-seed-data.js";
import { getEmpireKnowledgeRepository } from "../repositories/sqlite-empire-knowledge-repository.js";
import { ensureKnowledgeSeeded } from "./knowledge-object-service.js";

function seedLearnings(workspaceId: string, companyId?: string): void {
  const repo = getEmpireKnowledgeRepository();
  const existing = repo.listLearnings(workspaceId);
  if (existing.length > 0) return;

  const ts = new Date().toISOString();
  for (const seed of KNOWLEDGE_SEED_LEARNINGS) {
    const record: LearningRecord = {
      learningId: seed.learningId,
      workspaceId,
      companyId: companyId ?? seed.companyId,
      observation: seed.observation,
      evidence: seed.evidence,
      confidence: seed.confidence ?? 60,
      source: seed.source ?? "SEED",
      timestamp: ts,
      relatedObjectIds: seed.relatedObjectIds ?? [],
      importance: seed.importance ?? "MEDIUM",
      recommendation: seed.recommendation,
      tags: seed.tags ?? [],
    };
    repo.saveLearning(record);
  }
}

/** K-003 — Learning Records from important events. */
export function createLearningRecord(
  workspaceId: string,
  input: CreateLearningRecordInput,
): LearningRecord {
  ensureKnowledgeSeeded(workspaceId, input.companyId);
  seedLearnings(workspaceId, input.companyId);
  const parsed = CreateLearningRecordInputSchema.parse(input);
  const record: LearningRecord = {
    learningId: randomUUID(),
    workspaceId,
    companyId: parsed.companyId,
    observation: parsed.observation,
    evidence: parsed.evidence,
    confidence: parsed.confidence,
    source: parsed.source,
    timestamp: new Date().toISOString(),
    relatedObjectIds: parsed.relatedObjectIds,
    importance: parsed.importance,
    recommendation: parsed.recommendation,
    tags: parsed.tags ?? [],
  };
  getEmpireKnowledgeRepository().saveLearning(record);
  return record;
}

export function listLearningRecords(workspaceId: string): LearningRecord[] {
  ensureKnowledgeSeeded(workspaceId);
  seedLearnings(workspaceId);
  return getEmpireKnowledgeRepository().listLearnings(workspaceId);
}

export function getLearningRecord(learningId: string): LearningRecord | null {
  return getEmpireKnowledgeRepository().getLearning(learningId);
}

export function listLearningsByObject(workspaceId: string, objectId: string): LearningRecord[] {
  return listLearningRecords(workspaceId).filter((l) => l.relatedObjectIds.includes(objectId));
}

export function countLearningsByImportance(workspaceId: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of listLearningRecords(workspaceId)) {
    counts[l.importance] = (counts[l.importance] ?? 0) + 1;
  }
  return counts;
}

export function countLearningsBySource(workspaceId: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of listLearningRecords(workspaceId)) {
    counts[l.source] = (counts[l.source] ?? 0) + 1;
  }
  return counts;
}

export function averageLearningConfidence(workspaceId: string): number {
  const records = listLearningRecords(workspaceId);
  if (!records.length) return 0;
  return Math.round(records.reduce((s, r) => s + r.confidence, 0) / records.length);
}
