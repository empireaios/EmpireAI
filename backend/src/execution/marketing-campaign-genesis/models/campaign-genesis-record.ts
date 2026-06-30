import { z } from "zod";

import { marketingCampaignSchema, type MarketingCampaign } from "./marketing-campaign.js";

export type CampaignGenesisRecordId = string;

/** Persisted marketing campaign genesis record. */
export type CampaignGenesisRecord = MarketingCampaign & {
  recordId: CampaignGenesisRecordId;
  workspaceId: string;
  brandId: string;
  storeId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignGenesisRecordCreateInput = Omit<
  CampaignGenesisRecord,
  "recordId" | "workspaceId" | "campaignId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const campaignGenesisRecordSchema = marketingCampaignSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  brandId: z.string().min(1),
  storeId: z.string().nullable(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a CampaignGenesisRecord record shape. */
export function validateCampaignGenesisRecord(value: unknown): CampaignGenesisRecord {
  return campaignGenesisRecordSchema.parse(value);
}
