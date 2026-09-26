/** Read-only Amazon US seller listing summaries, one durable page per invocation.
 * Amazon Listings Items v2021-08-01: https://developer-docs.amazon.com/sp-api/reference/searchlistingsitems
 * Seller offers are current listing prices, not supplier cost, margin or pricing approval.
 */
import { createHash } from "node:crypto";
import { getDatabase } from "../../../../brain/database.js";
import { getAmazonMarketplaceProfile } from "../amazon-marketplace-profiles.js";
import { httpTransport } from "../http-transport.js";
import type { LiveCommerceAdapterContext, LiveCommerceSyncResult } from "./types.js";

type Listing = {
  sku: string; asin: string | null; marketplaceId: string;
  name: string | null; status: string[]; updatedAt: string | null;
  sellerOfferPriceCents: number | null; sellerOfferCurrency: "USD" | null;
  cycleStartedAt: string; sourceSha256: string;
};
type Cursor = {
  sellerId: string; nextToken: string; seen: number;
  startedAt: string; completedAt: string | null; status: string; reason: string;
};
function sellerOfferCents(raw: unknown, marketplaceId: string): number | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) throw new Error("Amazon seller offers malformed");
  const matching = raw.filter((offer): offer is Record<string, unknown> =>
    Boolean(offer && typeof offer === "object" && !Array.isArray(offer) &&
      (offer as Record<string, unknown>).marketplaceId === marketplaceId &&
      (offer as Record<string, unknown>).offerType === "B2C"));
  if (matching.length === 0) return null;
  if (matching.length !== 1) throw new Error("Amazon seller B2C offer ambiguous");
  const price = matching[0]!.price;
  if (!price || typeof price !== "object" || Array.isArray(price)) {
    throw new Error("Amazon seller B2C price missing");
  }
  const { currency, amount } = price as Record<string, unknown>;
  if (currency !== "USD" || typeof amount !== "string" ||
      !/^(?:0|[1-9]\d{0,10})(?:\.\d{1,2})?$/.test(amount)) {
    throw new Error("Amazon seller B2C USD price invalid");
  }
  const [units, decimals = ""] = amount.split(".");
  const cents = Number(units) * 100 + Number(decimals.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error("Amazon seller B2C USD price invalid");
  return cents;
}
function tables(): void {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS amazon_listing_import_rows (
      workspace_id TEXT NOT NULL, provider_id TEXT NOT NULL, seller_id TEXT NOT NULL,
      sku TEXT NOT NULL, record_json TEXT NOT NULL,
      PRIMARY KEY(workspace_id, provider_id, seller_id, sku)
    );
    CREATE TABLE IF NOT EXISTS amazon_listing_import_cursor (
      workspace_id TEXT NOT NULL, provider_id TEXT NOT NULL, seller_id TEXT NOT NULL,
      next_token TEXT NOT NULL, seen INTEGER NOT NULL,
      started_at TEXT NOT NULL, completed_at TEXT,
      status TEXT NOT NULL, reason TEXT NOT NULL,
      PRIMARY KEY(workspace_id, provider_id)
    );
    CREATE TABLE IF NOT EXISTS amazon_listing_import_gate (
      workspace_id TEXT NOT NULL, provider_id TEXT NOT NULL,
      next_allowed_at TEXT NOT NULL, PRIMARY KEY(workspace_id, provider_id)
    );
  `);
}
function cursor(ctx: LiveCommerceAdapterContext): Cursor | null {
  tables();
  const row = getDatabase().prepare(`
    SELECT seller_id AS sellerId, next_token AS nextToken, seen,
      started_at AS startedAt, completed_at AS completedAt, status, reason
    FROM amazon_listing_import_cursor WHERE workspace_id=@workspaceId AND provider_id=@providerId
  `).get({ workspaceId: ctx.workspaceId, providerId: ctx.providerId }) as Cursor | undefined;
  return row ?? null;
}
function listing(raw: unknown, marketplaceId: string, cycleStartedAt: string): Listing {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Amazon listing malformed");
  const item = raw as Record<string, unknown>;
  if (typeof item.sku !== "string" || !item.sku.trim() || item.sku.length > 256 ||
      !Array.isArray(item.summaries) || item.summaries.length < 1) {
    throw new Error("Amazon listing missing seller SKU or summary");
  }
  const matches = item.summaries.filter((s): s is Record<string, unknown> =>
    Boolean(s && typeof s === "object" && (s as Record<string, unknown>).marketplaceId === marketplaceId));
  if (matches.length !== 1) throw new Error("Amazon listing marketplace summary ambiguous");
  const summary = matches[0]!;
  if (summary.asin != null && (typeof summary.asin !== "string" || !/^[A-Z0-9]{10}$/.test(summary.asin)) ||
      summary.status != null && (!Array.isArray(summary.status) ||
        !summary.status.every(s => typeof s === "string" && s.length <= 40)) ||
      summary.lastUpdatedDate != null && (typeof summary.lastUpdatedDate !== "string" ||
        !Number.isFinite(Date.parse(summary.lastUpdatedDate)))) {
    throw new Error("Amazon listing summary fields invalid");
  }
  const priceCents = sellerOfferCents(item.offers, marketplaceId);
  return {
    sku: item.sku, asin: summary.asin as string | undefined ?? null,
    marketplaceId, name: typeof summary.itemName === "string" ? summary.itemName.slice(0, 512) : null,
    status: summary.status as string[] | undefined ?? [],
    updatedAt: summary.lastUpdatedDate as string | undefined ?? null,
    sellerOfferPriceCents: priceCents, sellerOfferCurrency: priceCents === null ? null : "USD",
    cycleStartedAt,
    sourceSha256: createHash("sha256").update(JSON.stringify(raw)).digest("hex"),
  };
}
async function reserveRequest(ctx: LiveCommerceAdapterContext): Promise<void> {
  tables();
  const db = getDatabase();
  const key = { workspaceId: ctx.workspaceId, providerId: ctx.providerId };
  const previous = db.prepare(`SELECT next_allowed_at FROM amazon_listing_import_gate
    WHERE workspace_id=@workspaceId AND provider_id=@providerId`).get(key) as
      { next_allowed_at: string } | undefined;
  if (previous && (!Number.isFinite(Date.parse(previous.next_allowed_at)) ||
      Date.now() < Date.parse(previous.next_allowed_at))) {
    throw new Error("AMAZON_LISTINGS_RATE_LIMIT_PENDING: durable provider request gate");
  }
  db.prepare(`INSERT INTO amazon_listing_import_gate
      (workspace_id, provider_id, next_allowed_at) VALUES (@workspaceId,@providerId,@nextAllowedAt)
      ON CONFLICT(workspace_id,provider_id) DO UPDATE SET next_allowed_at=excluded.next_allowed_at`
  ).run({ ...key, nextAllowedAt: new Date(Date.now() + 1_000).toISOString() });
  await db.requestCriticalPersist();
}
function persistPage(ctx: LiveCommerceAdapterContext, rows: Listing[], next: Cursor): void {
  const db = getDatabase();
  db.exec("SAVEPOINT amazon_listing_page");
  try {
    const statement = db.prepare(`INSERT INTO amazon_listing_import_rows
      (workspace_id,provider_id,seller_id,sku,record_json)
      VALUES (@workspaceId,@providerId,@sellerId,@sku,@recordJson)
      ON CONFLICT(workspace_id,provider_id,seller_id,sku) DO UPDATE SET record_json=excluded.record_json`);
    for (const row of rows) statement.run({
      workspaceId: ctx.workspaceId, providerId: ctx.providerId, sellerId: next.sellerId,
      sku: row.sku, recordJson: JSON.stringify(row),
    });
    db.prepare(`INSERT INTO amazon_listing_import_cursor
      (workspace_id,provider_id,seller_id,next_token,seen,started_at,completed_at,status,reason)
      VALUES (@workspaceId,@providerId,@sellerId,@nextToken,@seen,@startedAt,@completedAt,@status,@reason)
      ON CONFLICT(workspace_id,provider_id) DO UPDATE SET
        seller_id=excluded.seller_id,next_token=excluded.next_token,seen=excluded.seen,
        started_at=excluded.started_at,completed_at=excluded.completed_at,
        status=excluded.status,reason=excluded.reason`).run({
      workspaceId: ctx.workspaceId, providerId: ctx.providerId, ...next,
    });
    db.exec("RELEASE SAVEPOINT amazon_listing_page");
  } catch (error) {
    db.exec("ROLLBACK TO SAVEPOINT amazon_listing_page");
    db.exec("RELEASE SAVEPOINT amazon_listing_page");
    throw error;
  }
}
export function listImportedAmazonUsListings(workspaceId: string, sellerId: string): Listing[] {
  tables();
  const rows = getDatabase().prepare(`SELECT record_json FROM amazon_listing_import_rows
    WHERE workspace_id=@workspaceId AND provider_id='amazon-us' AND seller_id=@sellerId
    ORDER BY sku LIMIT 500`).all({ workspaceId, sellerId }) as Array<{ record_json: string }>;
  return rows.map(row => {
    const record = JSON.parse(row.record_json) as Listing;
    // Pre-price snapshots must remain explicitly unpriced on a code upgrade.
    if (record.sellerOfferCurrency !== "USD" ||
        typeof record.sellerOfferPriceCents !== "number" ||
        !Number.isSafeInteger(record.sellerOfferPriceCents) ||
        record.sellerOfferPriceCents <= 0) {
      return { ...record, sellerOfferPriceCents: null, sellerOfferCurrency: null };
    }
    return record;
  });
}

export function listCurrentAmazonUsListings(workspaceId: string): Listing[] {
  const selected = cursor({ workspaceId, providerId: "amazon-us", mode: "production", credentials: {} });
  return selected ? listImportedAmazonUsListings(workspaceId, selected.sellerId)
    .filter(row => row.cycleStartedAt === selected.startedAt) : [];
}

/** No opaque provider token or access credential is exposed to the caller. */
export function getAmazonUsListingsImportStatus(workspaceId: string): {
  status: string; reason: string; itemsSeen: number; pagesPending: boolean;
  nextAllowedAt: string | null; completedAt: string | null;
} | null {
  tables();
  const row = getDatabase().prepare(`SELECT c.status, c.reason, c.seen, c.next_token,
      c.completed_at, g.next_allowed_at
    FROM amazon_listing_import_cursor c LEFT JOIN amazon_listing_import_gate g
      ON g.workspace_id=c.workspace_id AND g.provider_id=c.provider_id
    WHERE c.workspace_id=@workspaceId AND c.provider_id='amazon-us'`).get({ workspaceId }) as {
    status: string; reason: string; seen: number; next_token: string;
    completed_at: string | null; next_allowed_at: string | null;
  } | undefined;
  return row ? { status: row.status, reason: row.reason, itemsSeen: row.seen,
    pagesPending: Boolean(row.next_token), nextAllowedAt: row.next_allowed_at,
    completedAt: row.completed_at } : null;
}

export function nextPendingAmazonUsListingsImport(): {
  workspaceId: string; nextAllowedAt: string | null; startedAt: string;
} | null {
  tables();
  return getDatabase().prepare(`SELECT c.workspace_id AS workspaceId,
      g.next_allowed_at AS nextAllowedAt, c.started_at AS startedAt
    FROM amazon_listing_import_cursor c LEFT JOIN amazon_listing_import_gate g
      ON g.workspace_id=c.workspace_id AND g.provider_id=c.provider_id
    WHERE c.provider_id='amazon-us' AND c.status='pending' AND c.next_token <> ''
    ORDER BY c.started_at ASC LIMIT 1`).get() as {
    workspaceId: string; nextAllowedAt: string | null; startedAt: string;
  } | undefined ?? null;
}

export async function pauseAmazonUsListingsImport(workspaceId: string, reason: string, startedAt: string): Promise<void> {
  if (reason !== "PROVIDER_FAILURE" && reason !== "RATE_GATE_CORRUPT") {
    throw new Error("Amazon listing pause reason invalid");
  }
  tables();
  getDatabase().prepare(`UPDATE amazon_listing_import_cursor SET status='paused', reason=@reason
    WHERE workspace_id=@workspaceId AND provider_id='amazon-us' AND status='pending'
      AND started_at=@startedAt`).run({ workspaceId, reason, startedAt });
  await getDatabase().requestCriticalPersist();
}

export async function syncAmazonUsListings(ctx: LiveCommerceAdapterContext): Promise<LiveCommerceSyncResult> {
  if (ctx.providerId !== "amazon-us" || ctx.mode !== "production") {
    throw new Error("Amazon US listing import requires production Amazon US context");
  }
  const token = ctx.credentials.accessToken, seller = ctx.credentials.sellerId;
  if (typeof token !== "string" || !token.trim() || typeof seller !== "string" ||
      !/^[A-Za-z0-9_-]{1,64}$/.test(seller)) {
    throw new Error("Amazon US seller ID and access token required for listing import");
  }
  const previous = cursor(ctx);
  if (previous && previous.sellerId !== seller) throw new Error("Amazon listing seller binding changed");
  if (previous && (previous.nextToken.length > 4096 || !Number.isSafeInteger(previous.seen) ||
      previous.seen < 0 || previous.seen > 50_000)) throw new Error("Amazon listing cursor invalid");
  const active = previous?.nextToken ? previous : {
    sellerId: seller, nextToken: "", seen: 0, startedAt: new Date().toISOString(),
    completedAt: null, status: "pending", reason: "",
  };
  const marketplaceId = getAmazonMarketplaceProfile("amazon-us").marketplaceId;
  const query = new URLSearchParams({ marketplaceIds: marketplaceId, includedData: "summaries,offers", pageSize: "20" });
  if (active.nextToken) query.set("pageToken", active.nextToken);
  await reserveRequest(ctx);
  const response = await httpTransport({
    url: `https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items/${encodeURIComponent(seller)}?${query}`,
    method: "GET", headers: { "x-amz-access-token": token }, timeoutMs: 15_000,
    maxResponseBytes: 2 * 1024 * 1024,
  });
  if (!response.ok) throw new Error(`Amazon US listing search failed: HTTP ${response.status}`);
  if (!response.json || typeof response.json !== "object" || Array.isArray(response.json)) {
    throw new Error("Amazon US listing search response malformed");
  }
  const body = response.json as Record<string, unknown>;
  if (!Array.isArray(body.items) || body.items.length > 20 ||
      body.pagination != null && (typeof body.pagination !== "object" || Array.isArray(body.pagination))) {
    throw new Error("Amazon US listing page missing or oversized");
  }
  const tokenAfter = (body.pagination as Record<string, unknown> | undefined)?.nextToken ?? "";
  if (typeof tokenAfter !== "string" || tokenAfter.length > 4096 ||
      tokenAfter && tokenAfter === active.nextToken || active.seen + body.items.length > 50_000) {
    throw new Error("Amazon US listing pagination invalid");
  }
  const rows = body.items.map(raw => listing(raw, marketplaceId, active.startedAt));
  if (new Set(rows.map(row => row.sku)).size !== rows.length) throw new Error("Amazon listing duplicate SKU page");
  const next: Cursor = {
    sellerId: seller, nextToken: tokenAfter,
    seen: active.seen + rows.length, startedAt: active.startedAt,
    completedAt: tokenAfter ? null : new Date().toISOString(),
    status: tokenAfter ? "pending" : "completed", reason: "",
  };
  persistPage(ctx, rows, next);
  await getDatabase().requestCriticalPersist();
  const readback = cursor(ctx);
  const read = getDatabase().prepare(`SELECT record_json FROM amazon_listing_import_rows
    WHERE workspace_id=@workspaceId AND provider_id=@providerId AND seller_id=@sellerId AND sku=@sku`);
  if (!readback || readback.sellerId !== seller || readback.nextToken !== tokenAfter ||
      readback.seen !== next.seen || rows.some(row =>
        JSON.parse((read.get({ workspaceId: ctx.workspaceId, providerId: ctx.providerId,
          sellerId: seller, sku: row.sku }) as { record_json: string } | undefined)?.record_json ?? "null")
          ?.sourceSha256 !== row.sourceSha256)) {
    throw new Error("Amazon US listing durable read-back failed");
  }
  if (tokenAfter) throw new Error("AMAZON_LISTINGS_PAGINATION_PENDING: durable page saved");
  return { syncType: "catalog", itemsProcessed: next.seen, itemsFailed: 0,
    liveApiVerified: true, durableReadbackVerified: true };
}
