import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import Fastify from "fastify";
import type { SessionUser } from "../../auth/permissions.js";
import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import { resetDatabaseInstance } from "../../brain/database.js";
import { registerAmazonOrderReadRoutes } from "../../orchestration/reality-integration/live-commerce/routes/amazon-order-read-routes.js";

const oldMode = process.env.LIVE_COMMERCE_INTEGRATION_MODE;
const oldPath = process.env.DATABASE_PATH;
const founder: SessionUser = {
  id: "offline-founder", email: "owner@example.test", name: "Owner",
  role: "founder", workspaceId: "workspace-owner",
};
afterEach(() => {
  resetDatabaseInstance();
  if (oldMode === undefined) delete process.env.LIVE_COMMERCE_INTEGRATION_MODE;
  else process.env.LIVE_COMMERCE_INTEGRATION_MODE = oldMode;
  if (oldPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = oldPath;
});

test("production-critical Amazon import route enforces founder identity before read or sync", async () => {
  process.env.DATABASE_PATH = ":memory:amazon-order-route";
  process.env.LIVE_COMMERCE_INTEGRATION_MODE = "sandbox";
  resetDatabaseInstance();
  const audits: unknown[] = [];
  let user: SessionUser | null = { ...founder, role: "operator" };
  const app = Fastify();
  await registerAmazonOrderReadRoutes(app, {
    authenticate: async (request, reply) => {
      if (!user) { reply.code(401).send({ error: "Authentication required" }); return; }
      request.user = user;
    },
    auditLogger: { write: (entry: unknown) => { audits.push(entry); } } as unknown as AuditLogger,
  });
  try {
    for (const [method, url] of [
      ["GET", "/commerce/amazon-us/orders/imported"],
      ["POST", "/commerce/amazon-us/orders/sync"],
      ["GET", "/commerce/amazon-us/listings/imported"],
      ["POST", "/commerce/amazon-us/listings/sync"],
    ] as const) {
      user = null;
      assert.equal((await app.inject({ method, url })).statusCode, 401);
      user = { ...founder, role: "operator" };
      assert.equal((await app.inject({ method, url })).statusCode, 403);
    }
    user = founder;
    const response = await app.inject({ method: "GET", url: "/commerce/amazon-us/orders/imported" });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json().orders, []);
    assert.equal(response.json().commerceEffect, "none");
    const catalog = await app.inject({ method: "GET", url: "/commerce/amazon-us/listings/imported" });
    assert.equal(catalog.statusCode, 200);
    assert.deepEqual(catalog.json().listings, []);
    assert.equal(catalog.json().commerceEffect, "none");
    const blocked = await app.inject({ method: "POST", url: "/commerce/amazon-us/orders/sync" });
    assert.equal(blocked.statusCode, 409); // No sandbox fixture may be mistaken for seller data.
    assert.equal((await app.inject({ method: "POST", url: "/commerce/amazon-us/listings/sync" })).statusCode, 409);
    assert.deepEqual(audits, []);
  } finally { await app.close(); }
});
