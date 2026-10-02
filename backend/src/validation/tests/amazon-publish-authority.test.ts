import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import Fastify from "fastify";
import { InMemorySessionStore } from "../../auth/session-store.js";
import { createAuthMiddleware } from "../../auth/middleware.js";
import type { SessionUser } from "../../auth/permissions.js";
import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import { getDatabase, resetDatabaseInstance } from "../../brain/database.js";
import { env } from "../../config/env.js";
import { getPillowAuthority } from "../../orchestration/pillow-commissioning/pillow-authority.js";
import { registerMarketplacePublishingRoutes } from "../../runtime/marketplace-publishing/routes/marketplace-publishing-routes.js";
import { buildMarketplaceListingPackage } from "../../runtime/marketplace-publishing/services/marketplace-publishing-service.js";
import { executeAmazonListingsPublish } from "../../runtime/marketplace-publishing/services/amazon-listings-publish-executor.js";
import type { MarketplaceListingPackage } from "../../runtime/marketplace-publishing/models/marketplace-adapter.js";

const sessions = new InMemorySessionStore();
const app = Fastify();
const owner: SessionUser = { id: "offline-owner", name: "Owner", role: "founder", email: env.FOUNDER_EMAIL, workspaceId: "ws_empire_1" };
const admin: SessionUser = { ...owner, id: "offline-admin", role: "admin", email: env.ADMIN_EMAIL };
const audits: Array<Record<string, unknown>> = [];
let outboundCalls = 0;
const originalFetch = globalThis.fetch;
const oldDatabase = process.env.DATABASE_PATH;
const activation = {
  LIVE_COMMERCE_INTEGRATION_MODE: "production", AMAZON_SP_API_CLIENT_ID: "offline-client",
  AMAZON_SP_API_CLIENT_SECRET: "offline-secret", AMAZON_SP_API_REFRESH_TOKEN_NA: "offline-refresh",
  AMAZON_SP_API_REFRESH_TOKEN: "offline-refresh", AMAZON_SP_API_REFRESH_TOKEN_FE: "offline-refresh-fe", AMAZON_SELLER_ID: "offline-seller",
  PILLOW_BORN: "true", PILLOW_BIRTH_STATUS: "BORN", PILLOW_REAL_COMMERCE_AUTHORIZED: "true",
};
const priorFlags = Object.fromEntries(Object.keys(activation).map(key => [key, process.env[key]]));
const draft = {
  companyId: "offline-company", productId: "offline-product", marketplaceId: "amazon-us" as const,
  title: "Offline product for authority testing", description: "Synthetic listing fixture, never a real product.",
  bulletPoints: ["Offline fixture"], specifications: { asin: "B000000000", sku: "offline-sku", quantity: "1" },
  price: 10, images: ["https://example.invalid/offline.jpg"], kingApproved: true, executiveCouncilApproved: true,
};

before(async () => {
  process.env.DATABASE_PATH = ":memory:";
  Object.assign(process.env, activation);
  globalThis.fetch = (async () => {
    outboundCalls++;
    throw new Error("Offline authorization test must never attempt outbound transport");
  }) as typeof fetch;
  await registerMarketplacePublishingRoutes(app, {
    authenticate: createAuthMiddleware(sessions),
    auditLogger: { write(entry: Record<string, unknown>) { audits.push(entry); } } as unknown as AuditLogger,
  });
  await app.ready();
});
beforeEach(() => {
  resetDatabaseInstance();
  outboundCalls = 0;
  audits.length = 0;
});
after(async () => {
  await app.close();
  resetDatabaseInstance();
  globalThis.fetch = originalFetch;
  if (oldDatabase === undefined) delete process.env.DATABASE_PATH; else process.env.DATABASE_PATH = oldDatabase;
  for (const [key, value] of Object.entries(priorFlags)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

async function headers(user: SessionUser): Promise<Record<string, string>> {
  return { authorization: `Bearer ${(await sessions.create(user)).token}` };
}
function forgedStoredPackage(workspaceId = owner.workspaceId): MarketplaceListingPackage {
  const pkg = { ...buildMarketplaceListingPackage({ ...draft, workspaceId }),
    status: "VALIDATED" as const, kingApproved: true, governanceApproved: true, blockers: [] };
  getDatabase().prepare("UPDATE marketplace_publish_packages SET record_json = @json WHERE package_id = @id")
    .run({ id: pkg.packageId, json: JSON.stringify(pkg) });
  return pkg;
}

test("direct Amazon executor rejects forged stored approval and environment unlock flags before every outbound call", async () => {
  const pkg = forgedStoredPackage();
  for (const marketplaceId of ["amazon", "amazon-us", "amazon-sg"] as const) {
    const result = await executeAmazonListingsPublish({ ...pkg, marketplaceId }, process.env);
    assert.equal(result.ok, false);
    assert.equal(result.liveApiCalled, false);
    assert.equal(result.httpStatus, null);
    assert.match(result.blockers.join("; "), /canonical commerce authority.*LOCKED.*NOT_BORN/i);
  }
  assert.equal(outboundCalls, 0);
  assert.equal(getPillowAuthority().certificationReceiptIngestion, "IMPLEMENTED_UNVERIFIED_ONLY");
});

test("unauthenticated requests cannot prepare or execute listings", async () => {
  for (const path of ["build", "execute"]) {
    const response = await app.inject({ method: "POST", url: `/marketplace-publishing/${path}`, payload: draft });
    assert.equal(response.statusCode, 401);
  }
  assert.equal(outboundCalls, 0);
});

test("offline draft preparation remains available but request approval booleans cannot grant authority", async () => {
  for (const user of [owner, { ...owner, id: "offline-operator", role: "operator" as const }]) {
    const response = await app.inject({ method: "POST", url: "/marketplace-publishing/build",
      headers: await headers(user), payload: { ...draft, approvedBy: owner.email, realCommerceAuthorized: true } });
    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.package.kingApproved, false);
    assert.equal(body.package.governanceApproved, false);
    assert.equal(body.package.status, "PUBLISH_BLOCKED");
    assert.equal(body.queueItem.status, "BLOCKED");
    assert.equal(body.package.title, draft.title);
  }
  assert.equal(outboundCalls, 0);
});

test("operators, foreign founders, admins and wrong-workspace sessions cannot execute even forged approved packages", async () => {
  const pkg = forgedStoredPackage();
  const denied = [
    { ...owner, role: "operator" as const }, admin,
    { ...owner, email: "foreign@example.invalid" },
    { ...owner, workspaceId: "foreign-workspace" },
  ];
  for (const user of denied) {
    const response = await app.inject({ method: "POST", url: "/marketplace-publishing/execute", headers: await headers(user),
      payload: { packageId: pkg.packageId, kingApproved: true, executiveCouncilApproved: true, approvedBy: owner.email } });
    assert.equal(response.statusCode, 403, `${user.role}/${user.workspaceId}/${user.email}`);
  }
  assert.equal(outboundCalls, 0);
  assert.deepEqual(audits, []);
});

test("configured owner execution is still blocked by canonical authority without a false published audit", async () => {
  const pkg = forgedStoredPackage();
  const response = await app.inject({ method: "POST", url: "/marketplace-publishing/execute", headers: await headers(owner),
    payload: { packageId: pkg.packageId } });
  assert.equal(response.statusCode, 409);
  assert.equal(response.json().publish.liveApiCalled, false);
  assert.match(response.json().publish.blockers.join("; "), /canonical commerce authority.*LOCKED/i);
  assert.equal(outboundCalls, 0);
  assert.equal(audits.length, 1);
  assert.equal(audits[0]!.action, "commerce_runtime.dispatch.blocked");
});

test("owner identity cannot be moved with workspace headers or body fields", async () => {
  const pkg = forgedStoredPackage();
  const ownerHeaders = await headers(owner);
  for (const variant of [
    { headers: { ...ownerHeaders, "x-workspace-id": "foreign-workspace" }, payload: { packageId: pkg.packageId } },
    { headers: ownerHeaders, payload: { packageId: pkg.packageId, workspaceId: "foreign-workspace" } },
  ]) {
    assert.equal((await app.inject({ method: "POST", url: "/marketplace-publishing/execute", ...variant })).statusCode, 403);
  }
  assert.equal(outboundCalls, 0);
});

test("absent configured owner and foreign stored package fail closed", async () => {
  const foreign = forgedStoredPackage("foreign-workspace");
  const ownerHeaders = await headers(owner);
  assert.equal((await app.inject({ method: "POST", url: "/marketplace-publishing/execute", headers: ownerHeaders,
    payload: { packageId: foreign.packageId } })).statusCode, 404);
  const original = env.FOUNDER_EMAIL;
  try {
    env.FOUNDER_EMAIL = "";
    assert.equal((await app.inject({ method: "POST", url: "/marketplace-publishing/execute", headers: ownerHeaders,
      payload: { packageId: foreign.packageId } })).statusCode, 403);
  } finally { env.FOUNDER_EMAIL = original; }
  assert.equal(outboundCalls, 0);
});

test("publishing health remains blocked when credentials are configured but Birth is unaccepted", async () => {
  const response = await app.inject({ method: "GET", url: "/health/marketplace-publishing" });
  assert.equal(response.statusCode, 200);
  const health = response.json();
  assert.equal(health.livePublishBlocked, true);
  assert.equal(health.birthStatus, "NOT_BORN");
  assert.equal(health.commerceStatus, "LOCKED");
  assert.equal(health.amazonSupportsPublish, false);
  assert.equal(health.amazonUsSupportsPublish, false);
  assert.equal(outboundCalls, 0);
});
