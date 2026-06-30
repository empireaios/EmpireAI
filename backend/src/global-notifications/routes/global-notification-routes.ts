import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../auth/middleware.js";
import {
  GlobalNotificationSourceSchema,
  GlobalNotificationTypeSchema,
  NotificationListQuerySchema,
} from "../models/global-notification.js";
import {
  acknowledgeNotification,
  buildGlobalNotificationDashboard,
  getUnreadNotificationCount,
  listGlobalNotifications,
  listGroupedGlobalNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  syncGlobalNotifications,
} from "../services/global-notification-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

/** GC-03 — Global Notifications Center routes (ESS + eye-series owners). */
export async function registerGlobalNotificationRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/global-notifications/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ dashboard: buildGlobalNotificationDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/global-notifications/unread-count", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ unreadCount: getUnreadNotificationCount(user.workspaceId, query.companyId) });
  });

  app.get("/global-notifications", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = NotificationListQuerySchema.parse(request.query);
    if (query.grouped) {
      const { grouped: _grouped, ...listQuery } = query;
      return reply.send({
        groups: listGroupedGlobalNotifications(user.workspaceId, listQuery as Record<string, unknown>),
        unreadCount: getUnreadNotificationCount(user.workspaceId, query.companyId),
      });
    }
    return reply.send({
      notifications: listGlobalNotifications(user.workspaceId, query as Record<string, unknown>),
      unreadCount: getUnreadNotificationCount(user.workspaceId, query.companyId),
    });
  });

  app.post("/global-notifications/sync", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).parse(request.body);
    const result = syncGlobalNotifications(user.workspaceId, body.companyId);

    auditLogger.write({
      action: "global_notifications.sync",
      actor: user.email,
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      correlationId: request.id,
      metadata: { ingested: result.ingested },
    });

    return reply.code(201).send(result);
  });

  app.post("/global-notifications/read-all", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).parse(request.body);
    const marked = markAllNotificationsRead(user.workspaceId, body.companyId);

    auditLogger.write({
      action: "global_notifications.read_all",
      actor: user.email,
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      correlationId: request.id,
      metadata: { marked },
    });

    return reply.send({ marked });
  });

  app.post("/global-notifications/:notificationId/read", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ notificationId: z.string().min(1) }).parse(request.params);
    const body = z.object({ companyId: z.string().min(1) }).parse(request.body);
    const notification = markNotificationRead(user.workspaceId, body.companyId, params.notificationId);
    if (!notification) return reply.code(404).send({ error: "Notification not found" });

    auditLogger.write({
      action: "global_notifications.read",
      actor: user.email,
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      correlationId: request.id,
      metadata: { notificationId: params.notificationId },
    });

    return reply.send({ notification });
  });

  app.post("/global-notifications/:notificationId/acknowledge", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ notificationId: z.string().min(1) }).parse(request.params);
    const body = z.object({ companyId: z.string().min(1) }).parse(request.body);
    const notification = acknowledgeNotification(user.workspaceId, body.companyId, params.notificationId);
    if (!notification) return reply.code(404).send({ error: "Notification not found" });

    auditLogger.write({
      action: "global_notifications.acknowledge",
      actor: user.email,
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      correlationId: request.id,
      metadata: { notificationId: params.notificationId },
    });

    return reply.send({ notification });
  });

  app.get("/global-notifications/filters", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({
      types: GlobalNotificationTypeSchema.options,
      sources: GlobalNotificationSourceSchema.options,
    });
  });
}
