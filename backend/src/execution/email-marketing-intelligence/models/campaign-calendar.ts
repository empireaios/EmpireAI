import { z } from "zod";

import { emailFlowTypeSchema, type EmailFlowType } from "./email-flow-types.js";

export const CAMPAIGN_CALENDAR_STATUSES = ["PLANNED"] as const;

export type CampaignCalendarStatus = (typeof CAMPAIGN_CALENDAR_STATUSES)[number];

/** Scheduled campaign calendar entry — planned only, no auto-send. */
export type CampaignCalendarEntry = {
  entryId: string;
  flowType: EmailFlowType;
  entryName: string;
  scheduledDayOffset: number;
  sendWindowLocal: string;
  cadence: string;
  status: CampaignCalendarStatus;
  notes: string;
};

export const campaignCalendarEntrySchema = z.object({
  entryId: z.string().min(1),
  flowType: emailFlowTypeSchema,
  entryName: z.string().min(1),
  scheduledDayOffset: z.number().int().min(0),
  sendWindowLocal: z.string().min(1),
  cadence: z.string().min(1),
  status: z.literal("PLANNED"),
  notes: z.string().min(1),
});

/** Validates a CampaignCalendarEntry record shape. */
export function validateCampaignCalendarEntry(value: unknown): CampaignCalendarEntry {
  return campaignCalendarEntrySchema.parse(value);
}
