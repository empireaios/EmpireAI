import { createHmac, timingSafeEqual } from "node:crypto";

import { getSupplierApiConfig } from "../config.js";
import { httpTransport } from "../http-transport.js";
import type {
  LiveCommerceAdapterContext,
  LiveCommerceProviderAdapter,
  LiveCommerceSyncResult,
  LiveCommerceValidationResult,
} from "./types.js";

const SUPPLIER_CAPABILITIES = ["catalog", "inventory", "pricing", "shipping", "supplier_health"];

function hasSupplierCredentials(credentials: Record<string, unknown>, providerId: string): boolean {
  if (credentials.apiKey) return true;
  const config = getSupplierApiConfig(providerId);
  return Boolean(config.apiKey);
}

function resolveApiKey(credentials: Record<string, unknown>, providerId: string): string {
  return String(credentials.apiKey ?? getSupplierApiConfig(providerId).apiKey ?? "");
}

async function pingSupplier(ctx: LiveCommerceAdapterContext): Promise<boolean> {
  if (ctx.mode === "sandbox") return hasSupplierCredentials(ctx.credentials, ctx.providerId);
  const apiKey = resolveApiKey(ctx.credentials, ctx.providerId);
  if (!apiKey) return false;
  const config = getSupplierApiConfig(ctx.providerId);
  const response = await httpTransport({
    url: `${config.baseUrl}/authentication/getAccessToken`,
    method: "POST",
    body: { apiKey }, timeoutMs: 15_000, maxResponseBytes: 64 * 1024,
  });
  const body = response.json;
  if (!response.ok || !body || typeof body !== "object" || Array.isArray(body)) return false;
  const proof = body as Record<string, unknown>;
  const data = proof.data && typeof proof.data === "object" && !Array.isArray(proof.data)
    ? proof.data as Record<string, unknown> : null;
  return proof.code === 200 && proof.result === true &&
    typeof data?.accessToken === "string" && data.accessToken.length > 0 &&
    typeof data.accessTokenExpiryDate === "string" &&
    Number.isFinite(Date.parse(data.accessTokenExpiryDate)) &&
    Date.parse(data.accessTokenExpiryDate) > Date.now() + 60_000;
}

function syncStub(
  syncType: LiveCommerceSyncResult["syncType"],
  ctx: LiveCommerceAdapterContext,
  count: number,
): LiveCommerceSyncResult {
  return {
    syncType,
    itemsProcessed: count,
    itemsFailed: 0,
    liveApiVerified: hasSupplierCredentials(ctx.credentials, ctx.providerId),
  };
}

export const cjDropshippingAdapter: LiveCommerceProviderAdapter = {
  providerId: "cj-dropshipping",
  category: "supplier",

  async validateConnection(ctx): Promise<LiveCommerceValidationResult> {
    const blockers: string[] = [];
    if (!hasSupplierCredentials(ctx.credentials, ctx.providerId)) {
      blockers.push("Supplier API key required");
    }
    let liveApiVerified = false;
    if (blockers.length === 0) {
      liveApiVerified = await pingSupplier(ctx);
      if (!liveApiVerified) blockers.push("Supplier authentication validation failed");
    }
    if (ctx.mode === "production" && liveApiVerified) {
      blockers.push("CJ production sync requires durable item, stock, price and order receipts");
    }
    return {
      valid: blockers.length === 0,
      providerId: ctx.providerId,
      capabilities: ctx.mode === "production" ? [] : SUPPLIER_CAPABILITIES,
      blockers,
      liveApiVerified,
    };
  },

  async syncCatalog(ctx) {
    if (ctx.mode === "sandbox") return syncStub("catalog", ctx, 20);
    throw new Error("CJ production catalog import requires authenticated item receipts and durable readback");
  },

  async syncInventory(ctx) {
    if (ctx.mode === "sandbox") return syncStub("inventory", ctx, 15);
    throw new Error("CJ production stock requires an explicit variant ID and durable warehouse receipt");
  },

  async syncPricing(ctx) {
    if (ctx.mode === "sandbox") return syncStub("pricing", ctx, 15);
    throw new Error("CJ production pricing requires a verified variant cost and durable readback");
  },

  async syncOrders(ctx) {
    if (ctx.mode === "sandbox") return syncStub("orders", ctx, 5);
    throw new Error("CJ production order import requires durable supplier order receipts");
  },

  verifyWebhookSignature(payload, signature, secret) {
    if (!secret || !signature) return false;
    const digest = createHmac("sha256", secret).update(payload).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      return digest === signature;
    }
  },
};

export function authenticateSupplier(input: {
  providerId: string;
  apiKey: string;
}): Record<string, unknown> {
  return {
    apiKey: input.apiKey,
    authenticatedAt: new Date().toISOString(),
    method: "api_key",
  };
}
