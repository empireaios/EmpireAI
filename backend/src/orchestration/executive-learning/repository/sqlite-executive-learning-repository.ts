import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type {
  ExecutiveKnowledgeEntry,
  PendingExecutiveLearning,
} from "@empireai/pillow";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row.record_json)) as T;
}

export class SqliteExecutiveLearningRepository {
  ensureTables(): void {
    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS executive_learning_pending (
        learning_id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        record_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        expires_at TEXT
      );

      CREATE TABLE IF NOT EXISTS executive_knowledge_base (
        learning_id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        record_json TEXT NOT NULL,
        approved_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_exec_learning_pending_ws
        ON executive_learning_pending(workspace_id, status);
      CREATE INDEX IF NOT EXISTS idx_exec_knowledge_ws
        ON executive_knowledge_base(workspace_id, status);
    `);
  }

  savePending(record: PendingExecutiveLearning): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO executive_learning_pending
        (learning_id, workspace_id, category, status, record_json, created_at, updated_at, expires_at)
       VALUES (@learningId, @workspaceId, @category, @status, @json, @createdAt, @updatedAt, @expiresAt)
       ON CONFLICT(learning_id) DO UPDATE SET
         status = excluded.status,
         category = excluded.category,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at,
         expires_at = excluded.expires_at`,
    ).run({
      learningId: record.learningId,
      workspaceId: record.workspaceId,
      category: record.category,
      status: record.status,
      json: JSON.stringify(record),
      createdAt: record.discoveredAt,
      updatedAt: record.updatedAt,
      expiresAt: record.expiresAt,
    });
  }

  listPending(workspaceId: string): PendingExecutiveLearning[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM executive_learning_pending
         WHERE workspace_id = @workspaceId
           AND status IN ('pending_confirmation', 'pending_approval')
         ORDER BY updated_at DESC`,
      )
      .all({ workspaceId }) as Array<Record<string, unknown>>;
    return rows.map((row) => mapJson<PendingExecutiveLearning>(row));
  }

  listAll(workspaceId: string): PendingExecutiveLearning[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM executive_learning_pending
         WHERE workspace_id = @workspaceId
         ORDER BY updated_at DESC`,
      )
      .all({ workspaceId }) as Array<Record<string, unknown>>;
    return rows.map((row) => mapJson<PendingExecutiveLearning>(row));
  }

  getPending(learningId: string, workspaceId: string): PendingExecutiveLearning | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM executive_learning_pending
         WHERE learning_id = @learningId AND workspace_id = @workspaceId`,
      )
      .get({ learningId, workspaceId }) as Record<string, unknown> | undefined;
    return row ? mapJson<PendingExecutiveLearning>(row) : null;
  }

  updateStatus(
    learningId: string,
    workspaceId: string,
    status: PendingExecutiveLearning["status"],
    notes?: string,
  ): PendingExecutiveLearning | null {
    const existing = this.getPending(learningId, workspaceId);
    if (!existing) return null;
    const updated: PendingExecutiveLearning = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
      description: notes ? `${existing.description}\n\nNotes: ${notes}` : existing.description,
    };
    this.savePending(updated);
    return updated;
  }

  editPending(input: {
    learningId: string;
    workspaceId: string;
    title?: string;
    description?: string;
    category?: PendingExecutiveLearning["category"];
  }): PendingExecutiveLearning | null {
    const existing = this.getPending(input.learningId, input.workspaceId);
    if (!existing) return null;
    const updated: PendingExecutiveLearning = {
      ...existing,
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      category: input.category ?? existing.category,
      updatedAt: new Date().toISOString(),
    };
    this.savePending(updated);
    return updated;
  }

  mergePending(input: {
    workspaceId: string;
    sourceLearningIds: string[];
    targetTitle: string;
    targetDescription: string;
    actor: string;
  }): PendingExecutiveLearning | null {
    const sources = input.sourceLearningIds
      .map((id) => this.getPending(id, input.workspaceId))
      .filter((item): item is PendingExecutiveLearning => item !== null);
    if (sources.length === 0) return null;

    const mergedId = randomUUID();
    const now = new Date().toISOString();
    const merged: PendingExecutiveLearning = {
      learningId: mergedId,
      workspaceId: input.workspaceId,
      title: input.targetTitle,
      description: input.targetDescription,
      category: sources[0]!.category,
      status: "pending_confirmation",
      observation: sources.map((s) => s.observation).join(" | "),
      evidence: sources.flatMap((s) => s.evidence),
      confidence: Math.max(...sources.map((s) => s.confidence)),
      reasoningAreas: [...new Set(sources.flatMap((s) => s.reasoningAreas))],
      impactSummary: sources.map((s) => s.impactSummary).join(" "),
      source: "merged",
      sessionId: null,
      requestId: null,
      discoveredAt: now,
      updatedAt: now,
      expiresAt: null,
      requiresGrandKingApproval: sources.some((s) => s.requiresGrandKingApproval),
    };

    for (const source of sources) {
      this.updateStatus(source.learningId, input.workspaceId, "merged", `Merged into ${mergedId}`);
    }
    this.savePending(merged);
    return merged;
  }

  promoteToKnowledge(learningId: string, knowledge: ExecutiveKnowledgeEntry): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO executive_knowledge_base
        (learning_id, workspace_id, category, status, record_json, approved_at, created_at, updated_at)
       VALUES (@learningId, @workspaceId, @category, @status, @json, @approvedAt, @createdAt, @updatedAt)
       ON CONFLICT(learning_id) DO UPDATE SET
         status = excluded.status,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      learningId: knowledge.learningId,
      workspaceId: knowledge.workspaceId,
      category: knowledge.category,
      status: knowledge.status,
      json: JSON.stringify(knowledge),
      approvedAt: knowledge.approvedAt,
      createdAt: knowledge.discoveredAt,
      updatedAt: knowledge.approvedAt,
    });

    db.prepare(
      `DELETE FROM executive_learning_pending
       WHERE learning_id = @learningId AND workspace_id = @workspaceId`,
    ).run({ learningId, workspaceId: knowledge.workspaceId });
  }

  listApprovedKnowledge(workspaceId: string): ExecutiveKnowledgeEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM executive_knowledge_base
         WHERE workspace_id = @workspaceId AND status = 'approved'
         ORDER BY approved_at DESC`,
      )
      .all({ workspaceId }) as Array<Record<string, unknown>>;
    return rows.map((row) => mapJson<ExecutiveKnowledgeEntry>(row));
  }

  getKnowledge(learningId: string, workspaceId: string): ExecutiveKnowledgeEntry | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM executive_knowledge_base
         WHERE learning_id = @learningId AND workspace_id = @workspaceId`,
      )
      .get({ learningId, workspaceId }) as Record<string, unknown> | undefined;
    return row ? mapJson<ExecutiveKnowledgeEntry>(row) : null;
  }

  archiveKnowledge(learningId: string, workspaceId: string): ExecutiveKnowledgeEntry | null {
    const existing = this.getKnowledge(learningId, workspaceId);
    if (!existing) return null;
    const archived: ExecutiveKnowledgeEntry = {
      ...existing,
      status: "archived",
    };
    const db = getDatabase();
    db.prepare(
      `UPDATE executive_knowledge_base
       SET status = 'archived', record_json = @json, updated_at = @updatedAt
       WHERE learning_id = @learningId AND workspace_id = @workspaceId`,
    ).run({
      learningId,
      workspaceId,
      json: JSON.stringify(archived),
      updatedAt: new Date().toISOString(),
    });
    return archived;
  }

  expireSessionContext(workspaceId: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    const rows = db
      .prepare(
        `SELECT record_json FROM executive_learning_pending
         WHERE workspace_id = @workspaceId AND category = 'D' AND expires_at IS NOT NULL`,
      )
      .all({ workspaceId }) as Array<Record<string, unknown>>;

    for (const row of rows) {
      const record = mapJson<PendingExecutiveLearning>(row);
      if (record.expiresAt && record.expiresAt <= now && record.status !== "expired") {
        this.savePending({ ...record, status: "expired", updatedAt: now });
      }
    }
  }
}
