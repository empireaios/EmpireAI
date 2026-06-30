import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type {
  FulfillmentAttemptRecord,
  LiveCjFulfillmentRecord,
} from "../models/live-cj-fulfillment-record.js";
import type { LiveCjFulfillmentRepository } from "./live-cj-fulfillment-repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

function mapFulfillmentRow(row: Record<string, unknown>): LiveCjFulfillmentRecord {
  return {
    fulfillmentId: String(row.fulfillment_id),
    pipelineId: String(row.pipeline_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    status: row.status as LiveCjFulfillmentRecord["status"],
    integrationMode: row.integration_mode as LiveCjFulfillmentRecord["integrationMode"],
    fulfillmentOrder: JSON.parse(String(row.fulfillment_order_json)) as LiveCjFulfillmentRecord["fulfillmentOrder"],
    supplierOrderId: row.supplier_order_id ? String(row.supplier_order_id) : null,
    trackingNumber: row.tracking_number ? String(row.tracking_number) : null,
    carrier: row.carrier ? String(row.carrier) : null,
    founderApprovalToken: row.founder_approval_token ? String(row.founder_approval_token) : null,
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    approvedAt: row.approved_at ? String(row.approved_at) : null,
    attemptCount: Number(row.attempt_count),
    lastErrorMessage: row.last_error_message ? String(row.last_error_message) : null,
    lastTrackingSyncAt: row.last_tracking_sync_at ? String(row.last_tracking_sync_at) : null,
    mock: Boolean(row.mock),
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapAttemptRow(row: Record<string, unknown>): FulfillmentAttemptRecord {
  return {
    attemptId: String(row.attempt_id),
    fulfillmentId: String(row.fulfillment_id),
    attemptNumber: Number(row.attempt_number),
    phase: row.phase as FulfillmentAttemptRecord["phase"],
    outcome: row.outcome as FulfillmentAttemptRecord["outcome"],
    message: String(row.message),
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
  };
}

/** SQLite persistence for LIVE CJ fulfillment jobs. */
export class SqliteLiveCjFulfillmentRepository implements LiveCjFulfillmentRepository {
  saveFulfillment(input: LiveCjFulfillmentRecord): LiveCjFulfillmentRecord {
    const db = getDatabase();
    const record = { ...input, updatedAt: nowIso() };

    db.prepare(
      `INSERT INTO live_cj_fulfillments
        (fulfillment_id, pipeline_id, workspace_id, company_id, status, integration_mode,
         fulfillment_order_json, supplier_order_id, tracking_number, carrier,
         founder_approval_token, approved_by, approved_at, attempt_count, last_error_message,
         last_tracking_sync_at, mock, metadata_json, created_at, updated_at)
       VALUES
        (@fulfillmentId, @pipelineId, @workspaceId, @companyId, @status, @integrationMode,
         @fulfillmentOrderJson, @supplierOrderId, @trackingNumber, @carrier,
         @founderApprovalToken, @approvedBy, @approvedAt, @attemptCount, @lastErrorMessage,
         @lastTrackingSyncAt, @mock, @metadataJson, @createdAt, @updatedAt)
       ON CONFLICT(fulfillment_id) DO UPDATE SET
         status = excluded.status,
         integration_mode = excluded.integration_mode,
         fulfillment_order_json = excluded.fulfillment_order_json,
         supplier_order_id = excluded.supplier_order_id,
         tracking_number = excluded.tracking_number,
         carrier = excluded.carrier,
         founder_approval_token = excluded.founder_approval_token,
         approved_by = excluded.approved_by,
         approved_at = excluded.approved_at,
         attempt_count = excluded.attempt_count,
         last_error_message = excluded.last_error_message,
         last_tracking_sync_at = excluded.last_tracking_sync_at,
         metadata_json = excluded.metadata_json,
         updated_at = excluded.updated_at`,
    ).run({
      fulfillmentId: record.fulfillmentId,
      pipelineId: record.pipelineId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      status: record.status,
      integrationMode: record.integrationMode,
      fulfillmentOrderJson: JSON.stringify(record.fulfillmentOrder),
      supplierOrderId: record.supplierOrderId,
      trackingNumber: record.trackingNumber,
      carrier: record.carrier,
      founderApprovalToken: record.founderApprovalToken,
      approvedBy: record.approvedBy,
      approvedAt: record.approvedAt,
      attemptCount: record.attemptCount,
      lastErrorMessage: record.lastErrorMessage,
      lastTrackingSyncAt: record.lastTrackingSyncAt,
      mock: record.mock ? 1 : 0,
      metadataJson: JSON.stringify(record.metadata),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return record;
  }

  getFulfillmentById(fulfillmentId: string): LiveCjFulfillmentRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM live_cj_fulfillments WHERE fulfillment_id = @fulfillmentId`)
      .get({ fulfillmentId }) as Record<string, unknown> | undefined;
    return row ? mapFulfillmentRow(row) : null;
  }

  getFulfillmentByPipelineId(pipelineId: string): LiveCjFulfillmentRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM live_cj_fulfillments WHERE pipeline_id = @pipelineId ORDER BY created_at DESC LIMIT 1`,
      )
      .get({ pipelineId }) as Record<string, unknown> | undefined;
    return row ? mapFulfillmentRow(row) : null;
  }

  listFulfillments(workspaceId: string, companyId?: string): LiveCjFulfillmentRecord[] {
    const db = getDatabase();
    const rows = companyId
      ? (db
          .prepare(
            `SELECT * FROM live_cj_fulfillments
             WHERE workspace_id = @workspaceId AND company_id = @companyId
             ORDER BY created_at DESC`,
          )
          .all({ workspaceId, companyId }) as Record<string, unknown>[])
      : (db
          .prepare(
            `SELECT * FROM live_cj_fulfillments
             WHERE workspace_id = @workspaceId ORDER BY created_at DESC`,
          )
          .all({ workspaceId }) as Record<string, unknown>[]);
    return rows.map(mapFulfillmentRow);
  }

  saveAttempt(attempt: FulfillmentAttemptRecord): FulfillmentAttemptRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT OR IGNORE INTO live_cj_fulfillment_attempts
        (attempt_id, fulfillment_id, attempt_number, phase, outcome, message, metadata_json, created_at)
       VALUES
        (@attemptId, @fulfillmentId, @attemptNumber, @phase, @outcome, @message, @metadataJson, @createdAt)`,
    ).run({
      attemptId: attempt.attemptId,
      fulfillmentId: attempt.fulfillmentId,
      attemptNumber: attempt.attemptNumber,
      phase: attempt.phase,
      outcome: attempt.outcome,
      message: attempt.message,
      metadataJson: JSON.stringify(attempt.metadata),
      createdAt: attempt.createdAt,
    });
    return attempt;
  }

  listAttempts(fulfillmentId: string): FulfillmentAttemptRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM live_cj_fulfillment_attempts
         WHERE fulfillment_id = @fulfillmentId ORDER BY attempt_number ASC`,
      )
      .all({ fulfillmentId }) as Record<string, unknown>[];
    return rows.map(mapAttemptRow);
  }
}

let defaultRepository: SqliteLiveCjFulfillmentRepository | null = null;

export function getLiveCjFulfillmentRepository(): LiveCjFulfillmentRepository {
  if (!defaultRepository) {
    defaultRepository = new SqliteLiveCjFulfillmentRepository();
  }
  return defaultRepository;
}

export function createFulfillmentRecord(
  input: Omit<LiveCjFulfillmentRecord, "fulfillmentId" | "createdAt" | "updatedAt">,
): LiveCjFulfillmentRecord {
  const timestamp = nowIso();
  return {
    ...input,
    fulfillmentId: randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createAttemptRecord(
  input: Omit<FulfillmentAttemptRecord, "attemptId" | "createdAt">,
): FulfillmentAttemptRecord {
  return {
    ...input,
    attemptId: randomUUID(),
    createdAt: nowIso(),
  };
}
