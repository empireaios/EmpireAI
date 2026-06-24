import { randomUUID } from "node:crypto";
import { getDatabase } from "../brain/database.js";
import type { CostCatalogEntry, CostRiskLevel, DependencyCostRecord } from "./types.js";

export const GLOBAL_COST_CATALOG: CostCatalogEntry[] = [
  {
    dependencyId: "redis",
    purpose: "Task queue, sessions, event bus",
    oneTimeCostCents: 0,
    monthlyCostCents: 0,
    usageBased: { model: "self-hosted or managed", note: "Variable by provider" },
    businessRisk: "high",
    technicalRisk: "medium",
    replaceability: "moderate",
    backupProvider: "KeyDB / managed Redis failover",
    metadata: { category: "infrastructure" },
  },
  {
    dependencyId: "sqlite",
    purpose: "Domain, audit, ledger persistence (sql.js WASM)",
    oneTimeCostCents: 0,
    monthlyCostCents: 0,
    usageBased: {},
    businessRisk: "medium",
    technicalRisk: "low",
    replaceability: "moderate",
    backupProvider: "better-sqlite3 or PostgreSQL at scale",
    metadata: { category: "database", scaleLimit: "single-node" },
  },
  {
    dependencyId: "openai",
    purpose: "LLM agent execution",
    oneTimeCostCents: 0,
    monthlyCostCents: 0,
    usageBased: { model: "token-based" },
    businessRisk: "medium",
    technicalRisk: "medium",
    replaceability: "easy",
    backupProvider: "anthropic / google-ai",
    metadata: { category: "llm" },
  },
  {
    dependencyId: "stripe",
    purpose: "Founder billing and payouts",
    oneTimeCostCents: 0,
    monthlyCostCents: 0,
    usageBased: { model: "transaction fee" },
    businessRisk: "high",
    technicalRisk: "low",
    replaceability: "moderate",
    backupProvider: "paypal",
    metadata: { category: "payments" },
  },
  {
    dependencyId: "shopify",
    purpose: "Commerce storefront sync",
    oneTimeCostCents: 0,
    monthlyCostCents: 2900,
    usageBased: { model: "plan + transaction" },
    businessRisk: "high",
    technicalRisk: "medium",
    replaceability: "moderate",
    backupProvider: "woocommerce",
    metadata: { category: "commerce" },
  },
  {
    dependencyId: "meta-ads",
    purpose: "Paid acquisition campaigns",
    oneTimeCostCents: 0,
    monthlyCostCents: 0,
    usageBased: { model: "ad spend" },
    businessRisk: "high",
    technicalRisk: "medium",
    replaceability: "easy",
    backupProvider: "google-ads",
    metadata: { category: "advertising" },
  },
];

export class CostIntelligenceRegistry {
  listCatalog(): CostCatalogEntry[] {
    return [...GLOBAL_COST_CATALOG];
  }

  list(workspaceId?: string): DependencyCostRecord[] {
    const db = getDatabase();
    const rows = workspaceId
      ? (db
          .prepare(
            `SELECT * FROM cost_dependencies WHERE workspace_id = @workspaceId OR workspace_id IS NULL`,
          )
          .all({ workspaceId }) as Array<Record<string, unknown>>)
      : (db.prepare(`SELECT * FROM cost_dependencies`).all() as Array<Record<string, unknown>>);

    if (rows.length === 0) {
      return GLOBAL_COST_CATALOG.map((entry) => ({
        id: entry.dependencyId,
        workspaceId: null,
        ...entry,
        updatedAt: new Date().toISOString(),
      }));
    }

    return rows.map(mapRow);
  }

  upsert(entry: CostCatalogEntry & { workspaceId?: string }): DependencyCostRecord {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO cost_dependencies
        (id, dependency_id, workspace_id, purpose, one_time_cost_cents, monthly_cost_cents,
         usage_based, business_risk, technical_risk, replaceability, backup_provider, metadata, updated_at)
       VALUES (@id, @dependencyId, @workspaceId, @purpose, @oneTime, @monthly, @usage, @businessRisk,
         @technicalRisk, @replaceability, @backup, @metadata, @updatedAt)`,
    ).run({
      id,
      dependencyId: entry.dependencyId,
      workspaceId: entry.workspaceId ?? null,
      purpose: entry.purpose,
      oneTime: entry.oneTimeCostCents,
      monthly: entry.monthlyCostCents,
      usageBased: JSON.stringify(entry.usageBased),
      businessRisk: entry.businessRisk,
      technicalRisk: entry.technicalRisk,
      replaceability: entry.replaceability,
      backup: entry.backupProvider,
      metadata: JSON.stringify(entry.metadata),
      updatedAt: now,
    });
    return mapRow(
      db.prepare(`SELECT * FROM cost_dependencies WHERE id = @id`).get({ id }) as Record<
        string,
        unknown
      >,
    );
  }
}

function mapRow(row: Record<string, unknown>): DependencyCostRecord {
  return {
    id: String(row.id),
    dependencyId: String(row.dependency_id),
    workspaceId: row.workspace_id ? String(row.workspace_id) : null,
    purpose: String(row.purpose),
    oneTimeCostCents: Number(row.one_time_cost_cents),
    monthlyCostCents: Number(row.monthly_cost_cents),
    usageBased: JSON.parse(String(row.usage_based)) as Record<string, unknown>,
    businessRisk: row.business_risk as CostRiskLevel,
    technicalRisk: row.technical_risk as CostRiskLevel,
    replaceability: row.replaceability as DependencyCostRecord["replaceability"],
    backupProvider: row.backup_provider ? String(row.backup_provider) : null,
    metadata: JSON.parse(String(row.metadata)) as Record<string, unknown>,
    updatedAt: String(row.updated_at),
  };
}

export const costIntelligenceRegistry = new CostIntelligenceRegistry();
