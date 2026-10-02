/** Seller-managed Amazon listing availability, not upstream dropship supplier stock.
 * https://developer-docs.amazon.com/sp-api/reference/searchlistingsitems
 */
import { createHash } from "node:crypto";
import { getDatabase } from "../../../../brain/database.js";
import { getAmazonMarketplaceProfile } from "../amazon-marketplace-profiles.js";
import { httpTransport } from "../http-transport.js";
import type { LiveCommerceAdapterContext, LiveCommerceSyncResult } from "./types.js";

type Stock = { sellerId: string; sku: string; marketplaceId: string;
  sellerFulfilledQuantity: number; cycleStartedAt: string; sourceSha256: string };
type Cursor = { sellerId: string; nextToken: string; seen: number; completedAt: string | null;
  startedAt: string; status: string; reason: string };
function tables() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS amazon_seller_inventory_rows (
      workspace_id TEXT NOT NULL, provider_id TEXT NOT NULL, seller_id TEXT NOT NULL,
      sku TEXT NOT NULL, record_json TEXT NOT NULL,
      PRIMARY KEY(workspace_id,provider_id,seller_id,sku)
    );
    CREATE TABLE IF NOT EXISTS amazon_seller_inventory_cursor (
      workspace_id TEXT NOT NULL, provider_id TEXT NOT NULL, seller_id TEXT NOT NULL,
      next_token TEXT NOT NULL, seen INTEGER NOT NULL, completed_at TEXT,
      started_at TEXT NOT NULL, status TEXT NOT NULL, reason TEXT NOT NULL,
      PRIMARY KEY(workspace_id,provider_id)
    );
    CREATE TABLE IF NOT EXISTS amazon_seller_inventory_gate (
      workspace_id TEXT NOT NULL, provider_id TEXT NOT NULL, next_allowed_at TEXT NOT NULL,
      PRIMARY KEY(workspace_id,provider_id)
    );
  `);
}
function cursor(ctx: LiveCommerceAdapterContext): Cursor | null {
  tables();
  return getDatabase().prepare(`SELECT seller_id AS sellerId, next_token AS nextToken,
    seen, completed_at AS completedAt, started_at AS startedAt, status, reason
    FROM amazon_seller_inventory_cursor
    WHERE workspace_id=@workspaceId AND provider_id=@providerId`).get({
    workspaceId: ctx.workspaceId, providerId: ctx.providerId,
  }) as Cursor | undefined ?? null;
}
function stock(raw: unknown, sellerId: string, marketplaceId: string, cycleStartedAt: string): Stock {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Amazon inventory item malformed");
  const item = raw as Record<string, unknown>;
  if (typeof item.sku !== "string" || !item.sku.trim() || item.sku.length > 256 ||
      !Array.isArray(item.summaries) ||
      item.summaries.filter(s => s && typeof s === "object" &&
        (s as Record<string, unknown>).marketplaceId === marketplaceId).length !== 1 ||
      !Array.isArray(item.fulfillmentAvailability)) {
    throw new Error("Amazon inventory SKU, marketplace or availability missing");
  }
  const rows = item.fulfillmentAvailability.filter((entry): entry is Record<string, unknown> =>
    Boolean(entry && typeof entry === "object" &&
      (entry as Record<string, unknown>).fulfillmentChannelCode === "DEFAULT" &&
      ((entry as Record<string, unknown>).marketplaceId == null ||
        (entry as Record<string, unknown>).marketplaceId === marketplaceId)));
  if (rows.length !== 1 || !Number.isSafeInteger(rows[0]!.quantity) ||
      (rows[0]!.quantity as number) < 0) {
    throw new Error("Amazon seller-fulfilled inventory absent or ambiguous");
  }
  return { sellerId, sku: item.sku, marketplaceId,
    sellerFulfilledQuantity: rows[0]!.quantity as number,
    cycleStartedAt,
    sourceSha256: createHash("sha256").update(JSON.stringify(raw)).digest("hex") };
}
async function reserve(ctx: LiveCommerceAdapterContext) {
  const db = getDatabase(); tables();
  const key = { workspaceId: ctx.workspaceId, providerId: ctx.providerId };
  const prior = db.prepare(`SELECT next_allowed_at FROM amazon_seller_inventory_gate
    WHERE workspace_id=@workspaceId AND provider_id=@providerId`).get(key) as
    { next_allowed_at: string } | undefined;
  if (prior && (!Number.isFinite(Date.parse(prior.next_allowed_at)) ||
      Date.now() < Date.parse(prior.next_allowed_at))) {
    throw new Error("AMAZON_INVENTORY_RATE_LIMIT_PENDING: durable request gate");
  }
  db.prepare(`INSERT INTO amazon_seller_inventory_gate
    (workspace_id,provider_id,next_allowed_at) VALUES (@workspaceId,@providerId,@nextAllowedAt)
    ON CONFLICT(workspace_id,provider_id) DO UPDATE SET next_allowed_at=excluded.next_allowed_at`
  ).run({ ...key, nextAllowedAt: new Date(Date.now() + 1_000).toISOString() });
  await db.requestCriticalPersist();
}
function persist(ctx: LiveCommerceAdapterContext, rows: Stock[], next: Cursor) {
  const db = getDatabase();
  db.exec("SAVEPOINT amazon_seller_inventory_page");
  try {
    const write = db.prepare(`INSERT INTO amazon_seller_inventory_rows
      (workspace_id,provider_id,seller_id,sku,record_json)
      VALUES (@workspaceId,@providerId,@sellerId,@sku,@recordJson)
      ON CONFLICT(workspace_id,provider_id,seller_id,sku) DO UPDATE SET record_json=excluded.record_json`);
    for (const row of rows) write.run({ workspaceId: ctx.workspaceId, providerId: ctx.providerId,
      sellerId: next.sellerId, sku: row.sku, recordJson: JSON.stringify(row) });
    db.prepare(`INSERT INTO amazon_seller_inventory_cursor
      (workspace_id,provider_id,seller_id,next_token,seen,completed_at,started_at,status,reason)
      VALUES (@workspaceId,@providerId,@sellerId,@nextToken,@seen,@completedAt,@startedAt,@status,@reason)
      ON CONFLICT(workspace_id,provider_id) DO UPDATE SET seller_id=excluded.seller_id,
        next_token=excluded.next_token,seen=excluded.seen,completed_at=excluded.completed_at,
        started_at=excluded.started_at,status=excluded.status,reason=excluded.reason`).run({
      workspaceId: ctx.workspaceId, providerId: ctx.providerId, ...next,
    });
    db.exec("RELEASE SAVEPOINT amazon_seller_inventory_page");
  } catch (error) {
    db.exec("ROLLBACK TO SAVEPOINT amazon_seller_inventory_page");
    db.exec("RELEASE SAVEPOINT amazon_seller_inventory_page");
    throw error;
  }
}
export function listImportedAmazonSellerInventory(workspaceId: string, sellerId: string): Stock[] {
  tables();
  const rows = getDatabase().prepare(`SELECT record_json FROM amazon_seller_inventory_rows
    WHERE workspace_id=@workspaceId AND provider_id='amazon-us' AND seller_id=@sellerId
    ORDER BY sku LIMIT 500`).all({ workspaceId, sellerId }) as Array<{ record_json: string }>;
  return rows.map(row => JSON.parse(row.record_json) as Stock);
}
export function listCurrentAmazonSellerInventory(workspaceId: string): Stock[] {
  const selected = cursor({ workspaceId, providerId: "amazon-us", mode: "production", credentials: {} });
  return selected ? listImportedAmazonSellerInventory(workspaceId, selected.sellerId)
    .filter(row => row.cycleStartedAt === selected.startedAt) : [];
}
export function getAmazonSellerInventoryImportStatus(workspaceId: string): {
  status: string; reason: string; itemsSeen: number; pagesPending: boolean;
  nextAllowedAt: string | null; completedAt: string | null;
} | null {
  tables();
  const row = getDatabase().prepare(`SELECT c.status, c.reason, c.seen, c.next_token,
      c.completed_at, g.next_allowed_at FROM amazon_seller_inventory_cursor c
    LEFT JOIN amazon_seller_inventory_gate g ON g.workspace_id=c.workspace_id AND g.provider_id=c.provider_id
    WHERE c.workspace_id=@workspaceId AND c.provider_id='amazon-us'`).get({ workspaceId }) as {
      status: string; reason: string; seen: number; next_token: string;
      completed_at: string | null; next_allowed_at: string | null;
    } | undefined;
  return row ? { status: row.status, reason: row.reason, itemsSeen: row.seen,
    pagesPending: Boolean(row.next_token), nextAllowedAt: row.next_allowed_at,
    completedAt: row.completed_at } : null;
}
export function nextPendingAmazonSellerInventoryImport(): {
  workspaceId: string; nextAllowedAt: string | null; startedAt: string;
} | null {
  tables();
  return getDatabase().prepare(`SELECT c.workspace_id AS workspaceId,
      g.next_allowed_at AS nextAllowedAt, c.started_at AS startedAt
    FROM amazon_seller_inventory_cursor c LEFT JOIN amazon_seller_inventory_gate g
      ON g.workspace_id=c.workspace_id AND g.provider_id=c.provider_id
    WHERE c.provider_id='amazon-us' AND c.status='pending' AND c.next_token <> ''
    ORDER BY c.started_at ASC LIMIT 1`).get() as {
      workspaceId: string; nextAllowedAt: string | null; startedAt: string;
    } | undefined ?? null;
}
export async function pauseAmazonSellerInventoryImport(
  workspaceId: string, reason: string, startedAt: string,
): Promise<void> {
  if (reason !== "PROVIDER_FAILURE" && reason !== "RATE_GATE_CORRUPT") {
    throw new Error("Amazon inventory pause reason invalid");
  }
  tables();
  getDatabase().prepare(`UPDATE amazon_seller_inventory_cursor SET status='paused', reason=@reason
    WHERE workspace_id=@workspaceId AND provider_id='amazon-us' AND status='pending'
      AND started_at=@startedAt`).run({ workspaceId, reason, startedAt });
  await getDatabase().requestCriticalPersist();
}
export async function syncAmazonUsSellerInventory(ctx: LiveCommerceAdapterContext): Promise<LiveCommerceSyncResult> {
  if (ctx.providerId !== "amazon-us" || ctx.mode !== "production") {
    throw new Error("Amazon seller inventory requires production Amazon US context");
  }
  const seller = ctx.credentials.sellerId, access = ctx.credentials.accessToken;
  if (typeof seller !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(seller) ||
      typeof access !== "string" || !access.trim()) {
    throw new Error("Amazon seller ID and access token required for inventory import");
  }
  const prior = cursor(ctx);
  if (prior && prior.sellerId !== seller) throw new Error("Amazon inventory seller binding changed");
  if (prior && (prior.nextToken.length > 4096 || !Number.isSafeInteger(prior.seen) ||
      prior.seen < 0 || prior.seen > 50_000)) throw new Error("Amazon inventory cursor invalid");
  const active = prior?.nextToken ? prior : { sellerId: seller, nextToken: "", seen: 0,
    completedAt: null, startedAt: new Date().toISOString(), status: "pending", reason: "" };
  const marketplaceId = getAmazonMarketplaceProfile("amazon-us").marketplaceId;
  const query = new URLSearchParams({ marketplaceIds: marketplaceId,
    includedData: "summaries,fulfillmentAvailability", pageSize: "20" });
  if (active.nextToken) query.set("pageToken", active.nextToken);
  await reserve(ctx);
  const response = await httpTransport({
    url: `https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items/${encodeURIComponent(seller)}?${query}`,
    method: "GET", headers: { "x-amz-access-token": access },
    timeoutMs: 15_000, maxResponseBytes: 2 * 1024 * 1024,
  });
  if (!response.ok) throw new Error(`Amazon US inventory search failed: HTTP ${response.status}`);
  if (!response.json || typeof response.json !== "object" || Array.isArray(response.json)) {
    throw new Error("Amazon US inventory response malformed");
  }
  const body = response.json as Record<string, unknown>;
  if (!Array.isArray(body.items) || body.items.length > 20 ||
      body.pagination != null && (typeof body.pagination !== "object" || Array.isArray(body.pagination))) {
    throw new Error("Amazon inventory page missing or oversized");
  }
  const token = (body.pagination as Record<string, unknown> | undefined)?.nextToken ?? "";
  if (typeof token !== "string" || token.length > 4096 || token && token === active.nextToken ||
      active.seen + body.items.length > 50_000) throw new Error("Amazon inventory pagination invalid");
  const rows = body.items.map(raw => stock(raw, seller, marketplaceId, active.startedAt));
  if (new Set(rows.map(row => row.sku)).size !== rows.length) throw new Error("Amazon inventory duplicate SKU page");
  const next: Cursor = { sellerId: seller, nextToken: token,
    seen: active.seen + rows.length, completedAt: token ? null : new Date().toISOString(),
    startedAt: active.startedAt, status: token ? "pending" : "completed", reason: "" };
  persist(ctx, rows, next);
  await getDatabase().requestCriticalPersist();
  const read = getDatabase().prepare(`SELECT record_json FROM amazon_seller_inventory_rows
    WHERE workspace_id=@workspaceId AND provider_id=@providerId AND seller_id=@sellerId AND sku=@sku`);
  const confirmed = cursor(ctx);
  if (!confirmed || confirmed.sellerId !== seller || confirmed.nextToken !== token ||
      confirmed.seen !== next.seen || rows.some(row =>
        JSON.parse((read.get({ workspaceId: ctx.workspaceId, providerId: ctx.providerId,
          sellerId: seller, sku: row.sku }) as { record_json: string } | undefined)?.record_json ?? "null")
          ?.sourceSha256 !== row.sourceSha256)) throw new Error("Amazon inventory durable read-back failed");
  if (token) throw new Error("AMAZON_INVENTORY_PAGINATION_PENDING: durable page saved");
  return { syncType: "inventory", itemsProcessed: next.seen, itemsFailed: 0,
    liveApiVerified: true, durableReadbackVerified: true };
}
