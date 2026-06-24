import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import type { OrderRecord } from "../types.js";

type OrderRow = {
  id: string;
  workspace_id: string;
  company_id: string;
  company_name: string;
  product_name: string;
  total_cents: number;
  profit_cents: number;
  status: string;
  created_at: string;
};

function mapOrder(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    companyId: row.company_id,
    companyName: row.company_name,
    productName: row.product_name,
    totalCents: row.total_cents,
    profitCents: row.profit_cents,
    status: row.status,
    createdAt: row.created_at,
  };
}

export class OrderRepository {
  listByWorkspace(workspaceId: string, limit = 50): OrderRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM orders WHERE workspace_id = @workspaceId ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as OrderRow[];
    return rows.map(mapOrder);
  }

  statsForWorkspace(workspaceId: string): {
    todayCount: number;
    processing: number;
    shipped: number;
    profitTodayCents: number;
  } {
    const db = getDatabase();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const row = db
      .prepare(
        `SELECT
          SUM(CASE WHEN created_at >= @startOfDay THEN 1 ELSE 0 END) as today_count,
          SUM(CASE WHEN status = 'Processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'Shipped' THEN 1 ELSE 0 END) as shipped,
          SUM(CASE WHEN created_at >= @startOfDay THEN profit_cents ELSE 0 END) as profit_today
         FROM orders WHERE workspace_id = @workspaceId`,
      )
      .get({ workspaceId, startOfDay: startOfDay.toISOString() }) as {
      today_count: number | null;
      processing: number | null;
      shipped: number | null;
      profit_today: number | null;
    };

    return {
      todayCount: row.today_count ?? 0,
      processing: row.processing ?? 0,
      shipped: row.shipped ?? 0,
      profitTodayCents: row.profit_today ?? 0,
    };
  }

  create(input: Omit<OrderRecord, "id" | "createdAt"> & { id?: string }): OrderRecord {
    const db = getDatabase();
    const id = input.id ?? randomUUID();

    if (input.id) {
      const existing = db
        .prepare(`SELECT * FROM orders WHERE id = @id`)
        .get({ id: input.id }) as OrderRow | undefined;
      if (existing) {
        return mapOrder(existing);
      }
    }

    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO orders
        (id, workspace_id, company_id, company_name, product_name, total_cents, profit_cents, status, created_at)
       VALUES (@id, @workspaceId, @companyId, @companyName, @productName, @totalCents, @profitCents, @status, @createdAt)`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      companyName: input.companyName,
      productName: input.productName,
      totalCents: input.totalCents,
      profitCents: input.profitCents,
      status: input.status,
      createdAt,
    });

    return { ...input, id, createdAt };
  }
}
