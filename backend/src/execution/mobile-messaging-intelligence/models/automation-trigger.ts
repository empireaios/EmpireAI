import { z } from "zod";

export const AUTOMATION_TRIGGER_EVENTS = [
  "SIGNUP",
  "CART_ABANDONED",
  "ORDER_PLACED",
  "ORDER_SHIPPED",
  "DELIVERY_CONFIRMED",
  "INACTIVITY_60D",
  "PRICE_DROP",
  "BACK_IN_STOCK",
] as const;

export type AutomationTriggerEvent = (typeof AUTOMATION_TRIGGER_EVENTS)[number];

/** Automation trigger linking events to SMS/push campaigns. */
export type AutomationTrigger = {
  triggerId: string;
  event: AutomationTriggerEvent;
  label: string;
  channel: string;
  linkedCampaignType: string;
  delayMinutes: number;
  segmentFilter: string;
  enabled: false;
  score: number;
};

export const automationTriggerSchema = z.object({
  triggerId: z.string().min(1),
  event: z.enum(AUTOMATION_TRIGGER_EVENTS),
  label: z.string().min(1),
  channel: z.string().min(1),
  linkedCampaignType: z.string().min(1),
  delayMinutes: z.number().min(0),
  segmentFilter: z.string().min(1),
  enabled: z.literal(false),
  score: z.number().min(0).max(100),
});

/** Validates an AutomationTrigger record shape. */
export function validateAutomationTrigger(value: unknown): AutomationTrigger {
  return automationTriggerSchema.parse(value);
}
