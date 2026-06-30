import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { LivePaymentRecord } from "../models/live-payment-record.js";
import type { LivePaymentRepository } from "./live-payment-repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

function mapPaymentRow(row: Record<string, unknown>): LivePaymentRecord {
  return {
    paymentId: String(row.payment_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    storeId: row.store_id ? String(row.store_id) : null,
    provider: row.provider as LivePaymentRecord["provider"],
    method: row.method as LivePaymentRecord["method"],
    status: row.status as LivePaymentRecord["status"],
    amountCents: Number(row.amount_cents),
    currency: String(row.currency),
    stripeSessionId: row.stripe_session_id ? String(row.stripe_session_id) : null,
    stripePaymentIntentId: row.stripe_payment_intent_id ? String(row.stripe_payment_intent_id) : null,
    stripeChargeId: row.stripe_charge_id ? String(row.stripe_charge_id) : null,
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    customerName: row.customer_name ? String(row.customer_name) : null,
    ledgerSaleEventId: row.ledger_sale_event_id ? String(row.ledger_sale_event_id) : null,
    ledgerFeeEventId: row.ledger_fee_event_id ? String(row.ledger_fee_event_id) : null,
    metadata: JSON.parse(String(row.metadata_json)),
    mock: Boolean(row.mock),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** SQLite persistence for live payment records. */
export class SqliteLivePaymentRepository implements LivePaymentRepository {
  savePayment(input: LivePaymentRecord): LivePaymentRecord {
    const db = getDatabase();
    const record = { ...input, updatedAt: nowIso() };

    db.prepare(
      `INSERT INTO live_payments
        (payment_id, workspace_id, company_id, store_id, provider, method, status,
         amount_cents, currency, stripe_session_id, stripe_payment_intent_id, stripe_charge_id,
         customer_email, customer_name, ledger_sale_event_id, ledger_fee_event_id,
         metadata_json, mock, created_at, updated_at)
       VALUES
        (@paymentId, @workspaceId, @companyId, @storeId, @provider, @method, @status,
         @amountCents, @currency, @stripeSessionId, @stripePaymentIntentId, @stripeChargeId,
         @customerEmail, @customerName, @ledgerSaleEventId, @ledgerFeeEventId,
         @metadataJson, @mock, @createdAt, @updatedAt)
       ON CONFLICT(payment_id) DO UPDATE SET
         status = excluded.status,
         stripe_charge_id = excluded.stripe_charge_id,
         ledger_sale_event_id = excluded.ledger_sale_event_id,
         ledger_fee_event_id = excluded.ledger_fee_event_id,
         updated_at = excluded.updated_at`,
    ).run({
      paymentId: record.paymentId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      storeId: record.storeId,
      provider: record.provider,
      method: record.method,
      status: record.status,
      amountCents: record.amountCents,
      currency: record.currency,
      stripeSessionId: record.stripeSessionId,
      stripePaymentIntentId: record.stripePaymentIntentId,
      stripeChargeId: record.stripeChargeId,
      customerEmail: record.customerEmail,
      customerName: record.customerName,
      ledgerSaleEventId: record.ledgerSaleEventId,
      ledgerFeeEventId: record.ledgerFeeEventId,
      metadataJson: JSON.stringify(record.metadata),
      mock: record.mock ? 1 : 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return record;
  }

  getPaymentById(paymentId: string): LivePaymentRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM live_payments WHERE payment_id = @paymentId`)
      .get({ paymentId }) as Record<string, unknown> | undefined;
    return row ? mapPaymentRow(row) : null;
  }

  getByStripeSession(sessionId: string): LivePaymentRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM live_payments WHERE stripe_session_id = @sessionId LIMIT 1`)
      .get({ sessionId }) as Record<string, unknown> | undefined;
    return row ? mapPaymentRow(row) : null;
  }

  getByStripePaymentIntent(paymentIntentId: string): LivePaymentRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM live_payments WHERE stripe_payment_intent_id = @paymentIntentId LIMIT 1`,
      )
      .get({ paymentIntentId }) as Record<string, unknown> | undefined;
    return row ? mapPaymentRow(row) : null;
  }

  getByStripeEvent(eventId: string): boolean {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT 1 FROM live_payment_stripe_events WHERE event_id = @eventId`)
      .get({ eventId });
    return Boolean(row);
  }

  markStripeEventProcessed(eventId: string, paymentId: string): void {
    const db = getDatabase();
    db.prepare(
      `INSERT OR IGNORE INTO live_payment_stripe_events (event_id, payment_id, processed_at)
       VALUES (@eventId, @paymentId, @processedAt)`,
    ).run({ eventId, paymentId, processedAt: nowIso() });
  }

  listPayments(workspaceId: string, companyId?: string): LivePaymentRecord[] {
    const db = getDatabase();
    const rows = companyId
      ? (db
          .prepare(
            `SELECT * FROM live_payments WHERE workspace_id = @workspaceId AND company_id = @companyId ORDER BY created_at DESC`,
          )
          .all({ workspaceId, companyId }) as Record<string, unknown>[])
      : (db
          .prepare(
            `SELECT * FROM live_payments WHERE workspace_id = @workspaceId ORDER BY created_at DESC`,
          )
          .all({ workspaceId }) as Record<string, unknown>[]);
    return rows.map(mapPaymentRow);
  }
}

let defaultRepository: SqliteLivePaymentRepository | null = null;

export function getLivePaymentRepository(): LivePaymentRepository {
  if (!defaultRepository) {
    defaultRepository = new SqliteLivePaymentRepository();
  }
  return defaultRepository;
}

export function createLivePaymentRecord(
  input: Omit<LivePaymentRecord, "paymentId" | "createdAt" | "updatedAt">,
): LivePaymentRecord {
  const timestamp = nowIso();
  return {
    ...input,
    paymentId: randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
