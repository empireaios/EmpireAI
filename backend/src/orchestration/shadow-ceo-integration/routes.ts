/**
 * Shadow CEO inspection API — Grand King cockpit-critical.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { createAuthMiddleware } from "../../auth/middleware.js";
import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import { openShadowCeoRepository, loadChain } from "../shadow-ceo/index.js";
import {
  listBlockedActions,
  stopOperatingLoopAndPersist,
} from "../shadow-ceo-authority/index.js";
import { runIntegratedVerticalSlice } from "./integrated-vertical-slice.js";
import { resolveShadowCeoDbPath } from "./durable-paths.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

let registered = false;

function founderOnly(user: { role?: string } | undefined): boolean {
  return user?.role === "founder" || user?.role === "admin";
}

export async function registerShadowCeoRoutes(
  app: FastifyInstance,
  _deps: {
    authenticate: AuthMiddleware;
    auditLogger: AuditLogger;
  },
): Promise<void> {
  if (registered) return;
  registered = true;

  app.post(
    "/shadow-ceo/run-vertical-slice",
    { preHandler: _deps.authenticate },
    async (request, reply) => {
      // EXPLICIT DEMO ROUTE ONLY — never invoked from ordinary Pillow chat admission.
      if (!founderOnly(request.user)) {
        return reply.code(403).send({ error: "Founder access required" });
      }
      const body = z
        .object({ runKey: z.string().optional() })
        .parse(request.body ?? {});
      const result = runIntegratedVerticalSlice({ runKey: body.runKey });
      return {
        ok: true,
        ENGINEERING_ONLY: true,
        BIRTH_STATUS: "NOT_BORN",
        WAVE_1: "0/24",
        REAL_COMMERCE_AUTHORIZED: false,
        objectiveId: result.controlPlane.objectiveId,
        chainIntegrityIssues: result.chainIntegrityIssues,
        ledger: result.ledger,
        authority: result.authority,
        restart: result.restart,
        baseline: result.baseline,
        cockpit: result.cockpit,
        brief: result.controlPlane.chain.brief,
      };
    },
  );

  app.get(
    "/shadow-ceo/cockpit",
    { preHandler: _deps.authenticate },
    async (request, reply) => {
      if (!founderOnly(request.user)) {
        return reply.code(403).send({ error: "Founder access required" });
      }
      const q = request.query as { objectiveId?: string; run?: string };
      if (q.run === "1") {
        const result = runIntegratedVerticalSlice();
        return {
          ok: true,
          ...result.cockpit,
          ledger: result.ledger,
          authority: result.authority,
          restart: result.restart,
          REAL_COMMERCE_AUTHORIZED: false,
        };
      }
      if (q.objectiveId) {
        const repo = openShadowCeoRepository({ dbPath: resolveShadowCeoDbPath() });
        const chain = loadChain(repo, q.objectiveId);
        repo.close();
        return {
          ok: true,
          chain,
          loop: null,
          blockedActions: listBlockedActions(),
          BIRTH_STATUS: "NOT_BORN",
          WAVE_1: "0/24",
          EXTERNAL_ACTION_LOCK: "LOCKED",
          REAL_COMMERCE_AUTHORIZED: false,
        };
      }
      {
        const repo = openShadowCeoRepository({ dbPath: resolveShadowCeoDbPath() });
        const recentObjectives = repo.listRecentObjectives(12).map((o) => ({
          id: o.id,
          title: o.title,
          mode: o.mode,
          createdAt: o.createdAt,
          completion: o.completion.status,
        }));
        repo.close();
        return {
          ok: true,
          message:
            recentObjectives.length > 0
              ? "Pass ?objectiveId= to load a durable episode chain"
              : "POST /shadow-ceo/run-vertical-slice or GET ?run=1",
          recentObjectives,
          BIRTH_STATUS: "NOT_BORN",
          WAVE_1: "0/24",
          EXTERNAL_ACTION_LOCK: "LOCKED",
          REAL_COMMERCE_AUTHORIZED: false,
        };
      }
    },
  );

  app.post(
    "/shadow-ceo/stop",
    { preHandler: _deps.authenticate },
    async (request, reply) => {
      if (!founderOnly(request.user)) {
        return reply.code(403).send({ error: "Founder access required" });
      }
      const body = z.object({ reason: z.string().min(1) }).parse(request.body ?? {});
      const loop = stopOperatingLoopAndPersist(body.reason);
      return { ok: true, loop };
    },
  );

  app.get("/health/shadow-ceo", async (_request, reply) => {
    return reply.send({
      status: "ok",
      module: "shadow-ceo",
      modeDefault: "SYNTHETIC",
      birthStatus: "NOT_BORN",
      realCommerceAuthorized: false,
    });
  });
}
