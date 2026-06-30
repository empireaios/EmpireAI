import type { KnowledgeEdge } from "../models/knowledge-graph.js";
import type { KnowledgeObject } from "../models/knowledge-object.js";
import type { LearningRecord } from "../models/learning-record.js";
import { getDatabase } from "../../../brain/database.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row["record_json"])) as T;
}

export class EmpireKnowledgeRepository {
  saveObject(obj: KnowledgeObject): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO empire_knowledge_objects
        (object_id, workspace_id, object_type, record_json, updated_at)
       VALUES (@objectId, @workspaceId, @objectType, @recordJson, @updatedAt)
       ON CONFLICT(object_id) DO UPDATE SET
         record_json = excluded.record_json,
         object_type = excluded.object_type,
         updated_at = excluded.updated_at`,
    ).run({
      objectId: obj.objectId,
      workspaceId: obj.workspaceId,
      objectType: obj.objectType,
      recordJson: JSON.stringify(obj),
      updatedAt: obj.updatedAt,
    });
  }

  getObject(objectId: string): KnowledgeObject | null {
    const db = getDatabase();
    const row = db.prepare(`SELECT record_json FROM empire_knowledge_objects WHERE object_id = @objectId`).get({ objectId }) as Record<string, unknown> | undefined;
    return row ? mapJson<KnowledgeObject>(row) : null;
  }

  listObjects(workspaceId: string, objectType?: string): KnowledgeObject[] {
    const db = getDatabase();
    const rows = objectType
      ? db.prepare(`SELECT record_json FROM empire_knowledge_objects WHERE workspace_id = @workspaceId AND object_type = @objectType`).all({ workspaceId, objectType })
      : db.prepare(`SELECT record_json FROM empire_knowledge_objects WHERE workspace_id = @workspaceId`).all({ workspaceId });
    return (rows as Record<string, unknown>[]).map((r) => mapJson<KnowledgeObject>(r));
  }

  countObjects(workspaceId: string): number {
    const db = getDatabase();
    const row = db.prepare(`SELECT COUNT(*) AS c FROM empire_knowledge_objects WHERE workspace_id = @workspaceId`).get({ workspaceId }) as { c: number };
    return row.c;
  }

  saveEdge(edge: KnowledgeEdge): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO empire_knowledge_edges
        (edge_id, workspace_id, from_object_id, to_object_id, relationship, record_json, created_at)
       VALUES (@edgeId, @workspaceId, @fromObjectId, @toObjectId, @relationship, @recordJson, @createdAt)
       ON CONFLICT(edge_id) DO UPDATE SET record_json = excluded.record_json`,
    ).run({
      edgeId: edge.edgeId,
      workspaceId: edge.workspaceId,
      fromObjectId: edge.fromObjectId,
      toObjectId: edge.toObjectId,
      relationship: edge.relationship,
      recordJson: JSON.stringify(edge),
      createdAt: edge.createdAt,
    });
  }

  listEdges(workspaceId: string): KnowledgeEdge[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT record_json FROM empire_knowledge_edges WHERE workspace_id = @workspaceId`).all({ workspaceId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<KnowledgeEdge>(r));
  }

  listEdgesFrom(objectId: string): KnowledgeEdge[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT record_json FROM empire_knowledge_edges WHERE from_object_id = @objectId`).all({ objectId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<KnowledgeEdge>(r));
  }

  listEdgesTo(objectId: string): KnowledgeEdge[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT record_json FROM empire_knowledge_edges WHERE to_object_id = @objectId`).all({ objectId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<KnowledgeEdge>(r));
  }

  saveLearning(record: LearningRecord): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO empire_knowledge_learning_records
        (learning_id, workspace_id, record_json, created_at)
       VALUES (@learningId, @workspaceId, @recordJson, @createdAt)
       ON CONFLICT(learning_id) DO UPDATE SET record_json = excluded.record_json`,
    ).run({
      learningId: record.learningId,
      workspaceId: record.workspaceId,
      recordJson: JSON.stringify(record),
      createdAt: record.timestamp,
    });
  }

  listLearnings(workspaceId: string): LearningRecord[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT record_json FROM empire_knowledge_learning_records WHERE workspace_id = @workspaceId ORDER BY created_at DESC`).all({ workspaceId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<LearningRecord>(r));
  }

  getLearning(learningId: string): LearningRecord | null {
    const db = getDatabase();
    const row = db.prepare(`SELECT record_json FROM empire_knowledge_learning_records WHERE learning_id = @learningId`).get({ learningId }) as Record<string, unknown> | undefined;
    return row ? mapJson<LearningRecord>(row) : null;
  }

  isSeeded(workspaceId: string): boolean {
    return this.countObjects(workspaceId) > 0;
  }
}

let repository: EmpireKnowledgeRepository | null = null;

export function getEmpireKnowledgeRepository(): EmpireKnowledgeRepository {
  repository ??= new EmpireKnowledgeRepository();
  return repository;
}

export function resetEmpireKnowledgeRepository(): void {
  repository = null;
}
