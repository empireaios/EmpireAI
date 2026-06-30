import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { GrandKingsRevenueCycleRecord } from "../models/grand-kings-revenue-cycle-record.js";
import type { GrandKingsRevenueRepository } from "./grand-kings-revenue-repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

function mapCycleRow(row: Record<string, unknown>): GrandKingsRevenueCycleRecord {
  return {
    cycleId: String(row.cycle_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    correlationId: String(row.correlation_id),
    revenue: JSON.parse(String(row.revenue_json)),
    advertising: JSON.parse(String(row.advertising_json)),
    order: JSON.parse(String(row.order_json)),
    capital: JSON.parse(String(row.capital_json)),
    kpi: JSON.parse(String(row.kpi_json)),
    overallHealthScore: Number(row.overall_health_score),
    mock: Boolean(row.mock),
    createdAt: String(row.created_at),
  };
}

let repositoryInstance: SqliteGrandKingsRevenueRepository | null = null;

export function getGrandKingsRevenueRepository(): SqliteGrandKingsRevenueRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteGrandKingsRevenueRepository();
  }
  return repositoryInstance;
}

export function resetGrandKingsRevenueRepository(): void {
  repositoryInstance = null;
}

export function createCycleRecord(
  input: Omit<GrandKingsRevenueCycleRecord, "cycleId" | "createdAt"> & {
    cycleId?: string;
  },
): GrandKingsRevenueCycleRecord {
  return {
    cycleId: input.cycleId ?? randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    correlationId: input.correlationId,
    revenue: input.revenue,
    advertising: input.advertising,
    order: input.order,
    capital: input.capital,
    kpi: input.kpi,
    overallHealthScore: input.overallHealthScore,
    mock: input.mock,
    createdAt: nowIso(),
  };
}

/** SQLite persistence for Grand King's revenue operational cycles. */
export class SqliteGrandKingsRevenueRepository implements GrandKingsRevenueRepository {
  saveCycle(record: GrandKingsRevenueCycleRecord): GrandKingsRevenueCycleRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO grand_kings_revenue_cycles
        (cycle_id, workspace_id, company_id, correlation_id, revenue_json, advertising_json,
         order_json, capital_json, kpi_json, overall_health_score, mock, created_at)
       VALUES
        (@cycleId, @workspaceId, @companyId, @correlationId, @revenueJson, @advertisingJson,
         @orderJson, @capitalJson, @kpiJson, @overallHealthScore, @mock, @createdAt)
       ON CONFLICT(cycle_id) DO UPDATE SET
         revenue_json = excluded.revenue_json,
         advertising_json = excluded.advertising_json,
         order_json = excluded.order_json,
         capital_json = excluded.capital_json,
         kpi_json = excluded.kpi_json,
         overall_health_score = excluded.overall_health_score,
         mock = excluded.mock`,
    ).run({
      cycleId: record.cycleId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      correlationId: record.correlationId,
      revenueJson: JSON.stringify(record.revenue),
      advertisingJson: JSON.stringify(record.advertising),
      orderJson: JSON.stringify(record.order),
      capitalJson: JSON.stringify(record.capital),
      kpiJson: JSON.stringify(record.kpi),
      overallHealthScore: record.overallHealthScore,
      mock: record.mock ? 1 : 0,
      createdAt: record.createdAt,
    });
    return record;
  }

  getCycleById(cycleId: string): GrandKingsRevenueCycleRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM grand_kings_revenue_cycles WHERE cycle_id = @cycleId`)
      .get({ cycleId });
    return row ? mapCycleRow(row as Record<string, unknown>) : null;
  }

  listCycles(workspaceId: string, companyId?: string): GrandKingsRevenueCycleRecord[] {
    const db = getDatabase();
    const rows = companyId
      ? db
          .prepare(
            `SELECT * FROM grand_kings_revenue_cycles
             WHERE workspace_id = @workspaceId AND company_id = @companyId
             ORDER BY created_at DESC`,
          )
          .all({ workspaceId, companyId })
      : db
          .prepare(
            `SELECT * FROM grand_kings_revenue_cycles
             WHERE workspace_id = @workspaceId ORDER BY created_at DESC`,
          )
          .all({ workspaceId });
    return (rows as Record<string, unknown>[]).map(mapCycleRow);
  }

  getLatestCycle(
    workspaceId: string,
    companyId?: string,
  ): GrandKingsRevenueCycleRecord | null {
    const cycles = this.listCycles(workspaceId, companyId);
    return cycles[0] ?? null;
  }
}
