import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  acknowledgeNotification,
  buildGlobalNotificationDashboard,
  createManualNotification,
  getUnreadNotificationCount,
  groupNotificationTime,
  listGlobalNotifications,
  listGroupedGlobalNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  resetGlobalNotificationRepository,
  seedDemoNotification,
  syncGlobalNotifications,
} from "../../global-notifications/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-gc-03";
const COMPANY_ID = "grand-king-company";

describe("GC-03 — Global Notification Integration", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGlobalNotificationRepository();
  });

  afterEach(() => {
    resetGlobalNotificationRepository();
    resetDatabaseInstance();
  });

  it("GC-03 — dashboard reports GC-03 mission ownership", () => {
    const dashboard = buildGlobalNotificationDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dashboard.missionId, "GC-03");
    assert.deepEqual(dashboard.owners, ["executive-surveillance", "eye-series"]);
  });

  it("GC-03 — manual notification persists with priority ordering", () => {
    createManualNotification({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      type: "information",
      source: "executive-surveillance",
      title: "Info notice",
      body: "Low priority",
    });
    createManualNotification({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      type: "critical",
      source: "eye-series",
      title: "Critical alert",
      body: "High priority",
    });

    const list = listGlobalNotifications(WORKSPACE_ID, { companyId: COMPANY_ID });
    assert.equal(list.length, 2);
    assert.equal(list[0]?.type, "critical");
    assert.equal(getUnreadNotificationCount(WORKSPACE_ID, COMPANY_ID), 2);
  });

  it("GC-03 — mark-as-read and acknowledge persist", () => {
    const notification = createManualNotification({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      type: "warning",
      source: "reality-integration",
      title: "Connector gap",
      body: "Revenue blocking gap detected",
      deepLink: "/dashboard/infrastructure",
    });

    const read = markNotificationRead(WORKSPACE_ID, COMPANY_ID, notification.notificationId);
    assert.ok(read?.readAt);

    const ack = acknowledgeNotification(WORKSPACE_ID, COMPANY_ID, notification.notificationId);
    assert.ok(ack?.acknowledgedAt);
    assert.equal(getUnreadNotificationCount(WORKSPACE_ID, COMPANY_ID), 0);
  });

  it("GC-03 — search and filter notifications", () => {
    createManualNotification({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      type: "executive",
      source: "executive-council",
      title: "Council debate required",
      body: "Executives disagree on expansion",
    });
    createManualNotification({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      type: "success",
      source: "commerce-runtime",
      title: "Orders flowing",
      body: "Commerce runtime healthy",
    });

    const filtered = listGlobalNotifications(WORKSPACE_ID, {
      companyId: COMPANY_ID,
      q: "Council",
      type: "executive",
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.source, "executive-council");
  });

  it("GC-03 — time grouping buckets notifications", () => {
    const now = new Date().toISOString();
    assert.equal(groupNotificationTime(now), "today");

    const grouped = listGroupedGlobalNotifications(WORKSPACE_ID, { companyId: COMPANY_ID });
    assert.ok(Array.isArray(grouped));
  });

  it("GC-03 — sync ingests from ESS, Eye, REAL, Council sources", () => {
    seedDemoNotification(WORKSPACE_ID, COMPANY_ID);
    const result = syncGlobalNotifications(WORKSPACE_ID, COMPANY_ID);
    assert.ok(result.ingested >= 1);
    assert.ok(result.notifications.length >= 1);
    assert.ok(result.notifications.some((n) => n.deepLink.startsWith("/dashboard")));
  });

  it("GC-03 — mark all read clears unread counter", () => {
    createManualNotification({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      type: "error",
      source: "grand-king",
      title: "Approval pending",
      body: "King decision required",
    });
    createManualNotification({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      type: "warning",
      source: "pillow",
      title: "Pillow session",
      body: "Review Pillow briefing",
    });

    const marked = markAllNotificationsRead(WORKSPACE_ID, COMPANY_ID);
    assert.equal(marked, 2);
    assert.equal(getUnreadNotificationCount(WORKSPACE_ID, COMPANY_ID), 0);
  });
});
