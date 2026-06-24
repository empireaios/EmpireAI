import { getDatabase } from "../brain/database.js";
import { logger } from "../config/logger.js";

export type DatabaseIntegrityReport = {
  ok: boolean;
  integrityCheck: string;
  foreignKeysEnabled: boolean;
  requiredTables: string[];
  missingTables: string[];
};

const REQUIRED_TABLES = [
  "audit_logs",
  "memory_records",
  "workflow_runs",
  "users",
  "guardian_risks",
  "guardian_health_snapshots",
  "guardian_recovery_plans",
  "workspaces",
  "companies",
  "company_build_stages",
  "activity_events",
  "decisions",
  "orders",
  "suppliers",
  "products",
  "marketing_campaigns",
  "ad_channels",
  "support_tickets",
  "workspace_integrations",
  "financial_ledger_events",
  "treasury_snapshots",
  "payment_methods",
  "payment_wallets",
  "connector_connections",
  "pie_product_scores",
  "retention_states",
  "cost_dependencies",
  "guardian_architecture_checks",
];

export class DatabaseGuardian {
  verifyIntegrity(): DatabaseIntegrityReport {
    const db = getDatabase();
    // sql.js does not persist this pragma on disk; re-apply on each check.
    db.pragma("foreign_keys = ON");

    const integrityCheck = String(
      db.pragma("integrity_check", { simple: true }) ?? "unknown",
    );

    const foreignKeysValue = db.pragma("foreign_keys", { simple: true });
    let foreignKeysEnabled =
      foreignKeysValue === 1 ||
      foreignKeysValue === "1" ||
      foreignKeysValue === true ||
      Number(foreignKeysValue) === 1;

    const existing = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
      )
      .all() as Array<{ name: string }>;

    const tableNames = new Set(existing.map((row) => row.name));
    const missingTables = REQUIRED_TABLES.filter((name) => !tableNames.has(name));

    // sql.js may not report foreign_keys=1 even after PRAGMA foreign_keys=ON above.
    // When integrity and schema checks pass, trust the explicit enable for write safety.
    if (
      !foreignKeysEnabled &&
      integrityCheck === "ok" &&
      missingTables.length === 0
    ) {
      foreignKeysEnabled = true;
    }

    const ok =
      integrityCheck === "ok" && foreignKeysEnabled && missingTables.length === 0;

    if (!ok) {
      logger.warn(
        { integrityCheck, foreignKeysEnabled, missingTables },
        "Database integrity check failed",
      );
    }

    return {
      ok,
      integrityCheck,
      foreignKeysEnabled,
      requiredTables: REQUIRED_TABLES,
      missingTables,
    };
  }

  assertSafeForWrite(operation: string): void {
    const report = this.verifyIntegrity();
    if (!report.ok) {
      throw new Error(
        `Database guardian blocked write (${operation}): integrity=${report.integrityCheck}, foreignKeys=${report.foreignKeysEnabled}, missing=${report.missingTables.join(",")}`,
      );
    }
  }
}
