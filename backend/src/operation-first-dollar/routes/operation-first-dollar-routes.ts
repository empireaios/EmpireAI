import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../auth/middleware.js";
import { FIRST_DOLLAR_MILESTONES } from "../models/operation-first-dollar.js";
import {
  buildLaunchCommandCenter,
  buildOperationFirstDollarDashboard,
  computeBusinessKpiSnapshot,
  generateDailyExecutiveBrief,
  getFirstDollarTrackerSummary,
  getLatestKpiSnapshot,
  listEmpireLearning,
  listMilestones,
  OperationFirstDollarError,
  recordEmpireLearning,
  recordMilestone,
  recordRealBusinessEvent,
  syncPipelineMilestones,
} from "../services/operation-first-dollar-service.js";
import { getOperationFirstDollarRepository } from "../repositories/sqlite-operation-first-dollar-repository.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerOperationFirstDollarRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/operation-first-dollar/launch-command-center", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send(buildLaunchCommandCenter(user.workspaceId, query.companyId));
  });

  app.get("/operation-first-dollar/first-dollar-tracker", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send(getFirstDollarTrackerSummary(user.workspaceId, query.companyId));
  });

  app.get("/operation-first-dollar/milestones", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ milestones: listMilestones(user.workspaceId, query.companyId) });
  });

  app.post("/operation-first-dollar/milestones", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().min(1),
      milestone: z.enum(FIRST_DOLLAR_MILESTONES),
      source: z.enum(["REAL", "SIMULATED"]),
      evidence: z.string().optional(),
      externalReference: z.string().optional(),
    }).parse(request.body);

    try {
      const record = recordMilestone({
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        milestone: body.milestone,
        source: body.source,
        evidence: body.evidence,
        externalReference: body.externalReference,
        actor: user.email,
      });
      auditLogger.write({
        action: "ofd.milestone.recorded",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { milestone: body.milestone, source: body.source },
      });
      return reply.code(201).send({ milestone: record });
    } catch (error) {
      if (error instanceof OperationFirstDollarError) {
        return reply.code(422).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/operation-first-dollar/real-events", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().min(1),
      eventType: z.enum(["sale", "visitor", "add_to_cart", "shipment", "payout", "profit", "refund"]),
      amountUsd: z.number().optional(),
      externalReference: z.string().min(1),
      evidence: z.string().min(1),
    }).parse(request.body);

    const result = recordRealBusinessEvent({
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      eventType: body.eventType,
      amountUsd: body.amountUsd,
      externalReference: body.externalReference,
      evidence: body.evidence,
    });

    auditLogger.write({
      action: "ofd.real_event.recorded",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { eventType: body.eventType, externalReference: body.externalReference },
    });

    return reply.code(201).send(result);
  });

  app.get("/operation-first-dollar/kpi", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1), refresh: z.coerce.boolean().optional() }).parse(request.query);
    const snapshot = query.refresh
      ? computeBusinessKpiSnapshot(user.workspaceId, query.companyId)
      : getLatestKpiSnapshot(user.workspaceId, query.companyId);
    return reply.send({ kpi: snapshot });
  });

  app.get("/operation-first-dollar/kpi/history", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1), limit: z.coerce.number().optional() }).parse(request.query);
    return reply.send({
      snapshots: getOperationFirstDollarRepository().listKpiSnapshots(user.workspaceId, query.companyId, query.limit ?? 30),
    });
  });

  app.get("/operation-first-dollar/learning", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({
      companyId: z.string().min(1),
      source: z.enum(["REAL", "SIMULATED"]).optional(),
    }).parse(request.query);
    return reply.send({ learning: listEmpireLearning(user.workspaceId, query.companyId, query.source) });
  });

  app.post("/operation-first-dollar/learning", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().min(1),
      decision: z.string().min(1),
      result: z.string().min(1),
      whySucceeded: z.string().optional(),
      whyFailed: z.string().optional(),
      recommendedImprovements: z.array(z.string()).optional(),
      source: z.enum(["REAL", "SIMULATED"]),
      eventType: z.string().min(1),
    }).parse(request.body);

    const record = recordEmpireLearning({
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      decision: body.decision,
      result: body.result,
      whySucceeded: body.whySucceeded,
      whyFailed: body.whyFailed,
      recommendedImprovements: body.recommendedImprovements,
      source: body.source,
      eventType: body.eventType,
    });

    return reply.code(201).send({ learning: record });
  });

  app.post("/operation-first-dollar/daily-brief", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).parse(request.body);
    const brief = generateDailyExecutiveBrief(user.workspaceId, body.companyId);
    return reply.code(201).send({ brief });
  });

  app.get("/operation-first-dollar/daily-brief/latest", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const brief = getOperationFirstDollarRepository().getLatestBrief(user.workspaceId, query.companyId);
    if (!brief) return reply.code(404).send({ error: "No brief generated yet" });
    return reply.send({ brief });
  });

  app.get("/operation-first-dollar/daily-brief/history", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1), limit: z.coerce.number().optional() }).parse(request.query);
    return reply.send({
      briefs: getOperationFirstDollarRepository().listBriefs(user.workspaceId, query.companyId, query.limit ?? 30),
    });
  });

  app.get("/operation-first-dollar/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send(buildOperationFirstDollarDashboard(user.workspaceId, query.companyId));
  });

  app.post("/operation-first-dollar/sync-pipeline", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).parse(request.body);
    const synced = syncPipelineMilestones(user.workspaceId, body.companyId);
    return reply.send({ synced });
  });
}
