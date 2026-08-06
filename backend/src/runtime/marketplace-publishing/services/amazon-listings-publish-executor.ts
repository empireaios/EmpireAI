/**
 * Minimal Amazon SP-API listings publish executor.
 * Repairs the missing putListingsItem step on the existing marketplace-publishing path.
 * No new subsystem — uses live-commerce http transport + LWA refresh already in-repo.
 */
import {
  getAmazonMarketplaceProfile,
  type AmazonMarketplaceRegistryId,
  isAmazonMarketplaceRegistryId,
  resolveAmazonMarketplaceRefreshToken,
} from "../../../orchestration/reality-integration/live-commerce/amazon-marketplace-profiles.js";
import { getAmazonSpApiConfig } from "../../../orchestration/reality-integration/live-commerce/config.js";
import { isAmazonLiveCommerceActivated } from "../../../orchestration/version-1-activation/version-1-activation-config.js";
import { httpTransport } from "../../../orchestration/reality-integration/live-commerce/http-transport.js";
import type { MarketplaceListingPackage, MarketplacePublishId } from "../models/marketplace-adapter.js";

export type AmazonListingsPublishResult = {
  ok: boolean;
  marketplaceId: MarketplacePublishId;
  registryId: AmazonMarketplaceRegistryId | null;
  sellerId: string | null;
  sku: string;
  httpStatus: number | null;
  amazonStatus: string | null;
  submissionId: string | null;
  issues: unknown[];
  blockers: string[];
  liveApiCalled: boolean;
  responseBody: unknown;
};

function resolveRegistryId(marketplaceId: MarketplacePublishId): AmazonMarketplaceRegistryId | null {
  if (marketplaceId === "amazon" || marketplaceId === "amazon-us") return "amazon-us";
  if (marketplaceId === "amazon-sg") return "amazon-sg";
  if (isAmazonMarketplaceRegistryId(marketplaceId)) return marketplaceId;
  return null;
}

async function refreshAccessToken(
  registryId: AmazonMarketplaceRegistryId,
  env: NodeJS.ProcessEnv,
): Promise<{ accessToken: string | null; blocker: string | null }> {
  const config = getAmazonSpApiConfig(registryId);
  const refreshToken = resolveAmazonMarketplaceRefreshToken(
    getAmazonMarketplaceProfile(registryId),
    env,
  );
  if (!config.clientId || !config.clientSecret || !refreshToken) {
    return { accessToken: null, blocker: "Amazon LWA client/secret/refresh token incomplete" };
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const started = performance.now();
  const response = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: body.toString(),
  });
  const text = await response.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = { raw: text };
  }
  void started;

  if (!response.ok || typeof json.access_token !== "string") {
    return {
      accessToken: null,
      blocker: `Amazon LWA refresh failed HTTP ${response.status}`,
    };
  }
  return { accessToken: json.access_token, blocker: null };
}

async function resolveSellerId(
  registryId: AmazonMarketplaceRegistryId,
  accessToken: string,
  env: NodeJS.ProcessEnv,
): Promise<{ sellerId: string | null; blocker: string | null }> {
  const fromEnv = env.AMAZON_SELLER_ID?.trim() || env.AMAZON_SP_API_SELLER_ID?.trim();
  if (fromEnv) return { sellerId: fromEnv, blocker: null };

  const profile = getAmazonMarketplaceProfile(registryId);

  // marketplaceParticipations does not return sellerId — probe Product Fees with a
  // known ASIN; Amazon echoes SellerId even on client error responses.
  const feesProbe = await httpTransport({
    url: `${profile.productionEndpoint}/products/fees/v0/items/B08N5WRWNW/feesEstimate`,
    method: "POST",
    headers: { "x-amz-access-token": accessToken },
    body: {
      FeesEstimateRequest: {
        MarketplaceId: profile.marketplaceId,
        IsAmazonFulfilled: false,
        PriceToEstimateFees: {
          ListingPrice: { CurrencyCode: "USD", Amount: 10 },
        },
        Identifier: "empireai-seller-id-probe",
      },
    },
  });
  const feesJson = feesProbe.json as {
    payload?: {
      FeesEstimateResult?: {
        FeesEstimateIdentifier?: { SellerId?: string };
      };
    };
  };
  const probed =
    feesJson.payload?.FeesEstimateResult?.FeesEstimateIdentifier?.SellerId?.trim() || null;
  if (probed) return { sellerId: probed, blocker: null };

  return {
    sellerId: null,
    blocker:
      "Could not resolve Amazon SellerId — set AMAZON_SELLER_ID (Seller Central merchant token) on Railway",
  };
}

function buildListingsPutBody(pkg: MarketplaceListingPackage, marketplaceId: string): Record<string, unknown> {
  const formatted = (pkg.formattedPayload ?? {}) as Record<string, unknown>;
  const productType =
    (typeof formatted.productType === "string" && formatted.productType) ||
    pkg.specifications.productType ||
    "PRODUCT";
  const baseAttrs =
    formatted.attributes && typeof formatted.attributes === "object"
      ? (formatted.attributes as Record<string, unknown>)
      : {};

  const withMarketplace = (entries: unknown): unknown => {
    if (!Array.isArray(entries)) return entries;
    return entries.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      return {
        marketplace_id: marketplaceId,
        language_tag: "en_US",
        ...(entry as Record<string, unknown>),
      };
    });
  };

  const attributes: Record<string, unknown> = {
    ...baseAttrs,
    item_name: withMarketplace(
      baseAttrs.item_name ?? [{ value: pkg.title, marketplace_id: marketplaceId, language_tag: "en_US" }],
    ),
    product_description: withMarketplace(
      baseAttrs.product_description ?? [
        { value: pkg.description, marketplace_id: marketplaceId, language_tag: "en_US" },
      ],
    ),
    condition_type: [{ value: "new_new", marketplace_id: marketplaceId }],
    list_price: [
      {
        value: pkg.price,
        currency: pkg.currency || "USD",
        marketplace_id: marketplaceId,
      },
    ],
  };

  if (Array.isArray(pkg.bulletPoints) && pkg.bulletPoints.length > 0) {
    attributes.bullet_point = pkg.bulletPoints.map((value) => ({
      value,
      marketplace_id: marketplaceId,
      language_tag: "en_US",
    }));
  }

  if (pkg.images[0]) {
    attributes.main_product_image_locator = [
      { media_location: pkg.images[0], marketplace_id: marketplaceId },
    ];
  }

  return {
    productType,
    requirements: pkg.specifications.requirements || "LISTING",
    attributes,
  };
}

/** Execute live Amazon Listings Items put for an approved package. */
export async function executeAmazonListingsPublish(
  pkg: MarketplaceListingPackage,
  env: NodeJS.ProcessEnv = process.env,
): Promise<AmazonListingsPublishResult> {
  const blockers: string[] = [];
  const registryId = resolveRegistryId(pkg.marketplaceId);
  const sku =
    pkg.specifications.sku ||
    pkg.productId ||
    `EMP-${pkg.packageId.replace(/-/g, "").slice(0, 12)}`;

  if (!registryId) {
    return {
      ok: false,
      marketplaceId: pkg.marketplaceId,
      registryId: null,
      sellerId: null,
      sku,
      httpStatus: null,
      amazonStatus: null,
      submissionId: null,
      issues: [],
      blockers: [`Marketplace ${pkg.marketplaceId} is not an Amazon V1 registry target`],
      liveApiCalled: false,
      responseBody: null,
    };
  }

  if (!isAmazonLiveCommerceActivated(env)) {
    blockers.push("LIVE_COMMERCE_INTEGRATION_MODE must be production with Amazon credentials");
  }
  if (!pkg.kingApproved) blockers.push("Grand King approval required");
  if (pkg.blockers.length > 0) blockers.push(...pkg.blockers);

  if (blockers.length > 0) {
    return {
      ok: false,
      marketplaceId: pkg.marketplaceId,
      registryId,
      sellerId: null,
      sku,
      httpStatus: null,
      amazonStatus: null,
      submissionId: null,
      issues: [],
      blockers,
      liveApiCalled: false,
      responseBody: null,
    };
  }

  const token = await refreshAccessToken(registryId, env);
  if (!token.accessToken) {
    return {
      ok: false,
      marketplaceId: pkg.marketplaceId,
      registryId,
      sellerId: null,
      sku,
      httpStatus: null,
      amazonStatus: null,
      submissionId: null,
      issues: [],
      blockers: [token.blocker ?? "LWA refresh failed"],
      liveApiCalled: false,
      responseBody: null,
    };
  }

  const seller = await resolveSellerId(registryId, token.accessToken, env);
  if (!seller.sellerId) {
    return {
      ok: false,
      marketplaceId: pkg.marketplaceId,
      registryId,
      sellerId: null,
      sku,
      httpStatus: null,
      amazonStatus: null,
      submissionId: null,
      issues: [],
      blockers: [seller.blocker ?? "sellerId unresolved"],
      liveApiCalled: true,
      responseBody: null,
    };
  }

  const profile = getAmazonMarketplaceProfile(registryId);
  const putBody = buildListingsPutBody(pkg, profile.marketplaceId);
  const url =
    `${profile.productionEndpoint}/listings/2021-08-01/items/` +
    `${encodeURIComponent(seller.sellerId)}/${encodeURIComponent(sku)}` +
    `?marketplaceIds=${encodeURIComponent(profile.marketplaceId)}&issueLocale=en_US`;

  const response = await httpTransport({
    url,
    method: "PUT",
    headers: {
      "x-amz-access-token": token.accessToken,
      "content-type": "application/json",
    },
    body: putBody,
  });

  const body = response.json as {
    status?: string;
    submissionId?: string;
    issues?: unknown[];
  };
  const amazonStatus = typeof body.status === "string" ? body.status : null;
  const issues = Array.isArray(body.issues) ? body.issues : [];
  const accepted =
    response.ok &&
    (amazonStatus === "ACCEPTED" ||
      amazonStatus === "VALID" ||
      amazonStatus === undefined ||
      issues.length === 0);

  return {
    ok: accepted,
    marketplaceId: pkg.marketplaceId,
    registryId,
    sellerId: seller.sellerId,
    sku,
    httpStatus: response.status,
    amazonStatus,
    submissionId: typeof body.submissionId === "string" ? body.submissionId : null,
    issues,
    blockers: accepted
      ? []
      : [
          `Amazon putListingsItem HTTP ${response.status}` +
            (amazonStatus ? ` status=${amazonStatus}` : ""),
        ],
    liveApiCalled: true,
    responseBody: response.json,
  };
}
