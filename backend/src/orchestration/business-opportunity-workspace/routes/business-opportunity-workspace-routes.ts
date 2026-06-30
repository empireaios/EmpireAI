import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { BUSINESS_OPPORTUNITY_STATUSES } from "../models/business-opportunity.js";
import {
  approveBusinessOpportunity,
  BusinessOpportunityBlockedError,
  BusinessOpportunityNotFoundError,
  compareBusinessOpportunities,
  getApprovalHistory,
  listBusinessOpportunities,
  rejectBusinessOpportunity,
  saveBusinessOpportunityForLater,
} from "../services/business-opportunity-workspace-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerBusinessOpportunityWorkspaceRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/business-workspace/opportunities", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        companyId: z.string().min(1),
        status: z.enum(BUSINESS_OPPORTUNITY_STATUSES).optional(),
        category: z.string().optional(),
        favorite: z.coerce.boolean().optional(),
        minDominationScore: z.coerce.number().optional(),
        minExpectedRoi: z.coerce.number().optional(),
        sortBy: z.enum(["rank", "dominationScore", "expectedRoi", "launchConfidence"]).optional(),
        sync: z.coerce.boolean().optional(),
      })
      .parse(request.query);

    const opportunities = listBusinessOpportunities(user.workspaceId, query.companyId, {
      status: query.status,
      category: query.category,
      favorite: query.favorite,
      minDominationScore: query.minDominationScore,
      minExpectedRoi: query.minExpectedRoi,
      sortBy: query.sortBy,
    }, { sync: query.sync });

    return reply.send({ opportunities, total: opportunities.length });
  });

  app.get("/business-workspace/compare", { preHandler: authenticate }, async (request, reply) => {
    const query = z
      .object({
        opportunityA: z.string().min(1),
        opportunityB: z.string().min(1),
      })
      .parse(request.query);

    try {
      const comparison = compareBusinessOpportunities(query.opportunityA, query.opportunityB);
      return reply.send({ comparison });
    } catch (error) {
      if (error instanceof BusinessOpportunityNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/business-workspace/opportunities/:businessOpportunityId/approve", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ businessOpportunityId: z.string().min(1) }).parse(request.params);

    try {
      const opportunity = approveBusinessOpportunity(params.businessOpportunityId, user.email);
      auditLogger.write({
        action: "business_workspace.approved",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { businessOpportunityId: params.businessOpportunityId, status: opportunity.status },
      });
      return reply.send({ opportunity });
    } catch (error) {
      if (error instanceof BusinessOpportunityNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof BusinessOpportunityBlockedError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/business-workspace/opportunities/:businessOpportunityId/reject", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ businessOpportunityId: z.string().min(1) }).parse(request.params);
    const body = z.object({ reason: z.string().optional() }).parse(request.body ?? {});

    try {
      const opportunity = rejectBusinessOpportunity(params.businessOpportunityId, user.email, body.reason);
      auditLogger.write({
        action: "business_workspace.rejected",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { businessOpportunityId: params.businessOpportunityId, reason: body.reason },
      });
      return reply.send({ opportunity });
    } catch (error) {
      if (error instanceof BusinessOpportunityNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/business-workspace/opportunities/:businessOpportunityId/save", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ businessOpportunityId: z.string().min(1) }).parse(request.params);
    const body = z.object({ notes: z.string().optional() }).parse(request.body ?? {});

    try {
      const opportunity = saveBusinessOpportunityForLater(params.businessOpportunityId, user.email, body.notes);
      auditLogger.write({
        action: "business_workspace.saved",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { businessOpportunityId: params.businessOpportunityId },
      });
      return reply.send({ opportunity });
    } catch (error) {
      if (error instanceof BusinessOpportunityNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/business-workspace/history", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        companyId: z.string().optional(),
        businessOpportunityId: z.string().optional(),
      })
      .parse(request.query);

    const history = getApprovalHistory(
      user.workspaceId,
      query.companyId,
      query.businessOpportunityId,
    );
    return reply.send({ history, total: history.length });
  });
}
