import { randomUUID } from "node:crypto";

import { getDatabase } from "../../brain/database.js";
import type { GlobalNotification } from "../models/global-notification.js";

let repositoryInstance: SqliteGlobalNotificationRepository | null = null;

export function getGlobalNotificationRepository(): SqliteGlobalNotificationRepository {
  if (!repositoryInstance) repositoryInstance = new SqliteGlobalNotificationRepository();
  return repositoryInstance;
}

export function resetGlobalNotificationRepository(): void {
  repositoryInstance = null;
}

export class SqliteGlobalNotificationRepository {
  upsert(notification: GlobalNotification): GlobalNotification {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO global_notifications
        (notification_id, workspace_id, company_id, type, source, title, body,
         deep_link, priority, source_ref, read_at, acknowledged_at, created_at, record_json)
       VALUES
        (@notificationId, @workspaceId, @companyId, @type, @source, @title, @body,
         @deepLink, @priority, @sourceRef, @readAt, @acknowledgedAt, @createdAt, @recordJson)
       ON CONFLICT(source_ref, workspace_id, company_id) DO UPDATE SET
         type = excluded.type,
         source = excluded.source,
         title = excluded.title,
         body = excluded.body,
         deep_link = excluded.deep_link,
         priority = excluded.priority,
         record_json = excluded.record_json,
         read_at = COALESCE(global_notifications.read_at, excluded.read_at),
         acknowledged_at = COALESCE(global_notifications.acknowledged_at, excluded.acknowledged_at)`,
    ).run({
      notificationId: notification.notificationId,
      workspaceId: notification.workspaceId,
      companyId: notification.companyId,
      type: notification.type,
      source: notification.source,
      title: notification.title,
      body: notification.body,
      deepLink: notification.deepLink,
      priority: notification.priority,
      sourceRef: notification.sourceRef,
      readAt: notification.readAt,
      acknowledgedAt: notification.acknowledgedAt,
      createdAt: notification.createdAt,
      recordJson: JSON.stringify(notification),
    });
    return this.getBySourceRef(notification.workspaceId, notification.companyId, notification.sourceRef)!;
  }

  getById(notificationId: string): GlobalNotification | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM global_notifications WHERE notification_id = @notificationId`)
      .get({ notificationId }) as { record_json: string } | undefined;
    return row ? (JSON.parse(row.record_json) as GlobalNotification) : null;
  }

  getBySourceRef(workspaceId: string, companyId: string, sourceRef: string): GlobalNotification | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM global_notifications
         WHERE workspace_id = @workspaceId AND company_id = @companyId AND source_ref = @sourceRef`,
      )
      .get({ workspaceId, companyId, sourceRef }) as { record_json: string } | undefined;
    return row ? (JSON.parse(row.record_json) as GlobalNotification) : null;
  }

  list(workspaceId: string, companyId: string): GlobalNotification[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM global_notifications
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY priority DESC, created_at DESC`,
      )
      .all({ workspaceId, companyId }) as Array<{ record_json: string }>;
    return rows.map((row) => JSON.parse(row.record_json) as GlobalNotification);
  }

  save(notification: GlobalNotification): void {
    const db = getDatabase();
    db.prepare(
      `UPDATE global_notifications SET
         read_at = @readAt,
         acknowledged_at = @acknowledgedAt,
         record_json = @recordJson
       WHERE notification_id = @notificationId`,
    ).run({
      notificationId: notification.notificationId,
      readAt: notification.readAt,
      acknowledgedAt: notification.acknowledgedAt,
      recordJson: JSON.stringify(notification),
    });
  }

  countUnread(workspaceId: string, companyId: string): number {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT COUNT(*) AS count FROM global_notifications
         WHERE workspace_id = @workspaceId AND company_id = @companyId AND read_at IS NULL`,
      )
      .get({ workspaceId, companyId }) as { count: number };
    return row.count;
  }

  createId(): string {
    return randomUUID();
  }
}
