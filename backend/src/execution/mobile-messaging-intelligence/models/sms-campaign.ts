import { z } from "zod";

import { smsCampaignTypeSchema, type SmsCampaignType } from "./sms-campaign-types.js";

export const SMS_CAMPAIGN_STATUSES = ["READY", "DRAFT"] as const;

export type SmsCampaignStatus = (typeof SMS_CAMPAIGN_STATUSES)[number];

/** SMS campaign blueprint — no live send. */
export type SmsCampaign = {
  campaignId: string;
  campaignType: SmsCampaignType;
  displayName: string;
  messageBody: string;
  characterCount: number;
  segmentCount: number;
  trigger: string;
  delayMinutes: number;
  score: number;
  status: SmsCampaignStatus;
};

export const smsCampaignSchema = z.object({
  campaignId: z.string().min(1),
  campaignType: smsCampaignTypeSchema,
  displayName: z.string().min(1),
  messageBody: z.string().min(1),
  characterCount: z.number().int().min(1),
  segmentCount: z.number().int().min(1),
  trigger: z.string().min(1),
  delayMinutes: z.number().min(0),
  score: z.number().min(0).max(100),
  status: z.enum(SMS_CAMPAIGN_STATUSES),
});

/** Validates an SmsCampaign record shape. */
export function validateSmsCampaign(value: unknown): SmsCampaign {
  return smsCampaignSchema.parse(value);
}
