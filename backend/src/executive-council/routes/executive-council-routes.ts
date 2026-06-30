import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../auth/middleware.js";
import { DebateContextInputSchema } from "../models/executive-core.js";
import { ExecutiveCertificationStatusSchema, ExecutiveMaturitySchema } from "../models/executive-registry.js";
import { AccountabilityOutcomeSchema } from "../models/executive-accountability.js";
import { runExecutiveDebate, listDebateSessions, getLatestDebateSession } from "../services/executive-debate-engine.js";
import {
  initializeExecutiveRegistry,
  listRegisteredExecutives,
  registerExecutive,
  updateExecutiveCertification,
} from "../services/executive-registry-service.js";
import { getExecutiveCouncilRuntime } from "../services/executive-council-runtime.js";
import { buildExecutiveHeadquartersDashboard } from "../services/executive-headquarters-service.js";
import { generateExecutiveMissions, listExecutiveMissions } from "../services/executive-mission-generator.js";
import { recordExecutiveAccountability, listExecutiveAccountability } from "../services/executive-accountability-service.js";
import {
  buildExecutiveMemorySummary,
  captureExecutiveLearningToSoul,
  getExecutiveDecisionHistory,
} from "../services/executive-memory-service.js";
import { EXECUTIVE_COMMERCIAL_WORKFLOW } from "../models/executive-workflow.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerExecutiveCouncilRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/executive-council/runtime", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ runtime: getExecutiveCouncilRuntime(user.workspaceId, query.companyId) });
  });

  app.get("/executive-council/executives", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ executives: listRegisteredExecutives(user.workspaceId, query.companyId) });
  });

  app.post("/executive-council/executives", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1),
        executiveId: z.string().min(1),
        role: z.string().min(1),
        title: z.string().min(1),
        domain: z.string().min(1),
        focusAreas: z.array(z.string()).min(1),
        certificationStatus: ExecutiveCertificationStatusSchema.optional(),
        maturity: ExecutiveMaturitySchema.optional(),
      })
      .parse(request.body);
    const { companyId, ...input } = body;
    const executive = registerExecutive(user.workspaceId, companyId, input);
    return reply.code(201).send({ executive });
  });

  app.patch("/executive-council/executives/:executiveId/certification", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ executiveId: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        companyId: z.string().min(1),
        certificationStatus: ExecutiveCertificationStatusSchema,
        maturity: ExecutiveMaturitySchema.optional(),
      })
      .parse(request.body);
    const executive = updateExecutiveCertification(
      user.workspaceId,
      body.companyId,
      params.executiveId,
      body.certificationStatus,
      body.maturity,
    );
    if (!executive) return reply.code(404).send({ error: "Executive not found" });
    return reply.send({ executive });
  });

  app.post("/executive-council/debate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).merge(DebateContextInputSchema).parse(request.body);
    const { companyId, ...context } = body;
    const session = runExecutiveDebate(user.workspaceId, companyId, context);

    auditLogger.write({
      action: "executive_council.debate",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { sessionId: session.sessionId, consensus: session.consensus, topic: session.topic },
    });

    try {
      captureExecutiveLearningToSoul(user.workspaceId, session, user.email);
    } catch {
      // Soul optional in some environments
    }

    return reply.code(201).send({ session });
  });

  app.get("/executive-council/sessions", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ sessions: listDebateSessions(user.workspaceId, query.companyId) });
  });

  app.get("/executive-council/sessions/latest", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ session: getLatestDebateSession(user.workspaceId, query.companyId) });
  });

  app.post("/executive-council/accountability", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1),
        executiveId: z.string().min(1),
        recommendationId: z.string().min(1),
        sessionId: z.string().min(1),
        predictedOutcome: z.string().min(1),
        outcome: AccountabilityOutcomeSchema,
        actualOutcome: z.string().optional(),
        commercialResult: z.string().optional(),
        confidenceAtRecommendation: z.number().min(0).max(100),
      })
      .parse(request.body);
    const { companyId, ...input } = body;
    const record = recordExecutiveAccountability(user.workspaceId, companyId, input);
    return reply.code(201).send({ record });
  });

  app.get("/executive-council/accountability", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({ companyId: z.string().min(1), executiveId: z.string().optional() })
      .parse(request.query);
    return reply.send({
      records: listExecutiveAccountability(user.workspaceId, query.companyId, query.executiveId),
    });
  });

  app.get("/executive-council/memory/:executiveId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ executiveId: z.string().min(1) }).parse(request.params);
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({
      memory: buildExecutiveMemorySummary(user.workspaceId, query.companyId, params.executiveId),
      decisionHistory: getExecutiveDecisionHistory(user.workspaceId, query.companyId),
    });
  });

  app.post("/executive-council/missions/generate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).parse(request.body);
    const missions = generateExecutiveMissions(user.workspaceId, body.companyId);
    return reply.code(201).send({ missions });
  });

  app.get("/executive-council/missions", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ missions: listExecutiveMissions(user.workspaceId, query.companyId) });
  });

  app.get("/executive-council/workflow", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ workflow: EXECUTIVE_COMMERCIAL_WORKFLOW });
  });

  app.get("/executive-council/headquarters", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    initializeExecutiveRegistry(user.workspaceId, query.companyId);
    return reply.send({ dashboard: buildExecutiveHeadquartersDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/executive-council/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ dashboard: buildExecutiveHeadquartersDashboard(user.workspaceId, query.companyId) });
  });
}
