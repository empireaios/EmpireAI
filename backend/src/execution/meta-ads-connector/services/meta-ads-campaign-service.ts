import { randomUUID } from "node:crypto";

import { recordAdSpend } from "../../analytics-conversion-engine/services/analytics-conversion-service.js";
import {
  isMetaAdsLaunchAllowed,
  loadMetaAdsEnv,
} from "../config/meta-ads-env.js";
import type {
  MetaAdCreative,
  MetaAdsCampaignRecord,
  MetaAdsOAuthRecord,
  MetaAudienceTargeting,
} from "../models/meta-ads-campaign-record.js";
import {
  createCampaignRecord,
  createOAuthRecord,
  getMetaAdsRepository,
} from "../repositories/sqlite-meta-ads-repository.js";
import {
  getMetaGraphApiClient,
  MetaGraphApiError,
} from "./meta-graph-api-client.js";

export class MetaAdsBlockedError extends Error {
  constructor(
    message: string,
    readonly protectTheEmpire = true,
  ) {
    super(message);
    this.name = "MetaAdsBlockedError";
  }
}

export type PrepareMetaCampaignInput = {
  workspaceId: string;
  companyId: string;
  name: string;
  objective?: string;
  budgetCents: number;
  budgetType?: "daily" | "lifetime";
  currency?: string;
  audience: MetaAudienceTargeting;
  creative?: MetaAdCreative;
  metadata?: Record<string, string>;
};

export type ApplyMetaCampaignApprovalInput = {
  campaignId: string;
  approvalToken: string;
  approvedBy: string;
  approvedAt: string;
};

export type UploadMetaCreativeInput = {
  campaignId: string;
  creative: MetaAdCreative;
};

function saveCampaign(
  record: MetaAdsCampaignRecord,
  updates: Partial<MetaAdsCampaignRecord>,
): MetaAdsCampaignRecord {
  return getMetaAdsRepository().saveCampaign({
    ...record,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

function resolveAccessToken(
  workspaceId: string,
  companyId: string,
): { oauth: MetaAdsOAuthRecord; accessToken: string } {
  const env = loadMetaAdsEnv();
  const repository = getMetaAdsRepository();
  const oauth = repository.getOAuth(workspaceId, companyId);

  if (oauth) {
    return { oauth, accessToken: oauth.accessToken };
  }

  if (env.META_ADS_ACCESS_TOKEN) {
    const fallback = createOAuthRecord({
      workspaceId,
      companyId,
      accessToken: env.META_ADS_ACCESS_TOKEN,
      tokenType: "bearer",
      expiresAt: null,
      adAccountId: env.META_ADS_AD_ACCOUNT_ID ?? null,
      scopes: ["ads_management", "ads_read"],
      mock: env.META_ADS_MOCK,
    });
    repository.saveOAuth(fallback);
    return { oauth: fallback, accessToken: fallback.accessToken };
  }

  if (env.META_ADS_MOCK) {
    const mockOAuth = createOAuthRecord({
      workspaceId,
      companyId,
      accessToken: `mock_meta_token_${randomUUID()}`,
      tokenType: "bearer",
      expiresAt: null,
      adAccountId: env.META_ADS_AD_ACCOUNT_ID ?? "act_mock_000000000",
      scopes: ["ads_management", "ads_read"],
      mock: true,
    });
    repository.saveOAuth(mockOAuth);
    return { oauth: mockOAuth, accessToken: mockOAuth.accessToken };
  }

  throw new MetaAdsBlockedError("Meta Ads OAuth is required before launching campaigns");
}

/** Builds Meta OAuth authorization URL. */
export function getMetaAdsOAuthUrl(input: {
  workspaceId: string;
  companyId: string;
}): { url: string; state: string } {
  const state = `${input.workspaceId}:${input.companyId}:${randomUUID()}`;
  const url = getMetaGraphApiClient().buildOAuthUrl(state);
  return { url, state };
}

/** Exchanges OAuth authorization code and persists token. */
export async function exchangeMetaAdsOAuthCode(input: {
  workspaceId: string;
  companyId: string;
  code: string;
}): Promise<MetaAdsOAuthRecord> {
  const env = loadMetaAdsEnv();
  const token = await getMetaGraphApiClient().exchangeCodeForToken(input.code);
  const expiresAt =
    token.expiresIn !== null
      ? new Date(Date.now() + token.expiresIn * 1000).toISOString()
      : null;

  return getMetaAdsRepository().saveOAuth(
    createOAuthRecord({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      accessToken: token.accessToken,
      tokenType: token.tokenType,
      expiresAt,
      adAccountId: env.META_ADS_AD_ACCOUNT_ID ?? null,
      scopes: ["ads_management", "ads_read", "business_management"],
      mock: env.META_ADS_MOCK,
    }),
  );
}

/** Prepares a Meta campaign — always PENDING_APPROVAL, never auto-launches. */
export function prepareMetaCampaign(input: PrepareMetaCampaignInput): MetaAdsCampaignRecord {
  const env = loadMetaAdsEnv();

  return getMetaAdsRepository().saveCampaign(
    createCampaignRecord({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      name: input.name,
      objective: input.objective ?? "OUTCOME_SALES",
      status: "PENDING_APPROVAL",
      budgetCents: input.budgetCents,
      budgetType: input.budgetType ?? "daily",
      currency: (input.currency ?? "USD").toUpperCase(),
      audience: input.audience,
      creative: input.creative ?? null,
      metaCampaignId: null,
      metaAdSetId: null,
      metaAdId: null,
      metaCreativeId: null,
      founderApprovalToken: `meta-approve-${randomUUID()}`,
      approvedBy: null,
      approvedAt: null,
      report: null,
      lastErrorMessage: null,
      mock: env.META_ADS_MOCK,
      metadata: input.metadata ?? {},
    }),
  );
}

/** Applies founder approval — required before launch. */
export function applyMetaCampaignApproval(
  input: ApplyMetaCampaignApprovalInput,
): MetaAdsCampaignRecord {
  const repository = getMetaAdsRepository();
  const campaign = repository.getCampaignById(input.campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${input.campaignId} not found`);
  }
  if (campaign.status !== "PENDING_APPROVAL") {
    throw new Error(`Campaign ${input.campaignId} is not pending approval`);
  }
  if (campaign.founderApprovalToken !== input.approvalToken) {
    throw new Error("Invalid founder approval token");
  }

  return saveCampaign(campaign, {
    status: "APPROVED",
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
    founderApprovalToken: null,
  });
}

/** Uploads or replaces campaign creative before launch. */
export function uploadMetaCreative(input: UploadMetaCreativeInput): MetaAdsCampaignRecord {
  const repository = getMetaAdsRepository();
  const campaign = repository.getCampaignById(input.campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${input.campaignId} not found`);
  }
  if (campaign.status === "ACTIVE" || campaign.status === "LAUNCHING") {
    throw new Error("Cannot replace creative after launch");
  }

  return saveCampaign(campaign, { creative: input.creative });
}

/** Launches approved campaign to Meta — gated by Protect The Empire. */
export async function launchMetaCampaign(campaignId: string): Promise<MetaAdsCampaignRecord> {
  const env = loadMetaAdsEnv();
  const repository = getMetaAdsRepository();
  const campaign = repository.getCampaignById(campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }
  if (campaign.status !== "APPROVED") {
    throw new MetaAdsBlockedError(`Campaign ${campaignId} must be APPROVED before launch`);
  }
  if (!campaign.creative) {
    throw new MetaAdsBlockedError(`Campaign ${campaignId} requires creative before launch`);
  }
  if (!isMetaAdsLaunchAllowed(env)) {
    throw new MetaAdsBlockedError(
      "Meta Ads launch is disabled — set META_ADS_LAUNCH_ENABLED=true after founder approval",
    );
  }

  const launching = saveCampaign(campaign, { status: "LAUNCHING", lastErrorMessage: null });

  try {
    const { oauth, accessToken } = resolveAccessToken(campaign.workspaceId, campaign.companyId);
    const result = await getMetaGraphApiClient().launchCampaign({
      accessToken,
      adAccountId: oauth.adAccountId,
      name: campaign.name,
      objective: campaign.objective,
      budgetCents: campaign.budgetCents,
      budgetType: campaign.budgetType,
      currency: campaign.currency,
      audience: campaign.audience,
      creative: campaign.creative,
      launchActive: true,
    });

    return saveCampaign(launching, {
      status: result.status,
      metaCampaignId: result.metaCampaignId,
      metaAdSetId: result.metaAdSetId,
      metaCreativeId: result.metaCreativeId,
      metaAdId: result.metaAdId,
    });
  } catch (error) {
    const message =
      error instanceof MetaGraphApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Meta campaign launch failed";

    return saveCampaign(launching, {
      status: "FAILED",
      lastErrorMessage: message,
    });
  }
}

/** Syncs campaign status from Meta. */
export async function syncMetaCampaignStatus(campaignId: string): Promise<MetaAdsCampaignRecord> {
  const repository = getMetaAdsRepository();
  const campaign = repository.getCampaignById(campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }
  if (!campaign.metaCampaignId) {
    return campaign;
  }

  const { accessToken } = resolveAccessToken(campaign.workspaceId, campaign.companyId);
  const remoteStatus = await getMetaGraphApiClient().fetchCampaignStatus({
    accessToken,
    metaCampaignId: campaign.metaCampaignId,
  });

  const mappedStatus =
    remoteStatus === "ACTIVE"
      ? "ACTIVE"
      : remoteStatus === "PAUSED"
        ? "PAUSED"
        : campaign.status;

  return saveCampaign(campaign, { status: mappedStatus });
}

/** Fetches campaign insights and records ad spend for ROAS. */
export async function syncMetaCampaignReport(campaignId: string): Promise<MetaAdsCampaignRecord> {
  const repository = getMetaAdsRepository();
  const campaign = repository.getCampaignById(campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }
  if (!campaign.metaCampaignId) {
    throw new Error(`Campaign ${campaignId} has not been launched on Meta`);
  }

  const { accessToken } = resolveAccessToken(campaign.workspaceId, campaign.companyId);
  const insights = await getMetaGraphApiClient().fetchCampaignInsights({
    accessToken,
    metaCampaignId: campaign.metaCampaignId,
    currency: campaign.currency,
  });

  const report = {
    spendCents: insights.spendCents,
    impressions: insights.impressions,
    clicks: insights.clicks,
    conversions: insights.conversions,
    roas: insights.roas,
    currency: insights.currency,
    syncedAt: new Date().toISOString(),
  };

  if (insights.spendCents > 0) {
    recordAdSpend({
      workspaceId: campaign.workspaceId,
      companyId: campaign.companyId,
      campaignId: campaign.campaignId,
      amountCents: insights.spendCents,
      currency: campaign.currency,
      channel: "META",
    });
  }

  return saveCampaign(campaign, { report });
}

export function getMetaCampaignById(campaignId: string): MetaAdsCampaignRecord | null {
  return getMetaAdsRepository().getCampaignById(campaignId);
}

export function listMetaCampaigns(
  workspaceId: string,
  companyId?: string,
): MetaAdsCampaignRecord[] {
  return getMetaAdsRepository().listCampaigns(workspaceId, companyId);
}

export function getMetaAdsOAuthStatus(
  workspaceId: string,
  companyId?: string,
): MetaAdsOAuthRecord | null {
  return getMetaAdsRepository().getOAuth(workspaceId, companyId);
}
