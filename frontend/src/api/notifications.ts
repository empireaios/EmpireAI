import { apiRequest } from "@/api/client";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";

export type GlobalNotificationType =
  | "information"
  | "success"
  | "warning"
  | "error"
  | "critical"
  | "executive";

export type GlobalNotificationSource =
  | "executive-surveillance"
  | "eye-series"
  | "reality-integration"
  | "executive-council"
  | "pillow"
  | "ux"
  | "commerce-runtime"
  | "supplier-intelligence"
  | "grand-king";

export type NotificationTimeGroup = "today" | "yesterday" | "this_week" | "older";

export interface GlobalNotification {
  notificationId: string;
  workspaceId: string;
  companyId: string;
  type: GlobalNotificationType;
  source: GlobalNotificationSource;
  title: string;
  body: string;
  deepLink: string;
  priority: number;
  sourceRef: string;
  readAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationListParams {
  companyId?: string;
  q?: string;
  type?: GlobalNotificationType;
  source?: GlobalNotificationSource;
  unreadOnly?: boolean;
  acknowledgedOnly?: boolean;
  limit?: number;
  grouped?: boolean;
}

export async function fetchUnreadNotificationCount(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ unreadCount: number }>("/global-notifications/unread-count", {
    params: { companyId },
  });
}

export async function fetchNotifications(params: NotificationListParams = {}) {
  const companyId = params.companyId ?? GRAND_KING_COMPANY_ID;
  return apiRequest<{
    notifications?: GlobalNotification[];
    groups?: Array<{ group: NotificationTimeGroup; notifications: GlobalNotification[] }>;
    unreadCount: number;
  }>("/global-notifications", {
    params: {
      companyId,
      q: params.q,
      type: params.type,
      source: params.source,
      unreadOnly: params.unreadOnly,
      acknowledgedOnly: params.acknowledgedOnly,
      limit: params.limit,
      grouped: params.grouped,
    },
  });
}

export async function syncNotifications(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ ingested: number; notifications: GlobalNotification[] }>(
    "/global-notifications/sync",
    { method: "POST", body: { companyId } },
  );
}

export async function markNotificationRead(notificationId: string, companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ notification: GlobalNotification }>(
    `/global-notifications/${notificationId}/read`,
    { method: "POST", body: { companyId } },
  );
}

export async function acknowledgeNotification(notificationId: string, companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ notification: GlobalNotification }>(
    `/global-notifications/${notificationId}/acknowledge`,
    { method: "POST", body: { companyId } },
  );
}

export async function markAllNotificationsRead(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ marked: number }>("/global-notifications/read-all", {
    method: "POST",
    body: { companyId },
  });
}

export async function fetchNotificationFilters() {
  return apiRequest<{ types: GlobalNotificationType[]; sources: GlobalNotificationSource[] }>(
    "/global-notifications/filters",
  );
}

export const TIME_GROUP_LABELS: Record<NotificationTimeGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This week",
  older: "Older",
};

export const TYPE_LABELS: Record<GlobalNotificationType, string> = {
  information: "Information",
  success: "Success",
  warning: "Warning",
  error: "Error",
  critical: "Critical",
  executive: "Executive",
};
