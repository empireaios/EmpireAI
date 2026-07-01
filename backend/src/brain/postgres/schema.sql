-- REAL-132 — Core Postgres schema (subset; expand via migrate script)
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  margin_pct REAL NOT NULL DEFAULT 0,
  agent_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
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

CREATE TABLE IF NOT EXISTS financial_ledger_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  company_id TEXT,
  event_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_connector_workspace ON connector_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ledger_workspace ON financial_ledger_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_workspace ON audit_logs(workspace_id);
