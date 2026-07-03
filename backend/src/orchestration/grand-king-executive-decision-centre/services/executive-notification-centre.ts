/**
 * G7-04 — Executive event feed and notification centre.
 */

import { randomUUID } from "node:crypto";
import type { ExecutiveNotification } from "../contracts/executive-decision-types.js";
import { generateExecutiveRecommendations } from "./decision-recommendation-engine.js";
import { buildRiskDashboard } from "./risk-dashboard.js";
import { buildProductionBlockerDashboard } from "./production-blocker-dashboard.js";

const notifications: ExecutiveNotification[] = [];

export function resetExecutiveNotificationsForTests(): void {
  notifications.length = 0;
}

export function buildExecutiveEventFeed(context: Record<string, unknown> = {}): ExecutiveNotification[] {
  return [...notifications];
}

export function publishExecutiveNotifications(context: Record<string, unknown> = {}): ExecutiveNotification[] {
  const recommendations = generateExecutiveRecommendations(context);
  const risks = buildRiskDashboard(context);
  const blockers = buildProductionBlockerDashboard(context);
  const now = new Date().toISOString();

  for (const rec of recommendations) {
    notifications.push({
      notificationId: randomUUID(),
      priority: rec.priority,
      summary: rec.summary,
      domainId: rec.domainId,
      createdAt: now,
      read: false,
    });
  }

  for (const risk of risks.risks) {
    notifications.push({
      notificationId: randomUUID(),
      priority: risk.severity === "critical" ? "critical" : "high",
      summary: risk.summary,
      domainId: "incidents",
      createdAt: now,
      read: false,
    });
  }

  if (blockers.blockerCount > 0) {
    notifications.push({
      notificationId: randomUUID(),
      priority: "high",
      summary: `${blockers.blockerCount} production blockers require attention`,
      domainId: "live_operations",
      createdAt: now,
      read: false,
    });
  }

  return [...notifications];
}

export function listExecutiveNotifications(): ExecutiveNotification[] {
  return [...notifications];
}
