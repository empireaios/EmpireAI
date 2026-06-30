import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { EmpireDatabase, isInMemoryDatabasePath } from "./sqlite-database.js";

let dbInstance: EmpireDatabase | null = null;
let activeDbPath: string | null = null;

function resolveDatabasePath(): string {
  const raw = process.env.DATABASE_PATH ?? env.DATABASE_PATH;
  if (isInMemoryDatabasePath(raw)) {
    return raw;
  }
  return path.resolve(raw);
}

export function getDatabase(): EmpireDatabase {
  const dbPath = resolveDatabasePath();
  if (dbInstance && activeDbPath !== dbPath) {
    closeDatabase();
  }
  if (dbInstance) return dbInstance;
  if (!isInMemoryDatabasePath(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

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

    CREATE TABLE IF NOT EXISTS revenue_loop_stores (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL UNIQUE,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      brand_id TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      product_name TEXT NOT NULL,
      product_description TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      cj_supplier_sku TEXT NOT NULL,
      cj_supplier_product_id TEXT NOT NULL,
      unit_cost_cents INTEGER NOT NULL,
      domain TEXT,
      deploy_path TEXT NOT NULL,
      status TEXT NOT NULL,
      analytics_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_revenue_loop_stores_workspace ON revenue_loop_stores(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_revenue_loop_stores_slug ON revenue_loop_stores(slug);

    CREATE TABLE IF NOT EXISTS revenue_loop_orders (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      stripe_session_id TEXT UNIQUE,
      stripe_payment_intent_id TEXT,
      customer_email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      revenue_cents INTEGER NOT NULL,
      cost_cents INTEGER NOT NULL,
      profit_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL,
      fulfillment_order_json TEXT,
      approval_token TEXT,
      approved_by TEXT,
      approved_at TEXT,
      supplier_order_id TEXT,
      tracking_number TEXT,
      profitable INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_revenue_loop_orders_workspace ON revenue_loop_orders(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_revenue_loop_orders_store ON revenue_loop_orders(store_id);

    CREATE TABLE IF NOT EXISTS production_deployments (
      deployment_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      brand_id TEXT NOT NULL,
      project_name TEXT NOT NULL,
      source_path TEXT NOT NULL,
      status TEXT NOT NULL,
      execution_mode TEXT NOT NULL,
      approval_json TEXT,
      environment_variables_json TEXT NOT NULL DEFAULT '{}',
      custom_domain TEXT,
      ssl_enabled INTEGER NOT NULL DEFAULT 0,
      vercel_project_id TEXT,
      vercel_deployment_id TEXT,
      previous_deployment_id TEXT,
      vercel_deployment_url TEXT,
      production_url TEXT,
      build_command TEXT NOT NULL,
      output_directory TEXT NOT NULL,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_production_deployments_workspace ON production_deployments(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_production_deployments_project ON production_deployments(project_name);

    CREATE TABLE IF NOT EXISTS production_deployment_logs (
      id TEXT PRIMARY KEY,
      deployment_id TEXT NOT NULL,
      level TEXT NOT NULL,
      phase TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_production_deployment_logs_deployment ON production_deployment_logs(deployment_id);

    CREATE TABLE IF NOT EXISTS live_payments (
      payment_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      store_id TEXT,
      provider TEXT NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      stripe_session_id TEXT,
      stripe_payment_intent_id TEXT,
      stripe_charge_id TEXT,
      customer_email TEXT,
      customer_name TEXT,
      ledger_sale_event_id TEXT,
      ledger_fee_event_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      mock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_live_payments_workspace ON live_payments(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_live_payments_stripe_session ON live_payments(stripe_session_id);
    CREATE INDEX IF NOT EXISTS idx_live_payments_stripe_intent ON live_payments(stripe_payment_intent_id);

    CREATE TABLE IF NOT EXISTS live_payment_stripe_events (
      event_id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL,
      processed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_live_payment_stripe_events_payment ON live_payment_stripe_events(payment_id);

    CREATE TABLE IF NOT EXISTS customer_order_pipelines (
      pipeline_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      store_id TEXT,
      brand_id TEXT,
      payment_id TEXT,
      revenue_order_id TEXT,
      correlation_id TEXT NOT NULL,
      status TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      revenue_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      fulfillment_order_json TEXT,
      inventory_reservation_id TEXT,
      supplier_order_id TEXT,
      tracking_number TEXT,
      carrier TEXT,
      approval_token TEXT,
      approved_by TEXT,
      approved_at TEXT,
      ledger_delivery_event_id TEXT,
      mock INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_customer_order_pipelines_workspace ON customer_order_pipelines(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_customer_order_pipelines_payment ON customer_order_pipelines(payment_id);
    CREATE INDEX IF NOT EXISTS idx_customer_order_pipelines_correlation ON customer_order_pipelines(correlation_id);

    CREATE TABLE IF NOT EXISTS customer_order_inventory_reservations (
      reservation_id TEXT PRIMARY KEY,
      pipeline_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      supplier_sku TEXT NOT NULL,
      supplier_product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_customer_order_reservations_pipeline ON customer_order_inventory_reservations(pipeline_id);

    CREATE TABLE IF NOT EXISTS live_cj_fulfillments (
      fulfillment_id TEXT PRIMARY KEY,
      pipeline_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      status TEXT NOT NULL,
      integration_mode TEXT NOT NULL,
      fulfillment_order_json TEXT NOT NULL,
      supplier_order_id TEXT,
      tracking_number TEXT,
      carrier TEXT,
      founder_approval_token TEXT,
      approved_by TEXT,
      approved_at TEXT,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_error_message TEXT,
      last_tracking_sync_at TEXT,
      mock INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_live_cj_fulfillments_workspace ON live_cj_fulfillments(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_live_cj_fulfillments_pipeline ON live_cj_fulfillments(pipeline_id);

    CREATE TABLE IF NOT EXISTS live_cj_fulfillment_attempts (
      attempt_id TEXT PRIMARY KEY,
      fulfillment_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      phase TEXT NOT NULL,
      outcome TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_live_cj_fulfillment_attempts_job ON live_cj_fulfillment_attempts(fulfillment_id);

    CREATE TABLE IF NOT EXISTS analytics_pixel_configs (
      config_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      store_id TEXT,
      ga4_measurement_id TEXT,
      ga4_api_secret TEXT,
      meta_pixel_id TEXT,
      meta_access_token TEXT,
      tiktok_pixel_id TEXT,
      tiktok_access_token TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_pixel_configs_workspace ON analytics_pixel_configs(workspace_id);

    CREATE TABLE IF NOT EXISTS analytics_server_events (
      event_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      event_name TEXT NOT NULL,
      platforms_json TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      value_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      customer_email TEXT,
      payload_json TEXT NOT NULL DEFAULT '{}',
      dispatch_results_json TEXT NOT NULL DEFAULT '{}',
      mock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_server_events_workspace ON analytics_server_events(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_server_events_correlation ON analytics_server_events(correlation_id);

    CREATE TABLE IF NOT EXISTS analytics_conversions (
      conversion_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      store_id TEXT,
      payment_id TEXT,
      pipeline_id TEXT,
      event_name TEXT NOT NULL,
      value_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      correlation_id TEXT NOT NULL UNIQUE,
      platforms_json TEXT NOT NULL,
      server_event_id TEXT NOT NULL,
      attributed INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_conversions_workspace ON analytics_conversions(workspace_id);

    CREATE TABLE IF NOT EXISTS analytics_roas_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      period TEXT NOT NULL,
      revenue_cents INTEGER NOT NULL,
      ad_spend_cents INTEGER NOT NULL,
      roas REAL NOT NULL,
      conversion_count INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      computed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_roas_workspace ON analytics_roas_snapshots(workspace_id);

    CREATE TABLE IF NOT EXISTS analytics_ad_spend (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      channel TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_ad_spend_workspace ON analytics_ad_spend(workspace_id);

    CREATE TABLE IF NOT EXISTS meta_ads_oauth (
      oauth_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      token_type TEXT NOT NULL DEFAULT 'bearer',
      expires_at TEXT,
      ad_account_id TEXT,
      scopes_json TEXT NOT NULL DEFAULT '[]',
      mock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_meta_ads_oauth_workspace ON meta_ads_oauth(workspace_id);

    CREATE TABLE IF NOT EXISTS meta_ads_campaigns (
      campaign_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      objective TEXT NOT NULL,
      status TEXT NOT NULL,
      budget_cents INTEGER NOT NULL,
      budget_type TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      audience_json TEXT NOT NULL,
      creative_json TEXT,
      meta_campaign_id TEXT,
      meta_ad_set_id TEXT,
      meta_ad_id TEXT,
      meta_creative_id TEXT,
      founder_approval_token TEXT,
      approved_by TEXT,
      approved_at TEXT,
      report_json TEXT,
      last_error_message TEXT,
      mock INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_meta_ads_campaigns_workspace ON meta_ads_campaigns(workspace_id);

    CREATE TABLE IF NOT EXISTS product_catalog_publishes (
      publish_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      store_slug TEXT NOT NULL,
      deploy_path TEXT NOT NULL,
      status TEXT NOT NULL,
      product_count INTEGER NOT NULL DEFAULT 0,
      published_product_count INTEGER NOT NULL DEFAULT 0,
      last_error_message TEXT,
      last_published_at TEXT,
      last_synced_at TEXT,
      mock INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_product_catalog_publishes_workspace ON product_catalog_publishes(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_product_catalog_publishes_store ON product_catalog_publishes(store_id);

    CREATE TABLE IF NOT EXISTS published_store_products (
      published_product_id TEXT PRIMARY KEY,
      publish_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      import_id TEXT NOT NULL,
      supplier_sku TEXT NOT NULL,
      store_product_handle TEXT NOT NULL,
      page_route TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      compare_at_price_cents INTEGER,
      currency TEXT NOT NULL DEFAULT 'USD',
      inventory_quantity INTEGER NOT NULL DEFAULT 0,
      availability TEXT NOT NULL,
      status TEXT NOT NULL,
      last_synced_at TEXT,
      mock INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_published_store_products_publish ON published_store_products(publish_id);
    CREATE INDEX IF NOT EXISTS idx_published_store_products_store ON published_store_products(store_id);

    CREATE TABLE IF NOT EXISTS grand_kings_revenue_cycles (
      cycle_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      revenue_json TEXT NOT NULL,
      advertising_json TEXT NOT NULL,
      order_json TEXT NOT NULL,
      capital_json TEXT NOT NULL,
      kpi_json TEXT NOT NULL,
      overall_health_score REAL NOT NULL,
      mock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_grand_kings_revenue_cycles_workspace ON grand_kings_revenue_cycles(workspace_id);

    CREATE TABLE IF NOT EXISTS first_revenue_validations (
      validation_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      stages_json TEXT NOT NULL,
      all_stages_passed INTEGER NOT NULL DEFAULT 0,
      production_ready INTEGER NOT NULL DEFAULT 0,
      production_blockers_json TEXT NOT NULL DEFAULT '[]',
      revenue_cents INTEGER NOT NULL DEFAULT 0,
      profit_cents INTEGER NOT NULL DEFAULT 0,
      ledger_verified INTEGER NOT NULL DEFAULT 0,
      store_id TEXT,
      pipeline_id TEXT,
      payment_id TEXT,
      campaign_id TEXT,
      mock INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_first_revenue_validations_workspace ON first_revenue_validations(workspace_id);

    CREATE TABLE IF NOT EXISTS soul_file_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      version_label TEXT NOT NULL,
      checksum TEXT NOT NULL,
      document_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(workspace_id, version)
    );

    CREATE INDEX IF NOT EXISTS idx_soul_file_snapshots_workspace ON soul_file_snapshots(workspace_id);

    CREATE TABLE IF NOT EXISTS soul_file_change_history (
      change_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      from_version INTEGER,
      to_version INTEGER NOT NULL,
      change_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      actor TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_soul_file_change_history_workspace ON soul_file_change_history(workspace_id);

    CREATE TABLE IF NOT EXISTS soul_runtime_events (
      event_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      memory_key TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      source TEXT NOT NULL,
      correlation_id TEXT,
      audit_action TEXT,
      payload_json TEXT NOT NULL DEFAULT '{}',
      soul_file_version INTEGER,
      recorded_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_soul_runtime_events_workspace ON soul_runtime_events(workspace_id);

    CREATE TABLE IF NOT EXISTS governance_policies (
      policy_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      policy_json TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      priority INTEGER NOT NULL DEFAULT 100,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_governance_policies_workspace ON governance_policies(workspace_id);

    CREATE TABLE IF NOT EXISTS governance_decisions (
      decision_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      verdict_json TEXT NOT NULL,
      actor TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_governance_decisions_workspace ON governance_decisions(workspace_id);

    CREATE TABLE IF NOT EXISTS identity_entities (
      canonical_id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      display_name TEXT NOT NULL,
      aliases_json TEXT NOT NULL DEFAULT '[]',
      workspace_id TEXT,
      entity_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_identity_entities_workspace ON identity_entities(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_identity_entities_display_name ON identity_entities(display_name);

    CREATE TABLE IF NOT EXISTS identity_history (
      history_id TEXT PRIMARY KEY,
      canonical_id TEXT NOT NULL,
      change_type TEXT NOT NULL,
      previous_value TEXT,
      new_value TEXT,
      summary TEXT NOT NULL,
      actor TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_identity_history_canonical ON identity_history(canonical_id);

    CREATE TABLE IF NOT EXISTS empire_doctrines (
      doctrine_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      status TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      doctrine_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_empire_doctrines_workspace ON empire_doctrines(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_empire_doctrines_status ON empire_doctrines(status);

    CREATE TABLE IF NOT EXISTS doctrine_lifecycle (
      lifecycle_id TEXT PRIMARY KEY,
      doctrine_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      event TEXT NOT NULL,
      summary TEXT NOT NULL,
      actor TEXT NOT NULL,
      correlation_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_doctrine_lifecycle_doctrine ON doctrine_lifecycle(doctrine_id);
    CREATE INDEX IF NOT EXISTS idx_doctrine_lifecycle_workspace ON doctrine_lifecycle(workspace_id);

    CREATE TABLE IF NOT EXISTS business_policies (
      policy_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      policy_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_business_policies_workspace ON business_policies(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_business_policies_category ON business_policies(category);
    CREATE INDEX IF NOT EXISTS idx_business_policies_status ON business_policies(status);

    CREATE TABLE IF NOT EXISTS policy_lifecycle (
      lifecycle_id TEXT PRIMARY KEY,
      policy_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      event TEXT NOT NULL,
      summary TEXT NOT NULL,
      actor TEXT NOT NULL,
      correlation_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_policy_lifecycle_policy ON policy_lifecycle(policy_id);
    CREATE INDEX IF NOT EXISTS idx_policy_lifecycle_workspace ON policy_lifecycle(workspace_id);

    CREATE TABLE IF NOT EXISTS king_promises (
      promise_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      status TEXT NOT NULL,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      promise_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_king_promises_workspace ON king_promises(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_king_promises_status ON king_promises(status);

    CREATE TABLE IF NOT EXISTS promise_lifecycle (
      lifecycle_id TEXT PRIMARY KEY,
      promise_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      event TEXT NOT NULL,
      summary TEXT NOT NULL,
      actor TEXT NOT NULL,
      correlation_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_promise_lifecycle_promise ON promise_lifecycle(promise_id);
    CREATE INDEX IF NOT EXISTS idx_promise_lifecycle_workspace ON promise_lifecycle(workspace_id);

    CREATE TABLE IF NOT EXISTS empire_kpi_metrics (
      kpi_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      metric_key TEXT NOT NULL,
      metric_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_empire_kpi_metrics_workspace ON empire_kpi_metrics(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_empire_kpi_metrics_key ON empire_kpi_metrics(metric_key);

    CREATE TABLE IF NOT EXISTS empire_kpi_observations (
      observation_id TEXT PRIMARY KEY,
      kpi_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      value REAL NOT NULL,
      source TEXT NOT NULL,
      actor TEXT NOT NULL,
      correlation_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      recorded_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_empire_kpi_observations_kpi ON empire_kpi_observations(kpi_id);
    CREATE INDEX IF NOT EXISTS idx_empire_kpi_observations_workspace ON empire_kpi_observations(workspace_id);

    CREATE TABLE IF NOT EXISTS kpi_lifecycle (
      lifecycle_id TEXT PRIMARY KEY,
      kpi_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      event TEXT NOT NULL,
      summary TEXT NOT NULL,
      actor TEXT NOT NULL,
      correlation_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_kpi_lifecycle_kpi ON kpi_lifecycle(kpi_id);
    CREATE INDEX IF NOT EXISTS idx_kpi_lifecycle_workspace ON kpi_lifecycle(workspace_id);

    CREATE TABLE IF NOT EXISTS empire_decisions (
      decision_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      decision_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_empire_decisions_workspace ON empire_decisions(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_empire_decisions_category ON empire_decisions(category);
    CREATE INDEX IF NOT EXISTS idx_empire_decisions_status ON empire_decisions(status);

    CREATE TABLE IF NOT EXISTS decision_lifecycle (
      lifecycle_id TEXT PRIMARY KEY,
      decision_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      event TEXT NOT NULL,
      summary TEXT NOT NULL,
      actor TEXT NOT NULL,
      correlation_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_decision_lifecycle_decision ON decision_lifecycle(decision_id);
    CREATE INDEX IF NOT EXISTS idx_decision_lifecycle_workspace ON decision_lifecycle(workspace_id);

    CREATE TABLE IF NOT EXISTS strategic_memories (
      memory_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      memory_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_strategic_memories_workspace ON strategic_memories(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_strategic_memories_category ON strategic_memories(category);
    CREATE INDEX IF NOT EXISTS idx_strategic_memories_status ON strategic_memories(status);

    CREATE TABLE IF NOT EXISTS strategic_memory_lifecycle (
      lifecycle_id TEXT PRIMARY KEY,
      memory_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      event TEXT NOT NULL,
      summary TEXT NOT NULL,
      actor TEXT NOT NULL,
      correlation_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_strategic_memory_lifecycle_memory ON strategic_memory_lifecycle(memory_id);
    CREATE INDEX IF NOT EXISTS idx_strategic_memory_lifecycle_workspace ON strategic_memory_lifecycle(workspace_id);

    CREATE TABLE IF NOT EXISTS ecommerce_os_workflows (
      workflow_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      workflow_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ecommerce_os_workflows_workspace ON ecommerce_os_workflows(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_ecommerce_os_workflows_company ON ecommerce_os_workflows(company_id);

    CREATE TABLE IF NOT EXISTS marketplace_connections (
      marketplace_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      status TEXT NOT NULL,
      connection_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (marketplace_id, workspace_id)
    );

    CREATE INDEX IF NOT EXISTS idx_marketplace_connections_workspace ON marketplace_connections(workspace_id);

    CREATE TABLE IF NOT EXISTS external_account_registry (
      provider_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      account_type TEXT NOT NULL DEFAULT 'grand_king',
      status TEXT NOT NULL,
      account_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (provider_id, workspace_id, account_type)
    );

    CREATE INDEX IF NOT EXISTS idx_external_account_registry_workspace ON external_account_registry(workspace_id);

    CREATE TABLE IF NOT EXISTS external_account_health (
      provider_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      health_json TEXT NOT NULL,
      computed_at TEXT NOT NULL,
      PRIMARY KEY (provider_id, workspace_id)
    );

    CREATE INDEX IF NOT EXISTS idx_external_account_health_workspace ON external_account_health(workspace_id);

    CREATE TABLE IF NOT EXISTS human_action_queue (
      action_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      status TEXT NOT NULL,
      action_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_human_action_queue_workspace ON human_action_queue(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_human_action_queue_provider ON human_action_queue(provider_id);

    CREATE TABLE IF NOT EXISTS marketplace_connection_registry (
      marketplace_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      account_type TEXT NOT NULL DEFAULT 'GRAND_KING',
      status TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (marketplace_id, workspace_id, account_type)
    );

    CREATE INDEX IF NOT EXISTS idx_marketplace_connection_registry_workspace ON marketplace_connection_registry(workspace_id);

    CREATE TABLE IF NOT EXISTS product_discovery_sessions (
      session_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      session_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_product_discovery_sessions_workspace ON product_discovery_sessions(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_product_discovery_sessions_company ON product_discovery_sessions(company_id);

    CREATE TABLE IF NOT EXISTS business_opportunity_workspace (
      business_opportunity_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      status TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_business_opportunity_workspace_workspace ON business_opportunity_workspace(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_business_opportunity_workspace_company ON business_opportunity_workspace(company_id);
    CREATE INDEX IF NOT EXISTS idx_business_opportunity_workspace_status ON business_opportunity_workspace(status);

    CREATE TABLE IF NOT EXISTS business_opportunity_history (
      history_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      business_opportunity_id TEXT NOT NULL,
      history_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_business_opportunity_history_workspace ON business_opportunity_history(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_business_opportunity_history_opportunity ON business_opportunity_history(business_opportunity_id);

    CREATE TABLE IF NOT EXISTS business_preview_studio (
      preview_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      business_opportunity_id TEXT NOT NULL,
      status TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_business_preview_studio_workspace ON business_preview_studio(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_business_preview_studio_company ON business_preview_studio(company_id);
    CREATE INDEX IF NOT EXISTS idx_business_preview_studio_opportunity ON business_preview_studio(business_opportunity_id);

    CREATE TABLE IF NOT EXISTS market_domination_strategies (
      strategy_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      business_opportunity_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_market_domination_strategies_workspace ON market_domination_strategies(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_market_domination_strategies_company ON market_domination_strategies(company_id);
    CREATE INDEX IF NOT EXISTS idx_market_domination_strategies_opportunity ON market_domination_strategies(business_opportunity_id);

    CREATE TABLE IF NOT EXISTS business_build_packages (
      build_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      business_opportunity_id TEXT NOT NULL,
      status TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_business_build_packages_workspace ON business_build_packages(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_business_build_packages_company ON business_build_packages(company_id);
    CREATE INDEX IF NOT EXISTS idx_business_build_packages_opportunity ON business_build_packages(business_opportunity_id);

    CREATE TABLE IF NOT EXISTS business_simulations (
      simulation_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      build_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      simulated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_business_simulations_workspace ON business_simulations(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_business_simulations_company ON business_simulations(company_id);
    CREATE INDEX IF NOT EXISTS idx_business_simulations_build ON business_simulations(build_id);

    CREATE TABLE IF NOT EXISTS execution_layer_packages (
      package_id TEXT PRIMARY KEY,
      package_type TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      build_id TEXT,
      business_opportunity_id TEXT,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_execution_layer_workspace ON execution_layer_packages(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_execution_layer_company ON execution_layer_packages(company_id);
    CREATE INDEX IF NOT EXISTS idx_execution_layer_build ON execution_layer_packages(build_id);
    CREATE INDEX IF NOT EXISTS idx_execution_layer_type ON execution_layer_packages(package_type);
    CREATE INDEX IF NOT EXISTS idx_execution_layer_opportunity ON execution_layer_packages(business_opportunity_id);

    CREATE TABLE IF NOT EXISTS credential_vault (
      credentials_ref TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      credential_type TEXT NOT NULL,
      encrypted_payload TEXT NOT NULL,
      scopes_json TEXT NOT NULL DEFAULT '[]',
      expires_at TEXT,
      rotated_at TEXT NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_credential_vault_workspace ON credential_vault(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_credential_vault_provider ON credential_vault(provider_id);

    CREATE TABLE IF NOT EXISTS credential_vault_audit (
      event_id TEXT PRIMARY KEY,
      credentials_ref TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      event TEXT NOT NULL,
      actor TEXT NOT NULL,
      scopes_json TEXT NOT NULL DEFAULT '[]',
      expires_at TEXT,
      verified INTEGER NOT NULL DEFAULT 0,
      recorded_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_credential_vault_audit_workspace ON credential_vault_audit(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_credential_vault_audit_ref ON credential_vault_audit(credentials_ref);

    CREATE TABLE IF NOT EXISTS connector_monitoring_events (
      event_id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      recorded_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_connector_monitoring_workspace ON connector_monitoring_events(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_connector_monitoring_provider ON connector_monitoring_events(provider_id);

    CREATE TABLE IF NOT EXISTS operational_access_registry (
      record_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_operational_access_workspace ON operational_access_registry(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_operational_access_provider ON operational_access_registry(provider_id);

    CREATE TABLE IF NOT EXISTS live_commerce_oauth_states (
      state_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_live_commerce_oauth_workspace ON live_commerce_oauth_states(workspace_id);

    CREATE TABLE IF NOT EXISTS live_commerce_sync_jobs (
      job_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      sync_type TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_live_commerce_sync_workspace ON live_commerce_sync_jobs(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_live_commerce_sync_provider ON live_commerce_sync_jobs(provider_id);

    CREATE TABLE IF NOT EXISTS live_commerce_webhook_events (
      event_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      received_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_live_commerce_webhook_workspace ON live_commerce_webhook_events(workspace_id);

    CREATE TABLE IF NOT EXISTS live_commerce_audit_log (
      audit_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      action TEXT NOT NULL,
      record_json TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_live_commerce_audit_workspace ON live_commerce_audit_log(workspace_id);

    CREATE TABLE IF NOT EXISTS live_commerce_recovery_queue (
      recovery_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      error_message TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      recovered_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_live_commerce_recovery_workspace ON live_commerce_recovery_queue(workspace_id);

    CREATE TABLE IF NOT EXISTS global_notifications (
      notification_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      deep_link TEXT NOT NULL,
      priority INTEGER NOT NULL,
      source_ref TEXT NOT NULL,
      read_at TEXT,
      acknowledged_at TEXT,
      created_at TEXT NOT NULL,
      record_json TEXT NOT NULL,
      UNIQUE(workspace_id, company_id, source_ref)
    );

    CREATE INDEX IF NOT EXISTS idx_global_notifications_workspace ON global_notifications(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_global_notifications_company ON global_notifications(company_id);
    CREATE INDEX IF NOT EXISTS idx_global_notifications_unread ON global_notifications(workspace_id, company_id, read_at);
    CREATE INDEX IF NOT EXISTS idx_global_notifications_priority ON global_notifications(priority DESC, created_at DESC);

    CREATE TABLE IF NOT EXISTS global_assistant_sessions (
      session_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_global_assistant_sessions_workspace ON global_assistant_sessions(workspace_id);

    CREATE TABLE IF NOT EXISTS global_assistant_messages (
      message_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_global_assistant_messages_session ON global_assistant_messages(session_id, created_at);

    CREATE TABLE IF NOT EXISTS global_assistant_commands (
      command_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      status TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_global_assistant_commands_workspace ON global_assistant_commands(workspace_id);

    CREATE TABLE IF NOT EXISTS global_assistant_audit_artifacts (
      artifact_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      mission_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_global_assistant_audit_workspace ON global_assistant_audit_artifacts(workspace_id);

    CREATE TABLE IF NOT EXISTS empire_access_registry (
      record_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      platform_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_empire_access_workspace ON empire_access_registry(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_empire_access_platform ON empire_access_registry(platform_id);

    CREATE TABLE IF NOT EXISTS supplier_intelligence_products (
      record_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_supplier_intel_workspace ON supplier_intelligence_products(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_supplier_intel_provider ON supplier_intelligence_products(provider_id);

    CREATE TABLE IF NOT EXISTS marketplace_publish_packages (
      package_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      marketplace_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_marketplace_publish_workspace ON marketplace_publish_packages(workspace_id);

    CREATE TABLE IF NOT EXISTS marketplace_publish_queue (
      queue_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      queued_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_marketplace_publish_queue_workspace ON marketplace_publish_queue(workspace_id);

    CREATE TABLE IF NOT EXISTS listing_intelligence_records (
      record_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      supplier_product_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_listing_intel_workspace ON listing_intelligence_records(workspace_id);

    CREATE TABLE IF NOT EXISTS commerce_execution_pipelines (
      pipeline_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_commerce_exec_pipeline_workspace ON commerce_execution_pipelines(workspace_id);

    CREATE TABLE IF NOT EXISTS global_distribution_plans (
      plan_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_global_distribution_plans_workspace ON global_distribution_plans(workspace_id);

    CREATE TABLE IF NOT EXISTS empire_knowledge_graph (
      observation_id TEXT PRIMARY KEY,
      eye_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT,
      record_json TEXT NOT NULL,
      dedup_hash TEXT NOT NULL UNIQUE,
      observed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_empire_kg_workspace ON empire_knowledge_graph(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_empire_kg_eye ON empire_knowledge_graph(eye_id);
    CREATE INDEX IF NOT EXISTS idx_empire_kg_dedup ON empire_knowledge_graph(dedup_hash);

    CREATE TABLE IF NOT EXISTS eye_series_reports (
      report_id TEXT PRIMARY KEY,
      eye_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_eye_series_reports_workspace ON eye_series_reports(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_eye_series_reports_eye ON eye_series_reports(eye_id);

    CREATE TABLE IF NOT EXISTS eye_series_investigations (
      investigation_id TEXT PRIMARY KEY,
      eye_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_eye_series_investigations_workspace ON eye_series_investigations(workspace_id);

    CREATE TABLE IF NOT EXISTS ofd_milestones (
      milestone_id TEXT PRIMARY KEY,
      milestone TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      achieved_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ofd_milestones_workspace ON ofd_milestones(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_ofd_milestones_company ON ofd_milestones(workspace_id, company_id);
    CREATE INDEX IF NOT EXISTS idx_ofd_milestones_type ON ofd_milestones(workspace_id, company_id, milestone);

    CREATE TABLE IF NOT EXISTS ofd_kpi_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      computed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ofd_kpi_workspace ON ofd_kpi_snapshots(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS ofd_learning_records (
      learning_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      source TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ofd_learning_workspace ON ofd_learning_records(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_ofd_learning_company ON ofd_learning_records(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS ofd_executive_briefs (
      brief_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ofd_briefs_workspace ON ofd_executive_briefs(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS commerce_runtime_plans (
      plan_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      status TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_commerce_runtime_plans_workspace ON commerce_runtime_plans(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS commerce_runtime_events (
      event_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      lifecycle TEXT NOT NULL,
      record_json TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_commerce_runtime_events_workspace ON commerce_runtime_events(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS commerce_runtime_queue (
      queue_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      kernel TEXT NOT NULL,
      status TEXT NOT NULL,
      record_json TEXT NOT NULL,
      requested_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_commerce_runtime_queue_workspace ON commerce_runtime_queue(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS global_commerce_identity (
      identity_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(workspace_id, company_id)
    );

    CREATE INDEX IF NOT EXISTS idx_global_commerce_identity_workspace ON global_commerce_identity(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS global_commerce_expansion_plans (
      plan_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_global_commerce_expansion_workspace ON global_commerce_expansion_plans(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS global_commerce_intelligence_rankings (
      ranking_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_global_commerce_intelligence_rankings_workspace ON global_commerce_intelligence_rankings(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS empire_knowledge_objects (
      object_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      object_type TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_empire_knowledge_objects_workspace ON empire_knowledge_objects(workspace_id, object_type);

    CREATE TABLE IF NOT EXISTS empire_knowledge_edges (
      edge_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      from_object_id TEXT NOT NULL,
      to_object_id TEXT NOT NULL,
      relationship TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_empire_knowledge_edges_workspace ON empire_knowledge_edges(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_empire_knowledge_edges_from ON empire_knowledge_edges(from_object_id);

    CREATE TABLE IF NOT EXISTS empire_knowledge_learning_records (
      learning_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_empire_knowledge_learnings_workspace ON empire_knowledge_learning_records(workspace_id);

    CREATE TABLE IF NOT EXISTS founder_automation_plans (
      plan_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_founder_automation_plans_workspace ON founder_automation_plans(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS amazon_listing_packages (
      listing_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_amazon_listing_packages_workspace ON amazon_listing_packages(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS cis_supplier_products (
      supplier_product_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (supplier_product_id, workspace_id, company_id)
    );

    CREATE TABLE IF NOT EXISTS cis_commercial_reviews (
      review_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      supplier_product_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      reviewed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cis_winning_listings (
      listing_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      supplier_product_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      generated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cis_commercial_strategies (
      strategy_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      supplier_product_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      computed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cis_commercial_experiments (
      experiment_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      supplier_product_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      classified_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cis_reviews_workspace ON cis_commercial_reviews(workspace_id, company_id);
    CREATE INDEX IF NOT EXISTS idx_cis_listings_workspace ON cis_winning_listings(workspace_id, company_id);
    CREATE INDEX IF NOT EXISTS idx_cis_experiments_workspace ON cis_commercial_experiments(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS ec_executives (
      executive_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (executive_id, workspace_id, company_id)
    );

    CREATE TABLE IF NOT EXISTS ec_council_sessions (
      session_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      started_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ec_accountability (
      record_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      executive_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ec_generated_missions (
      mission_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      generated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ec_sessions_workspace ON ec_council_sessions(workspace_id, company_id);
    CREATE INDEX IF NOT EXISTS idx_ec_accountability_workspace ON ec_accountability(workspace_id, company_id);
    CREATE INDEX IF NOT EXISTS idx_ec_missions_workspace ON ec_generated_missions(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS ess_watchers (
      watcher_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (watcher_id, workspace_id, company_id)
    );

    CREATE TABLE IF NOT EXISTS ess_observations (
      observation_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      observed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ess_signals (
      signal_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      emitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ess_missions (
      mission_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      generated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ess_observation_history (
      record_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ess_signals_workspace ON ess_signals(workspace_id, company_id);
    CREATE INDEX IF NOT EXISTS idx_ess_missions_workspace ON ess_missions(workspace_id, company_id);
    CREATE INDEX IF NOT EXISTS idx_ess_observations_workspace ON ess_observations(workspace_id, company_id);

    CREATE TABLE IF NOT EXISTS grand_king_products (
      product_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grand_king_tasks (
      task_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grand_king_suppliers (
      supplier_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grand_king_orders (
      order_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      status TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grand_king_ai_decisions (
      decision_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      status TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_gk_products_workspace ON grand_king_products(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_gk_tasks_workspace ON grand_king_tasks(workspace_id, status);
    CREATE INDEX IF NOT EXISTS idx_gk_orders_workspace ON grand_king_orders(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_gk_decisions_workspace ON grand_king_ai_decisions(workspace_id, status);

    CREATE TABLE IF NOT EXISTS gkr_pipeline_products (
      product_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      state TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gkr_timeline_events (
      event_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gkr_pipeline_missions (
      mission_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      generated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_gkr_products_workspace ON gkr_pipeline_products(workspace_id, company_id, state);
    CREATE INDEX IF NOT EXISTS idx_gkr_timeline_product ON gkr_timeline_events(workspace_id, company_id, product_id);
    CREATE INDEX IF NOT EXISTS idx_gkr_missions_workspace ON gkr_pipeline_missions(workspace_id, company_id);
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

  if (dbPath && !isInMemoryDatabasePath(dbPath)) {
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
