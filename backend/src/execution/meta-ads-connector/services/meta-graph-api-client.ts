import { randomUUID } from "node:crypto";

import { loadMetaAdsEnv } from "../config/meta-ads-env.js";
import type { MetaAdCreative, MetaAudienceTargeting } from "../models/meta-ads-campaign-record.js";

export class MetaGraphApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly metaError?: unknown,
  ) {
    super(message);
    this.name = "MetaGraphApiError";
  }
}

export type MetaTokenResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number | null;
};

export type MetaLaunchResult = {
  metaCampaignId: string;
  metaAdSetId: string;
  metaCreativeId: string;
  metaAdId: string;
  status: "ACTIVE" | "PAUSED";
};

export type MetaCampaignInsights = {
  spendCents: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  currency: string;
};

const META_SCOPES = ["ads_management", "ads_read", "business_management"];

function graphBaseUrl(): string {
  const env = loadMetaAdsEnv();
  return `https://graph.facebook.com/${env.META_ADS_GRAPH_VERSION}`;
}

async function graphFetch<T>(
  path: string,
  options: {
    method?: string;
    accessToken?: string;
    body?: Record<string, unknown>;
    query?: Record<string, string>;
  },
): Promise<T> {
  const url = new URL(`${graphBaseUrl()}${path}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
    }
  }
  if (options.accessToken) {
    url.searchParams.set("access_token", options.accessToken);
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok || payload.error) {
    throw new MetaGraphApiError(
      payload.error?.message ?? `Meta Graph API request failed (${response.status})`,
      response.status,
      payload.error,
    );
  }

  return payload;
}

function mockMetaId(prefix: string): string {
  return `${prefix}_mock_${randomUUID().slice(0, 12)}`;
}

function buildTargeting(audience: MetaAudienceTargeting): Record<string, unknown> {
  return {
    geo_locations: { countries: audience.countries },
    age_min: audience.ageMin,
    age_max: audience.ageMax,
    interests: audience.interests.map((interest) => ({ name: interest })),
  };
}

/** Meta Marketing API client with mock fallback for Protect The Empire. */
export class MetaGraphApiClient {
  buildOAuthUrl(state: string): string {
    const env = loadMetaAdsEnv();
    if (env.META_ADS_MOCK || !env.META_ADS_APP_ID) {
      return `https://www.facebook.com/v19.0/dialog/oauth?client_id=mock&redirect_uri=${encodeURIComponent(env.META_ADS_REDIRECT_URI)}&state=${encodeURIComponent(state)}&scope=${META_SCOPES.join(",")}`;
    }

    const params = new URLSearchParams({
      client_id: env.META_ADS_APP_ID,
      redirect_uri: env.META_ADS_REDIRECT_URI,
      state,
      scope: META_SCOPES.join(","),
      response_type: "code",
    });
    return `https://www.facebook.com/${env.META_ADS_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
    const env = loadMetaAdsEnv();
    if (env.META_ADS_MOCK) {
      return {
        accessToken: `mock_meta_token_${randomUUID()}`,
        tokenType: "bearer",
        expiresIn: 60 * 60 * 24 * 60,
      };
    }

    const payload = await graphFetch<{
      access_token: string;
      token_type: string;
      expires_in?: number;
    }>("/oauth/access_token", {
      query: {
        client_id: env.META_ADS_APP_ID!,
        client_secret: env.META_ADS_APP_SECRET!,
        redirect_uri: env.META_ADS_REDIRECT_URI,
        code,
      },
    });

    return {
      accessToken: payload.access_token,
      tokenType: payload.token_type,
      expiresIn: payload.expires_in ?? null,
    };
  }

  resolveAdAccountId(explicit?: string | null): string {
    const env = loadMetaAdsEnv();
    const accountId = explicit ?? env.META_ADS_AD_ACCOUNT_ID;
    if (!accountId) {
      if (env.META_ADS_MOCK) return "act_mock_000000000";
      throw new MetaGraphApiError("Meta ad account ID is required");
    }
    return accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  }

  async launchCampaign(input: {
    accessToken: string;
    adAccountId: string | null;
    name: string;
    objective: string;
    budgetCents: number;
    budgetType: "daily" | "lifetime";
    currency: string;
    audience: MetaAudienceTargeting;
    creative: MetaAdCreative;
    launchActive: boolean;
  }): Promise<MetaLaunchResult> {
    const env = loadMetaAdsEnv();
    const adAccount = this.resolveAdAccountId(input.adAccountId);
    const status = input.launchActive ? "ACTIVE" : "PAUSED";

    if (env.META_ADS_MOCK) {
      return {
        metaCampaignId: mockMetaId("camp"),
        metaAdSetId: mockMetaId("adset"),
        metaCreativeId: mockMetaId("creative"),
        metaAdId: mockMetaId("ad"),
        status,
      };
    }

    const campaign = await graphFetch<{ id: string }>(`/${adAccount}/campaigns`, {
      method: "POST",
      accessToken: input.accessToken,
      body: {
        name: input.name,
        objective: input.objective,
        status,
        special_ad_categories: [],
      },
    });

    const budgetField = input.budgetType === "daily" ? "daily_budget" : "lifetime_budget";
    const adSet = await graphFetch<{ id: string }>(`/${adAccount}/adsets`, {
      method: "POST",
      accessToken: input.accessToken,
      body: {
        name: `${input.name} Ad Set`,
        campaign_id: campaign.id,
        billing_event: "IMPRESSIONS",
        optimization_goal: "OFFSITE_CONVERSIONS",
        [budgetField]: input.budgetCents,
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        targeting: buildTargeting(input.audience),
        status,
      },
    });

    const creative = await graphFetch<{ id: string }>(`/${adAccount}/adcreatives`, {
      method: "POST",
      accessToken: input.accessToken,
      body: {
        name: `${input.name} Creative`,
        object_story_spec: {
          link_data: {
            message: input.creative.primaryText,
            link: input.creative.linkUrl,
            name: input.creative.headline,
            description: input.creative.description,
            picture: input.creative.imageUrl,
            call_to_action: { type: input.creative.callToAction },
          },
        },
      },
    });

    const ad = await graphFetch<{ id: string }>(`/${adAccount}/ads`, {
      method: "POST",
      accessToken: input.accessToken,
      body: {
        name: `${input.name} Ad`,
        adset_id: adSet.id,
        creative: { creative_id: creative.id },
        status,
      },
    });

    return {
      metaCampaignId: campaign.id,
      metaAdSetId: adSet.id,
      metaCreativeId: creative.id,
      metaAdId: ad.id,
      status,
    };
  }

  async fetchCampaignStatus(input: {
    accessToken: string;
    metaCampaignId: string;
  }): Promise<"ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED" | "UNKNOWN"> {
    const env = loadMetaAdsEnv();
    if (env.META_ADS_MOCK) {
      return "ACTIVE";
    }

    const payload = await graphFetch<{ status?: string }>(`/${input.metaCampaignId}`, {
      accessToken: input.accessToken,
      query: { fields: "status" },
    });

    const status = payload.status ?? "UNKNOWN";
    if (status === "ACTIVE" || status === "PAUSED" || status === "ARCHIVED" || status === "DELETED") {
      return status;
    }
    return "UNKNOWN";
  }

  async fetchCampaignInsights(input: {
    accessToken: string;
    metaCampaignId: string;
    currency: string;
  }): Promise<MetaCampaignInsights> {
    const env = loadMetaAdsEnv();
    if (env.META_ADS_MOCK) {
      return {
        spendCents: 12500,
        impressions: 48000,
        clicks: 920,
        conversions: 14,
        roas: 2.35,
        currency: input.currency,
      };
    }

    const payload = await graphFetch<{
      data?: Array<{
        spend?: string;
        impressions?: string;
        clicks?: string;
        actions?: Array<{ action_type: string; value: string }>;
        purchase_roas?: Array<{ value: string }>;
      }>;
    }>(`/${input.metaCampaignId}/insights`, {
      accessToken: input.accessToken,
      query: {
        fields: "spend,impressions,clicks,actions,purchase_roas",
        date_preset: "maximum",
      },
    });

    const row = payload.data?.[0];
    const spendDollars = Number(row?.spend ?? 0);
    const purchaseAction = row?.actions?.find((action) => action.action_type === "purchase");
    const roasValue = Number(row?.purchase_roas?.[0]?.value ?? 0);

    return {
      spendCents: Math.round(spendDollars * 100),
      impressions: Number(row?.impressions ?? 0),
      clicks: Number(row?.clicks ?? 0),
      conversions: Number(purchaseAction?.value ?? 0),
      roas: roasValue,
      currency: input.currency,
    };
  }
}

let clientInstance: MetaGraphApiClient | null = null;

export function getMetaGraphApiClient(): MetaGraphApiClient {
  if (!clientInstance) {
    clientInstance = new MetaGraphApiClient();
  }
  return clientInstance;
}

export function resetMetaGraphApiClient(): void {
  clientInstance = null;
}
