import { z } from "zod";

import { audienceSegmentSchema, type AudienceSegment } from "./audience-segment.js";
import { automationTriggerSchema, type AutomationTrigger } from "./automation-trigger.js";
import { frequencyControlSchema, type FrequencyControl } from "./frequency-control.js";
import { messageTimingSchema, type MessageTiming } from "./message-timing.js";
import {
  mobileMessagingSignalSchema,
  type MobileMessagingSignal,
} from "./mobile-messaging-signal.js";
import { pushNotificationSchema, type PushNotification } from "./push-notification.js";
import { smsCampaignSchema, type SmsCampaign } from "./sms-campaign.js";

export type MobileMessagingBlueprintId = string;

/** Complete mobile messaging blueprint — intelligence only, no auto-send. */
export type MobileMessagingBlueprint = {
  blueprintId: MobileMessagingBlueprintId;
  storeId: string;
  brandId: string;
  blueprintName: string;
  smsCampaigns: SmsCampaign[];
  pushNotifications: PushNotification[];
  timingRules: MessageTiming[];
  segments: AudienceSegment[];
  automationTriggers: AutomationTrigger[];
  frequencyControls: FrequencyControl[];
  overallScore: number;
  confidence: number;
  signals: MobileMessagingSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoSendEnabled: false;
};

export type MobileMessagingBlueprintCreateInput = Omit<MobileMessagingBlueprint, "blueprintId">;

export const mobileMessagingBlueprintSchema = z.object({
  blueprintId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  blueprintName: z.string().min(1),
  smsCampaigns: z.array(smsCampaignSchema).length(6),
  pushNotifications: z.array(pushNotificationSchema).length(6),
  timingRules: z.array(messageTimingSchema).min(2),
  segments: z.array(audienceSegmentSchema).length(6),
  automationTriggers: z.array(automationTriggerSchema).min(1),
  frequencyControls: z.array(frequencyControlSchema).min(2),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(mobileMessagingSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoSendEnabled: z.literal(false),
});

/** Validates a MobileMessagingBlueprint record shape. */
export function validateMobileMessagingBlueprint(value: unknown): MobileMessagingBlueprint {
  return mobileMessagingBlueprintSchema.parse(value);
}
