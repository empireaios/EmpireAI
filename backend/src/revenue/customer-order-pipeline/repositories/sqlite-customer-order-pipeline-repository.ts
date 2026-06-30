import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { CustomerOrderPipelineRecord } from "../models/customer-order-pipeline-record.js";
import type { InventoryReservation } from "../models/inventory-reservation.js";
import type { CustomerOrderPipelineRepository } from "./customer-order-pipeline-repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

function mapPipelineRow(row: Record<string, unknown>): CustomerOrderPipelineRecord {
  return {
    pipelineId: String(row.pipeline_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    storeId: row.store_id ? String(row.store_id) : null,
    brandId: row.brand_id ? String(row.brand_id) : null,
    paymentId: row.payment_id ? String(row.payment_id) : null,
    revenueOrderId: row.revenue_order_id ? String(row.revenue_order_id) : null,
    correlationId: String(row.correlation_id),
    status: row.status as CustomerOrderPipelineRecord["status"],
    customerEmail: String(row.customer_email),
    customerName: String(row.customer_name),
    revenueCents: Number(row.revenue_cents),
    currency: String(row.currency),
    fulfillmentOrder: row.fulfillment_order_json
      ? (JSON.parse(String(row.fulfillment_order_json)) as CustomerOrderPipelineRecord["fulfillmentOrder"])
      : null,
    inventoryReservationId: row.inventory_reservation_id
      ? String(row.inventory_reservation_id)
      : null,
    supplierOrderId: row.supplier_order_id ? String(row.supplier_order_id) : null,
    trackingNumber: row.tracking_number ? String(row.tracking_number) : null,
    carrier: row.carrier ? String(row.carrier) : null,
    approvalToken: row.approval_token ? String(row.approval_token) : null,
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    approvedAt: row.approved_at ? String(row.approved_at) : null,
    ledgerDeliveryEventId: row.ledger_delivery_event_id
      ? String(row.ledger_delivery_event_id)
      : null,
    mock: Boolean(row.mock),
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapReservationRow(row: Record<string, unknown>): InventoryReservation {
  return {
    reservationId: String(row.reservation_id),
    pipelineId: String(row.pipeline_id),
    workspaceId: String(row.workspace_id),
    supplierSku: String(row.supplier_sku),
    supplierProductId: String(row.supplier_product_id),
    quantity: Number(row.quantity),
    status: row.status as InventoryReservation["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** SQLite persistence for customer order pipeline records. */
export class SqliteCustomerOrderPipelineRepository implements CustomerOrderPipelineRepository {
  savePipeline(input: CustomerOrderPipelineRecord): CustomerOrderPipelineRecord {
    const db = getDatabase();
    const record = { ...input, updatedAt: nowIso() };

    db.prepare(
      `INSERT INTO customer_order_pipelines
        (pipeline_id, workspace_id, company_id, store_id, brand_id, payment_id, revenue_order_id,
         correlation_id, status, customer_email, customer_name, revenue_cents, currency,
         fulfillment_order_json, inventory_reservation_id, supplier_order_id, tracking_number,
         carrier, approval_token, approved_by, approved_at, ledger_delivery_event_id,
         mock, metadata_json, created_at, updated_at)
       VALUES
        (@pipelineId, @workspaceId, @companyId, @storeId, @brandId, @paymentId, @revenueOrderId,
         @correlationId, @status, @customerEmail, @customerName, @revenueCents, @currency,
         @fulfillmentOrderJson, @inventoryReservationId, @supplierOrderId, @trackingNumber,
         @carrier, @approvalToken, @approvedBy, @approvedAt, @ledgerDeliveryEventId,
         @mock, @metadataJson, @createdAt, @updatedAt)
       ON CONFLICT(pipeline_id) DO UPDATE SET
         status = excluded.status,
         payment_id = excluded.payment_id,
         revenue_order_id = excluded.revenue_order_id,
         fulfillment_order_json = excluded.fulfillment_order_json,
         inventory_reservation_id = excluded.inventory_reservation_id,
         supplier_order_id = excluded.supplier_order_id,
         tracking_number = excluded.tracking_number,
         carrier = excluded.carrier,
         approval_token = excluded.approval_token,
         approved_by = excluded.approved_by,
         approved_at = excluded.approved_at,
         ledger_delivery_event_id = excluded.ledger_delivery_event_id,
         metadata_json = excluded.metadata_json,
         updated_at = excluded.updated_at`,
    ).run({
      pipelineId: record.pipelineId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      storeId: record.storeId,
      brandId: record.brandId,
      paymentId: record.paymentId,
      revenueOrderId: record.revenueOrderId,
      correlationId: record.correlationId,
      status: record.status,
      customerEmail: record.customerEmail,
      customerName: record.customerName,
      revenueCents: record.revenueCents,
      currency: record.currency,
      fulfillmentOrderJson: record.fulfillmentOrder
        ? JSON.stringify(record.fulfillmentOrder)
        : null,
      inventoryReservationId: record.inventoryReservationId,
      supplierOrderId: record.supplierOrderId,
      trackingNumber: record.trackingNumber,
      carrier: record.carrier,
      approvalToken: record.approvalToken,
      approvedBy: record.approvedBy,
      approvedAt: record.approvedAt,
      ledgerDeliveryEventId: record.ledgerDeliveryEventId,
      mock: record.mock ? 1 : 0,
      metadataJson: JSON.stringify(record.metadata),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return record;
  }

  getPipelineById(pipelineId: string): CustomerOrderPipelineRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM customer_order_pipelines WHERE pipeline_id = @pipelineId`)
      .get({ pipelineId }) as Record<string, unknown> | undefined;
    return row ? mapPipelineRow(row) : null;
  }

  getPipelineByPaymentId(paymentId: string): CustomerOrderPipelineRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM customer_order_pipelines WHERE payment_id = @paymentId LIMIT 1`,
      )
      .get({ paymentId }) as Record<string, unknown> | undefined;
    return row ? mapPipelineRow(row) : null;
  }

  getPipelineByCorrelationId(correlationId: string): CustomerOrderPipelineRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM customer_order_pipelines WHERE correlation_id = @correlationId LIMIT 1`,
      )
      .get({ correlationId }) as Record<string, unknown> | undefined;
    return row ? mapPipelineRow(row) : null;
  }

  listPipelines(workspaceId: string, companyId?: string): CustomerOrderPipelineRecord[] {
    const db = getDatabase();
    const rows = companyId
      ? (db
          .prepare(
            `SELECT * FROM customer_order_pipelines
             WHERE workspace_id = @workspaceId AND company_id = @companyId
             ORDER BY created_at DESC`,
          )
          .all({ workspaceId, companyId }) as Record<string, unknown>[])
      : (db
          .prepare(
            `SELECT * FROM customer_order_pipelines
             WHERE workspace_id = @workspaceId ORDER BY created_at DESC`,
          )
          .all({ workspaceId }) as Record<string, unknown>[]);
    return rows.map(mapPipelineRow);
  }

  saveReservation(reservation: InventoryReservation): InventoryReservation {
    const db = getDatabase();
    const record = { ...reservation, updatedAt: nowIso() };

    db.prepare(
      `INSERT INTO customer_order_inventory_reservations
        (reservation_id, pipeline_id, workspace_id, supplier_sku, supplier_product_id,
         quantity, status, created_at, updated_at)
       VALUES
        (@reservationId, @pipelineId, @workspaceId, @supplierSku, @supplierProductId,
         @quantity, @status, @createdAt, @updatedAt)
       ON CONFLICT(reservation_id) DO UPDATE SET
         status = excluded.status,
         updated_at = excluded.updated_at`,
    ).run({
      reservationId: record.reservationId,
      pipelineId: record.pipelineId,
      workspaceId: record.workspaceId,
      supplierSku: record.supplierSku,
      supplierProductId: record.supplierProductId,
      quantity: record.quantity,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return record;
  }

  getReservationById(reservationId: string): InventoryReservation | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM customer_order_inventory_reservations WHERE reservation_id = @reservationId`,
      )
      .get({ reservationId }) as Record<string, unknown> | undefined;
    return row ? mapReservationRow(row) : null;
  }

  getReservationByPipelineId(pipelineId: string): InventoryReservation | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM customer_order_inventory_reservations WHERE pipeline_id = @pipelineId LIMIT 1`,
      )
      .get({ pipelineId }) as Record<string, unknown> | undefined;
    return row ? mapReservationRow(row) : null;
  }
}

let defaultRepository: SqliteCustomerOrderPipelineRepository | null = null;

export function getCustomerOrderPipelineRepository(): CustomerOrderPipelineRepository {
  if (!defaultRepository) {
    defaultRepository = new SqliteCustomerOrderPipelineRepository();
  }
  return defaultRepository;
}

export function createPipelineRecord(
  input: Omit<CustomerOrderPipelineRecord, "pipelineId" | "createdAt" | "updatedAt">,
): CustomerOrderPipelineRecord {
  const timestamp = nowIso();
  return {
    ...input,
    pipelineId: randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createReservationRecord(
  input: Omit<InventoryReservation, "reservationId" | "createdAt" | "updatedAt">,
): InventoryReservation {
  const timestamp = nowIso();
  return {
    ...input,
    reservationId: randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
