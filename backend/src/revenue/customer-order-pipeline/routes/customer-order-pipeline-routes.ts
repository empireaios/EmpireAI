import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  applyPipelineApproval,
  completePipelineDelivery,
  CustomerOrderPipelineBlockedError,
  getPipelineById,
  ingestVerifiedPayment,
  listPipelines,
  runSandboxFulfillmentCycle,
  startCheckoutPipeline,
  submitPipelineFulfillment,
  syncPipelineTracking,
} from "../services/customer-order-pipeline-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

const startSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  revenueCents: z.number().int().min(100),
  currency: z.string().length(3).optional(),
  correlationId: z.string().min(1),
});

const approvalSchema = z.object({
  pipelineId: z.string().min(1),
  approvalToken: z.string().min(1),
  approvedBy: z.string().min(1),
  approvedAt: z.string().datetime({ offset: true }),
});

function requireFounder(role: string, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  if (role !== "founder" && role !== "admin") {
    reply.code(403).send({ error: "Grand King approval required for order pipeline actions" });
    return false;
  }
  return true;
}

export async function registerCustomerOrderPipelineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post(
    "/customer-orders/checkout/start",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = startSchema.parse(request.body);
      if (body.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      const pipeline = startCheckoutPipeline(body);
      auditLogger.write({
        action: "customer_order.checkout_started",
        actor: user.email,
        workspaceId: body.workspaceId,
        companyId: body.companyId,
        correlationId: body.correlationId,
        metadata: { pipelineId: pipeline.pipelineId },
      });

      return reply.send({ pipeline });
    },
  );

  app.post(
    "/customer-orders/payment/ingest",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z.object({ paymentId: z.string().min(1) }).parse(request.body);

      try {
        const pipeline = await ingestVerifiedPayment(body.paymentId);
        if (pipeline.workspaceId !== user.workspaceId && user.role !== "admin") {
          return reply.code(403).send({ error: "Workspace mismatch" });
        }

        auditLogger.write({
          action: "customer_order.payment_verified",
          actor: user.email,
          workspaceId: pipeline.workspaceId,
          companyId: pipeline.companyId,
          correlationId: pipeline.correlationId,
          metadata: { pipelineId: pipeline.pipelineId, paymentId: body.paymentId },
        });

        return reply.send({ pipeline });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    },
  );

  app.post(
    "/customer-orders/fulfillment/approve",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = approvalSchema.parse(request.body);
      const pipeline = applyPipelineApproval(body);

      if (pipeline.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "customer_order.fulfillment_approved",
        actor: user.email,
        workspaceId: pipeline.workspaceId,
        companyId: pipeline.companyId,
        correlationId: pipeline.correlationId,
        metadata: { pipelineId: pipeline.pipelineId },
      });

      return reply.send({ pipeline });
    },
  );

  app.post(
    "/customer-orders/fulfillment/submit",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = z.object({ pipelineId: z.string().min(1) }).parse(request.body);

      try {
        const pipeline = await submitPipelineFulfillment(body.pipelineId);
        if (pipeline.workspaceId !== user.workspaceId && user.role !== "admin") {
          return reply.code(403).send({ error: "Workspace mismatch" });
        }

        auditLogger.write({
          action: "customer_order.fulfillment_submitted",
          actor: user.email,
          workspaceId: pipeline.workspaceId,
          companyId: pipeline.companyId,
          correlationId: pipeline.correlationId,
          metadata: {
            pipelineId: pipeline.pipelineId,
            supplierOrderId: pipeline.supplierOrderId,
          },
        });

        return reply.send({ pipeline });
      } catch (error) {
        if (error instanceof CustomerOrderPipelineBlockedError) {
          return reply.code(403).send({ error: error.message, protectTheEmpire: true });
        }
        throw error;
      }
    },
  );

  app.post(
    "/customer-orders/tracking/sync",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z.object({ pipelineId: z.string().min(1) }).parse(request.body);
      const pipeline = syncPipelineTracking(body.pipelineId);

      if (pipeline.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "customer_order.tracking_synced",
        actor: user.email,
        workspaceId: pipeline.workspaceId,
        companyId: pipeline.companyId,
        correlationId: pipeline.correlationId,
        metadata: {
          pipelineId: pipeline.pipelineId,
          trackingNumber: pipeline.trackingNumber,
          status: pipeline.status,
        },
      });

      return reply.send({ pipeline });
    },
  );

  app.post(
    "/customer-orders/delivery/complete",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z.object({ pipelineId: z.string().min(1) }).parse(request.body);
      const pipeline = completePipelineDelivery(body.pipelineId);

      if (pipeline.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "customer_order.delivered",
        actor: user.email,
        workspaceId: pipeline.workspaceId,
        companyId: pipeline.companyId,
        correlationId: pipeline.correlationId,
        metadata: {
          pipelineId: pipeline.pipelineId,
          ledgerDeliveryEventId: pipeline.ledgerDeliveryEventId,
        },
      });

      return reply.send({ pipeline });
    },
  );

  app.post(
    "/customer-orders/sandbox/run-cycle",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = z
        .object({
          pipelineId: z.string().min(1),
          approvalToken: z.string().min(1),
        })
        .parse(request.body);

      const pipeline = await runSandboxFulfillmentCycle({
        pipelineId: body.pipelineId,
        approvalToken: body.approvalToken,
        approvedBy: user.email,
      });

      auditLogger.write({
        action: "customer_order.delivered",
        actor: user.email,
        workspaceId: pipeline.workspaceId,
        companyId: pipeline.companyId,
        correlationId: pipeline.correlationId,
        metadata: { pipelineId: pipeline.pipelineId, sandbox: true },
      });

      return reply.send({ pipeline });
    },
  );

  app.get(
    "/customer-orders/pipelines",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const pipelines = listPipelines(user.workspaceId, query.companyId);
      return reply.send({ pipelines });
    },
  );

  app.get(
    "/customer-orders/pipelines/:pipelineId",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const params = z.object({ pipelineId: z.string().min(1) }).parse(request.params);
      const pipeline = getPipelineById(params.pipelineId);

      if (!pipeline) {
        return reply.code(404).send({ error: "Pipeline not found" });
      }
      if (pipeline.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      return reply.send({ pipeline });
    },
  );
}
