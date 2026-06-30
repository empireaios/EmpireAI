import { randomUUID } from "node:crypto";

import type {
  GlobalNotification,
  GlobalNotificationSource,
  GlobalNotificationType,
  NotificationTimeGroup,
} from "../models/global-notification.js";
import { NotificationListQuerySchema, priorityForType } from "../models/global-notification.js";
import { DEEP_LINKS } from "../deep-links.js";
import { getGlobalNotificationRepository } from "../repositories/sqlite-global-notification-repository.js";
import { ingestNotificationsFromSources } from "./notification-ingestion-service.js";

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** GC-03 — Time bucket for notification history UI. */
export function groupNotificationTime(createdAt: string): NotificationTimeGroup {
  const created = new Date(createdAt);
  const now = new Date();
  const today = startOfDay(now);
  const createdDay = startOfDay(created);
  const diffDays = Math.floor((today.getTime() - createdDay.getTime()) / 86_400_000);

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays <= 7) return "this_week";
  return "older";
}

function matchesQuery(notification: GlobalNotification, q: string | undefined): boolean {
  if (!q?.trim()) return true;
  const normalized = q.trim().toLowerCase();
  return (
    notification.title.toLowerCase().includes(normalized) ||
    notification.body.toLowerCase().includes(normalized) ||
    notification.source.toLowerCase().includes(normalized)
  );
}

function filterNotifications(
  notifications: GlobalNotification[],
  query: {
    q?: string;
    type?: GlobalNotificationType;
    source?: GlobalNotificationSource;
    unreadOnly?: boolean;
    acknowledgedOnly?: boolean;
    limit?: number;
  },
): GlobalNotification[] {
  let filtered = notifications.filter((n) => matchesQuery(n, query.q));
  if (query.type) filtered = filtered.filter((n) => n.type === query.type);
  if (query.source) filtered = filtered.filter((n) => n.source === query.source);
  if (query.unreadOnly) filtered = filtered.filter((n) => !n.readAt);
  if (query.acknowledgedOnly) filtered = filtered.filter((n) => !!n.acknowledgedAt);
  filtered.sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt));
  return filtered.slice(0, query.limit ?? 100);
}

export function buildGlobalNotificationDashboard(workspaceId: string, companyId: string) {
  return {
    missionId: "GC-03",
    moduleId: "global-notifications",
    owners: ["executive-surveillance", "eye-series"],
    unreadCount: getUnreadNotificationCount(workspaceId, companyId),
    totalCount: getGlobalNotificationRepository().list(workspaceId, companyId).length,
    deepLinkRegistry: DEEP_LINKS,
    computedAt: new Date().toISOString(),
  };
}

export function syncGlobalNotifications(workspaceId: string, companyId: string): {
  ingested: number;
  notifications: GlobalNotification[];
} {
  const ingested = ingestNotificationsFromSources(workspaceId, companyId);
  return {
    ingested: ingested.length,
    notifications: listGlobalNotifications(workspaceId, { companyId }),
  };
}

export function listGlobalNotifications(
  workspaceId: string,
  rawQuery: Record<string, unknown>,
): GlobalNotification[] {
  const query = NotificationListQuerySchema.parse(rawQuery);
  const all = getGlobalNotificationRepository().list(workspaceId, query.companyId);
  return filterNotifications(all, query);
}

export function listGroupedGlobalNotifications(
  workspaceId: string,
  rawQuery: Record<string, unknown>,
): Array<{ group: NotificationTimeGroup; notifications: GlobalNotification[] }> {
  const notifications = listGlobalNotifications(workspaceId, rawQuery);
  const groups = new Map<NotificationTimeGroup, GlobalNotification[]>();
  const order: NotificationTimeGroup[] = ["today", "yesterday", "this_week", "older"];

  for (const notification of notifications) {
    const group = groupNotificationTime(notification.createdAt);
    const bucket = groups.get(group) ?? [];
    bucket.push(notification);
    groups.set(group, bucket);
  }

  return order
    .filter((group) => groups.has(group))
    .map((group) => ({ group, notifications: groups.get(group)! }));
}

export function getUnreadNotificationCount(workspaceId: string, companyId: string): number {
  return getGlobalNotificationRepository().countUnread(workspaceId, companyId);
}

export function markNotificationRead(
  workspaceId: string,
  companyId: string,
  notificationId: string,
): GlobalNotification | null {
  const repo = getGlobalNotificationRepository();
  const existing = repo.getById(notificationId);
  if (!existing || existing.workspaceId !== workspaceId || existing.companyId !== companyId) return null;

  const updated: GlobalNotification = {
    ...existing,
    readAt: existing.readAt ?? new Date().toISOString(),
  };
  repo.save(updated);
  return updated;
}

export function markAllNotificationsRead(workspaceId: string, companyId: string): number {
  const repo = getGlobalNotificationRepository();
  const all = repo.list(workspaceId, companyId);
  let count = 0;
  const now = new Date().toISOString();
  for (const notification of all) {
    if (!notification.readAt) {
      repo.save({ ...notification, readAt: now });
      count += 1;
    }
  }
  return count;
}

export function acknowledgeNotification(
  workspaceId: string,
  companyId: string,
  notificationId: string,
): GlobalNotification | null {
  const repo = getGlobalNotificationRepository();
  const existing = repo.getById(notificationId);
  if (!existing || existing.workspaceId !== workspaceId || existing.companyId !== companyId) return null;

  const now = new Date().toISOString();
  const updated: GlobalNotification = {
    ...existing,
    readAt: existing.readAt ?? now,
    acknowledgedAt: now,
  };
  repo.save(updated);
  return updated;
}

export function createManualNotification(input: {
  workspaceId: string;
  companyId: string;
  type: GlobalNotificationType;
  source: GlobalNotificationSource;
  title: string;
  body: string;
  deepLink?: string;
  sourceRef?: string;
}): GlobalNotification {
  const repo = getGlobalNotificationRepository();
  const now = new Date().toISOString();
  const notification: GlobalNotification = {
    notificationId: repo.createId(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    type: input.type,
    source: input.source,
    title: input.title,
    body: input.body,
    deepLink: input.deepLink ?? (DEEP_LINKS[input.source] as string),
    priority: priorityForType(input.type),
    sourceRef: input.sourceRef ?? `${input.source}:manual:${randomUUID()}`,
    readAt: null,
    acknowledgedAt: null,
    createdAt: now,
  };
  return repo.upsert(notification);
}

export { DEEP_LINKS } from "../deep-links.js";
export { moduleDeepLink } from "../deep-links.js";
