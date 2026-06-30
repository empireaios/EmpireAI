import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { FirstRevenueValidationRecord } from "../models/first-revenue-validation-record.js";
import type { FirstRevenueValidationRepository } from "./first-revenue-validation-repository.js";

function mapValidationRow(row: Record<string, unknown>): FirstRevenueValidationRecord {
  return {
    validationId: String(row.validation_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    correlationId: String(row.correlation_id),
    mode: row.mode as FirstRevenueValidationRecord["mode"],
    stages: JSON.parse(String(row.stages_json)),
    allStagesPassed: Boolean(row.all_stages_passed),
    productionReady: Boolean(row.production_ready),
    productionBlockers: JSON.parse(String(row.production_blockers_json)),
    revenueCents: Number(row.revenue_cents),
    profitCents: Number(row.profit_cents),
    ledgerVerified: Boolean(row.ledger_verified),
    storeId: row.store_id ? String(row.store_id) : null,
    pipelineId: row.pipeline_id ? String(row.pipeline_id) : null,
    paymentId: row.payment_id ? String(row.payment_id) : null,
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
    mock: Boolean(row.mock),
    createdAt: String(row.created_at),
  };
}

let repositoryInstance: SqliteFirstRevenueValidationRepository | null = null;

export function getFirstRevenueValidationRepository(): SqliteFirstRevenueValidationRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteFirstRevenueValidationRepository();
  }
  return repositoryInstance;
}

export function resetFirstRevenueValidationRepository(): void {
  repositoryInstance = null;
}

export function createValidationRecord(
  input: Omit<FirstRevenueValidationRecord, "validationId" | "createdAt"> & {
    validationId?: string;
  },
): FirstRevenueValidationRecord {
  return {
    validationId: input.validationId ?? randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    correlationId: input.correlationId,
    mode: input.mode,
    stages: input.stages,
    allStagesPassed: input.allStagesPassed,
    productionReady: input.productionReady,
    productionBlockers: input.productionBlockers,
    revenueCents: input.revenueCents,
    profitCents: input.profitCents,
    ledgerVerified: input.ledgerVerified,
    storeId: input.storeId,
    pipelineId: input.pipelineId,
    paymentId: input.paymentId,
    campaignId: input.campaignId,
    mock: input.mock,
    createdAt: new Date().toISOString(),
  };
}

/** SQLite persistence for first revenue validation runs. */
export class SqliteFirstRevenueValidationRepository implements FirstRevenueValidationRepository {
  saveValidation(record: FirstRevenueValidationRecord): FirstRevenueValidationRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO first_revenue_validations
        (validation_id, workspace_id, company_id, correlation_id, mode, stages_json,
         all_stages_passed, production_ready, production_blockers_json, revenue_cents,
         profit_cents, ledger_verified, store_id, pipeline_id, payment_id, campaign_id,
         mock, created_at)
       VALUES
        (@validationId, @workspaceId, @companyId, @correlationId, @mode, @stagesJson,
         @allStagesPassed, @productionReady, @productionBlockersJson, @revenueCents,
         @profitCents, @ledgerVerified, @storeId, @pipelineId, @paymentId, @campaignId,
         @mock, @createdAt)
       ON CONFLICT(validation_id) DO UPDATE SET
         stages_json = excluded.stages_json,
         all_stages_passed = excluded.all_stages_passed,
         production_ready = excluded.production_ready,
         production_blockers_json = excluded.production_blockers_json,
         revenue_cents = excluded.revenue_cents,
         profit_cents = excluded.profit_cents,
         ledger_verified = excluded.ledger_verified,
         store_id = excluded.store_id,
         pipeline_id = excluded.pipeline_id,
         payment_id = excluded.payment_id,
         campaign_id = excluded.campaign_id,
         mock = excluded.mock`,
    ).run({
      validationId: record.validationId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      correlationId: record.correlationId,
      mode: record.mode,
      stagesJson: JSON.stringify(record.stages),
      allStagesPassed: record.allStagesPassed ? 1 : 0,
      productionReady: record.productionReady ? 1 : 0,
      productionBlockersJson: JSON.stringify(record.productionBlockers),
      revenueCents: record.revenueCents,
      profitCents: record.profitCents,
      ledgerVerified: record.ledgerVerified ? 1 : 0,
      storeId: record.storeId,
      pipelineId: record.pipelineId,
      paymentId: record.paymentId,
      campaignId: record.campaignId,
      mock: record.mock ? 1 : 0,
      createdAt: record.createdAt,
    });
    return record;
  }

  getValidationById(validationId: string): FirstRevenueValidationRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM first_revenue_validations WHERE validation_id = @validationId`)
      .get({ validationId });
    return row ? mapValidationRow(row as Record<string, unknown>) : null;
  }

  listValidations(workspaceId: string, companyId?: string): FirstRevenueValidationRecord[] {
    const db = getDatabase();
    const rows = companyId
      ? db
          .prepare(
            `SELECT * FROM first_revenue_validations
             WHERE workspace_id = @workspaceId AND company_id = @companyId
             ORDER BY created_at DESC`,
          )
          .all({ workspaceId, companyId })
      : db
          .prepare(
            `SELECT * FROM first_revenue_validations
             WHERE workspace_id = @workspaceId ORDER BY created_at DESC`,
          )
          .all({ workspaceId });
    return (rows as Record<string, unknown>[]).map(mapValidationRow);
  }
}
