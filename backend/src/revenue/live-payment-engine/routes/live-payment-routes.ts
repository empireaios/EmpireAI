import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { PAYPAL_ARCHITECTURE_BLUEPRINT } from "../models/paypal-architecture.js";
import {
  completeMockCheckout,
  completeMockPaymentIntent,
  createLiveCheckout,
  createLivePaymentIntent,
  getPaymentById,
  getRevenueSummary,
  listLivePayments,
  LivePaymentEngineBlockedError,
  processStripeWebhookEvent,
} from "../services/live-payment-engine-service.js";
import { verifyStripeWebhookSignature } from "../services/stripe-payment-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;
type RawBodyRequest = FastifyRequest & { rawBody?: Buffer };

const checkoutSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().optional(),
  productName: z.string().min(1),
  amountCents: z.number().int().min(100),
  currency: z.string().length(3).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  customerEmail: z.string().email().optional(),
  metadata: z.record(z.string()).optional(),
});

const paymentIntentSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().optional(),
  amountCents: z.number().int().min(100),
  currency: z.string().length(3).optional(),
  customerEmail: z.string().email().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export async function registerLivePaymentRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post(
    "/live-payments/checkout/create",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = checkoutSchema.parse(request.body);

      if (body.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      try {
        const result = await createLiveCheckout(body);
        auditLogger.write({
          action: "live_payment.checkout_created",
          actor: user.email,
          workspaceId: body.workspaceId,
          companyId: body.companyId,
          correlationId: result.sessionId,
          metadata: { paymentId: result.payment.paymentId, mock: result.mock },
        });
        return reply.send(result);
      } catch (error) {
        if (error instanceof LivePaymentEngineBlockedError) {
          return reply.code(403).send({ error: error.message, livePaymentBlocked: true });
        }
        throw error;
      }
    },
  );

  app.post(
    "/live-payments/payment-intent/create",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = paymentIntentSchema.parse(request.body);

      if (body.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      try {
        const result = await createLivePaymentIntent(body);
        auditLogger.write({
          action: "live_payment.payment_intent_created",
          actor: user.email,
          workspaceId: body.workspaceId,
          companyId: body.companyId,
          correlationId: result.paymentIntentId,
          metadata: { paymentId: result.payment.paymentId, mock: result.mock },
        });
        return reply.send(result);
      } catch (error) {
        if (error instanceof LivePaymentEngineBlockedError) {
          return reply.code(403).send({ error: error.message, livePaymentBlocked: true });
        }
        throw error;
      }
    },
  );

  app.get("/live-payments/checkout/mock", async (request, reply) => {
    const query = z
      .object({
        session_id: z.string().min(1),
        workspace_id: z.string().min(1),
        company_id: z.string().min(1),
        amount_cents: z.coerce.number().int().min(100).optional(),
        product_name: z.string().optional(),
      })
      .parse(request.query);

    const payment = await completeMockCheckout({
      sessionId: query.session_id,
      workspaceId: query.workspace_id,
      companyId: query.company_id,
      amountCents: query.amount_cents ?? 4999,
      productName: query.product_name,
    });

    auditLogger.write({
      action: "live_payment.succeeded",
      actor: "mock_checkout",
      workspaceId: payment.workspaceId,
      companyId: payment.companyId,
      correlationId: payment.stripeSessionId ?? payment.paymentId,
      metadata: { paymentId: payment.paymentId, mock: true },
    });

    reply.header("Content-Type", "text/html; charset=utf-8");
    return reply.send(
      `<html><body style="font-family:system-ui;background:#0f0f12;color:#34d399;padding:48px"><h1>Mock payment complete</h1><p>Payment ${payment.paymentId} recorded. Revenue: ${(payment.amountCents / 100).toFixed(2)} ${payment.currency}</p></body></html>`,
    );
  });

  app.get("/live-payments/checkout/success", async (_request, reply) => {
    reply.header("Content-Type", "text/html; charset=utf-8");
    return reply.send(
      `<html><body style="font-family:system-ui;background:#0f0f12;color:#34d399;padding:48px"><h1>Payment received</h1><p>Thank you — your payment is being processed.</p></body></html>`,
    );
  });

  app.get("/live-payments/checkout/cancel", async (_request, reply) => {
    reply.header("Content-Type", "text/html; charset=utf-8");
    return reply.send(
      `<html><body style="font-family:system-ui;background:#0f0f12;color:#f87171;padding:48px"><h1>Checkout cancelled</h1></body></html>`,
    );
  });

  app.post(
    "/live-payments/webhooks/stripe",
    {
      config: { rawBody: true },
      preParsing: async (request, _reply, payload) => {
        const chunks: Buffer[] = [];
        for await (const chunk of payload) {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        }
        const rawBody = Buffer.concat(chunks);
        (request as RawBodyRequest).rawBody = rawBody;
        return rawBody;
      },
    },
    async (request, reply) => {
      const rawBody = (request as RawBodyRequest).rawBody;
      if (!rawBody) {
        return reply.code(400).send({ error: "Missing raw body" });
      }

      const signature = request.headers["stripe-signature"];
      const event = verifyStripeWebhookSignature(
        rawBody,
        typeof signature === "string" ? signature : undefined,
      );

      const result = await processStripeWebhookEvent(event);

      if (result.payment) {
        const action =
          result.payment.status === "REFUNDED"
            ? "live_payment.refunded"
            : result.payment.status === "FAILED"
              ? "live_payment.failed"
              : "live_payment.succeeded";

        auditLogger.write({
          action,
          actor: "stripe_webhook",
          workspaceId: result.payment.workspaceId,
          companyId: result.payment.companyId,
          correlationId:
            result.payment.stripeSessionId ??
            result.payment.stripePaymentIntentId ??
            result.payment.paymentId,
          metadata: {
            paymentId: result.payment.paymentId,
            eventType: event.type,
            amountCents: result.payment.amountCents,
          },
        });
      }

      return reply.send({ received: true, skipped: result.skipped });
    },
  );

  app.get(
    "/live-payments/revenue",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const summary = getRevenueSummary(user.workspaceId, query.companyId);
      return reply.send(summary);
    },
  );

  app.get(
    "/live-payments/payments",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const payments = listLivePayments(user.workspaceId, query.companyId);
      return reply.send({ payments });
    },
  );

  app.get(
    "/live-payments/payments/:paymentId",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const params = z.object({ paymentId: z.string().min(1) }).parse(request.params);
      const payment = getPaymentById(params.paymentId);

      if (!payment) {
        return reply.code(404).send({ error: "Payment not found" });
      }
      if (payment.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      return reply.send({ payment });
    },
  );

  app.get(
    "/live-payments/paypal/architecture",
    { preHandler: authenticate },
    async (_request, reply) => {
      return reply.send({ blueprint: PAYPAL_ARCHITECTURE_BLUEPRINT });
    },
  );
}
