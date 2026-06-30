import type { OpportunityRankingResult } from "../models/opportunity-ranking.js";
import { getDatabase } from "../../../brain/database.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row["record_json"])) as T;
}

export class GlobalCommerceIntelligenceRepository {
  saveRanking(ranking: OpportunityRankingResult): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO global_commerce_intelligence_rankings
        (ranking_id, workspace_id, company_id, record_json, created_at)
       VALUES (@rankingId, @workspaceId, @companyId, @recordJson, @createdAt)
       ON CONFLICT(ranking_id) DO UPDATE SET record_json = excluded.record_json`,
    ).run({
      rankingId: ranking.rankingId,
      workspaceId: ranking.workspaceId,
      companyId: ranking.companyId,
      recordJson: JSON.stringify(ranking),
      createdAt: ranking.computedAt,
    });
  }

  getLatestRanking(workspaceId: string, companyId: string): OpportunityRankingResult | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM global_commerce_intelligence_rankings
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get({ workspaceId, companyId }) as Record<string, unknown> | undefined;
    return row ? mapJson<OpportunityRankingResult>(row) : null;
  }
}

let repository: GlobalCommerceIntelligenceRepository | null = null;

export function getGlobalCommerceIntelligenceRepository(): GlobalCommerceIntelligenceRepository {
  repository ??= new GlobalCommerceIntelligenceRepository();
  return repository;
}

export function resetGlobalCommerceIntelligenceRepository(): void {
  repository = null;
}
