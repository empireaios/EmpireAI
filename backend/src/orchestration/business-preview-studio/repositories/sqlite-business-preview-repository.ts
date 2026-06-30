import { getDatabase } from "../../../brain/database.js";
import type { BusinessPreviewRecord } from "../models/business-preview.js";

let repositoryInstance: SqliteBusinessPreviewRepository | null = null;

export function getBusinessPreviewRepository(): SqliteBusinessPreviewRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteBusinessPreviewRepository();
  }
  return repositoryInstance;
}

export function resetBusinessPreviewRepository(): void {
  repositoryInstance = null;
}

function mapRow(row: Record<string, unknown>): BusinessPreviewRecord {
  return JSON.parse(String(row.record_json)) as BusinessPreviewRecord;
}

export class SqliteBusinessPreviewRepository {
  savePreview(record: BusinessPreviewRecord): BusinessPreviewRecord {
    const db = getDatabase();
    const updated = { ...record, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO business_preview_studio
        (preview_id, workspace_id, company_id, business_opportunity_id, status, record_json, updated_at)
       VALUES
        (@previewId, @workspaceId, @companyId, @businessOpportunityId, @status, @recordJson, @updatedAt)
       ON CONFLICT(preview_id) DO UPDATE SET
         status = excluded.status,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      previewId: updated.previewId,
      workspaceId: updated.workspaceId,
      companyId: updated.companyId,
      businessOpportunityId: updated.businessOpportunityId,
      status: updated.status,
      recordJson: JSON.stringify(updated),
      updatedAt: updated.updatedAt,
    });
    return updated;
  }

  getPreview(previewId: string): BusinessPreviewRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM business_preview_studio WHERE preview_id = @previewId`)
      .get({ previewId });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  getLatestByOpportunity(businessOpportunityId: string): BusinessPreviewRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM business_preview_studio
         WHERE business_opportunity_id = @businessOpportunityId
         ORDER BY updated_at DESC LIMIT 1`,
      )
      .get({ businessOpportunityId });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  listPreviews(workspaceId: string, companyId?: string): BusinessPreviewRecord[] {
    const db = getDatabase();
    let query = `SELECT record_json FROM business_preview_studio WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (companyId) {
      query += ` AND company_id = @companyId`;
      params.companyId = companyId;
    }
    query += ` ORDER BY updated_at DESC`;
    const rows = db.prepare(query).all(params);
    return (rows as Record<string, unknown>[]).map(mapRow);
  }
}
