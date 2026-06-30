import type { RegisteredTool } from "../../../brain/types.js";
import {
  applyMetaCampaignApproval,
  exchangeMetaAdsOAuthCode,
  getMetaAdsOAuthStatus,
  getMetaCampaignById,
  launchMetaCampaign,
  listMetaCampaigns,
  MetaAdsBlockedError,
  prepareMetaCampaign,
  syncMetaCampaignReport,
  syncMetaCampaignStatus,
  uploadMetaCreative,
  getMetaAdsOAuthUrl,
} from "../services/meta-ads-campaign-service.js";

export const metaAdsConnectorTools: RegisteredTool[] = [
  {
    name: "meta_ads.get_oauth_url",
    description: "Build Meta OAuth authorization URL for ads_management scope",
    module: "meta-ads-connector",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      getMetaAdsOAuthUrl({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
      }),
  },
  {
    name: "meta_ads.exchange_oauth_code",
    description: "Exchange Meta OAuth code and persist access token",
    module: "meta-ads-connector",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        code: { type: "string" },
      },
      required: ["workspaceId", "companyId", "code"],
    },
    handler: async (args) => {
      const oauth = await exchangeMetaAdsOAuthCode({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        code: String(args.code),
      });
      return { ...oauth, accessToken: "[redacted]" };
    },
  },
  {
    name: "meta_ads.prepare_campaign",
    description: "Prepare Meta campaign at PENDING_APPROVAL — never auto-launches",
    module: "meta-ads-connector",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        name: { type: "string" },
        objective: { type: "string" },
        budgetCents: { type: "number" },
        budgetType: { type: "string", enum: ["daily", "lifetime"] },
        currency: { type: "string" },
        audience: { type: "object" },
        creative: { type: "object" },
      },
      required: ["workspaceId", "companyId", "name", "budgetCents", "audience"],
    },
    handler: async (args) =>
      prepareMetaCampaign({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        name: String(args.name),
        objective: args.objective ? String(args.objective) : undefined,
        budgetCents: Number(args.budgetCents),
        budgetType: args.budgetType as "daily" | "lifetime" | undefined,
        currency: args.currency ? String(args.currency) : undefined,
        audience: args.audience as {
          countries: string[];
          ageMin: number;
          ageMax: number;
          interests: string[];
        },
        creative: args.creative as
          | {
              headline: string;
              primaryText: string;
              imageUrl: string;
              callToAction: "SHOP_NOW" | "LEARN_MORE" | "SIGN_UP";
              linkUrl: string;
            }
          | undefined,
      }),
  },
  {
    name: "meta_ads.apply_approval",
    description: "Apply founder approval before Meta campaign launch",
    module: "meta-ads-connector",
    authorityLevel: "L3",
    parameters: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        approvalToken: { type: "string" },
        approvedBy: { type: "string" },
        approvedAt: { type: "string" },
      },
      required: ["campaignId", "approvalToken", "approvedBy", "approvedAt"],
    },
    handler: async (args) =>
      applyMetaCampaignApproval({
        campaignId: String(args.campaignId),
        approvalToken: String(args.approvalToken),
        approvedBy: String(args.approvedBy),
        approvedAt: String(args.approvedAt),
      }),
  },
  {
    name: "meta_ads.upload_creative",
    description: "Upload or replace Meta ad creative on a prepared campaign",
    module: "meta-ads-connector",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        creative: { type: "object" },
      },
      required: ["campaignId", "creative"],
    },
    handler: async (args) =>
      uploadMetaCreative({
        campaignId: String(args.campaignId),
        creative: args.creative as {
          headline: string;
          primaryText: string;
          imageUrl: string;
          callToAction: "SHOP_NOW" | "LEARN_MORE" | "SIGN_UP";
          linkUrl: string;
        },
      }),
  },
  {
    name: "meta_ads.launch_campaign",
    description: "Launch approved Meta campaign — gated by META_ADS_LAUNCH_ENABLED",
    module: "meta-ads-connector",
    authorityLevel: "L3",
    parameters: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
      },
      required: ["campaignId"],
    },
    handler: async (args) => {
      try {
        return await launchMetaCampaign(String(args.campaignId));
      } catch (error) {
        if (error instanceof MetaAdsBlockedError) {
          return {
            blocked: true,
            protectTheEmpire: error.protectTheEmpire,
            message: error.message,
          };
        }
        throw error;
      }
    },
  },
  {
    name: "meta_ads.sync_status",
    description: "Sync Meta campaign status from Graph API",
    module: "meta-ads-connector",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
      },
      required: ["campaignId"],
    },
    handler: async (args) => syncMetaCampaignStatus(String(args.campaignId)),
  },
  {
    name: "meta_ads.get_report",
    description: "Fetch Meta campaign insights and record ad spend for ROAS",
    module: "meta-ads-connector",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
      },
      required: ["campaignId"],
    },
    handler: async (args) => syncMetaCampaignReport(String(args.campaignId)),
  },
  {
    name: "meta_ads.list_campaigns",
    description: "List Meta Ads campaigns for a workspace",
    module: "meta-ads-connector",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) =>
      listMetaCampaigns(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      ),
  },
  {
    name: "meta_ads.get_oauth_status",
    description: "Check Meta Ads OAuth connection status",
    module: "meta-ads-connector",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => {
      const oauth = getMetaAdsOAuthStatus(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      );
      return {
        connected: Boolean(oauth),
        mock: oauth?.mock ?? false,
        adAccountId: oauth?.adAccountId ?? null,
      };
    },
  },
];
