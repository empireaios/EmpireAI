import { createHmac, timingSafeEqual } from "node:crypto";

import {
  type AmazonMarketplaceRegistryId,
  getAmazonMarketplaceProfile,
  resolveAmazonSpApiEndpoint,
} from "../amazon-marketplace-profiles.js";
import { getAmazonSpApiConfig, isProductionLiveCommerce } from "../config.js";
import { httpTransport } from "../http-transport.js";
import type {
  LiveCommerceAdapterContext,
  LiveCommerceProviderAdapter,
  LiveCommerceSyncResult,
  LiveCommerceValidationResult,
} from "./types.js";

// A successful Sellers API ping establishes account connectivity only. It is
// neither an order import nor evidence that inventory/pricing/listing flows work.
const AMAZON_CAPABILITIES = ["account_validation"];

function createAmazonAdapterHelpers(registryId: AmazonMarketplaceRegistryId) {
  const profile = getAmazonMarketplaceProfile(registryId);

  function resolveEndpoint(mode: LiveCommerceAdapterContext["mode"]): string {
    return resolveAmazonSpApiEndpoint(profile, mode);
  }

  function getConfig() {
    return getAmazonSpApiConfig(registryId);
  }

  function hasRequiredCredentials(
    credentials: Record<string, unknown>,
    mode: "sandbox" | "production",
  ): boolean {
    if (mode === "sandbox") {
      return Boolean(
        credentials.accessToken || credentials.refreshToken || credentials.lwaRefreshToken,
      );
    }
    const config = getConfig();
    return Boolean(
      credentials.accessToken &&
        (credentials.refreshToken || credentials.lwaRefreshToken || config.refreshToken) &&
        config.clientId &&
        config.clientSecret,
    );
  }

  async function pingMarketplace(ctx: LiveCommerceAdapterContext): Promise<boolean> {
    if (ctx.mode === "sandbox") {
      return hasRequiredCredentials(ctx.credentials, ctx.mode);
    }

    const response = await httpTransport({
      url: `${resolveEndpoint(ctx.mode)}/sellers/v1/marketplaceParticipations`,
      method: "GET",
      headers: {
        "x-amz-access-token": String(ctx.credentials.accessToken ?? ""),
      },
    });
    return response.ok;
  }

  function buildSyncResult(
    syncType: LiveCommerceSyncResult["syncType"],
    _ctx: LiveCommerceAdapterContext,
    itemsProcessed: number,
  ): LiveCommerceSyncResult {
    return {
      syncType,
      itemsProcessed,
      itemsFailed: 0,
      liveApiVerified: false, // fixture counts are never a live API receipt
    };
  }

  return {
    profile,
    resolveEndpoint,
    getConfig,
    hasRequiredCredentials,
    pingMarketplace,
    buildSyncResult,
  };
}

export function createAmazonSpApiAdapter(
  registryId: AmazonMarketplaceRegistryId,
): LiveCommerceProviderAdapter {
  const helpers = createAmazonAdapterHelpers(registryId);

  return {
    providerId: registryId,
    category: "marketplace",

    async validateConnection(ctx): Promise<LiveCommerceValidationResult> {
      const blockers: string[] = [];
      if (!helpers.hasRequiredCredentials(ctx.credentials, ctx.mode)) {
        blockers.push(`Amazon SP-API credentials incomplete for ${registryId}`);
      }

      let liveApiVerified = false;
      if (blockers.length === 0) {
        const connected = await helpers.pingMarketplace(ctx);
        liveApiVerified = ctx.mode === "production" && connected;
        if (!connected) {
          blockers.push(`Amazon SP-API marketplace validation failed for ${registryId}`);
        }
      }

      return {
        valid: blockers.length === 0,
        providerId: ctx.providerId,
        capabilities: AMAZON_CAPABILITIES,
        blockers,
        liveApiVerified,
      };
    },

    async syncCatalog(ctx) {
      if (ctx.mode === "sandbox") return helpers.buildSyncResult("catalog", ctx, 12);
      throw new Error("AMAZON_CATALOG_SYNC_UNIMPLEMENTED: no persisted catalog receipt");
    },

    async syncInventory(ctx) {
      if (ctx.mode === "sandbox") return helpers.buildSyncResult("inventory", ctx, 8);
      throw new Error("AMAZON_INVENTORY_SYNC_UNIMPLEMENTED: FBA summaries are not seller-fulfilled stock evidence");
    },

    async syncPricing(ctx) {
      if (ctx.mode === "sandbox") return helpers.buildSyncResult("pricing", ctx, 6);
      throw new Error("AMAZON_PRICING_SYNC_UNIMPLEMENTED: no seller SKU or persisted price receipt");
    },

    async syncOrders(ctx) {
      if (ctx.mode === "sandbox") return helpers.buildSyncResult("orders", ctx, 4);
      throw new Error("AMAZON_ORDERS_SYNC_UNIMPLEMENTED: no cursor, durable order import or reconciliation");
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
}

export const amazonUsSpApiAdapter = createAmazonSpApiAdapter("amazon-us");
export const amazonSgSpApiAdapter = createAmazonSpApiAdapter("amazon-sg");

/** @deprecated Legacy alias — use amazonUsSpApiAdapter (B6-01D). */
export const amazonSpApiAdapter = amazonUsSpApiAdapter;

export function amazonOAuthAuthorizeUrl(input: {
  registryId: AmazonMarketplaceRegistryId;
  redirectUri: string;
  state: string;
  scopes?: string[];
}): string {
  const profile = getAmazonMarketplaceProfile(input.registryId);
  const config = getAmazonSpApiConfig(input.registryId);
  const clientId = config.clientId || "sandbox-client-id";
  const scope = (input.scopes ?? ["sellingpartnerapi::notifications"]).join(" ");
  const params = new URLSearchParams({
    client_id: clientId,
    scope,
    response_type: "code",
    redirect_uri: input.redirectUri,
    state: input.state,
  });
  return `${profile.sellerCentralAuthorizeBaseUrl}?${params.toString()}`;
}

export async function amazonOAuthExchangeCode(input: {
  registryId: AmazonMarketplaceRegistryId;
  code: string;
  redirectUri: string;
}): Promise<Record<string, unknown>> {
  const config = getAmazonSpApiConfig(input.registryId);
  if (!isProductionLiveCommerce() || !config.clientId || !config.clientSecret) {
    return {
      accessToken: `sandbox-amazon-access-${input.registryId}-${input.code.slice(0, 8)}`,
      refreshToken: `sandbox-amazon-refresh-${input.registryId}-${input.code.slice(0, 8)}`,
      expiresIn: 3600,
      tokenType: "bearer",
    };
  }

  const response = await httpTransport({
    url: "https://api.amazon.com/auth/o2/token",
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: undefined,
  });

  if (!response.ok) {
    throw new Error(`Amazon OAuth token exchange failed for ${input.registryId}`);
  }

  const json = response.json as Record<string, unknown>;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
    tokenType: json.token_type,
  };
}

export async function amazonOAuthRefreshToken(
  registryId: AmazonMarketplaceRegistryId,
  refreshToken: string,
): Promise<Record<string, unknown>> {
  const config = getAmazonSpApiConfig(registryId);
  if (!isProductionLiveCommerce() || !config.clientId || !config.clientSecret) {
    return {
      accessToken: `sandbox-amazon-access-refreshed-${registryId}-${Date.now()}`,
      refreshToken,
      expiresIn: 3600,
      tokenType: "bearer",
    };
  }

  // LWA requires application/x-www-form-urlencoded (not JSON).
  const form = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });
  const raw = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: form.toString(),
  });
  const text = await raw.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error(`Amazon OAuth refresh failed for ${registryId}: non-JSON response`);
  }

  if (!raw.ok) throw new Error(`Amazon OAuth refresh failed for ${registryId}`);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresIn: json.expires_in,
    tokenType: json.token_type,
  };
}
