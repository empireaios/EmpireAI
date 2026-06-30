import { getDatabase } from "../../../brain/database.js";
import type { MarketDominationStrategyDocument } from "../models/market-domination-strategy.js";

let repositoryInstance: SqliteMarketStrategyRepository | null = null;

export function getMarketStrategyRepository(): SqliteMarketStrategyRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteMarketStrategyRepository();
  }
  return repositoryInstance;
}

export function resetMarketStrategyRepository(): void {
  repositoryInstance = null;
}

function mapRow(row: Record<string, unknown>): MarketDominationStrategyDocument {
  return JSON.parse(String(row.record_json)) as MarketDominationStrategyDocument;
}

export class SqliteMarketStrategyRepository {
  saveStrategy(record: MarketDominationStrategyDocument): MarketDominationStrategyDocument {
    const db = getDatabase();
    const updated = { ...record, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO market_domination_strategies
        (strategy_id, workspace_id, company_id, business_opportunity_id, record_json, updated_at)
       VALUES
        (@strategyId, @workspaceId, @companyId, @businessOpportunityId, @recordJson, @updatedAt)
       ON CONFLICT(strategy_id) DO UPDATE SET
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      strategyId: updated.strategyId,
      workspaceId: updated.workspaceId,
      companyId: updated.companyId,
      businessOpportunityId: updated.businessOpportunityId,
      recordJson: JSON.stringify(updated),
      updatedAt: updated.updatedAt,
    });
    return updated;
  }

  getStrategy(strategyId: string): MarketDominationStrategyDocument | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM market_domination_strategies WHERE strategy_id = @strategyId`)
      .get({ strategyId });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  getLatestByOpportunity(businessOpportunityId: string): MarketDominationStrategyDocument | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM market_domination_strategies
         WHERE business_opportunity_id = @businessOpportunityId
         ORDER BY updated_at DESC LIMIT 1`,
      )
      .get({ businessOpportunityId });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  listStrategies(workspaceId: string, companyId?: string): MarketDominationStrategyDocument[] {
    const db = getDatabase();
    let query = `SELECT record_json FROM market_domination_strategies WHERE workspace_id = @workspaceId`;
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
