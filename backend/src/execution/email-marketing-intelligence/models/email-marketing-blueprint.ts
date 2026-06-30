import { z } from "zod";

import { campaignCalendarEntrySchema, type CampaignCalendarEntry } from "./campaign-calendar.js";
import { emailFlowSchema, type EmailFlow } from "./email-flow.js";
import {
  emailMarketingSignalSchema,
  type EmailMarketingSignal,
} from "./email-marketing-signal.js";

export type EmailMarketingBlueprintId = string;

/** Complete email marketing blueprint — intelligence only, no auto-send. */
export type EmailMarketingBlueprint = {
  blueprintId: EmailMarketingBlueprintId;
  storeId: string;
  brandId: string;
  blueprintName: string;
  flows: EmailFlow[];
  campaignCalendar: CampaignCalendarEntry[];
  overallScore: number;
  confidence: number;
  signals: EmailMarketingSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoSendEnabled: false;
};

export type EmailMarketingBlueprintCreateInput = Omit<EmailMarketingBlueprint, "blueprintId">;

export const emailMarketingBlueprintSchema = z.object({
  blueprintId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  blueprintName: z.string().min(1),
  flows: z.array(emailFlowSchema).length(9),
  campaignCalendar: z.array(campaignCalendarEntrySchema).min(1),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(emailMarketingSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoSendEnabled: z.literal(false),
});

/** Validates an EmailMarketingBlueprint record shape. */
export function validateEmailMarketingBlueprint(value: unknown): EmailMarketingBlueprint {
  return emailMarketingBlueprintSchema.parse(value);
}
