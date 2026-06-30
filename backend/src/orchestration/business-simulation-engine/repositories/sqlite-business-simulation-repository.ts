import { getDatabase } from "../../../brain/database.js";
import type { BusinessSimulationRecord } from "../models/business-simulation.js";

let repositoryInstance: SqliteBusinessSimulationRepository | null = null;

export function getBusinessSimulationRepository(): SqliteBusinessSimulationRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteBusinessSimulationRepository();
  }
  return repositoryInstance;
}

export function resetBusinessSimulationRepository(): void {
  repositoryInstance = null;
}

function mapRow(row: Record<string, unknown>): BusinessSimulationRecord {
  return JSON.parse(String(row.record_json)) as BusinessSimulationRecord;
}

export class SqliteBusinessSimulationRepository {
  saveSimulation(record: BusinessSimulationRecord): BusinessSimulationRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO business_simulations
        (simulation_id, workspace_id, company_id, build_id, record_json, simulated_at)
       VALUES
        (@simulationId, @workspaceId, @companyId, @buildId, @recordJson, @simulatedAt)
       ON CONFLICT(simulation_id) DO UPDATE SET
         record_json = excluded.record_json,
         simulated_at = excluded.simulated_at`,
    ).run({
      simulationId: record.simulationId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      buildId: record.buildId,
      recordJson: JSON.stringify(record),
      simulatedAt: record.simulatedAt,
    });
    return record;
  }

  getSimulation(simulationId: string): BusinessSimulationRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM business_simulations WHERE simulation_id = @simulationId`)
      .get({ simulationId });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  getLatestByBuild(buildId: string): BusinessSimulationRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM business_simulations
         WHERE build_id = @buildId ORDER BY simulated_at DESC LIMIT 1`,
      )
      .get({ buildId });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  listSimulations(workspaceId: string, companyId?: string): BusinessSimulationRecord[] {
    const db = getDatabase();
    let query = `SELECT record_json FROM business_simulations WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (companyId) {
      query += ` AND company_id = @companyId`;
      params.companyId = companyId;
    }
    query += ` ORDER BY simulated_at DESC`;
    const rows = db.prepare(query).all(params);
    return (rows as Record<string, unknown>[]).map(mapRow);
  }
}
