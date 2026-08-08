/**
 * Amazon SP-API preflight for first-dollar pre-sale.
 * Restrictions BEFORE recommend/publish. Fees for economics. BUYABLE ≠ ACCEPTED.
 */
import {
  getAmazonMarketplaceProfile,
  resolveAmazonMarketplaceRefreshToken,
} from "../reality-integration/live-commerce/amazon-marketplace-profiles.js";
import { getAmazonSpApiConfig } from "../reality-integration/live-commerce/config.js";
import { httpTransport } from "../reality-integration/live-commerce/http-transport.js";
import {
  AMAZON_US_MARKETPLACE_ID,
  PROOF_001_BLOCKED_ASIN,
  type CommercialOfferState,
} from "./models.js";

const REGISTRY_ID = "amazon-us" as const;

export type AmazonSession = {
  accessToken: string;
  sellerId: string;
  endpoint: string;
  marketplaceId: string;
};

export async function openAmazonUsSession(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ session: AmazonSession | null; blocker: string | null }> {
  const config = getAmazonSpApiConfig(REGISTRY_ID);
  const profile = getAmazonMarketplaceProfile(REGISTRY_ID);
  const refreshToken = resolveAmazonMarketplaceRefreshToken(profile, env);
  if (!config.clientId || !config.clientSecret || !refreshToken) {
    return { session: null, blocker: "Amazon LWA credentials incomplete" };
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });
  const tokenRes = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: body.toString(),
  });
  const tokenJson = (await tokenRes.json().catch(() => ({}))) as {
    access_token?: string;
  };
  if (!tokenRes.ok || typeof tokenJson.access_token !== "string") {
    return { session: null, blocker: `Amazon LWA refresh failed HTTP ${tokenRes.status}` };
  }

  const sellerFromEnv = env.AMAZON_SELLER_ID?.trim() || env.AMAZON_SP_API_SELLER_ID?.trim();
  let sellerId = sellerFromEnv || null;
  if (!sellerId) {
    const feesProbe = await httpTransport({
      url: `${profile.productionEndpoint}/products/fees/v0/items/B08N5WRWNW/feesEstimate`,
      method: "POST",
      headers: { "x-amz-access-token": tokenJson.access_token },
      body: {
        FeesEstimateRequest: {
          MarketplaceId: profile.marketplaceId,
          IsAmazonFulfilled: false,
          PriceToEstimateFees: {
            ListingPrice: { CurrencyCode: "USD", Amount: 10 },
          },
          Identifier: "empireai-presale-seller-id-probe",
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
    sellerId =
      feesJson.payload?.FeesEstimateResult?.FeesEstimateIdentifier?.SellerId?.trim() || null;
  }

  if (!sellerId) {
    return {
      session: null,
      blocker: "Could not resolve Amazon SellerId — set AMAZON_SELLER_ID",
    };
  }

  return {
    session: {
      accessToken: tokenJson.access_token,
      sellerId,
      endpoint: profile.productionEndpoint,
      marketplaceId: profile.marketplaceId || AMAZON_US_MARKETPLACE_ID,
    },
    blocker: null,
  };
}

export async function searchCatalogAsin(
  session: AmazonSession,
  keywords: string,
): Promise<{ asin: string | null; blocker: string | null }> {
  const cleaned = keywords.replace(/[^\w\s]/g, " ").trim().split(/\s+/).slice(0, 8).join(" ");
  if (!cleaned) return { asin: null, blocker: "Empty keywords for catalog search" };

  const url =
    `${session.endpoint}/catalog/2022-04-01/items` +
    `?marketplaceIds=${encodeURIComponent(session.marketplaceId)}` +
    `&keywords=${encodeURIComponent(cleaned)}` +
    `&includedData=summaries&pageSize=3`;

  const response = await httpTransport({
    url,
    method: "GET",
    headers: { "x-amz-access-token": session.accessToken },
  });
  if (!response.ok) {
    return { asin: null, blocker: `Catalog search failed HTTP ${response.status}` };
  }

  const items = (response.json as {
    items?: Array<{
      asin?: string;
      summaries?: Array<{ brandName?: string; itemName?: string }>;
    }>;
  })?.items;

  if (!Array.isArray(items) || items.length === 0) {
    return { asin: null, blocker: "No Amazon catalog ASIN matched supplier title" };
  }

  for (const item of items) {
    const asin = item.asin?.trim();
    if (!asin) continue;
    if (asin.toUpperCase() === PROOF_001_BLOCKED_ASIN) continue;
    const brand = item.summaries?.[0]?.brandName?.toLowerCase() ?? "";
    if (brand.includes("anker")) continue;
    return { asin, blocker: null };
  }

  return {
    asin: null,
    blocker: "Catalog matches were brand-gated / Proof-001 failure class — skipped",
  };
}

export type ListingsRestrictionResult = {
  restricted: boolean;
  qualificationRequired: boolean;
  reasons: string[];
  raw: unknown;
};

export async function getListingsRestrictions(
  session: AmazonSession,
  asin: string,
): Promise<ListingsRestrictionResult> {
  const url =
    `${session.endpoint}/listings/2021-08-01/restrictions` +
    `?asin=${encodeURIComponent(asin)}` +
    `&sellerId=${encodeURIComponent(session.sellerId)}` +
    `&marketplaceIds=${encodeURIComponent(session.marketplaceId)}` +
    `&conditionType=new_new`;

  const response = await httpTransport({
    url,
    method: "GET",
    headers: { "x-amz-access-token": session.accessToken },
  });

  const json = response.json as {
    restrictions?: Array<{
      marketplaceId?: string;
      conditionType?: string;
      reasons?: Array<{ reasonCode?: string; message?: string }>;
    }>;
    errors?: Array<{ message?: string; code?: string }>;
  };

  if (!response.ok) {
    const errMsg =
      json.errors?.map((e) => e.message || e.code).filter(Boolean).join("; ") ||
      `HTTP ${response.status}`;
    return {
      restricted: true,
      qualificationRequired: false,
      reasons: [`Restrictions API unavailable: ${errMsg}`],
      raw: json,
    };
  }

  const restrictions = Array.isArray(json.restrictions) ? json.restrictions : [];
  const reasons: string[] = [];
  let qualificationRequired = false;

  for (const row of restrictions) {
    for (const reason of row.reasons ?? []) {
      const code = reason.reasonCode ?? "UNKNOWN";
      const message = reason.message ?? "";
      reasons.push(`${code}: ${message}`.trim());
      if (
        /APPROVAL|QUALIFICATION|NOT_ELIGIBLE|RESTRICTED/i.test(code) ||
        /approval|qualification|not eligible|brand/i.test(message)
      ) {
        qualificationRequired = true;
      }
    }
  }

  return {
    restricted: reasons.length > 0,
    qualificationRequired,
    reasons,
    raw: json,
  };
}

export type FeesEstimateResult = {
  totalFeesUsd: number | null;
  freshness: "LIVE" | "UNAVAILABLE";
  raw: unknown;
  blocker: string | null;
};

export async function estimateAmazonFees(
  session: AmazonSession,
  asin: string,
  listingPriceUsd: number,
): Promise<FeesEstimateResult> {
  const response = await httpTransport({
    url: `${session.endpoint}/products/fees/v0/items/${encodeURIComponent(asin)}/feesEstimate`,
    method: "POST",
    headers: { "x-amz-access-token": session.accessToken },
    body: {
      FeesEstimateRequest: {
        MarketplaceId: session.marketplaceId,
        IsAmazonFulfilled: false,
        PriceToEstimateFees: {
          ListingPrice: { CurrencyCode: "USD", Amount: listingPriceUsd },
        },
        Identifier: `empireai-presale-fees-${asin}`,
      },
    },
  });

  const json = response.json as {
    payload?: {
      FeesEstimateResult?: {
        Status?: string;
        FeesEstimate?: {
          TotalFeesEstimate?: { Amount?: number; CurrencyCode?: string };
        };
        Error?: { Message?: string; Code?: string };
      };
    };
    errors?: Array<{ message?: string }>;
  };

  const total =
    json.payload?.FeesEstimateResult?.FeesEstimate?.TotalFeesEstimate?.Amount;
  if (typeof total === "number" && Number.isFinite(total)) {
    return { totalFeesUsd: total, freshness: "LIVE", raw: json, blocker: null };
  }

  const err =
    json.payload?.FeesEstimateResult?.Error?.Message ||
    json.errors?.map((e) => e.message).filter(Boolean).join("; ") ||
    `Fees estimate unavailable HTTP ${response.status}`;
  return { totalFeesUsd: null, freshness: "UNAVAILABLE", raw: json, blocker: err };
}

/**
 * Interpret post-publication listing item into commercial states.
 * ACCEPTED alone never yields BUYABLE.
 */
export function interpretListingCommercialState(input: {
  amazonStatus?: string | null;
  summaries?: Array<{ status?: string[]; selectable?: boolean }>;
  issues?: Array<{ code?: string; severity?: string; message?: string; categories?: string[] }>;
  offers?: Array<{ offerType?: string }>;
}): { state: CommercialOfferState; reasons: string[] } {
  const reasons: string[] = [];
  const issues = input.issues ?? [];
  const statusBits = (input.summaries ?? []).flatMap((s) => s.status ?? []);
  const selectable = (input.summaries ?? []).some((s) => s.selectable === true);

  for (const issue of issues) {
    const blob = `${issue.code ?? ""} ${issue.message ?? ""} ${(issue.categories ?? []).join(" ")}`;
    if (/18304|QUALIFICATION_REQUIRED/i.test(blob)) {
      reasons.push(issue.message || "QUALIFICATION_REQUIRED");
      return { state: "QUALIFICATION_REQUIRED", reasons };
    }
    if (/LISTING_SUPPRESSED|SUPPRESSED/i.test(blob)) {
      reasons.push(issue.message || "LISTING_SUPPRESSED");
      return { state: "SUPPRESSED", reasons };
    }
  }

  if (statusBits.some((s) => /SUPPRESSED/i.test(s))) {
    reasons.push("summary status SUPPRESSED");
    return { state: "SUPPRESSED", reasons };
  }
  if (statusBits.some((s) => /INACTIVE/i.test(s))) {
    reasons.push("summary status INACTIVE");
    return { state: "INACTIVE", reasons };
  }

  const hasBuyableOffer =
    selectable &&
    (input.offers?.length ?? 0) > 0 &&
    statusBits.some((s) => /BUYABLE|DISCOVERABLE/i.test(s)) &&
    !statusBits.some((s) => /SUPPRESSED|INACTIVE/i.test(s));

  if (hasBuyableOffer && issues.every((i) => (i.severity ?? "").toUpperCase() !== "ERROR")) {
    return { state: "BUYABLE", reasons: ["selectable offer with no blocking ERROR issues"] };
  }

  if (statusBits.some((s) => /DISCOVERABLE/i.test(s))) {
    reasons.push("DISCOVERABLE without confirmed BUYABLE offer");
    return { state: "DISCOVERABLE", reasons };
  }

  if (input.amazonStatus && /ACCEPTED/i.test(input.amazonStatus)) {
    reasons.push("ACCEPTED is not BUYABLE without post-status verification");
    return { state: "ACCEPTED", reasons };
  }

  if (input.amazonStatus && /SUBMITTED|IN_PROGRESS/i.test(input.amazonStatus)) {
    return { state: "SUBMITTED", reasons: [String(input.amazonStatus)] };
  }

  return { state: "UNKNOWN", reasons: reasons.length ? reasons : ["Insufficient listing evidence"] };
}

/** Regression guard: Proof 001 Anker / brand-suppressed pattern must never qualify. */
export function isProof001FailureClass(input: {
  asin?: string | null;
  productName?: string | null;
  brandName?: string | null;
  amazonSellerSku?: string | null;
}): boolean {
  const asin = (input.asin ?? "").toUpperCase();
  const sku = (input.amazonSellerSku ?? "").toUpperCase();
  const name = `${input.productName ?? ""} ${input.brandName ?? ""}`.toLowerCase();
  if (asin === PROOF_001_BLOCKED_ASIN) return true;
  if (sku.includes("EMP-PROOF-1786072434049")) return true;
  if (/\banker\b/.test(name)) return true;
  return false;
}
