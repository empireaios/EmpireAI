/**
 * Amazon Orders API v2026-01-01: one bounded page per invocation.
 * A page and its continuation cursor are committed together, then fsynced by
 * the SQL.js critical boundary before any completed sync is reported.
 * No customer PII is stored here; fulfilment economics require separate proof.
 */
import { createHash } from "node:crypto";
import { getDatabase } from "../../../../brain/database.js";
import { getAmazonMarketplaceProfile } from "../amazon-marketplace-profiles.js";
import { httpTransport } from "../http-transport.js";
import type { LiveCommerceAdapterContext, LiveCommerceSyncResult } from "./types.js";

type OrderSnapshot = {
  orderId: string;
  marketplaceId: string;
  createdTime: string;
  lastUpdatedTime: string;
  fulfillmentStatus: string | null;
  fulfilledBy: string | null;
  orderItems: Array<{ orderItemId: string; sellerSku: string | null; quantityOrdered: number }>;
  grandTotalCents: number | null;
  sourceSha256: string;
};
type Cursor = {
  since: string;
  until: string;
  nextToken: string;
  seen: number;
  startedAt: string;
  lastCompletedAt: string | null;
};

function ensureTables(): void {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS amazon_order_import_rows (
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      marketplace_id TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      record_json TEXT NOT NULL,
      PRIMARY KEY (workspace_id, provider_id, order_id)
    );
    CREATE TABLE IF NOT EXISTS amazon_order_import_cursors (
      workspace_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      since_time TEXT NOT NULL,
      until_time TEXT NOT NULL,
      next_token TEXT NOT NULL,
      seen_count INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      PRIMARY KEY (workspace_id, provider_id)
    );
  `);
}

function getCursor(workspaceId: string, providerId: string): Cursor | null {
  ensureTables();
  const row = getDatabase().prepare(`
    SELECT since_time, until_time, next_token, seen_count, started_at, completed_at
    FROM amazon_order_import_cursors
    WHERE workspace_id = @workspaceId AND provider_id = @providerId
  `).get({ workspaceId, providerId }) as {
    since_time: string; until_time: string; next_token: string;
    seen_count: number; started_at: string; completed_at: string | null;
  } | undefined;
  if (!row) return null;
  return {
    since: row.since_time, until: row.until_time, nextToken: row.next_token,
    seen: row.seen_count, startedAt: row.started_at, lastCompletedAt: row.completed_at,
  };
}

function validTime(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function moneyCents(value: unknown): number | null {
  if (value == null) return null;
  if (!value || typeof value !== "object") throw new Error("Amazon order proceeds malformed");
  const record = value as Record<string, unknown>;
  if (record.currencyCode !== "USD" || typeof record.amount !== "string" ||
      !/^\d+(?:\.\d{1,2})?$/.test(record.amount)) {
    throw new Error("Amazon order proceeds currency or amount unsupported");
  }
  const [whole, fraction = ""] = record.amount.split(".");
  const cents = BigInt(whole ?? "0") * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Amazon order proceeds exceed safe integer");
  return Number(cents);
}

function sanitizeOrder(value: unknown, marketplaceId: string): OrderSnapshot {
  if (!value || typeof value !== "object") throw new Error("Amazon order payload malformed");
  const raw = value as Record<string, unknown>;
  const channel = raw.salesChannel as Record<string, unknown> | undefined;
  if (typeof raw.orderId !== "string" || !raw.orderId.trim() ||
      channel?.marketplaceId !== marketplaceId ||
      !validTime(raw.createdTime) || !validTime(raw.lastUpdatedTime)) {
    throw new Error("Amazon order identity, marketplace or timestamps invalid");
  }
  if (Date.parse(raw.lastUpdatedTime) > Date.now() + 5 * 60_000) {
    throw new Error("Amazon order updated timestamp is in the future");
  }
  if (raw.orderItems != null && !Array.isArray(raw.orderItems)) {
    throw new Error("Amazon order items malformed");
  }
  const orderItems = (raw.orderItems as unknown[] | undefined ?? []).map(item => {
    if (!item || typeof item !== "object") throw new Error("Amazon order item malformed");
    const entry = item as Record<string, unknown>;
    const product = entry.product as Record<string, unknown> | undefined;
    if (typeof entry.orderItemId !== "string" || !entry.orderItemId ||
        !Number.isSafeInteger(entry.quantityOrdered) || (entry.quantityOrdered as number) < 0) {
      throw new Error("Amazon order item identity or quantity invalid");
    }
    return {
      orderItemId: entry.orderItemId,
      sellerSku: typeof product?.sellerSku === "string" ? product.sellerSku : null,
      quantityOrdered: entry.quantityOrdered as number,
    };
  });
  const fulfillment = raw.fulfillment as Record<string, unknown> | undefined;
  const proceeds = raw.proceeds as Record<string, unknown> | undefined;
  return {
    orderId: raw.orderId, marketplaceId,
    createdTime: new Date(raw.createdTime).toISOString(),
    lastUpdatedTime: new Date(raw.lastUpdatedTime).toISOString(),
    fulfillmentStatus: typeof fulfillment?.fulfillmentStatus === "string" ? fulfillment.fulfillmentStatus : null,
    fulfilledBy: typeof fulfillment?.fulfilledBy === "string" ? fulfillment.fulfilledBy : null,
    orderItems,
    grandTotalCents: moneyCents((proceeds?.grandTotal)),
    sourceSha256: createHash("sha256").update(JSON.stringify(raw)).digest("hex"),
  };
}

function persistPage(ctx: LiveCommerceAdapterContext, snapshots: OrderSnapshot[], cursor: Cursor): void {
  ensureTables();
  const db = getDatabase();
  db.exec("SAVEPOINT amazon_order_page");
  try {
    const write = db.prepare(`
      INSERT INTO amazon_order_import_rows
        (workspace_id, provider_id, order_id, marketplace_id, updated_at, record_json)
      VALUES (@workspaceId, @providerId, @orderId, @marketplaceId, @updatedAt, @recordJson)
      ON CONFLICT(workspace_id, provider_id, order_id) DO UPDATE SET
        marketplace_id = excluded.marketplace_id,
        updated_at = excluded.updated_at,
        record_json = excluded.record_json
      WHERE excluded.updated_at >= amazon_order_import_rows.updated_at
    `);
    for (const snapshot of snapshots) {
      write.run({
        workspaceId: ctx.workspaceId, providerId: ctx.providerId,
        orderId: snapshot.orderId, marketplaceId: snapshot.marketplaceId,
        updatedAt: snapshot.lastUpdatedTime, recordJson: JSON.stringify(snapshot),
      });
    }
    db.prepare(`
      INSERT INTO amazon_order_import_cursors
        (workspace_id, provider_id, since_time, until_time, next_token, seen_count, started_at, completed_at)
      VALUES (@workspaceId, @providerId, @since, @until, @nextToken, @seen, @startedAt, @completedAt)
      ON CONFLICT(workspace_id, provider_id) DO UPDATE SET
        since_time=excluded.since_time, until_time=excluded.until_time,
        next_token=excluded.next_token, seen_count=excluded.seen_count,
        started_at=excluded.started_at, completed_at=excluded.completed_at
    `).run({
      workspaceId: ctx.workspaceId, providerId: ctx.providerId,
      since: cursor.since, until: cursor.until, nextToken: cursor.nextToken,
      seen: cursor.seen, startedAt: cursor.startedAt, completedAt: cursor.lastCompletedAt,
    });
    db.exec("RELEASE SAVEPOINT amazon_order_page");
  } catch (error) {
    db.exec("ROLLBACK TO SAVEPOINT amazon_order_page");
    db.exec("RELEASE SAVEPOINT amazon_order_page");
    throw error;
  }
}

function getImportedOrder(workspaceId: string, providerId: string, orderId: string): OrderSnapshot | null {
  const row = getDatabase().prepare(`
    SELECT record_json FROM amazon_order_import_rows
    WHERE workspace_id = @workspaceId AND provider_id = @providerId AND order_id = @orderId
  `).get({ workspaceId, providerId, orderId }) as { record_json: string } | undefined;
  return row ? JSON.parse(row.record_json) as OrderSnapshot : null;
}

/** Read-only snapshots, never customer PII or a fulfilment authorization. */
export function listImportedAmazonOrders(
  workspaceId: string, providerId = "amazon-us", limit = 100,
): OrderSnapshot[] {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
    throw new Error("Amazon order read limit must be 1..500");
  }
  ensureTables();
  const rows = getDatabase().prepare(`
    SELECT record_json FROM amazon_order_import_rows
    WHERE workspace_id = @workspaceId AND provider_id = @providerId
    ORDER BY updated_at DESC LIMIT @limit
  `).all({ workspaceId, providerId, limit }) as Array<{ record_json: string }>;
  return rows.map(row => JSON.parse(row.record_json) as OrderSnapshot);
}

export async function syncAmazonUsOrders(ctx: LiveCommerceAdapterContext): Promise<LiveCommerceSyncResult> {
  if (ctx.providerId !== "amazon-us" || ctx.mode !== "production") {
    throw new Error("Amazon US order import requires production Amazon US context");
  }
  const token = ctx.credentials.accessToken;
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("Amazon US access token required for order import");
  }
  const marketplaceId = getAmazonMarketplaceProfile("amazon-us").marketplaceId;
  const prior = getCursor(ctx.workspaceId, ctx.providerId);
  const now = Date.now();
  const initialSince = new Date(now - 7 * 24 * 60 * 60_000).toISOString();
  const until = new Date(now - 3 * 60_000).toISOString();
  const baseSince = prior?.since ?? initialSince;
  if (!validTime(baseSince) || Date.parse(baseSince) >= Date.parse(until)) {
    throw new Error("Amazon order sync cursor interval invalid");
  }
  // Amazon pagination tokens expire in 24h. Restart the same fixed window
  // from its beginning after 23h; upserts make repeated pages idempotent.
  const resume = prior?.nextToken && validTime(prior.startedAt) &&
    now - Date.parse(prior.startedAt) < 23 * 60 * 60_000;
  const active: Cursor = resume ? prior! : {
    since: baseSince,
    until: prior?.nextToken && validTime(prior.until) ? prior.until : until,
    nextToken: "",
    seen: 0,
    startedAt: new Date(now).toISOString(),
    lastCompletedAt: prior?.lastCompletedAt ?? null,
  };
  if (!validTime(active.since) || !validTime(active.until) ||
      Date.parse(active.since) > Date.parse(active.until) ||
      !Number.isSafeInteger(active.seen) || active.seen < 0 ||
      active.seen > 50_000 || active.nextToken.length > 4096) {
    throw new Error("Amazon US order sync cursor malformed");
  }
  const params = new URLSearchParams({
    lastUpdatedAfter: active.since,
    lastUpdatedBefore: active.until,
    marketplaceIds: marketplaceId,
    maxResultsPerPage: "100",
    includedData: "FULFILLMENT,PROCEEDS,CANCELLATION,PACKAGES",
  });
  if (active.nextToken) params.set("paginationToken", active.nextToken);
  const response = await httpTransport({
    url: `https://sellingpartnerapi-na.amazon.com/orders/2026-01-01/orders?${params}`,
    method: "GET",
    headers: { "x-amz-access-token": token },
  });
  if (!response.ok) throw new Error(`Amazon US order search failed: HTTP ${response.status}`);
  if (!response.json || typeof response.json !== "object") {
    throw new Error("Amazon US order search response malformed");
  }
  const payload = response.json as Record<string, unknown>;
  if (!Array.isArray(payload.orders) || payload.orders.length > 100) {
    throw new Error("Amazon US order search page missing or oversized");
  }
  if (payload.pagination != null &&
      (typeof payload.pagination !== "object" || Array.isArray(payload.pagination))) {
    throw new Error("Amazon US order pagination payload malformed");
  }
  const pagination = payload.pagination as Record<string, unknown> | undefined;
  const nextToken = pagination?.nextToken ?? "";
  if (typeof nextToken !== "string" || nextToken.length > 4096 ||
      (nextToken && nextToken === active.nextToken)) {
    throw new Error("Amazon US order pagination token invalid");
  }
  const snapshots = payload.orders.map((order: unknown) => sanitizeOrder(order, marketplaceId));
  if (active.seen + snapshots.length > 50_000) {
    throw new Error("Amazon US order sync exceeds bounded window");
  }
  const finished = !nextToken;
  const cursor: Cursor = finished ? {
    since: new Date(Date.parse(active.until) - 2 * 60_000).toISOString(),
    until: "", nextToken: "", seen: 0,
    startedAt: "", lastCompletedAt: new Date().toISOString(),
  } : {
    ...active, nextToken, seen: active.seen + snapshots.length,
  };
  persistPage(ctx, snapshots, cursor);
  await getDatabase().requestCriticalPersist();
  const readback = getCursor(ctx.workspaceId, ctx.providerId);
  if (!readback || readback.nextToken !== cursor.nextToken ||
      readback.since !== cursor.since || readback.lastCompletedAt !== cursor.lastCompletedAt ||
      snapshots.some(snapshot =>
        getImportedOrder(ctx.workspaceId, ctx.providerId, snapshot.orderId)?.sourceSha256 !== snapshot.sourceSha256)) {
    throw new Error("Amazon US order import durable read-back failed");
  }
  if (!finished) {
    // One page per call bounds request work. A durable recovery record can
    // resume the cursor later; a scheduler and rate-limit delay remain required.
    // Never grant a completed cycle from a partial page.
    throw new Error("AMAZON_ORDERS_PAGINATION_PENDING: durable page saved; continue after provider rate limit");
  }
  return {
    syncType: "orders", itemsProcessed: active.seen + snapshots.length,
    itemsFailed: 0, liveApiVerified: true, durableReadbackVerified: true,
  };
}
