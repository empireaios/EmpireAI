import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import type { SupplierRecord } from "../types.js";

type SupplierRow = {
  id: string;
  workspace_id: string;
  name: string;
  region: string;
  product_count: number;
  reliability: number;
  avg_ship_days: number;
  status: string;
};

export class SupplierRepository {
  listByWorkspace(workspaceId: string): SupplierRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM suppliers WHERE workspace_id = @workspaceId ORDER BY name ASC`)
      .all({ workspaceId }) as SupplierRow[];

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      region: row.region,
      productCount: row.product_count,
      reliability: row.reliability,
      avgShipDays: row.avg_ship_days,
      status: row.status as SupplierRecord["status"],
    }));
  }

  statsForWorkspace(workspaceId: string): {
    count: number;
    fulfillmentRate: number;
    degraded: number;
  } {
    const suppliers = this.listByWorkspace(workspaceId);
    const degraded = suppliers.filter((s) => s.status === "degraded").length;
    const avgReliability =
      suppliers.length > 0
        ? suppliers.reduce((sum, s) => sum + s.reliability, 0) / suppliers.length
        : 0;

    return {
      count: suppliers.length,
      fulfillmentRate: avgReliability / 100,
      degraded,
    };
  }

  create(input: Omit<SupplierRecord, "id"> & { id?: string }): SupplierRecord {
    const db = getDatabase();
    const id = input.id ?? randomUUID();

    if (input.id) {
      const existing = db
        .prepare(`SELECT id FROM suppliers WHERE id = @id`)
        .get({ id: input.id }) as { id: string } | undefined;
      if (existing) {
        return { ...input, id: input.id };
      }
    }

    db.prepare(
      `INSERT INTO suppliers
        (id, workspace_id, name, region, product_count, reliability, avg_ship_days, status)
       VALUES (@id, @workspaceId, @name, @region, @productCount, @reliability, @avgShipDays, @status)`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      name: input.name,
      region: input.region,
      productCount: input.productCount,
      reliability: input.reliability,
      avgShipDays: input.avgShipDays,
      status: input.status,
    });
    return { ...input, id };
  }
}
