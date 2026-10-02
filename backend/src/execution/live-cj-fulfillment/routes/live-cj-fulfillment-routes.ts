import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import type { SessionUser } from "../../../auth/permissions.js";
import { getCustomerOrderPipelineRepository } from "../../../revenue/customer-order-pipeline/repositories/sqlite-customer-order-pipeline-repository.js";
import {
  applyFounderApproval,
  executeLiveCjSubmit,
  getLiveCjFulfillmentById,
  listFulfillmentAttempts,
  listLiveCjFulfillments,
  LiveCjFulfillmentBlockedError,
  prepareLiveCjFulfillment,
  recoverFailedFulfillment,
  syncLiveCjTracking,
} from "../services/live-cj-fulfillment-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

const defaultServices = {
  applyFounderApproval,
  executeLiveCjSubmit,
  getLiveCjFulfillmentById,
  listFulfillmentAttempts,
  listLiveCjFulfillments,
  prepareLiveCjFulfillment,
  recoverFailedFulfillment,
  syncLiveCjTracking,
  getPipeline: (pipelineId: string) =>
    getCustomerOrderPipelineRepository().getPipelineById(pipelineId),
};

export type LiveCjRouteServices = typeof defaultServices;

const approvalSchema = z.object({
  fulfillmentId: z.string().min(1),
  approvalToken: z.string().min(1),
  // Older clients may send these fields; authority and time come from the server.
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
});

function requireWorkspaceBeforeEffect(
  resource: { workspaceId: string } | null | undefined,
  user: SessionUser,
  reply: FastifyReply,
): boolean {
  if (!resource) {
    reply.code(404).send({ error: "Fulfillment resource not found" });
    return false;
  }
  if (resource.workspaceId !== user.workspaceId && user.role !== "admin") {
    reply.code(403).send({ error: "Workspace mismatch" });
    return false;
  }
  return true;
}

function requireFounder(role: string, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  if (role !== "founder" && role !== "admin") {
    reply.code(403).send({ error: "Grand King founder approval required for LIVE CJ fulfillment" });
    return false;
  }
  return true;
}

export async function registerLiveCjFulfillmentRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger; services?: Partial<LiveCjRouteServices> },
): Promise<void> {
  const { authenticate, auditLogger } = deps;
  const services = { ...defaultServices, ...deps.services };

  app.post(
    "/live-cj-fulfillment/prepare",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z.object({ pipelineId: z.string().min(1) }).parse(request.body);

      if (!requireWorkspaceBeforeEffect(services.getPipeline(body.pipelineId), user, reply)) return;
      const fulfillment = services.prepareLiveCjFulfillment(body);

      auditLogger.write({
        action: "live_cj_fulfillment.prepared",
        actor: user.email,
        workspaceId: fulfillment.workspaceId,
        companyId: fulfillment.companyId,
        correlationId: fulfillment.pipelineId,
        metadata: { fulfillmentId: fulfillment.fulfillmentId, status: fulfillment.status },
      });

      return reply.send({ fulfillment });
    },
  );

  app.post(
    "/live-cj-fulfillment/approve",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = approvalSchema.parse(request.body);
      if (!requireWorkspaceBeforeEffect(services.getLiveCjFulfillmentById(body.fulfillmentId), user, reply)) return;
      const fulfillment = services.applyFounderApproval({
        ...body,
        approvedBy: user.email,
        approvedAt: new Date().toISOString(),
      });

      auditLogger.write({
        action: "live_cj_fulfillment.approved",
        actor: user.email,
        workspaceId: fulfillment.workspaceId,
        companyId: fulfillment.companyId,
        correlationId: fulfillment.pipelineId,
        metadata: { fulfillmentId: fulfillment.fulfillmentId },
      });

      return reply.send({ fulfillment });
    },
  );

  app.post(
    "/live-cj-fulfillment/submit-live",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = z.object({ fulfillmentId: z.string().min(1) }).parse(request.body);
      if (!requireWorkspaceBeforeEffect(services.getLiveCjFulfillmentById(body.fulfillmentId), user, reply)) return;

      try {
        const fulfillment = await services.executeLiveCjSubmit(body.fulfillmentId);

        auditLogger.write({
          action: "live_cj_fulfillment.submitted",
          actor: user.email,
          workspaceId: fulfillment.workspaceId,
          companyId: fulfillment.companyId,
          correlationId: fulfillment.pipelineId,
          metadata: {
            fulfillmentId: fulfillment.fulfillmentId,
            supplierOrderId: fulfillment.supplierOrderId,
            mock: fulfillment.mock,
          },
        });

        return reply.send({ fulfillment });
      } catch (error) {
        if (error instanceof LiveCjFulfillmentBlockedError) {
          return reply.code(403).send({ error: error.message, protectTheEmpire: true });
        }
        throw error;
      }
    },
  );

  app.post(
    "/live-cj-fulfillment/tracking/sync",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          fulfillmentId: z.string().min(1),
          markDelivered: z.boolean().optional(),
        })
        .parse(request.body);

      if (!requireWorkspaceBeforeEffect(services.getLiveCjFulfillmentById(body.fulfillmentId), user, reply)) return;
      const fulfillment = await services.syncLiveCjTracking(body.fulfillmentId, {
        markDelivered: body.markDelivered,
      });

      auditLogger.write({
        action: "live_cj_fulfillment.tracking_synced",
        actor: user.email,
        workspaceId: fulfillment.workspaceId,
        companyId: fulfillment.companyId,
        correlationId: fulfillment.pipelineId,
        metadata: {
          fulfillmentId: fulfillment.fulfillmentId,
          status: fulfillment.status,
          trackingNumber: fulfillment.trackingNumber,
        },
      });

      return reply.send({ fulfillment });
    },
  );

  app.post(
    "/live-cj-fulfillment/recover",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = approvalSchema.parse(request.body);
      if (!requireWorkspaceBeforeEffect(services.getLiveCjFulfillmentById(body.fulfillmentId), user, reply)) return;
      const fulfillment = services.recoverFailedFulfillment({
        ...body,
        approvedBy: user.email,
        approvedAt: new Date().toISOString(),
      });

      auditLogger.write({
        action: "live_cj_fulfillment.recovered",
        actor: user.email,
        workspaceId: fulfillment.workspaceId,
        companyId: fulfillment.companyId,
        correlationId: fulfillment.pipelineId,
        metadata: { fulfillmentId: fulfillment.fulfillmentId },
      });

      return reply.send({ fulfillment });
    },
  );

  app.get(
    "/live-cj-fulfillment/jobs",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const fulfillments = services.listLiveCjFulfillments(user.workspaceId, query.companyId);
      return reply.send({ fulfillments });
    },
  );

  app.get(
    "/live-cj-fulfillment/jobs/:fulfillmentId",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const params = z.object({ fulfillmentId: z.string().min(1) }).parse(request.params);
      const fulfillment = services.getLiveCjFulfillmentById(params.fulfillmentId);

      if (!fulfillment) {
        return reply.code(404).send({ error: "Fulfillment not found" });
      }
      if (fulfillment.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      return reply.send({
        fulfillment,
        attempts: services.listFulfillmentAttempts(params.fulfillmentId),
      });
    },
  );
}
