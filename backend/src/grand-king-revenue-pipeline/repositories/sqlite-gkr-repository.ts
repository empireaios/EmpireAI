import type { PipelineProduct, RevenueTimelineEvent } from "../models/revenue-pipeline-core.js";
import type { RevenuePipelineMission } from "../models/revenue-dashboard.js";
import { getDatabase } from "../../brain/database.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row["record_json"])) as T;
}

export class GkrRepository {
  saveProduct(product: PipelineProduct): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO gkr_pipeline_products (product_id, workspace_id, company_id, state, record_json, updated_at)
       VALUES (@productId, @workspaceId, @companyId, @state, @json, @updatedAt)
       ON CONFLICT(product_id) DO UPDATE SET state = excluded.state, record_json = excluded.record_json, updated_at = excluded.updated_at`,
    ).run({
      productId: product.productId,
      workspaceId: product.workspaceId,
      companyId: product.companyId,
      state: product.state,
      json: JSON.stringify(product),
      updatedAt: product.updatedAt,
    });
  }

  getProduct(productId: string): PipelineProduct | null {
    const db = getDatabase();
    const row = db.prepare(`SELECT record_json FROM gkr_pipeline_products WHERE product_id = @productId`).get({ productId }) as Record<string, unknown> | undefined;
    return row ? mapJson<PipelineProduct>(row) : null;
  }

  listProducts(workspaceId: string, companyId: string): PipelineProduct[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT record_json FROM gkr_pipeline_products WHERE workspace_id = @workspaceId AND company_id = @companyId ORDER BY updated_at DESC`)
      .all({ workspaceId, companyId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<PipelineProduct>(r));
  }

  saveTimelineEvent(event: RevenueTimelineEvent, workspaceId: string, companyId: string): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO gkr_timeline_events (event_id, workspace_id, company_id, product_id, record_json, recorded_at)
       VALUES (@eventId, @workspaceId, @companyId, @productId, @json, @recordedAt)`,
    ).run({
      eventId: event.eventId,
      workspaceId,
      companyId,
      productId: event.productId,
      json: JSON.stringify(event),
      recordedAt: event.recordedAt,
    });
  }

  listTimeline(workspaceId: string, companyId: string, productId?: string): RevenueTimelineEvent[] {
    const db = getDatabase();
    const rows = productId
      ? (db.prepare(
          `SELECT record_json FROM gkr_timeline_events WHERE workspace_id = @workspaceId AND company_id = @companyId AND product_id = @productId ORDER BY recorded_at ASC`,
        ).all({ workspaceId, companyId, productId }) as Record<string, unknown>[])
      : (db.prepare(
          `SELECT record_json FROM gkr_timeline_events WHERE workspace_id = @workspaceId AND company_id = @companyId ORDER BY recorded_at DESC LIMIT 200`,
        ).all({ workspaceId, companyId }) as Record<string, unknown>[]);
    return rows.map((r) => mapJson<RevenueTimelineEvent>(r));
  }

  saveMission(mission: RevenuePipelineMission, workspaceId: string, companyId: string): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO gkr_pipeline_missions (mission_id, workspace_id, company_id, record_json, generated_at)
       VALUES (@missionId, @workspaceId, @companyId, @json, @generatedAt)`,
    ).run({
      missionId: mission.missionId,
      workspaceId,
      companyId,
      json: JSON.stringify(mission),
      generatedAt: mission.generatedAt,
    });
  }

  listMissions(workspaceId: string, companyId: string): RevenuePipelineMission[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT record_json FROM gkr_pipeline_missions WHERE workspace_id = @workspaceId AND company_id = @companyId ORDER BY generated_at DESC LIMIT 50`)
      .all({ workspaceId, companyId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<RevenuePipelineMission>(r));
  }

  isSeeded(workspaceId: string, companyId: string): boolean {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT COUNT(*) as count FROM gkr_pipeline_products WHERE workspace_id = @workspaceId AND company_id = @companyId`)
      .get({ workspaceId, companyId }) as { count: number };
    return row.count > 0;
  }
}

let repository: GkrRepository | null = null;

export function getGkrRepository(): GkrRepository {
  if (!repository) repository = new GkrRepository();
  return repository;
}

export function resetGkrRepository(): void {
  repository = null;
}
