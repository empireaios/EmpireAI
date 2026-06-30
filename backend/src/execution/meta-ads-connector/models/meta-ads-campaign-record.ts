import { z } from "zod";

export const META_CAMPAIGN_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "LAUNCHING",
  "ACTIVE",
  "PAUSED",
  "FAILED",
] as const;

export type MetaCampaignStatus = (typeof META_CAMPAIGN_STATUSES)[number];

export const META_BUDGET_TYPES = ["daily", "lifetime"] as const;
export type MetaBudgetType = (typeof META_BUDGET_TYPES)[number];

export type MetaAudienceTargeting = {
  countries: string[];
  ageMin: number;
  ageMax: number;
  interests: string[];
  genders?: ("male" | "female" | "all")[];
};

export type MetaAdCreative = {
  headline: string;
  primaryText: string;
  description?: string;
  imageUrl: string;
  callToAction: "SHOP_NOW" | "LEARN_MORE" | "SIGN_UP";
  linkUrl: string;
};

export type MetaCampaignReport = {
  spendCents: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  currency: string;
  syncedAt: string;
};

/** Meta Ads campaign record — launch requires founder approval. */
export type MetaAdsCampaignRecord = {
  campaignId: string;
  workspaceId: string;
  companyId: string;
  name: string;
  objective: string;
  status: MetaCampaignStatus;
  budgetCents: number;
  budgetType: MetaBudgetType;
  currency: string;
  audience: MetaAudienceTargeting;
  creative: MetaAdCreative | null;
  metaCampaignId: string | null;
  metaAdSetId: string | null;
  metaAdId: string | null;
  metaCreativeId: string | null;
  founderApprovalToken: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  report: MetaCampaignReport | null;
  lastErrorMessage: string | null;
  mock: boolean;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type MetaAdsOAuthRecord = {
  oauthId: string;
  workspaceId: string;
  companyId: string;
  accessToken: string;
  tokenType: string;
  expiresAt: string | null;
  adAccountId: string | null;
  scopes: string[];
  mock: boolean;
  createdAt: string;
  updatedAt: string;
};

export const metaAudienceSchema = z.object({
  countries: z.array(z.string()).min(1),
  ageMin: z.number().int().min(18).max(65),
  ageMax: z.number().int().min(18).max(65),
  interests: z.array(z.string()),
  genders: z.array(z.enum(["male", "female", "all"])).optional(),
});

export const metaAdCreativeSchema = z.object({
  headline: z.string().min(1),
  primaryText: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  callToAction: z.enum(["SHOP_NOW", "LEARN_MORE", "SIGN_UP"]),
  linkUrl: z.string().url(),
});

export const metaCampaignReportSchema = z.object({
  spendCents: z.number().int().min(0),
  impressions: z.number().int().min(0),
  clicks: z.number().int().min(0),
  conversions: z.number().int().min(0),
  roas: z.number().min(0),
  currency: z.string().length(3),
  syncedAt: z.string().datetime({ offset: true }),
});

export const metaAdsCampaignRecordSchema = z.object({
  campaignId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  name: z.string().min(1),
  objective: z.string().min(1),
  status: z.enum(META_CAMPAIGN_STATUSES),
  budgetCents: z.number().int().min(100),
  budgetType: z.enum(META_BUDGET_TYPES),
  currency: z.string().length(3),
  audience: metaAudienceSchema,
  creative: metaAdCreativeSchema.nullable(),
  metaCampaignId: z.string().nullable(),
  metaAdSetId: z.string().nullable(),
  metaAdId: z.string().nullable(),
  metaCreativeId: z.string().nullable(),
  founderApprovalToken: z.string().nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: z.string().datetime({ offset: true }).nullable(),
  report: metaCampaignReportSchema.nullable(),
  lastErrorMessage: z.string().nullable(),
  mock: z.boolean(),
  metadata: z.record(z.string()),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export function validateMetaAdsCampaignRecord(value: unknown): MetaAdsCampaignRecord {
  return metaAdsCampaignRecordSchema.parse(value);
}
