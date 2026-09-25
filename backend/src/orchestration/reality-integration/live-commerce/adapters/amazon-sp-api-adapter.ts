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
  // Seller Central expects an SP-API application ID here; the LWA client ID is
  // only used in the separate code/token exchange. The redirect URI is the
  // registered callback, not a consent-page query parameter.
  if (isProductionLiveCommerce() && !config.applicationId.trim()) {
    throw new Error("Amazon SP-API application ID is not configured");
  }
  if (!input.state.trim()) throw new Error("Amazon OAuth state is required");
  const params = new URLSearchParams({
    application_id: config.applicationId || "sandbox-application-id",
    state: input.state,
  });
  return `${profile.sellerCentralAuthorizeBaseUrl}?${params.toString()}`;
}

async function exchangeLwaToken(
  registryId: AmazonMarketplaceRegistryId,
  form: URLSearchParams,
  requireRefreshToken: boolean,
): Promise<Record<string, unknown>> {
  const response = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: form.toString(),
    signal: AbortSignal.timeout(10_000),
  });
  // Do not include response bodies or secrets in errors or logs.
  if (!response.ok) throw new Error(`Amazon OAuth token exchange failed for ${registryId}`);
  let json: Record<string, unknown>;
  try {
    json = await response.json() as Record<string, unknown>;
  } catch {
    throw new Error(`Amazon OAuth token exchange returned invalid JSON for ${registryId}`);
  }
  if (
    !json || typeof json.access_token !== "string" || !json.access_token ||
    (requireRefreshToken && (typeof json.refresh_token !== "string" || !json.refresh_token)) ||
    json.token_type !== "bearer" ||
    typeof json.expires_in !== "number" ||
    !Number.isFinite(json.expires_in) || json.expires_in <= 0
  ) {
    throw new Error(`Amazon OAuth token exchange returned invalid credentials for ${registryId}`);
  }
  return json;
}

export async function amazonOAuthExchangeCode(input: {
  registryId: AmazonMarketplaceRegistryId;
  code: string;
  redirectUri: string;
}): Promise<Record<string, unknown>> {
  if (!input.code || !input.redirectUri) throw new Error("Amazon OAuth code and redirect URI are required");
  const config = getAmazonSpApiConfig(input.registryId);
  if (!isProductionLiveCommerce()) {
    return {
      accessToken: `sandbox-amazon-access-${input.registryId}-${input.code.slice(0, 8)}`,
      refreshToken: `sandbox-amazon-refresh-${input.registryId}-${input.code.slice(0, 8)}`,
      expiresIn: 3600,
      tokenType: "bearer",
    };
  }
  if (!config.clientId || !config.clientSecret || !config.applicationId) {
    throw new Error(`Amazon OAuth application credentials incomplete for ${input.registryId}`);
  }
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });
  const json = await exchangeLwaToken(input.registryId, form, true);
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
  if (!refreshToken) throw new Error("Amazon OAuth refresh token is required");
  const config = getAmazonSpApiConfig(registryId);
  if (!isProductionLiveCommerce()) {
    return {
      accessToken: `sandbox-amazon-access-refreshed-${registryId}-${Date.now()}`,
      refreshToken,
      expiresIn: 3600,
      tokenType: "bearer",
    };
  }
  if (!config.clientId || !config.clientSecret) {
    throw new Error(`Amazon OAuth application credentials incomplete for ${registryId}`);
  }
  const form = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });
  const json = await exchangeLwaToken(registryId, form, false);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresIn: json.expires_in,
    tokenType: json.token_type,
  };
}
