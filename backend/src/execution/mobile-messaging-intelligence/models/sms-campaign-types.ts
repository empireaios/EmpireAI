import { z } from "zod";

export const SMS_CAMPAIGN_TYPES = [
  "WELCOME",
  "CART_RECOVERY",
  "ORDER_UPDATE",
  "SHIPPING_ALERT",
  "PROMOTION",
  "WINBACK",
] as const;

export type SmsCampaignType = (typeof SMS_CAMPAIGN_TYPES)[number];

export const SMS_CAMPAIGN_LABELS: Record<SmsCampaignType, string> = {
  WELCOME: "Welcome SMS",
  CART_RECOVERY: "Cart Recovery",
  ORDER_UPDATE: "Order Update",
  SHIPPING_ALERT: "Shipping Alert",
  PROMOTION: "Promotion",
  WINBACK: "Winback",
};

export const smsCampaignTypeSchema = z.enum(SMS_CAMPAIGN_TYPES);

/** Validates an SmsCampaignType value. */
export function validateSmsCampaignType(value: unknown): SmsCampaignType {
  return smsCampaignTypeSchema.parse(value);
}
