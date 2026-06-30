import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../auth/middleware.js";
import { buildSupplierAdapterRegistry } from "../services/supplier-adapter-registry-service.js";
import { buildSupplierDashboard } from "../services/supplier-dashboard-service.js";
import { buildCjAdapterSkeleton } from "../adapters/cj-dropshipping-adapter.js";
import { buildExecutiveSupplierBriefing } from "../services/executive-supplier-briefing-service.js";
import { runSupplierWatcher } from "../services/supplier-surveyor-watcher.js";
import { listSupplierProducts, findSupplierOpportunities, ingestSupplierProduct } from "../services/supplier-opportunity-service.js";
import { scoreSupplierProduct } from "../services/supplier-scoring-service.js";
import { compareSuppliersForProduct } from "../services/supplier-comparison-service.js";
import { evaluateShippingAcceptability } from "../services/shipping-acceptability-service.js";
import { detectSupplierRisks } from "../services/supplier-risk-service.js";
import { prepareFulfillmentHandoff } from "../services/fulfillment-handoff-service.js";
import { supplierProductSchema } from "../models/supplier-product.js";
import { shippingAcceptabilityInputSchema } from "../models/shipping-acceptability.js";
import { getEmpireAccessRecord } from "../../operational-access/services/empire-access-registry-service.js";
import { SUPPLIER_PROVIDER_CATALOG } from "../models/supplier-abstraction.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerSupplierIntelligenceRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/supplier-intelligence/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1).default("co-grand-king") }).parse(request.query);
    const dashboard = buildSupplierDashboard(user.workspaceId, query.companyId);
    const briefing = buildExecutiveSupplierBriefing(dashboard);
    const watcherAlerts = runSupplierWatcher(user.workspaceId, dashboard);
    return reply.send({ dashboard, executiveBriefing: briefing, watcherAlerts });
  });

  app.get("/supplier-intelligence/adapters", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ adapters: buildSupplierAdapterRegistry(user.workspaceId), catalog: SUPPLIER_PROVIDER_CATALOG });
  });

  app.get("/supplier-intelligence/products", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ products: listSupplierProducts(user.workspaceId) });
  });

  app.post("/supplier-intelligence/products", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = supplierProductSchema.parse({ ...(request.body as Record<string, unknown>), ingestedAt: new Date().toISOString() });
    return reply.send({ product: ingestSupplierProduct(user.workspaceId, body) });
  });

  app.get("/supplier-intelligence/opportunities", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ opportunities: findSupplierOpportunities(user.workspaceId) });
  });

  app.post("/supplier-intelligence/score", { preHandler: authenticate }, async (request, reply) => {
    const body = supplierProductSchema.parse({ ...(request.body as Record<string, unknown>), ingestedAt: new Date().toISOString() });
    return reply.send({ score: scoreSupplierProduct(body) });
  });

  app.post("/supplier-intelligence/shipping-acceptability", { preHandler: authenticate }, async (request, reply) => {
    const input = shippingAcceptabilityInputSchema.parse(request.body);
    return reply.send({ result: evaluateShippingAcceptability(input) });
  });

  app.post("/supplier-intelligence/compare", { preHandler: authenticate }, async (request, reply) => {
    const body = z.object({
      productIdea: z.string(),
      targetCountry: z.string(),
      candidates: z.array(supplierProductSchema),
    }).parse(request.body);
    const candidates = body.candidates.map((c) => ({ ...c, ingestedAt: c.ingestedAt ?? new Date().toISOString() }));
    return reply.send({ comparison: compareSuppliersForProduct(body.productIdea, body.targetCountry, candidates) });
  });

  app.get("/supplier-intelligence/risks", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const products = listSupplierProducts(user.workspaceId);
    return reply.send({ risks: products.flatMap((p) => detectSupplierRisks(p)) });
  });

  app.get("/supplier-intelligence/cj-adapter", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const record = getEmpireAccessRecord(user.workspaceId, "cj-dropshipping");
    return reply.send({ skeleton: buildCjAdapterSkeleton(Boolean(record.credentialsRef)) });
  });

  app.post("/supplier-intelligence/fulfillment-handoff", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().default("co-grand-king"),
      product: supplierProductSchema,
      customerOrderId: z.string().optional(),
      pipelineId: z.string().optional(),
    }).parse(request.body);
    const product = { ...body.product, ingestedAt: body.product.ingestedAt ?? new Date().toISOString() };
    const handoff = prepareFulfillmentHandoff(user.workspaceId, body.companyId, product, {
      customerOrderId: body.customerOrderId,
      pipelineId: body.pipelineId,
    });
    return reply.send({ handoff });
  });

  app.get("/health/supplier-intelligence", async (_request, reply) => {
    const dashboard = buildSupplierDashboard("ws_empire_1", "co-grand-king");
    return reply.send({
      status: dashboard.architectureComplete ? "HEALTHY" : "WARNING",
      architecturePercent: dashboard.architecturePercent,
      providers: dashboard.adapterSummary.total,
    });
  });
}
