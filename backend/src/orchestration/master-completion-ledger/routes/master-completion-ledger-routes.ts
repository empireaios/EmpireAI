import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildMasterCompletionLedger } from "../services/master-completion-ledger-service.js";
import { buildBusinessCompletionLedger } from "../services/business-completion-ledger-service.js";
import { buildRevenueMissionLedger } from "../services/revenue-mission-ledger-service.js";
import { buildOperationalAccessReport } from "../services/operational-access-report-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerMasterCompletionLedgerRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/master-completion-ledger/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1).default("co-grand-king") }).parse(request.query);
    return reply.send({ ledger: buildMasterCompletionLedger(user.workspaceId, query.companyId) });
  });

  app.get("/master-completion-ledger/programs", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1).default("co-grand-king") }).parse(request.query);
    const ledger = buildMasterCompletionLedger(user.workspaceId, query.companyId);
    return reply.send({ programs: ledger.programs, summary: ledger.summary });
  });

  app.get("/master-completion-ledger/business", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1).default("co-grand-king") }).parse(request.query);
    return reply.send({ ledger: buildBusinessCompletionLedger(user.workspaceId, query.companyId) });
  });

  app.get("/master-completion-ledger/revenue-mission", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1).default("co-grand-king") }).parse(request.query);
    return reply.send({ ledger: buildRevenueMissionLedger(user.workspaceId, query.companyId) });
  });

  app.get("/master-completion-ledger/operational-access-report", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ report: buildOperationalAccessReport(user.workspaceId) });
  });

  app.get("/health/master-completion-ledger", async (_request, reply) => {
    const ledger = buildMasterCompletionLedger("ws_empire_1", "co-grand-king");
    return reply.send({
      status: ledger.summary.blocked > 6 ? "WARNING" : "HEALTHY",
      averageCompletion: ledger.summary.averageCompletionPercent,
      successMission: ledger.successMission.phase,
    });
  });
}
