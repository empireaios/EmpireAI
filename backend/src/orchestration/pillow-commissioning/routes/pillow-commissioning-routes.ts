import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { createAuthMiddleware } from "../../../auth/middleware.js";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { authorisePillowBirth, getBirthRecord } from "../birth.js";
import {
  buildCostControlCentreSnapshot,
} from "../cost-control-centre.js";
import {
  assertPaidAutonomousAllowed,
  buildCostGuardStatus,
  getCostGuardLimits,
  runSafeHardStopProof,
  setCostGuardLimits,
} from "../cost-guard.js";
import { listFlightEvents, recordFlightEvent } from "../flight-recorder.js";
import { buildScaleCostOptimisationReport } from "../intelligence-tiers.js";
import {
  getOneProductCommissioningRecord,
  runPillowOneProductCommissioning,
} from "../one-product-commissioning.js";
import { buildPillowOperatingState } from "../operating-state.js";
import { buildPortfolioControlPlaneSnapshot } from "../portfolio-control-plane.js";
import { assessPostLaunchCommercialDeviations } from "../post-launch-commercial-deviation.js";
import {
  buildAndPersistOneProductDecisionDossier,
  getOrBuildOneProductDecisionDossier,
} from "../one-product-decision-dossier.js";
import { getPillowCommercePresaleRepository } from "../../pillow-commerce-presale/repository/sqlite-pillow-commerce-presale-repository.js";
import { buildSinceLastVisitBrief } from "../since-last-visit.js";
import { evaluateExecutiveBirthReadiness } from "../executive-operating-loop/birth-readiness.js";
import { runPillowCapabilityTests } from "../executive-operating-loop/capability-harness.js";
import { runExecutiveOperatingCycle } from "../executive-operating-loop/cycle-runner.js";
import { buildLiveCommercialSituation } from "../executive-operating-loop/live-situation.js";
import {
  getLatestExecutiveCycle,
  listExecutiveCycles,
  listOutcomes,
} from "../executive-operating-loop/store.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

let routesRegistered = false;

export async function registerPillowCommissioningRoutes(
  app: FastifyInstance,
  deps: {
    authenticate: AuthMiddleware;
    auditLogger: AuditLogger;
  },
): Promise<void> {
  if (routesRegistered) return;
  routesRegistered = true;

  app.get(
    "/pillow-commissioning/status",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const operating = buildPillowOperatingState(workspaceId);
      const birth = getBirthRecord(workspaceId);
      const since = buildSinceLastVisitBrief(workspaceId, { recordVisit: false });
      const costGuard = buildCostGuardStatus(workspaceId);
      const commissioning = getOneProductCommissioningRecord(workspaceId);
      return reply.send({
        operating,
        birth,
        sinceLastVisit: since,
        costGuard,
        oneProduct: commissioning,
        thousandRelease: "AWAITING_GRAND_KING_AND_CHATGPT",
        firstRealDollar: "NOT_YET_REALIZED",
      });
    },
  );

  app.get(
    "/pillow-commissioning/flight-recorder",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const query = z
        .object({
          limit: z.coerce.number().int().positive().max(200).optional(),
          since: z.string().optional(),
        })
        .parse(request.query ?? {});
      return reply.send({
        events: listFlightEvents(workspaceId, {
          limit: query.limit,
          since: query.since,
        }),
      });
    },
  );

  app.post(
    "/pillow-commissioning/visit",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const brief = buildSinceLastVisitBrief(workspaceId, { recordVisit: true });
      recordFlightEvent({
        workspaceId,
        eventType: "OBSERVE",
        businessArea: "executive",
        subsystem: "since-last-visit",
        objective: "Grand King visit recorded",
        authority: "grand_king",
        result: `Visit at ${brief.lastVisitAt}`,
        evidenceConsidered: ["founder-visit-clock"],
      });
      return reply.send(brief);
    },
  );

  app.get(
    "/pillow-commissioning/since-last-visit",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      return reply.send(buildSinceLastVisitBrief(workspaceId, { recordVisit: false }));
    },
  );

  app.get(
    "/pillow-commissioning/cost-control",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      return reply.send(buildCostControlCentreSnapshot(workspaceId));
    },
  );

  app.get(
    "/pillow-commissioning/portfolio-control",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      return reply.send(buildPortfolioControlPlaneSnapshot(workspaceId));
    },
  );

  app.get(
    "/pillow-commissioning/post-launch-deviations",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      return reply.send(assessPostLaunchCommercialDeviations(workspaceId));
    },
  );

  app.get(
    "/pillow-commissioning/cost-guard",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      return reply.send({
        status: buildCostGuardStatus(workspaceId),
        limits: getCostGuardLimits(workspaceId),
      });
    },
  );

  app.post(
    "/pillow-commissioning/cost-guard/limits",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== "founder" && user.role !== "admin") {
        return reply.code(403).send({ error: "Founder access required" });
      }
      const workspaceId = user.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const body = z
        .object({
          monthlyOperatingBudgetUsd: z.number().nonnegative().nullable().optional(),
          dailyAiBudgetUsd: z.number().nonnegative().nullable().optional(),
          providerModelBudgetUsd: z.number().nonnegative().nullable().optional(),
          missionCampaignBudgetUsd: z.number().nonnegative().nullable().optional(),
          autonomousPaidActionLimitUsd: z.number().nonnegative().nullable().optional(),
          commerceOperationalBudgetUsd: z.number().nonnegative().nullable().optional(),
          customerOrderFulfilmentBudgetUsd: z.number().nonnegative().nullable().optional(),
          warningPct: z.number().min(1).max(99).optional(),
          criticalPct: z.number().min(1).max(100).optional(),
        })
        .parse(request.body ?? {});
      const limits = setCostGuardLimits(workspaceId, body, user.email);
      return reply.send({ ok: true, limits, status: buildCostGuardStatus(workspaceId) });
    },
  );

  app.post(
    "/pillow-commissioning/cost-guard/hard-stop-proof",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== "founder" && user.role !== "admin") {
        return reply.code(403).send({ error: "Founder access required" });
      }
      const workspaceId = user.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const proof = runSafeHardStopProof(workspaceId, user.email);
      deps.auditLogger.write({
        action: "tool.execute",
        actor: user.email,
        workspaceId,
        companyId: "grand-king",
        correlationId: `hard-stop-proof-${Date.now()}`,
        metadata: { tool: "pillow_commissioning.hard_stop_proof", ...proof },
      });
      return reply.send(proof);
    },
  );

  app.get(
    "/pillow-commissioning/scale-cost-report",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      return reply.send(buildScaleCostOptimisationReport(workspaceId));
    },
  );

  app.post(
    "/pillow-commissioning/one-product/run",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== "founder" && user.role !== "admin") {
        return reply.code(403).send({ error: "Founder access required" });
      }
      const workspaceId = user.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const gate = assertPaidAutonomousAllowed(workspaceId, 0.01);
      if (!gate.allowed) {
        return reply.code(409).send({ ok: false, error: gate.reason, costGuard: gate.status });
      }
      const result = runPillowOneProductCommissioning(workspaceId);
      const dossier = result.ok
        ? buildAndPersistOneProductDecisionDossier(workspaceId)
        : { ok: false, dossier: null };
      deps.auditLogger.write({
        action: "tool.execute",
        actor: user.email,
        workspaceId,
        companyId: "grand-king",
        correlationId: result.record?.commissioningId ?? "opc-none",
        metadata: {
          tool: "pillow_commissioning.one_product_run",
          ok: result.ok,
          selectionAuthority: result.record?.selectionAuthority ?? null,
          cursorSelected: false,
          publicationAttempted: false,
          supplierSpendAttempted: false,
          dossierBuilt: Boolean(dossier.dossier),
        },
      });
      return reply.code(result.ok ? 200 : 409).send({
        ...result,
        decisionDossier: dossier.dossier,
      });
    },
  );

  app.get(
    "/pillow-commissioning/one-product",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      return reply.send({
        record: getOneProductCommissioningRecord(workspaceId),
      });
    },
  );

  app.get(
    "/pillow-commissioning/one-product/decision-dossier",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const commerce =
        getPillowCommercePresaleRepository().getPendingApprovalOpportunity(workspaceId);
      const result = getOrBuildOneProductDecisionDossier(workspaceId, {
        commerceOpportunityId: commerce?.opportunityId ?? null,
        commerceOpportunityName: commerce?.recommendation.productName ?? null,
      });
      return reply.code(result.ok ? 200 : 404).send(result);
    },
  );

  app.get(
    "/pillow-commissioning/birth",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      return reply.send(getBirthRecord(workspaceId));
    },
  );

  app.get(
    "/pillow-commissioning/executive-loop/latest",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      return reply.send({
        latest: getLatestExecutiveCycle(workspaceId),
        recent: listExecutiveCycles(workspaceId, 5),
        outcomes: listOutcomes(workspaceId, 20),
      });
    },
  );

  app.post(
    "/pillow-commissioning/executive-loop/run",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const situation = buildLiveCommercialSituation(workspaceId);
      const cycle = runExecutiveOperatingCycle({
        workspaceId,
        situation,
        mode: "live",
        persist: true,
        recordFlight: true,
      });
      return reply.send({ ok: true, cycle });
    },
  );

  app.post(
    "/pillow-commissioning/capability-tests/run",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = `${request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID}:capability-sandbox`;
      const result = runPillowCapabilityTests(workspaceId);
      return reply.send({ ok: true, ...result });
    },
  );

  app.get(
    "/pillow-commissioning/birth-readiness",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      return reply.send(evaluateExecutiveBirthReadiness(workspaceId));
    },
  );

  app.post(
    "/pillow-commissioning/birth/authorise",
    { preHandler: deps.authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== "founder" && user.role !== "admin") {
        return reply.code(403).send({ error: "Founder access required" });
      }
      const workspaceId = user.workspaceId ?? GRAND_KING_WORKSPACE_ID;
      const body = z
        .object({
          confirm: z.literal("AUTHORISE_PILLOW_BIRTH"),
        })
        .parse(request.body ?? {});
      void body;
      const result = authorisePillowBirth(workspaceId, user.email);
      return reply.code(result.ok ? 200 : 409).send(result);
    },
  );

  app.get("/health/pillow-commissioning", async (_request, reply) => {
    const birth = getBirthRecord(GRAND_KING_WORKSPACE_ID);
    return reply.send({
      ok: true,
      module: "pillow-commissioning",
      birthStatus: birth.status,
      birthTimestamp: birth.birthTimestamp,
      technicallyReady: birth.technicallyReady,
      thousandRelease: "AWAITING_GRAND_KING_AND_CHATGPT",
    });
  });
}
