import { z } from "zod";

export const EMAIL_FLOW_TYPES = [
  "WELCOME",
  "ABANDONED_CART",
  "BROWSE_ABANDONMENT",
  "PURCHASE_CONFIRMATION",
  "SHIPPING",
  "REVIEW_REQUEST",
  "UPSELL",
  "VIP",
  "WINBACK",
] as const;

export type EmailFlowType = (typeof EMAIL_FLOW_TYPES)[number];

export const EMAIL_FLOW_LABELS: Record<EmailFlowType, string> = {
  WELCOME: "Welcome Flow",
  ABANDONED_CART: "Abandoned Cart",
  BROWSE_ABANDONMENT: "Browse Abandonment",
  PURCHASE_CONFIRMATION: "Purchase Confirmation",
  SHIPPING: "Shipping",
  REVIEW_REQUEST: "Review Request",
  UPSELL: "Upsell",
  VIP: "VIP",
  WINBACK: "Winback",
};

export const emailFlowTypeSchema = z.enum(EMAIL_FLOW_TYPES);

/** Validates an EmailFlowType value. */
export function validateEmailFlowType(value: unknown): EmailFlowType {
  return emailFlowTypeSchema.parse(value);
}
