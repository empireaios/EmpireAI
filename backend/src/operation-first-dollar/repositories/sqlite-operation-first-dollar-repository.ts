import { randomUUID } from "node:crypto";

import { getDatabase } from "../../brain/database.js";
import type {
  BusinessKpiSnapshot,
  DailyExecutiveBrief,
  EmpireLearningRecord,
  FirstDollarMilestone,
  MetricSource,
  MilestoneRecord,
} from "../models/operation-first-dollar.js";

let repositoryInstance: SqliteOperationFirstDollarRepository | null = null;

export function getOperationFirstDollarRepository(): SqliteOperationFirstDollarRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteOperationFirstDollarRepository();
  }
  return repositoryInstance;
}

export function resetOperationFirstDollarRepository(): void {
  repositoryInstance = null;
}

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row.record_json)) as T;
}

export class SqliteOperationFirstDollarRepository {
  saveMilestone(record: MilestoneRecord): MilestoneRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ofd_milestones
        (milestone_id, milestone, workspace_id, company_id, record_json, achieved_at, created_at)
       VALUES
        (@milestoneId, @milestone, @workspaceId, @companyId, @recordJson, @achievedAt, @createdAt)
       ON CONFLICT(milestone_id) DO UPDATE SET
         record_json = excluded.record_json,
         achieved_at = excluded.achieved_at`,
    ).run({
      milestoneId: record.milestoneId,
      milestone: record.milestone,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      recordJson: JSON.stringify(record),
      achievedAt: record.achievedAt,
      createdAt: record.createdAt,
    });
    return record;
  }

  getMilestoneByType(
    workspaceId: string,
    companyId: string,
    milestone: FirstDollarMilestone,
  ): MilestoneRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM ofd_milestones
         WHERE workspace_id = @workspaceId AND company_id = @companyId AND milestone = @milestone
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get({ workspaceId, companyId, milestone });
    return row ? mapJson<MilestoneRecord>(row as Record<string, unknown>) : null;
  }

  listMilestones(workspaceId: string, companyId: string): MilestoneRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM ofd_milestones
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY CASE WHEN achieved_at IS NULL THEN 1 ELSE 0 END, achieved_at ASC, created_at ASC`,
      )
      .all({ workspaceId, companyId }) as Record<string, unknown>[];
    return rows.map((row) => mapJson<MilestoneRecord>(row));
  }

  saveKpiSnapshot(snapshot: BusinessKpiSnapshot): BusinessKpiSnapshot {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ofd_kpi_snapshots
        (snapshot_id, workspace_id, company_id, record_json, computed_at)
       VALUES
        (@snapshotId, @workspaceId, @companyId, @recordJson, @computedAt)`,
    ).run({
      snapshotId: snapshot.snapshotId,
      workspaceId: snapshot.workspaceId,
      companyId: snapshot.companyId,
      recordJson: JSON.stringify(snapshot),
      computedAt: snapshot.computedAt,
    });
    return snapshot;
  }

  getLatestKpiSnapshot(workspaceId: string, companyId: string): BusinessKpiSnapshot | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM ofd_kpi_snapshots
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY computed_at DESC LIMIT 1`,
      )
      .get({ workspaceId, companyId });
    return row ? mapJson<BusinessKpiSnapshot>(row as Record<string, unknown>) : null;
  }

  listKpiSnapshots(workspaceId: string, companyId: string, limit = 30): BusinessKpiSnapshot[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM ofd_kpi_snapshots
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY computed_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, companyId, limit }) as Record<string, unknown>[];
    return rows.map((row) => mapJson<BusinessKpiSnapshot>(row));
  }

  saveLearning(record: EmpireLearningRecord): EmpireLearningRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ofd_learning_records
        (learning_id, workspace_id, company_id, source, record_json, created_at)
       VALUES
        (@learningId, @workspaceId, @companyId, @source, @recordJson, @createdAt)`,
    ).run({
      learningId: record.learningId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      source: record.source,
      recordJson: JSON.stringify(record),
      createdAt: record.createdAt,
    });
    return record;
  }

  listLearningRecords(
    workspaceId: string,
    companyId?: string,
    source?: MetricSource,
    limit = 100,
  ): EmpireLearningRecord[] {
    const db = getDatabase();
    let query = `SELECT record_json FROM ofd_learning_records WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId, limit };
    if (companyId) {
      query += ` AND company_id = @companyId`;
      params.companyId = companyId;
    }
    if (source) {
      query += ` AND source = @source`;
      params.source = source;
    }
    query += ` ORDER BY created_at DESC LIMIT @limit`;
    const rows = db.prepare(query).all(params) as Record<string, unknown>[];
    return rows.map((row) => mapJson<EmpireLearningRecord>(row));
  }

  countLearningRecords(workspaceId: string, companyId?: string): number {
    const db = getDatabase();
    let query = `SELECT COUNT(*) as count FROM ofd_learning_records WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (companyId) {
      query += ` AND company_id = @companyId`;
      params.companyId = companyId;
    }
    return (db.prepare(query).get(params) as { count: number }).count;
  }

  saveBrief(brief: DailyExecutiveBrief): DailyExecutiveBrief {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ofd_executive_briefs
        (brief_id, workspace_id, company_id, record_json, created_at)
       VALUES
        (@briefId, @workspaceId, @companyId, @recordJson, @createdAt)`,
    ).run({
      briefId: brief.briefId,
      workspaceId: brief.workspaceId,
      companyId: brief.companyId,
      recordJson: JSON.stringify(brief),
      createdAt: brief.createdAt,
    });
    return brief;
  }

  getLatestBrief(workspaceId: string, companyId: string): DailyExecutiveBrief | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM ofd_executive_briefs
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get({ workspaceId, companyId });
    return row ? mapJson<DailyExecutiveBrief>(row as Record<string, unknown>) : null;
  }

  listBriefs(workspaceId: string, companyId: string, limit = 30): DailyExecutiveBrief[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM ofd_executive_briefs
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, companyId, limit }) as Record<string, unknown>[];
    return rows.map((row) => mapJson<DailyExecutiveBrief>(row));
  }

  getLaunchDate(workspaceId: string, companyId: string): string | null {
    const firstListing = this.getMilestoneByType(workspaceId, companyId, "FIRST_LISTING_CREATED");
    return firstListing?.achievedAt ?? null;
  }
}
