import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { loadRevenueLoopEnv } from "../config/revenue-loop-env.js";
import { getRevenueLoopRepository } from "../repositories/sqlite-revenue-loop-repository.js";
import {
  applyFulfillmentApproval,
  ingestCheckoutCompleted,
  LiveFulfillmentBlockedError,
  submitLiveFulfillment,
} from "../services/revenue-loop-service.js";
import {
  buildMockCheckoutCompletedEvent,
  createCheckoutSession,
  verifyStripeWebhookSignature,
} from "../services/stripe-client.js";
import { processStripeWebhookEvent } from "../../live-payment-engine/services/live-payment-engine-service.js";
import {
  deployLiveStore,
  readDeployedStorefront,
} from "../services/storefront-deploy-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

type RawBodyRequest = FastifyRequest & { rawBody?: Buffer };

const deploySchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  brandId: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  productName: z.string().min(1),
  productDescription: z.string().min(1),
  priceCents: z.number().int().min(100),
  currency: z.string().length(3).optional(),
  cjSupplierSku: z.string().min(1),
  cjSupplierProductId: z.string().min(1),
  unitCostCents: z.number().int().min(0),
  domain: z.string().nullable().optional(),
});

const approvalSchema = z.object({
  recordId: z.string().min(1),
  approvalToken: z.string().min(1),
  approvedBy: z.string().min(1),
  approvedAt: z.string().datetime({ offset: true }),
});

export async function registerRevenueLoopRoutes(
  app: FastifyInstance,
  deps: {
    authenticate: AuthMiddleware;
    auditLogger: AuditLogger;
  },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/store/:slug", async (request, reply) => {
    const params = z.object({ slug: z.string().min(1) }).parse(request.params);
    const html = readDeployedStorefront(params.slug);
    if (!html) {
      return reply.code(404).send({ error: "Store not found or not deployed" });
    }
    reply.header("Content-Type", "text/html; charset=utf-8");
    return reply.send(html);
  });

  app.post("/store/:slug/checkout", async (request, reply) => {
    const params = z.object({ slug: z.string().min(1) }).parse(request.params);
    const body = z
      .object({ customerEmail: z.string().email().optional() })
      .parse(request.body ?? {});

    const store = getRevenueLoopRepository().getStoreBySlug(params.slug);
    if (!store || store.status === "SUSPENDED") {
      return reply.code(404).send({ error: "Store unavailable" });
    }

    const config = loadRevenueLoopEnv();
    const session = await createCheckoutSession({
      storeSlug: store.slug,
      storeId: store.storeId,
      workspaceId: store.workspaceId,
      companyId: store.companyId,
      productName: store.productName,
      priceCents: store.priceCents,
      currency: store.currency,
      successUrl: `${config.REVENUE_LOOP_STORE_BASE_URL}/store/${store.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${config.REVENUE_LOOP_STORE_BASE_URL}/store/${store.slug}`,
      customerEmail: body.customerEmail,
    });

    return reply.send({
      checkoutUrl: session.url,
      sessionId: session.id,
      mock: session.mock,
    });
  });

  app.get("/store/:slug/checkout/mock", async (request, reply) => {
    const params = z.object({ slug: z.string().min(1) }).parse(request.params);
    const query = z.object({ session_id: z.string().min(1) }).parse(request.query);

    const store = getRevenueLoopRepository().getStoreBySlug(params.slug);
    if (!store) {
      return reply.code(404).send({ error: "Store not found" });
    }

    const event = buildMockCheckoutCompletedEvent(query.session_id, {
      storeId: store.storeId,
      storeSlug: store.slug,
      workspaceId: store.workspaceId,
      companyId: store.companyId,
      amountTotal: String(store.priceCents),
      currency: store.currency.toLowerCase(),
      customerEmail: "mock-customer@grandkings.account",
      customerName: "Mock Grand King Customer",
      addressLine1: "123 Commerce Way",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      countryCode: "US",
    });

    const record = await ingestCheckoutCompleted({ event });
    reply.header("Content-Type", "text/html; charset=utf-8");
    return reply.send(
      `<html><body style="font-family:system-ui;background:#0f0f12;color:#f5f5f7;padding:48px"><h1>Mock payment complete</h1><p>Order ${record.recordId} awaiting founder fulfillment approval.</p><p>Profit estimate: ${(record.profitCents / 100).toFixed(2)} ${record.currency}</p></body></html>`,
    );
  });

  app.get("/store/:slug/success", async (request, reply) => {
    reply.header("Content-Type", "text/html; charset=utf-8");
    return reply.send(
      `<html><body style="font-family:system-ui;background:#0f0f12;color:#34d399;padding:48px"><h1>Thank you for your order!</h1><p>Payment received. Your order is being prepared.</p></body></html>`,
    );
  });

  app.post("/webhooks/stripe", {
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
  }, async (request, reply) => {
    const rawBody = (request as RawBodyRequest).rawBody;
    if (!rawBody) {
      return reply.code(400).send({ error: "Missing raw body" });
    }

    const signature = request.headers["stripe-signature"];
    const event = verifyStripeWebhookSignature(rawBody, typeof signature === "string" ? signature : undefined);

    const paymentResult = await processStripeWebhookEvent(event);

    if (paymentResult.payment) {
      const metadata = paymentResult.payment.metadata;
      const isStoreOrder = Boolean(metadata.storeId || metadata.storeSlug);

      auditLogger.write({
        action: isStoreOrder ? "revenue_loop.payment_received" : "live_payment.succeeded",
        actor: "stripe_webhook",
        workspaceId: paymentResult.payment.workspaceId,
        companyId: paymentResult.payment.companyId,
        correlationId:
          paymentResult.payment.stripeSessionId ?? paymentResult.payment.paymentId,
        metadata: {
          paymentId: paymentResult.payment.paymentId,
          amountCents: paymentResult.payment.amountCents,
          storeId: metadata.storeId ?? null,
        },
      });
    }

    return reply.send({ received: true });
  });

  app.post(
    "/revenue-loop/deploy",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== "founder" && user.role !== "admin") {
        return reply.code(403).send({ error: "Founder approval required to deploy live stores" });
      }

      const body = deploySchema.parse(request.body);
      if (body.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      const result = deployLiveStore(body);
      auditLogger.write({
        action: "revenue_loop.store_deployed",
        actor: user.email,
        workspaceId: body.workspaceId,
        companyId: body.companyId,
        correlationId: result.store.storeId,
        metadata: { slug: result.store.slug, publicUrl: result.publicUrl },
      });

      return reply.send(result);
    },
  );

  app.post(
    "/revenue-loop/fulfillment/approve",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== "founder" && user.role !== "admin") {
        return reply.code(403).send({ error: "Founder approval required" });
      }

      const body = approvalSchema.parse(request.body);
      const record = applyFulfillmentApproval(body);

      if (record.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "revenue_loop.fulfillment_approved",
        actor: user.email,
        workspaceId: record.workspaceId,
        companyId: record.companyId,
        correlationId: record.recordId,
        metadata: { approvalToken: body.approvalToken },
      });

      return reply.send({ record });
    },
  );

  app.post(
    "/revenue-loop/fulfillment/submit-live",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== "founder" && user.role !== "admin") {
        return reply.code(403).send({ error: "Founder approval required for LIVE fulfillment" });
      }

      const body = z.object({ recordId: z.string().min(1) }).parse(request.body);
      try {
        const record = await submitLiveFulfillment(body.recordId);
        if (record.workspaceId !== user.workspaceId && user.role !== "admin") {
          return reply.code(403).send({ error: "Workspace mismatch" });
        }

        auditLogger.write({
          action: "revenue_loop.live_fulfillment_submitted",
          actor: user.email,
          workspaceId: record.workspaceId,
          companyId: record.companyId,
          correlationId: record.recordId,
          metadata: {
            supplierOrderId: record.supplierOrderId,
            profitable: record.profitable,
          },
        });

        return reply.send({ record });
      } catch (error) {
        if (error instanceof LiveFulfillmentBlockedError) {
          return reply.code(403).send({ error: error.message, protectTheEmpire: true });
        }
        throw error;
      }
    },
  );

  app.get(
    "/revenue-loop/stores",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const stores = getRevenueLoopRepository().listStores(user.workspaceId);
      return reply.send({ stores });
    },
  );

  app.get(
    "/revenue-loop/orders",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ storeId: z.string().optional() }).parse(request.query);
      const orders = getRevenueLoopRepository().listOrders(user.workspaceId, query.storeId);
      return reply.send({ orders });
    },
  );
}
