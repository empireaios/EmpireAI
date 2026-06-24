import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { EmpireDatabase } from "./sqlite-database.js";

let dbInstance: EmpireDatabase | null = null;
let activeDbPath: string | null = null;

function resolveDatabasePath(): string {
  return path.resolve(process.env.DATABASE_PATH ?? env.DATABASE_PATH);
}

export function getDatabase(): EmpireDatabase {
  const dbPath = resolveDatabasePath();
  if (dbInstance && activeDbPath !== dbPath) {
    closeDatabase();
  }
  if (dbInstance) return dbInstance;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  dbInstance = new EmpireDatabase(dbPath);
  activeDbPath = dbPath;
  dbInstance.pragma("foreign_keys = ON");
  migrate(dbInstance);
  logger.info({ dbPath, driver: "sql.js" }, "Brain database initialized");

  return dbInstance;
}

function migrate(db: EmpireDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT,
      agent_id TEXT,
      correlation_id TEXT NOT NULL,
      metadata TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_workspace ON audit_logs(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_audit_correlation ON audit_logs(correlation_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

    CREATE TABLE IF NOT EXISTS memory_records (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT,
      agent_id TEXT,
      memory_key TEXT NOT NULL,
      value TEXT NOT NULL,
      embedding TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_memory_unique
      ON memory_records(scope, workspace_id, company_id, agent_id, memory_key);

    CREATE INDEX IF NOT EXISTS idx_memory_workspace ON memory_records(workspace_id);

    CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT,
      status TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      input TEXT NOT NULL,
      output TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_workflow_runs_workspace ON workflow_runs(workspace_id);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS guardian_risks (
      id TEXT PRIMARY KEY,
      severity TEXT NOT NULL,
      subsystem TEXT NOT NULL,
      code TEXT NOT NULL,
      message TEXT NOT NULL,
      correlation_id TEXT,
      metadata TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_guardian_risks_open ON guardian_risks(resolved_at);

    CREATE TABLE IF NOT EXISTS guardian_health_snapshots (
      id TEXT PRIMARY KEY,
      overall_status TEXT NOT NULL,
      report TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS guardian_recovery_plans (
      id TEXT PRIMARY KEY,
      risk_id TEXT NOT NULL,
      title TEXT NOT NULL,
      steps TEXT NOT NULL,
      rollback_steps TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_guardian_recovery_risk ON guardian_recovery_plans(risk_id);

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'Sovereign',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      revenue_cents INTEGER NOT NULL DEFAULT 0,
      margin_pct REAL,
      agent_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_companies_workspace ON companies(workspace_id);

    CREATE TABLE IF NOT EXISTS company_build_stages (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      outcome TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activity_workspace ON activity_events(workspace_id);

    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      module TEXT NOT NULL DEFAULT 'ai-ceo',
      title TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'denied')),
      agent_id TEXT NOT NULL,
      authority_level TEXT NOT NULL DEFAULT 'L3',
      rationale TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_decisions_workspace ON decisions(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_decisions_pending ON decisions(workspace_id, status);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      total_cents INTEGER NOT NULL,
      profit_cents INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_workspace ON orders(workspace_id);

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      product_count INTEGER NOT NULL,
      reliability REAL NOT NULL,
      avg_ship_days REAL NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      demand TEXT NOT NULL,
      margin_cents INTEGER NOT NULL,
      trend TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS marketing_campaigns (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT,
      name TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      reach TEXT NOT NULL,
      conversion TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ad_channels (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      spend_cents INTEGER NOT NULL,
      roas REAL NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      status TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      resolution_seconds INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_integrations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS financial_ledger_events (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT,
      event_type TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      direction TEXT NOT NULL CHECK(direction IN ('credit', 'debit')),
      correlation_id TEXT NOT NULL,
      source TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ledger_workspace ON financial_ledger_events(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_correlation ON financial_ledger_events(correlation_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_type ON financial_ledger_events(event_type);

    CREATE TABLE IF NOT EXISTS treasury_snapshots (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_treasury_workspace ON treasury_snapshots(workspace_id);

    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('primary', 'backup')),
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      last_four TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_wallets (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      wallet_type TEXT NOT NULL CHECK(wallet_type IN ('empireai', 'advertising')),
      balance_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      low_balance_threshold_cents INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS connector_connections (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      connector_id TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      credentials_ref TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      connected_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_connector_workspace ON connector_connections(workspace_id);

    CREATE TABLE IF NOT EXISTS pie_product_scores (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      scores TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      rationale TEXT NOT NULL,
      confidence REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pie_workspace ON pie_product_scores(workspace_id);

    CREATE TABLE IF NOT EXISTS retention_states (
      workspace_id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'cancelled', 'preserved')),
      paused_at TEXT,
      cancelled_at TEXT,
      preserved_at TEXT,
      exit_survey TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cost_dependencies (
      id TEXT PRIMARY KEY,
      dependency_id TEXT NOT NULL,
      workspace_id TEXT,
      purpose TEXT NOT NULL,
      one_time_cost_cents INTEGER NOT NULL DEFAULT 0,
      monthly_cost_cents INTEGER NOT NULL DEFAULT 0,
      usage_based TEXT NOT NULL DEFAULT '{}',
      business_risk TEXT NOT NULL,
      technical_risk TEXT NOT NULL,
      replaceability TEXT NOT NULL,
      backup_provider TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS guardian_architecture_checks (
      id TEXT PRIMARY KEY,
      overall TEXT NOT NULL,
      report TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS supplier_intelligence_scores (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      supplier_name TEXT NOT NULL,
      scores TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      rationale TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_supplier_intel_workspace ON supplier_intelligence_scores(workspace_id);

    CREATE TABLE IF NOT EXISTS supplier_intelligence_evaluations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      supplier_name TEXT NOT NULL,
      scores TEXT NOT NULL,
      trust_score REAL NOT NULL,
      overall_recommendation TEXT NOT NULL,
      explanation TEXT NOT NULL,
      confidence REAL NOT NULL,
      fake_supplier_risk REAL NOT NULL,
      guardian_verdict TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_workspace ON supplier_intelligence_evaluations(workspace_id);

    CREATE TABLE IF NOT EXISTS product_scout_evaluations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      scores TEXT NOT NULL,
      final_empire_score REAL NOT NULL,
      recommendation TEXT NOT NULL,
      explanation TEXT NOT NULL,
      guardian_verdict TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_product_scout_workspace ON product_scout_evaluations(workspace_id);

    CREATE TABLE IF NOT EXISTS product_intelligence_evaluations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      product_id TEXT,
      product_title TEXT NOT NULL,
      category TEXT NOT NULL,
      scores TEXT NOT NULL,
      overall_score REAL NOT NULL,
      recommendation TEXT NOT NULL,
      explanation TEXT NOT NULL,
      confidence REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pie_evaluations_workspace ON product_intelligence_evaluations(workspace_id);

    CREATE TABLE IF NOT EXISTS product_intelligence_catalog (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      demand_score REAL NOT NULL,
      competition_score REAL NOT NULL,
      margin_score REAL NOT NULL,
      supplier_availability TEXT NOT NULL,
      trend_direction TEXT NOT NULL,
      confidence REAL NOT NULL,
      recommendation TEXT NOT NULL,
      overall_score REAL NOT NULL,
      explanation TEXT NOT NULL,
      provider_count INTEGER NOT NULL DEFAULT 0,
      evaluated_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pie_catalog_workspace ON product_intelligence_catalog(workspace_id);

    CREATE TABLE IF NOT EXISTS product_intelligence_signals (
      id TEXT PRIMARY KEY,
      catalog_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      signal_data TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pie_signals_catalog ON product_intelligence_signals(catalog_id);
    CREATE INDEX IF NOT EXISTS idx_pie_signals_workspace ON product_intelligence_signals(workspace_id);
  `);
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    activeDbPath = null;
  }
}

export function resetDatabaseInstance(): void {
  const dbPath = resolveDatabasePath();
  closeDatabase();

  if (dbPath) {
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    } catch {
      // Best-effort cleanup for validation/test isolation.
    }
  }
}

export type { EmpireDatabase };
