import { getDatabase } from "../../../brain/database.js";
import type {
  AmazonCjProductMap,
  PresaleCycleResult,
  QualifiedOpportunity,
} from "../models.js";

export function ensurePillowCommercePresaleTables(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS pillow_commerce_presale_cycles (
      cycle_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      outcome TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pillow_commerce_presale_opportunities (
      opportunity_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      disposition TEXT NOT NULL,
      approval_id TEXT,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pillow_commerce_amazon_cj_maps (
      amazon_seller_sku TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      asin TEXT NOT NULL,
      cj_pid TEXT NOT NULL,
      cj_vid TEXT NOT NULL,
      record_json TEXT NOT NULL,
      verified_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pillow_commerce_presale_cycles_ws
      ON pillow_commerce_presale_cycles(workspace_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_pillow_commerce_presale_opps_ws
      ON pillow_commerce_presale_opportunities(workspace_id, disposition, updated_at);
  `);
}

export class SqlitePillowCommercePresaleRepository {
  constructor() {
    ensurePillowCommercePresaleTables();
  }

  saveCycle(cycle: PresaleCycleResult): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO pillow_commerce_presale_cycles
        (cycle_id, workspace_id, company_id, outcome, record_json, created_at)
       VALUES (@cycleId, @workspaceId, @companyId, @outcome, @json, @createdAt)
       ON CONFLICT(cycle_id) DO UPDATE SET
         outcome = excluded.outcome,
         record_json = excluded.record_json`,
    ).run({
      cycleId: cycle.cycleId,
      workspaceId: cycle.workspaceId,
      companyId: cycle.companyId,
      outcome: cycle.outcome,
      json: JSON.stringify(cycle),
      createdAt: cycle.completedAt,
    });
  }

  saveOpportunity(opportunity: QualifiedOpportunity): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO pillow_commerce_presale_opportunities
        (opportunity_id, workspace_id, company_id, disposition, approval_id, record_json, created_at, updated_at)
       VALUES (@opportunityId, @workspaceId, @companyId, @disposition, @approvalId, @json, @createdAt, @updatedAt)
       ON CONFLICT(opportunity_id) DO UPDATE SET
         disposition = excluded.disposition,
         approval_id = excluded.approval_id,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      opportunityId: opportunity.opportunityId,
      workspaceId: opportunity.workspaceId,
      companyId: opportunity.companyId,
      disposition: opportunity.disposition,
      approvalId: opportunity.approvalId,
      json: JSON.stringify(opportunity),
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
    });
  }

  saveMapping(map: AmazonCjProductMap, workspaceId: string): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO pillow_commerce_amazon_cj_maps
        (amazon_seller_sku, workspace_id, asin, cj_pid, cj_vid, record_json, verified_at)
       VALUES (@amazonSellerSku, @workspaceId, @asin, @cjPid, @cjVid, @json, @verifiedAt)
       ON CONFLICT(amazon_seller_sku) DO UPDATE SET
         asin = excluded.asin,
         cj_pid = excluded.cj_pid,
         cj_vid = excluded.cj_vid,
         record_json = excluded.record_json,
         verified_at = excluded.verified_at`,
    ).run({
      amazonSellerSku: map.amazonSellerSku,
      workspaceId,
      asin: map.asin,
      cjPid: map.cjPid,
      cjVid: map.cjVid,
      json: JSON.stringify(map),
      verifiedAt: map.verifiedAt,
    });
  }

  getLatestCycle(workspaceId: string): PresaleCycleResult | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM pillow_commerce_presale_cycles
         WHERE workspace_id = @workspaceId ORDER BY created_at DESC LIMIT 1`,
      )
      .get({ workspaceId }) as { record_json: string } | undefined;
    return row ? (JSON.parse(row.record_json) as PresaleCycleResult) : null;
  }

  getLatestOpportunity(workspaceId: string): QualifiedOpportunity | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM pillow_commerce_presale_opportunities
         WHERE workspace_id = @workspaceId ORDER BY updated_at DESC LIMIT 1`,
      )
      .get({ workspaceId }) as { record_json: string } | undefined;
    return row ? (JSON.parse(row.record_json) as QualifiedOpportunity) : null;
  }

  getPendingApprovalOpportunity(workspaceId: string): QualifiedOpportunity | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM pillow_commerce_presale_opportunities
         WHERE workspace_id = @workspaceId AND disposition IN ('APPROVAL_READY', 'AWAITING_APPROVAL')
         ORDER BY updated_at DESC LIMIT 1`,
      )
      .get({ workspaceId }) as { record_json: string } | undefined;
    return row ? (JSON.parse(row.record_json) as QualifiedOpportunity) : null;
  }

  getMappingByAmazonSku(amazonSellerSku: string): AmazonCjProductMap | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM pillow_commerce_amazon_cj_maps WHERE amazon_seller_sku = @amazonSellerSku`,
      )
      .get({ amazonSellerSku }) as { record_json: string } | undefined;
    return row ? (JSON.parse(row.record_json) as AmazonCjProductMap) : null;
  }

  updateOpportunity(opportunity: QualifiedOpportunity): void {
    this.saveOpportunity(opportunity);
  }

  getFunnelCounts(workspaceId: string): {
    mappings: number;
    approvalReady: number;
    awaitingApproval: number;
    approvedPendingPublish: number;
    published: number;
    evaluatedFromCycles: number;
    rejectedFromCycles: number;
  } {
    const db = getDatabase();
    const mappings = (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM pillow_commerce_amazon_cj_maps WHERE workspace_id = @workspaceId`,
        )
        .get({ workspaceId }) as { n: number }
    ).n;
    const byDisposition = (disposition: string) =>
      (
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM pillow_commerce_presale_opportunities
             WHERE workspace_id = @workspaceId AND disposition = @disposition`,
          )
          .get({ workspaceId, disposition }) as { n: number }
      ).n;

    const cycleRows = db
      .prepare(
        `SELECT record_json FROM pillow_commerce_presale_cycles
         WHERE workspace_id = @workspaceId ORDER BY created_at DESC LIMIT 25`,
      )
      .all({ workspaceId }) as Array<{ record_json: string }>;

    let evaluatedFromCycles = 0;
    let rejectedFromCycles = 0;
    for (const row of cycleRows) {
      try {
        const cycle = JSON.parse(row.record_json) as PresaleCycleResult;
        evaluatedFromCycles += Number(cycle.candidatesRetrieved ?? 0);
        rejectedFromCycles += Array.isArray(cycle.rejections) ? cycle.rejections.length : 0;
      } catch {
        /* ignore corrupt rows */
      }
    }

    return {
      mappings,
      approvalReady: byDisposition("APPROVAL_READY"),
      awaitingApproval: byDisposition("AWAITING_APPROVAL"),
      approvedPendingPublish: byDisposition("APPROVED_PENDING_PUBLISH"),
      published: byDisposition("PUBLISHED"),
      evaluatedFromCycles,
      rejectedFromCycles,
    };
  }

  aggregateRejectionReasons(
    workspaceId: string,
    limitCycles = 25,
  ): Array<{ reasonCode: string; count: number }> {
    const db = getDatabase();
    const cycleRows = db
      .prepare(
        `SELECT record_json FROM pillow_commerce_presale_cycles
         WHERE workspace_id = @workspaceId ORDER BY created_at DESC LIMIT @limitCycles`,
      )
      .all({ workspaceId, limitCycles }) as Array<{ record_json: string }>;
    const counts = new Map<string, number>();
    for (const row of cycleRows) {
      try {
        const cycle = JSON.parse(row.record_json) as PresaleCycleResult;
        for (const rejection of cycle.rejections ?? []) {
          const code = String(rejection.reasonCode ?? "UNKNOWN");
          counts.set(code, (counts.get(code) ?? 0) + 1);
        }
      } catch {
        /* ignore */
      }
    }
    return [...counts.entries()]
      .map(([reasonCode, count]) => ({ reasonCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }
}

let repoSingleton: SqlitePillowCommercePresaleRepository | null = null;

export function getPillowCommercePresaleRepository(): SqlitePillowCommercePresaleRepository {
  if (!repoSingleton) repoSingleton = new SqlitePillowCommercePresaleRepository();
  return repoSingleton;
}
