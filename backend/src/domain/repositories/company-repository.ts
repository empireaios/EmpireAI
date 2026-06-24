import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import type { BuildStageRecord, BuildStageStatus, CompanyRecord, CompanyStatus } from "../types.js";

const DEFAULT_BUILD_STAGES: Array<{ stage: string; progress: number; status: BuildStageStatus }> = [
  { stage: "Brand system", progress: 0, status: "pending" },
  { stage: "Product catalog", progress: 0, status: "pending" },
  { stage: "Storefront theme", progress: 0, status: "pending" },
  { stage: "Checkout & payments", progress: 0, status: "pending" },
  { stage: "Ad creatives", progress: 0, status: "pending" },
];

type CompanyRow = {
  id: string;
  workspace_id: string;
  name: string;
  category: string;
  status: string;
  revenue_cents: number;
  margin_pct: number | null;
  agent_count: number;
  created_at: string;
  updated_at: string;
};

function mapCompany(row: CompanyRow): CompanyRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    category: row.category,
    status: row.status as CompanyStatus,
    revenueCents: row.revenue_cents,
    marginPct: row.margin_pct,
    agentCount: row.agent_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CompanyRepository {
  listByWorkspace(workspaceId: string): CompanyRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM companies WHERE workspace_id = @workspaceId ORDER BY created_at DESC`,
      )
      .all({ workspaceId }) as CompanyRow[];
    return rows.map(mapCompany);
  }

  getById(id: string): CompanyRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM companies WHERE id = @id`)
      .get({ id }) as CompanyRow | undefined;
    return row ? mapCompany(row) : null;
  }

  findBuilding(workspaceId: string): CompanyRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM companies WHERE workspace_id = @workspaceId AND status = 'building' ORDER BY created_at DESC LIMIT 1`,
      )
      .get({ workspaceId }) as CompanyRow | undefined;
    return row ? mapCompany(row) : null;
  }

  countByWorkspace(workspaceId: string): number {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT COUNT(*) as count FROM companies WHERE workspace_id = @workspaceId`)
      .get({ workspaceId }) as { count: number };
    return row.count;
  }

  create(input: {
    id?: string;
    workspaceId: string;
    name: string;
    category: string;
    status?: CompanyStatus;
    revenueCents?: number;
    marginPct?: number | null;
    agentCount?: number;
  }): CompanyRecord {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = input.id ?? randomUUID();

    const existing = this.getById(id);
    if (existing) {
      if (existing.workspaceId === input.workspaceId) {
        return existing;
      }
      throw new Error(
        `Company id ${id} already exists in workspace ${existing.workspaceId}`,
      );
    }

    db.prepare(
      `INSERT INTO companies
        (id, workspace_id, name, category, status, revenue_cents, margin_pct, agent_count, created_at, updated_at)
       VALUES (@id, @workspaceId, @name, @category, @status, @revenueCents, @marginPct, @agentCount, @createdAt, @updatedAt)
       ON CONFLICT(id) DO NOTHING`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      name: input.name,
      category: input.category,
      status: input.status ?? "building",
      revenueCents: input.revenueCents ?? 0,
      marginPct: input.marginPct ?? null,
      agentCount: input.agentCount ?? 12,
      createdAt: now,
      updatedAt: now,
    });

    this.seedBuildStages(id);
    const created = this.getById(id);
    if (!created) {
      throw new Error(`Failed to create or load company ${id}`);
    }
    return created;
  }

  updateStatus(id: string, status: CompanyStatus): CompanyRecord | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `UPDATE companies SET status = @status, updated_at = @updatedAt WHERE id = @id`,
      )
      .run({ id, status, updatedAt: now });
    if (result.changes === 0) return null;
    return this.getById(id);
  }

  getBuildStages(companyId: string): BuildStageRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM company_build_stages WHERE company_id = @companyId ORDER BY sort_order ASC`,
      )
      .all({ companyId }) as Array<{
      id: string;
      company_id: string;
      stage: string;
      progress: number;
      status: string;
      sort_order: number;
    }>;

    return rows.map((row) => ({
      id: row.id,
      companyId: row.company_id,
      stage: row.stage,
      progress: row.progress,
      status: row.status as BuildStageStatus,
      sortOrder: row.sort_order,
    }));
  }

  seedBuildStages(companyId: string, stages = DEFAULT_BUILD_STAGES): void {
    const db = getDatabase();
    const existing = db
      .prepare(`SELECT COUNT(*) AS count FROM company_build_stages WHERE company_id = @companyId`)
      .get({ companyId }) as { count: number };
    if (existing.count > 0) return;

    const insert = db.prepare(
      `INSERT INTO company_build_stages (id, company_id, stage, progress, status, sort_order)
       VALUES (@id, @companyId, @stage, @progress, @status, @sortOrder)`,
    );

    stages.forEach((stage, index) => {
      insert.run({
        id: randomUUID(),
        companyId,
        stage: stage.stage,
        progress: stage.progress,
        status: stage.status,
        sortOrder: index,
      });
    });
  }

  portfolioTotals(workspaceId: string): {
    revenueCents: number;
    avgMarginPct: number | null;
    companyCount: number;
    agentCount: number;
  } {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT
          COALESCE(SUM(revenue_cents), 0) as revenue_cents,
          AVG(margin_pct) as avg_margin_pct,
          COUNT(*) as company_count,
          COALESCE(SUM(agent_count), 0) as agent_count
         FROM companies WHERE workspace_id = @workspaceId`,
      )
      .get({ workspaceId }) as {
      revenue_cents: number;
      avg_margin_pct: number | null;
      company_count: number;
      agent_count: number;
    };

    return {
      revenueCents: row.revenue_cents,
      avgMarginPct: row.avg_margin_pct,
      companyCount: row.company_count,
      agentCount: row.agent_count,
    };
  }
}
