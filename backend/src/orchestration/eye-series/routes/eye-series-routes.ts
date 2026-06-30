import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { EYE_IDS } from "../models/eye-series.js";
import type { EyeId } from "../models/eye-series.js";
import {
  buildEyeSeriesDashboard,
  completeInvestigation,
  getEyeReport,
  getEyeSummary,
  listEyeReports,
  listInvestigationHistory,
  listKnowledgeGraph,
  runAllEyes,
  runEye,
  searchIntelligence,
  validateEyeSeries,
} from "../services/eye-series-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

const eyeIdSchema = z.enum(EYE_IDS);

export async function registerEyeSeriesRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post("/eye-series/run-all", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).parse(request.body);
    const result = runAllEyes(user.workspaceId, body.companyId);
    auditLogger.write({
      action: "eye_series.run_all",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { reports: result.reports.length },
    });
    return reply.code(201).send(result);
  });

  for (const eyeId of EYE_IDS) {
    app.post(`/eye-series/${eyeId}/run`, { preHandler: authenticate }, async (request, reply) => {
      const user = request.user!;
      const params = z.object({ eyeId: eyeIdSchema }).parse(request.params);
      const body = z.object({ companyId: z.string().min(1) }).parse(request.body);

      if (params.eyeId === "executive_eye") {
        const result = runAllEyes(user.workspaceId, body.companyId);
        return reply.code(201).send({ report: result.executive, brief: result.brief });
      }

      const report = runEye(params.eyeId as Exclude<EyeId, "executive_eye">, user.workspaceId, body.companyId);
      auditLogger.write({
        action: "eye_series.run",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { eyeId: params.eyeId, reportId: report.reportId },
      });
      return reply.code(201).send({ report });
    });

    app.get(`/eye-series/${eyeId}/list`, { preHandler: authenticate }, async (request, reply) => {
      const user = request.user!;
      z.object({ eyeId: eyeIdSchema }).parse(request.params);
      return reply.send({ reports: listEyeReports(user.workspaceId, eyeId) });
    });

    app.get(`/eye-series/${eyeId}/summary`, { preHandler: authenticate }, async (request, reply) => {
      const user = request.user!;
      z.object({ eyeId: eyeIdSchema }).parse(request.params);
      return reply.send(getEyeSummary(user.workspaceId, eyeId));
    });

    app.get(`/eye-series/${eyeId}/history`, { preHandler: authenticate }, async (request, reply) => {
      const user = request.user!;
      z.object({ eyeId: eyeIdSchema }).parse(request.params);
      return reply.send({ investigations: listInvestigationHistory(user.workspaceId, eyeId) });
    });
  }

  app.get("/eye-series/:eyeId/search", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ eyeId: eyeIdSchema }).parse(request.params);
    const query = z.object({ q: z.string().min(1) }).parse(request.query);
    return reply.send({ observations: searchIntelligence(user.workspaceId, query.q, params.eyeId) });
  });

  app.get("/eye-series/reports/:reportId", { preHandler: authenticate }, async (request, reply) => {
    const { reportId } = z.object({ reportId: z.string().min(1) }).parse(request.params);
    const report = getEyeReport(reportId);
    if (!report) return reply.code(404).send({ error: "Report not found" });
    return reply.send({ report });
  });

  app.get("/eye-series/knowledge-graph", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ eyeId: eyeIdSchema.optional(), limit: z.coerce.number().optional() }).parse(request.query);
    return reply.send({ observations: listKnowledgeGraph(user.workspaceId, query.eyeId, query.limit ?? 100) });
  });

  app.get("/eye-series/intelligence/search", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ q: z.string().min(1), eyeId: eyeIdSchema.optional() }).parse(request.query);
    return reply.send({ observations: searchIntelligence(user.workspaceId, query.q, query.eyeId) });
  });

  app.get("/eye-series/investigations", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ eyeId: eyeIdSchema.optional(), limit: z.coerce.number().optional() }).parse(request.query);
    return reply.send({ investigations: listInvestigationHistory(user.workspaceId, query.eyeId, query.limit ?? 50) });
  });

  app.post("/eye-series/investigate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ eyeId: eyeIdSchema, question: z.string().min(1) }).parse(request.body);
    const investigation = completeInvestigation(user.workspaceId, body.eyeId, body.question);
    return reply.code(201).send({ investigation });
  });

  app.get("/eye-series/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send(buildEyeSeriesDashboard(user.workspaceId, query.companyId));
  });

  app.post("/eye-series/validate-all", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).parse(request.body);
    const validation = await validateEyeSeries(user.workspaceId, body.companyId);
    auditLogger.write({
      action: "eye_series.validate_all",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { valid: validation.valid },
    });
    return reply.code(201).send({ validation });
  });
}
