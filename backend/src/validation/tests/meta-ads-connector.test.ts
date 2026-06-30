import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { metaAdsConnectorTools } from "../../execution/meta-ads-connector/tools/meta-ads-connector-tools.js";
import {
  applyMetaCampaignApproval,
  exchangeMetaAdsOAuthCode,
  getMetaAdsOAuthUrl,
  launchMetaCampaign,
  MetaAdsBlockedError,
  prepareMetaCampaign,
  syncMetaCampaignReport,
  syncMetaCampaignStatus,
  uploadMetaCreative,
} from "../../execution/meta-ads-connector/index.js";
import type { ToolContext } from "../../brain/types.js";

const WORKSPACE_ID = "ws-m107";
const COMPANY_ID = "co-grand-king";
const ORIGINAL_ENV = { ...process.env };

const sampleAudience = {
  countries: ["US"],
  ageMin: 25,
  ageMax: 54,
  interests: ["Online shopping", "Ecommerce"],
};

const sampleCreative = {
  headline: "Grand King's Best Seller",
  primaryText: "Shop the launch collection today.",
  imageUrl: "https://cdn.example.com/ad-square.jpg",
  callToAction: "SHOP_NOW" as const,
  linkUrl: "https://store.example.com/products/hero",
};

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "meta-ads-connector",
    correlationId: "corr-m107",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = metaAdsConnectorTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

function prepareApprovedCampaign() {
  const prepared = prepareMetaCampaign({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    name: "Grand King Launch",
    budgetCents: 5000,
    audience: sampleAudience,
    creative: sampleCreative,
  });

  return applyMetaCampaignApproval({
    campaignId: prepared.campaignId,
    approvalToken: prepared.founderApprovalToken!,
    approvedBy: "founder@empireai.com",
    approvedAt: new Date().toISOString(),
  });
}

beforeEach(() => {
  process.env.META_ADS_MOCK = "true";
  process.env.META_ADS_LAUNCH_ENABLED = "false";
  delete process.env.META_ADS_APP_ID;
  delete process.env.META_ADS_APP_SECRET;
  delete process.env.META_ADS_ACCESS_TOKEN;
  delete process.env.META_ADS_AD_ACCOUNT_ID;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Mission 107 Meta Ads Connector", () => {
  it("registers ten Meta Ads Brain tools", () => {
    assert.equal(metaAdsConnectorTools.length, 10);
    assert.ok(metaAdsConnectorTools.some((tool) => tool.name === "meta_ads.launch_campaign"));
  });

  it("builds Meta OAuth authorization URL", () => {
    const result = getMetaAdsOAuthUrl({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.match(result.url, /facebook\.com/);
    assert.match(result.state, new RegExp(`${WORKSPACE_ID}:${COMPANY_ID}`));
  });

  it("exchanges OAuth code in mock mode", async () => {
    const oauth = await exchangeMetaAdsOAuthCode({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      code: "mock-auth-code",
    });

    assert.equal(oauth.mock, true);
    assert.match(oauth.accessToken, /mock_meta_token_/);
  });

  it("prepares campaign at PENDING_APPROVAL without launching", () => {
    const campaign = prepareMetaCampaign({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      name: "US Prospecting",
      budgetCents: 2500,
      budgetType: "daily",
      audience: sampleAudience,
    });

    assert.equal(campaign.status, "PENDING_APPROVAL");
    assert.ok(campaign.founderApprovalToken);
    assert.equal(campaign.metaCampaignId, null);
    assert.equal(campaign.mock, true);
  });

  it("blocks launch when Protect The Empire gate is disabled", async () => {
    const approved = prepareApprovedCampaign();

    const toolResult = (await invokeTool("meta_ads.launch_campaign", {
      campaignId: approved.campaignId,
    })) as { blocked: boolean; protectTheEmpire: boolean };

    assert.equal(toolResult.blocked, true);
    assert.equal(toolResult.protectTheEmpire, true);

    await assert.rejects(
      () => launchMetaCampaign(approved.campaignId),
      MetaAdsBlockedError,
    );
  });

  it("launches approved campaign when gate is enabled in mock mode", async () => {
    process.env.META_ADS_LAUNCH_ENABLED = "true";
    const approved = prepareApprovedCampaign();

    const launched = await launchMetaCampaign(approved.campaignId);

    assert.equal(launched.status, "ACTIVE");
    assert.ok(launched.metaCampaignId);
    assert.ok(launched.metaAdSetId);
    assert.ok(launched.metaAdId);
    assert.ok(launched.metaCreativeId);
  });

  it("uploads creative on prepared campaign", () => {
    const prepared = prepareMetaCampaign({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      name: "Creative Upload Test",
      budgetCents: 3000,
      audience: sampleAudience,
    });

    const updated = uploadMetaCreative({
      campaignId: prepared.campaignId,
      creative: sampleCreative,
    });

    assert.equal(updated.creative?.headline, sampleCreative.headline);
    assert.equal(updated.creative?.callToAction, "SHOP_NOW");
  });

  it("syncs campaign status after launch", async () => {
    process.env.META_ADS_LAUNCH_ENABLED = "true";
    const approved = prepareApprovedCampaign();
    const launched = await launchMetaCampaign(approved.campaignId);

    const synced = await syncMetaCampaignStatus(launched.campaignId);

    assert.equal(synced.status, "ACTIVE");
  });

  it("syncs reporting insights and records ad spend", async () => {
    process.env.META_ADS_LAUNCH_ENABLED = "true";
    const approved = prepareApprovedCampaign();
    const launched = await launchMetaCampaign(approved.campaignId);

    const reported = await syncMetaCampaignReport(launched.campaignId);

    assert.ok(reported.report);
    assert.equal(reported.report?.spendCents, 12500);
    assert.equal(reported.report?.impressions, 48000);
    assert.ok(reported.report!.roas > 0);
  });

  it("prepares campaign via Brain tool", async () => {
    const campaign = (await invokeTool("meta_ads.prepare_campaign", {
      companyId: COMPANY_ID,
      name: "Tool Prepared Campaign",
      budgetCents: 4000,
      audience: sampleAudience,
    })) as { status: string };

    assert.equal(campaign.status, "PENDING_APPROVAL");
  });
});
