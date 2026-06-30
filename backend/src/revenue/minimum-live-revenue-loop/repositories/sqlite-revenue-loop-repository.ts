import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { LiveStoreConfig } from "../models/live-store-config.js";
import type { Order } from "../../../orders/models/order.js";
import type { RevenueOrderRecord } from "../models/revenue-order-record.js";
import type { LiveStoreRecord, RevenueLoopRepository } from "./revenue-loop-repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

function mapStoreRow(row: Record<string, unknown>): LiveStoreRecord {
  return {
    recordId: String(row.id),
    storeId: String(row.store_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    brandId: String(row.brand_id),
    slug: String(row.slug),
    productName: String(row.product_name),
    productDescription: String(row.product_description),
    priceCents: Number(row.price_cents),
    currency: String(row.currency),
    cjSupplierSku: String(row.cj_supplier_sku),
    cjSupplierProductId: String(row.cj_supplier_product_id),
    unitCostCents: Number(row.unit_cost_cents),
    domain: row.domain ? String(row.domain) : null,
    deployPath: String(row.deploy_path),
    status: row.status as LiveStoreRecord["status"],
    analytics: JSON.parse(String(row.analytics_json)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapOrderRow(row: Record<string, unknown>): RevenueOrderRecord {
  return {
    recordId: String(row.id),
    storeId: String(row.store_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    stripeSessionId: row.stripe_session_id ? String(row.stripe_session_id) : null,
    stripePaymentIntentId: row.stripe_payment_intent_id
      ? String(row.stripe_payment_intent_id)
      : null,
    customerEmail: String(row.customer_email),
    customerName: String(row.customer_name),
    revenueCents: Number(row.revenue_cents),
    costCents: Number(row.cost_cents),
    profitCents: Number(row.profit_cents),
    currency: String(row.currency),
    status: row.status as RevenueOrderRecord["status"],
    fulfillmentOrder: row.fulfillment_order_json
      ? (JSON.parse(String(row.fulfillment_order_json)) as Order)
      : null,
    approvalToken: row.approval_token ? String(row.approval_token) : null,
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    approvedAt: row.approved_at ? String(row.approved_at) : null,
    supplierOrderId: row.supplier_order_id ? String(row.supplier_order_id) : null,
    trackingNumber: row.tracking_number ? String(row.tracking_number) : null,
    profitable: Boolean(row.profitable),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** SQLite-backed revenue loop repository for production persistence. */
export class SqliteRevenueLoopRepository implements RevenueLoopRepository {
  saveStore(input: LiveStoreRecord): LiveStoreRecord {
    const db = getDatabase();
    const timestamp = nowIso();
    const record: LiveStoreRecord = {
      ...input,
      recordId: input.recordId || randomUUID(),
      createdAt: input.createdAt || timestamp,
      updatedAt: timestamp,
    };

    db.prepare(
      `INSERT INTO revenue_loop_stores
        (id, store_id, workspace_id, company_id, brand_id, slug, product_name, product_description,
         price_cents, currency, cj_supplier_sku, cj_supplier_product_id, unit_cost_cents,
         domain, deploy_path, status, analytics_json, created_at, updated_at)
       VALUES
        (@id, @storeId, @workspaceId, @companyId, @brandId, @slug, @productName, @productDescription,
         @priceCents, @currency, @cjSupplierSku, @cjSupplierProductId, @unitCostCents,
         @domain, @deployPath, @status, @analyticsJson, @createdAt, @updatedAt)
       ON CONFLICT(store_id) DO UPDATE SET
         slug = excluded.slug,
         product_name = excluded.product_name,
         product_description = excluded.product_description,
         price_cents = excluded.price_cents,
         domain = excluded.domain,
         deploy_path = excluded.deploy_path,
         status = excluded.status,
         analytics_json = excluded.analytics_json,
         updated_at = excluded.updated_at`,
    ).run({
      id: record.recordId,
      storeId: record.storeId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      brandId: record.brandId,
      slug: record.slug,
      productName: record.productName,
      productDescription: record.productDescription,
      priceCents: record.priceCents,
      currency: record.currency,
      cjSupplierSku: record.cjSupplierSku,
      cjSupplierProductId: record.cjSupplierProductId,
      unitCostCents: record.unitCostCents,
      domain: record.domain,
      deployPath: record.deployPath,
      status: record.status,
      analyticsJson: JSON.stringify(record.analytics),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return record;
  }

  getStoreBySlug(slug: string): LiveStoreRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM revenue_loop_stores WHERE slug = @slug LIMIT 1`)
      .get({ slug }) as Record<string, unknown> | undefined;
    return row ? mapStoreRow(row) : null;
  }

  getStoreById(storeId: string): LiveStoreRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM revenue_loop_stores WHERE store_id = @storeId LIMIT 1`)
      .get({ storeId }) as Record<string, unknown> | undefined;
    return row ? mapStoreRow(row) : null;
  }

  listStores(workspaceId: string): LiveStoreRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM revenue_loop_stores WHERE workspace_id = @workspaceId ORDER BY updated_at DESC`,
      )
      .all({ workspaceId }) as Record<string, unknown>[];
    return rows.map(mapStoreRow);
  }

  saveOrder(input: RevenueOrderRecord): RevenueOrderRecord {
    const db = getDatabase();
    const timestamp = nowIso();
    const record: RevenueOrderRecord = {
      ...input,
      recordId: input.recordId || randomUUID(),
      createdAt: input.createdAt || timestamp,
      updatedAt: timestamp,
    };

    db.prepare(
      `INSERT INTO revenue_loop_orders
        (id, store_id, workspace_id, company_id, stripe_session_id, stripe_payment_intent_id,
         customer_email, customer_name, revenue_cents, cost_cents, profit_cents, currency, status,
         fulfillment_order_json, approval_token, approved_by, approved_at, supplier_order_id,
         tracking_number, profitable, created_at, updated_at)
       VALUES
        (@id, @storeId, @workspaceId, @companyId, @stripeSessionId, @stripePaymentIntentId,
         @customerEmail, @customerName, @revenueCents, @costCents, @profitCents, @currency, @status,
         @fulfillmentOrderJson, @approvalToken, @approvedBy, @approvedAt, @supplierOrderId,
         @trackingNumber, @profitable, @createdAt, @updatedAt)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         fulfillment_order_json = excluded.fulfillment_order_json,
         approval_token = excluded.approval_token,
         approved_by = excluded.approved_by,
         approved_at = excluded.approved_at,
         supplier_order_id = excluded.supplier_order_id,
         tracking_number = excluded.tracking_number,
         profitable = excluded.profitable,
         profit_cents = excluded.profit_cents,
         cost_cents = excluded.cost_cents,
         updated_at = excluded.updated_at`,
    ).run({
      id: record.recordId,
      storeId: record.storeId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      stripeSessionId: record.stripeSessionId,
      stripePaymentIntentId: record.stripePaymentIntentId,
      customerEmail: record.customerEmail,
      customerName: record.customerName,
      revenueCents: record.revenueCents,
      costCents: record.costCents,
      profitCents: record.profitCents,
      currency: record.currency,
      status: record.status,
      fulfillmentOrderJson: record.fulfillmentOrder
        ? JSON.stringify(record.fulfillmentOrder)
        : null,
      approvalToken: record.approvalToken,
      approvedBy: record.approvedBy,
      approvedAt: record.approvedAt,
      supplierOrderId: record.supplierOrderId,
      trackingNumber: record.trackingNumber,
      profitable: record.profitable ? 1 : 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return record;
  }

  getOrderById(recordId: string): RevenueOrderRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM revenue_loop_orders WHERE id = @recordId LIMIT 1`)
      .get({ recordId }) as Record<string, unknown> | undefined;
    return row ? mapOrderRow(row) : null;
  }

  getOrderByStripeSession(sessionId: string): RevenueOrderRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM revenue_loop_orders WHERE stripe_session_id = @sessionId LIMIT 1`,
      )
      .get({ sessionId }) as Record<string, unknown> | undefined;
    return row ? mapOrderRow(row) : null;
  }

  listOrders(workspaceId: string, storeId?: string): RevenueOrderRecord[] {
    const db = getDatabase();
    const rows = storeId
      ? (db
          .prepare(
            `SELECT * FROM revenue_loop_orders WHERE workspace_id = @workspaceId AND store_id = @storeId ORDER BY created_at DESC`,
          )
          .all({ workspaceId, storeId }) as Record<string, unknown>[])
      : (db
          .prepare(
            `SELECT * FROM revenue_loop_orders WHERE workspace_id = @workspaceId ORDER BY created_at DESC`,
          )
          .all({ workspaceId }) as Record<string, unknown>[]);
    return rows.map(mapOrderRow);
  }
}

let defaultRepository: SqliteRevenueLoopRepository | null = null;

export function getRevenueLoopRepository(): RevenueLoopRepository {
  if (!defaultRepository) {
    defaultRepository = new SqliteRevenueLoopRepository();
  }
  return defaultRepository;
}

export function createLiveStoreRecord(
  config: LiveStoreConfig,
): LiveStoreRecord {
  const timestamp = nowIso();
  return {
    ...config,
    recordId: randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
