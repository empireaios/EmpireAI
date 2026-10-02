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
import { getPillowAuthority } from "../../../orchestration/pillow-commissioning/pillow-authority.js";
import { validateAmazonOfferInput, validateAmazonCatalogIdentity, buildVerifiedAmazonOfferBody, validateAmazonSubmissionReceipt,
  type AmazonSubmissionBinding } from "./amazon-listing-proof.js";
import type { MarketplaceListingPackage, MarketplacePublishId } from "../models/marketplace-adapter.js";

export type AmazonListingsPublishResult = {
  /** True only for independently confirmed listing availability; not implemented here. */
  ok: boolean;
  submissionAccepted: boolean;
  listingVerified: false;
  submissionBinding: AmazonSubmissionBinding | null;
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
): Promise<{ accessToken: string | null; blocker: string | null; requestAttempted: boolean }> {
  const config = getAmazonSpApiConfig(registryId);
  const refreshToken = resolveAmazonMarketplaceRefreshToken(
    getAmazonMarketplaceProfile(registryId),
    env,
  );
  if (!config.clientId || !config.clientSecret || !refreshToken) {
    return { accessToken: null, blocker: "Amazon LWA client/secret/refresh token incomplete", requestAttempted: false };
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
      requestAttempted: true,
    };
  }
  return { accessToken: json.access_token, blocker: null, requestAttempted: true };
}

function resolveSellerId(env: NodeJS.ProcessEnv): { sellerId: string | null; blocker: string | null } {
  const sellerId = env.AMAZON_SELLER_ID?.trim() || env.AMAZON_SP_API_SELLER_ID?.trim();
  return sellerId ? { sellerId, blocker: null } : { sellerId: null,
    blocker: "Explicit Amazon seller account ID required; it will not be inferred from an unrelated ASIN or invented fee estimate" };
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
      submissionAccepted: false,
      listingVerified: false,
      submissionBinding: null,
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

  // Package booleans and credentials are not a certification receipt or a live
  // commercial grant. Re-check canonical authority at this last effect boundary,
  // including direct/internal callers, before LWA refresh or any provider call.
  const authority = getPillowAuthority();
  if (!authority.realCommerceAuthorized || authority.birthStatus === "NOT_BORN" || authority.commerceStatus === "LOCKED") {
    blockers.push(`Canonical commerce authority is LOCKED; Pillow is NOT_BORN. ${authority.reason}`);
  }

  if (!isAmazonLiveCommerceActivated(env)) {
    blockers.push("LIVE_COMMERCE_INTEGRATION_MODE must be production with Amazon credentials");
  }
  if (!pkg.kingApproved) blockers.push("Grand King approval required");
  if (pkg.blockers.length > 0) blockers.push(...pkg.blockers);

  if (blockers.length > 0) {
    return {
      ok: false,
      submissionAccepted: false,
      listingVerified: false,
      submissionBinding: null,
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

  const prepared = validateAmazonOfferInput(pkg);
  if (!prepared.offer) {
    return { ok: false, submissionAccepted: false, listingVerified: false, submissionBinding: null,
      marketplaceId: pkg.marketplaceId, registryId, sellerId: null, sku,
      httpStatus: null, amazonStatus: null, submissionId: null, issues: [], blockers: prepared.blockers,
      liveApiCalled: false, responseBody: null };
  }
  const offer = prepared.offer;

  const seller = resolveSellerId(env);
  if (!seller.sellerId) {
    return {
      ok: false,
      submissionAccepted: false,
      listingVerified: false,
      submissionBinding: null,
      marketplaceId: pkg.marketplaceId,
      registryId,
      sellerId: null,
      sku,
      httpStatus: null,
      amazonStatus: null,
      submissionId: null,
      issues: [],
      blockers: [seller.blocker ?? "sellerId unresolved"],
      liveApiCalled: false,
      responseBody: null,
    };
  }

  const token = await refreshAccessToken(registryId, env);
  if (!token.accessToken) {
    return {
      ok: false,
      submissionAccepted: false,
      listingVerified: false,
      submissionBinding: null,
      marketplaceId: pkg.marketplaceId,
      registryId,
      sellerId: null,
      sku,
      httpStatus: null,
      amazonStatus: null,
      submissionId: null,
      issues: [],
      blockers: [token.blocker ?? "LWA refresh failed"],
      liveApiCalled: token.requestAttempted,
      responseBody: null,
    };
  }

  const profile = getAmazonMarketplaceProfile(registryId);
  const catalog = await httpTransport({
    url: `${profile.productionEndpoint}/catalog/2022-04-01/items/${encodeURIComponent(offer.asin)}` +
      `?marketplaceIds=${encodeURIComponent(profile.marketplaceId)}&includedData=identifiers`,
    method: "GET", headers: { "x-amz-access-token": token.accessToken },
  });
  const identityBlockers = catalog.ok ? validateAmazonCatalogIdentity(catalog.json, offer, profile.marketplaceId)
    : [`Amazon catalog identity lookup failed HTTP ${catalog.status}`];
  if (identityBlockers.length) {
    return { ok: false, submissionAccepted: false, listingVerified: false, submissionBinding: null,
      marketplaceId: pkg.marketplaceId, registryId, sellerId: seller.sellerId, sku: offer.sku,
      httpStatus: catalog.status, amazonStatus: null, submissionId: null, issues: [], blockers: identityBlockers,
      liveApiCalled: true, responseBody: catalog.json };
  }
  const putBody = buildVerifiedAmazonOfferBody(offer, profile.marketplaceId);
  const url =
    `${profile.productionEndpoint}/listings/2021-08-01/items/` +
    `${encodeURIComponent(seller.sellerId)}/${encodeURIComponent(offer.sku)}` +
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

  const proof = validateAmazonSubmissionReceipt(response, {
    sellerId: seller.sellerId, sku: offer.sku, marketplaceId: profile.marketplaceId, asin: offer.asin,
  });
  return {
    ok: false,
    submissionAccepted: proof.accepted,
    listingVerified: false,
    submissionBinding: proof.binding,
    marketplaceId: pkg.marketplaceId,
    registryId,
    sellerId: seller.sellerId,
    sku: offer.sku,
    httpStatus: response.status,
    amazonStatus: proof.amazonStatus,
    submissionId: proof.submissionId,
    issues: proof.issues,
    blockers: proof.accepted ? ["Submission accepted for processing; listing availability and exact marketplace readback remain unverified"] : proof.blockers,
    liveApiCalled: true,
    responseBody: response.json,
  };
}
