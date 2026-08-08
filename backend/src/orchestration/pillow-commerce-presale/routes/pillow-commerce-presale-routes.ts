import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { createAuthMiddleware } from "../../../auth/middleware.js";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import type { ApprovalGateEngine } from "../../pillow-approval/approval-gate-engine.js";
import { getPillowCommercePresaleRepository } from "../repository/sqlite-pillow-commerce-presale-repository.js";
import {
  applyOwnerDecisionToOpportunity,
  runPillowCommercePresaleCycle,
} from "../services/presale-cycle-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

let routesRegistered = false;

export async function registerPillowCommercePresaleRoutes(
  app: FastifyInstance,
  deps: {
    authenticate: AuthMiddleware;
    auditLogger: AuditLogger;
    getApprovalGate?: () => ApprovalGateEngine | null;
  },
): Promise<void> {
  if (routesRegistered) return;
  routesRegistered = true;

  app.post(
    "/pillow-commerce-presale/run-cycle",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== "founder" && user.role !== "admin") {
        return reply.code(403).send({ error: "Founder access required" });
      }
      const body = z
        .object({
          workspaceId: z.string().optional(),
          companyId: z.string().optional(),
          maxCandidates: z.number().int().positive().max(20).optional(),
          initiatedBy: z.enum(["http", "pillow-tool", "pillow-autonomous"]).optional(),
        })
        .parse(request.body ?? {});

      const workspaceId = body.workspaceId ?? user.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const cycle = await runPillowCommercePresaleCycle({
        workspaceId,
        companyId: body.companyId ?? GRAND_KING_COMPANY_ID,
        initiatedBy: body.initiatedBy ?? "http",
        maxCandidates: body.maxCandidates,
        approvalGate: deps.getApprovalGate?.() ?? null,
      });

      deps.auditLogger.write({
        action: "tool.execute",
        actor: user.email,
        workspaceId,
        companyId: cycle.companyId,
        correlationId: cycle.cycleId,
        metadata: {
          tool: "pillow_commerce.run_presale_cycle",
          outcome: cycle.outcome,
          candidatesRetrieved: cycle.candidatesRetrieved,
          rejected: cycle.rejections.length,
          approvalId: cycle.qualifiedOpportunity?.approvalId ?? null,
          publicationAttempted: false,
          supplierSpendAttempted: false,
        },
      });

      return reply.send(cycle);
    },
  );

  app.get(
    "/pillow-commerce-presale/latest",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const user = request.user!;
      const workspaceId = user.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const repo = getPillowCommercePresaleRepository();
      return reply.send({
        standingObjective:
          "FIND AND PREPARE SAFE, PROFITABLE DROPSHIPPING OPPORTUNITIES FOR AMAZON US",
        latestCycle: repo.getLatestCycle(workspaceId),
        latestOpportunity: repo.getLatestOpportunity(workspaceId),
        pendingApproval: repo.getPendingApprovalOpportunity(workspaceId),
      });
    },
  );

  app.post(
    "/pillow-commerce-presale/owner-decision",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== "founder" && user.role !== "admin") {
        return reply.code(403).send({ error: "Founder access required" });
      }
      const body = z
        .object({
          opportunityId: z.string().min(1),
          outcome: z.enum(["Approved", "Rejected", "Cancelled"]),
          approvalId: z.string().optional(),
          notes: z.string().optional(),
        })
        .parse(request.body);

      const workspaceId = user.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const gate = deps.getApprovalGate?.() ?? null;
      if (gate && body.approvalId) {
        gate.decide({
          workspaceId,
          approvalId: body.approvalId,
          outcome: body.outcome,
          actor: user.email,
          notes: body.notes,
          correlationId: request.id,
        });
      }

      const opportunity = applyOwnerDecisionToOpportunity({
        workspaceId,
        opportunityId: body.opportunityId,
        outcome: body.outcome,
      });

      return reply.send({
        ok: Boolean(opportunity),
        opportunity,
        publicationAttempted: false,
        supplierSpendAttempted: false,
        note: "Owner decision recorded. Publication and supplier spend remain gated and were NOT executed.",
      });
    },
  );

  app.get("/health/pillow-commerce-presale", async (_request, reply) => {
    const repo = getPillowCommercePresaleRepository();
    const latest = repo.getLatestCycle(GRAND_KING_WORKSPACE_ID);
    return reply.send({
      ok: true,
      module: "pillow-commerce-presale",
      standingObjective:
        "FIND AND PREPARE SAFE, PROFITABLE DROPSHIPPING OPPORTUNITIES FOR AMAZON US",
      lastOutcome: latest?.outcome ?? null,
      lastCycleAt: latest?.completedAt ?? null,
      publicationAutoDisabled: true,
      supplierSpendAutoDisabled: true,
    });
  });
}
