import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Fastify from "fastify";
import type { SessionUser } from "../../auth/permissions.js";
import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import {
  registerLiveCjFulfillmentRoutes,
  type LiveCjRouteServices,
} from "../../execution/live-cj-fulfillment/routes/live-cj-fulfillment-routes.js";

const owner: SessionUser = {
  id: "synthetic-founder", email: "owner@example.test", name: "Owner",
  role: "founder", workspaceId: "workspace-owner",
};
const routes = [
  { path: "prepare", payload: { pipelineId: "pipeline-test" } },
  { path: "approve", payload: { fulfillmentId: "fulfillment-test", approvalToken: "synthetic-token", approvedBy: "forged@example.test", approvedAt: "1900-01-01T00:00:00.000Z" } },
  { path: "submit-live", payload: { fulfillmentId: "fulfillment-test" } },
  { path: "tracking/sync", payload: { fulfillmentId: "fulfillment-test", markDelivered: true } },
  { path: "recover", payload: { fulfillmentId: "fulfillment-test", approvalToken: "synthetic-token", approvedBy: "forged@example.test", approvedAt: "1900-01-01T00:00:00.000Z" } },
] as const;

async function harness(options: {
  user?: SessionUser | null;
  resourceWorkspace?: string;
  missing?: boolean;
} = {}) {
  const user = options.user === undefined ? owner : options.user;
  const workspaceId = options.resourceWorkspace ?? owner.workspaceId;
  const calls: Array<{ action: string; input: unknown }> = [];
  const audits: unknown[] = [];
  const fulfillment = {
    fulfillmentId: "fulfillment-test", pipelineId: "pipeline-test", workspaceId,
    companyId: "company-test", status: "APPROVED", supplierOrderId: null, mock: false,
  } as NonNullable<ReturnType<LiveCjRouteServices["getLiveCjFulfillmentById"]>>;
  const perform = (action: string, input: unknown) => {
    calls.push({ action, input });
    return fulfillment;
  };
  const services: Partial<LiveCjRouteServices> = {
    getPipeline: () => options.missing ? null : { workspaceId } as NonNullable<ReturnType<LiveCjRouteServices["getPipeline"]>>,
    getLiveCjFulfillmentById: () => options.missing ? null : fulfillment,
    prepareLiveCjFulfillment: (input) => perform("prepare", input),
    applyFounderApproval: (input) => perform("approve", input),
    executeLiveCjSubmit: async (input) => perform("submit-live", input),
    syncLiveCjTracking: async (input) => perform("tracking/sync", input),
    recoverFailedFulfillment: (input) => perform("recover", input),
  };
  const app = Fastify();
  await registerLiveCjFulfillmentRoutes(app, {
    authenticate: async (request, reply) => {
      if (!user) { reply.code(401).send({ error: "Authentication required" }); return; }
      request.user = user;
    },
    auditLogger: { write: (entry: unknown) => { audits.push(entry); } } as unknown as AuditLogger,
    services,
  });
  return { app, calls, audits };
}

describe("CJ HTTP authorization precedes every effect", () => {
  for (const route of routes) {
    it(`${route.path}: foreign workspace never reaches mutation or provider service`, async () => {
      const { app, calls, audits } = await harness({ resourceWorkspace: "workspace-foreign" });
      try {
        const response = await app.inject({ method: "POST", url: `/live-cj-fulfillment/${route.path}`, payload: route.payload });
        assert.equal(response.statusCode, 403);
        assert.deepEqual(calls, []);
        assert.deepEqual(audits, []);
      } finally { await app.close(); }
    });
    it(`${route.path}: absent resource never reaches mutation`, async () => {
      const { app, calls } = await harness({ missing: true });
      try {
        assert.equal((await app.inject({ method: "POST", url: `/live-cj-fulfillment/${route.path}`, payload: route.payload })).statusCode, 404);
        assert.deepEqual(calls, []);
      } finally { await app.close(); }
    });
    it(`${route.path}: unauthenticated request never reaches mutation`, async () => {
      const { app, calls } = await harness({ user: null });
      try {
        assert.equal((await app.inject({ method: "POST", url: `/live-cj-fulfillment/${route.path}`, payload: route.payload })).statusCode, 401);
        assert.deepEqual(calls, []);
      } finally { await app.close(); }
    });
  }

  for (const route of routes.filter(({ path }) => ["approve", "submit-live", "recover"].includes(path))) {
    it(`${route.path}: an operator cannot grant or consume founder authority`, async () => {
      const { app, calls } = await harness({ user: { ...owner, role: "operator" } });
      try {
        assert.equal((await app.inject({ method: "POST", url: `/live-cj-fulfillment/${route.path}`, payload: route.payload })).statusCode, 403);
        assert.deepEqual(calls, []);
      } finally { await app.close(); }
    });
  }

  for (const route of routes.filter(({ path }) => ["approve", "recover"].includes(path))) {
    it(`${route.path}: approval attribution and time cannot be supplied by the client`, async () => {
      const { app, calls } = await harness();
      const before = Date.now();
      try {
        assert.equal((await app.inject({ method: "POST", url: `/live-cj-fulfillment/${route.path}`, payload: route.payload })).statusCode, 200);
        assert.equal(calls.length, 1);
        const input = calls[0]!.input as { approvedBy: string; approvedAt: string; approvalToken: string };
        assert.equal(input.approvedBy, owner.email);
        assert.ok(Date.parse(input.approvedAt) >= before && Date.parse(input.approvedAt) <= Date.now());
        assert.equal(input.approvalToken, "synthetic-token");
      } finally { await app.close(); }
    });
  }

  it("same-workspace founder reaches the bounded submit service exactly once", async () => {
    const { app, calls } = await harness();
    try {
      assert.equal((await app.inject({ method: "POST", url: "/live-cj-fulfillment/submit-live", payload: { fulfillmentId: "fulfillment-test" } })).statusCode, 200);
      assert.deepEqual(calls, [{ action: "submit-live", input: "fulfillment-test" }]);
    } finally { await app.close(); }
  });
});
