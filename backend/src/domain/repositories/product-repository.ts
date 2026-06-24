import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import type { ProductRecord } from "../types.js";

type ProductRow = {
  id: string;
  workspace_id: string;
  name: string;
  score: number;
  demand: string;
  margin_cents: number;
  trend: string;
};

export class ProductRepository {
  listTopByWorkspace(workspaceId: string, limit = 20): ProductRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM products WHERE workspace_id = @workspaceId ORDER BY score DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as ProductRow[];

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      score: row.score,
      demand: row.demand,
      marginCents: row.margin_cents,
      trend: row.trend,
    }));
  }

  statsForWorkspace(workspaceId: string): {
    skuCount: number;
    avgScore: number;
    activeSignals: number;
  } {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT COUNT(*) as sku_count, AVG(score) as avg_score FROM products WHERE workspace_id = @workspaceId`,
      )
      .get({ workspaceId }) as { sku_count: number; avg_score: number | null };

    return {
      skuCount: row.sku_count,
      avgScore: row.avg_score ?? 0,
      activeSignals: Math.max(1, Math.floor(row.sku_count * 0.07)),
    };
  }

  create(input: Omit<ProductRecord, "id"> & { id?: string }): ProductRecord {
    const db = getDatabase();
    const id = input.id ?? randomUUID();

    if (input.id) {
      const existing = db
        .prepare(`SELECT id FROM products WHERE id = @id`)
        .get({ id: input.id }) as { id: string } | undefined;
      if (existing) {
        return { ...input, id: input.id };
      }
    }

    db.prepare(
      `INSERT INTO products (id, workspace_id, name, score, demand, margin_cents, trend)
       VALUES (@id, @workspaceId, @name, @score, @demand, @marginCents, @trend)
       ON CONFLICT(id) DO NOTHING`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      name: input.name,
      score: input.score,
      demand: input.demand,
      marginCents: input.marginCents,
      trend: input.trend,
    });
    return { ...input, id };
  }
}
