import { z } from "zod";

import {
  marketingCampaignIntelligenceSchema,
  type MarketingCampaignIntelligence,
} from "./marketing-campaign-intelligence.js";

export type CampaignIntelligenceRecordId = string;

/** Persisted marketing campaign intelligence record. */
export type CampaignIntelligenceRecord = MarketingCampaignIntelligence & {
  recordId: CampaignIntelligenceRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type CampaignIntelligenceRecordCreateInput = Omit<
  CampaignIntelligenceRecord,
  "recordId" | "workspaceId" | "intelligenceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const campaignIntelligenceRecordSchema = marketingCampaignIntelligenceSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a CampaignIntelligenceRecord record shape. */
export function validateCampaignIntelligenceRecord(
  value: unknown,
): CampaignIntelligenceRecord {
  return campaignIntelligenceRecordSchema.parse(value);
}
