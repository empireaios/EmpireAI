import { z } from "zod";

/** GC-03 — Global notification severity / presentation types. */
export const GlobalNotificationTypeSchema = z.enum([
  "information",
  "success",
  "warning",
  "error",
  "critical",
  "executive",
]);
export type GlobalNotificationType = z.infer<typeof GlobalNotificationTypeSchema>;

/** GC-03 — Owning module for deep-link routing. */
export const GlobalNotificationSourceSchema = z.enum([
  "executive-surveillance",
  "eye-series",
  "reality-integration",
  "executive-council",
  "pillow",
  "ux",
  "commerce-runtime",
  "supplier-intelligence",
  "grand-king",
]);
export type GlobalNotificationSource = z.infer<typeof GlobalNotificationSourceSchema>;

export const GlobalNotificationSchema = z.object({
  notificationId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  type: GlobalNotificationTypeSchema,
  source: GlobalNotificationSourceSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  deepLink: z.string().min(1),
  priority: z.number().int().min(0).max(100),
  sourceRef: z.string().min(1),
  readAt: z.string().nullable(),
  acknowledgedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});
export type GlobalNotification = z.infer<typeof GlobalNotificationSchema>;

export const NotificationTimeGroupSchema = z.enum(["today", "yesterday", "this_week", "older"]);
export type NotificationTimeGroup = z.infer<typeof NotificationTimeGroupSchema>;

export const NotificationListQuerySchema = z.object({
  companyId: z.string().min(1),
  q: z.string().optional(),
  type: GlobalNotificationTypeSchema.optional(),
  source: GlobalNotificationSourceSchema.optional(),
  unreadOnly: z.coerce.boolean().optional(),
  acknowledgedOnly: z.coerce.boolean().optional(),
  grouped: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;

export const NOTIFICATION_TYPE_PRIORITY: Record<GlobalNotificationType, number> = {
  critical: 100,
  executive: 90,
  error: 80,
  warning: 70,
  success: 50,
  information: 30,
};

export function priorityForType(type: GlobalNotificationType): number {
  return NOTIFICATION_TYPE_PRIORITY[type];
}

export function inferTypeFromSignalPriority(priority: string | undefined): GlobalNotificationType {
  const normalized = (priority ?? "").toUpperCase();
  if (normalized === "CRITICAL") return "critical";
  if (normalized === "HIGH") return "error";
  if (normalized === "MEDIUM") return "warning";
  return "information";
}
