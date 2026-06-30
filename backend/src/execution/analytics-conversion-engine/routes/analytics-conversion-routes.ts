import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildConversionPixelScripts } from "../services/pixel-script-builder.js";
import {
  AnalyticsConversionBlockedError,
  computeRoasSnapshot,
  getLatestRoasSnapshot,
  getPixelConfig,
  listConversions,
  listServerEvents,
  recordAdSpend,
  registerPixelConfig,
  trackPurchaseConversion,
  trackServerSideEvent,
} from "../services/analytics-conversion-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

const pixelConfigSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().optional(),
  ga4MeasurementId: z.string().optional(),
  ga4ApiSecret: z.string().optional(),
  metaPixelId: z.string().optional(),
  metaAccessToken: z.string().optional(),
  tiktokPixelId: z.string().optional(),
  tiktokAccessToken: z.string().optional(),
});

export async function registerAnalyticsConversionRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post(
    "/analytics/pixels/register",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = pixelConfigSchema.parse(request.body);
      if (body.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      const config = registerPixelConfig(body);
      auditLogger.write({
        action: "analytics_conversion.pixels_registered",
        actor: user.email,
        workspaceId: body.workspaceId,
        companyId: body.companyId,
        correlationId: config.configId,
        metadata: {
          ga4: Boolean(config.ga4MeasurementId),
          meta: Boolean(config.metaPixelId),
          tiktok: Boolean(config.tiktokPixelId),
        },
      });

      return reply.send({ config });
    },
  );

  app.get(
    "/analytics/pixels/scripts",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z
        .object({
          companyId: z.string().optional(),
          productValue: z.coerce.number().optional(),
          currency: z.string().optional(),
        })
        .parse(request.query);

      const config = getPixelConfig(user.workspaceId, query.companyId);
      const scripts = buildConversionPixelScripts({
        ga4MeasurementId: config?.ga4MeasurementId,
        metaPixelId: config?.metaPixelId,
        tiktokPixelId: config?.tiktokPixelId,
        productValue: query.productValue,
        currency: query.currency,
      });

      reply.header("Content-Type", "text/html; charset=utf-8");
      return reply.send(scripts);
    },
  );

  app.post(
    "/analytics/events/server-side",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          workspaceId: z.string().min(1),
          companyId: z.string().min(1),
          eventName: z.enum(["page_view", "begin_checkout", "add_to_cart", "purchase", "lead"]),
          correlationId: z.string().min(1),
          valueCents: z.number().int().min(0),
          currency: z.string().length(3).optional(),
          customerEmail: z.string().email().optional(),
        })
        .parse(request.body);

      if (body.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      try {
        const event = await trackServerSideEvent(body);
        auditLogger.write({
          action: "analytics_conversion.server_event_dispatched",
          actor: user.email,
          workspaceId: body.workspaceId,
          companyId: body.companyId,
          correlationId: body.correlationId,
          metadata: { eventId: event.eventId, eventName: event.eventName, mock: event.mock },
        });
        return reply.send({ event });
      } catch (error) {
        if (error instanceof AnalyticsConversionBlockedError) {
          return reply.code(403).send({ error: error.message });
        }
        throw error;
      }
    },
  );

  app.post(
    "/analytics/conversions/purchase",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          workspaceId: z.string().min(1),
          companyId: z.string().min(1),
          storeId: z.string().optional(),
          paymentId: z.string().optional(),
          pipelineId: z.string().optional(),
          correlationId: z.string().min(1),
          valueCents: z.number().int().min(1),
          currency: z.string().length(3).optional(),
          customerEmail: z.string().email().optional(),
        })
        .parse(request.body);

      if (body.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      try {
        const result = await trackPurchaseConversion(body);
        auditLogger.write({
          action: "analytics_conversion.purchase_tracked",
          actor: user.email,
          workspaceId: body.workspaceId,
          companyId: body.companyId,
          correlationId: body.correlationId,
          metadata: {
            conversionId: result.conversion.conversionId,
            valueCents: result.conversion.valueCents,
            platforms: result.serverEvent.platforms,
          },
        });
        return reply.send(result);
      } catch (error) {
        if (error instanceof AnalyticsConversionBlockedError) {
          return reply.code(403).send({ error: error.message });
        }
        throw error;
      }
    },
  );

  app.post(
    "/analytics/roas/ad-spend",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          workspaceId: z.string().min(1),
          companyId: z.string().min(1),
          campaignId: z.string().min(1),
          amountCents: z.number().int().min(1),
          currency: z.string().length(3).optional(),
          channel: z.enum(["META", "TIKTOK", "GOOGLE", "OTHER"]),
        })
        .parse(request.body);

      if (body.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      recordAdSpend(body);
      auditLogger.write({
        action: "analytics_conversion.ad_spend_recorded",
        actor: user.email,
        workspaceId: body.workspaceId,
        companyId: body.companyId,
        correlationId: body.campaignId,
        metadata: { amountCents: body.amountCents, channel: body.channel },
      });

      return reply.send({ recorded: true });
    },
  );

  app.get(
    "/analytics/roas",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z
        .object({ companyId: z.string().min(1), period: z.string().optional() })
        .parse(request.query);

      const snapshot = computeRoasSnapshot({
        workspaceId: user.workspaceId,
        companyId: query.companyId,
        period: query.period,
      });

      return reply.send({ snapshot, latest: getLatestRoasSnapshot(user.workspaceId, query.companyId) });
    },
  );

  app.get(
    "/analytics/conversions",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const conversions = listConversions(user.workspaceId, query.companyId);
      return reply.send({ conversions });
    },
  );

  app.get(
    "/analytics/events",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ limit: z.coerce.number().optional() }).parse(request.query);
      const events = listServerEvents(user.workspaceId, query.limit);
      return reply.send({ events });
    },
  );
}
