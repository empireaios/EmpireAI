import { z } from "zod";

export const PUSH_NOTIFICATION_TYPES = [
  "WELCOME",
  "CART_ABANDONMENT",
  "PRICE_DROP",
  "BACK_IN_STOCK",
  "ORDER_SHIPPED",
  "PROMOTION",
] as const;

export type PushNotificationType = (typeof PUSH_NOTIFICATION_TYPES)[number];

export const PUSH_NOTIFICATION_LABELS: Record<PushNotificationType, string> = {
  WELCOME: "Welcome Push",
  CART_ABANDONMENT: "Cart Abandonment",
  PRICE_DROP: "Price Drop",
  BACK_IN_STOCK: "Back in Stock",
  ORDER_SHIPPED: "Order Shipped",
  PROMOTION: "Promotion",
};

export const pushNotificationTypeSchema = z.enum(PUSH_NOTIFICATION_TYPES);

/** Validates a PushNotificationType value. */
export function validatePushNotificationType(value: unknown): PushNotificationType {
  return pushNotificationTypeSchema.parse(value);
}
