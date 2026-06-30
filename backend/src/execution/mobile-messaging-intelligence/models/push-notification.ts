import { z } from "zod";

import {
  pushNotificationTypeSchema,
  type PushNotificationType,
} from "./push-notification-types.js";

export const PUSH_NOTIFICATION_STATUSES = ["READY", "DRAFT"] as const;

export type PushNotificationStatus = (typeof PUSH_NOTIFICATION_STATUSES)[number];

/** Push notification blueprint — no live send. */
export type PushNotification = {
  notificationId: string;
  notificationType: PushNotificationType;
  displayName: string;
  title: string;
  body: string;
  deepLink: string;
  trigger: string;
  delayMinutes: number;
  score: number;
  status: PushNotificationStatus;
};

export const pushNotificationSchema = z.object({
  notificationId: z.string().min(1),
  notificationType: pushNotificationTypeSchema,
  displayName: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  deepLink: z.string().min(1),
  trigger: z.string().min(1),
  delayMinutes: z.number().min(0),
  score: z.number().min(0).max(100),
  status: z.enum(PUSH_NOTIFICATION_STATUSES),
});

/** Validates a PushNotification record shape. */
export function validatePushNotification(value: unknown): PushNotification {
  return pushNotificationSchema.parse(value);
}
