import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import Fastify from "fastify";
import { InMemorySessionStore } from "../../auth/session-store.js";
import { createAuthMiddleware } from "../../auth/middleware.js";
import type { SessionUser } from "../../auth/permissions.js";
import { env } from "../../config/env.js";
import type { PillowHost } from "../../orchestration/pillow-host/pillow-host.js";
import { registerMissionRuntimeRoutes } from "../../orchestration/pillow-host/routes/mission-runtime-routes.js";

const actions = ["connect", "create-mission", "queue", "ready", "execute", "pause", "resume", "retry", "cancel",
  "recover", "archive", "monitor", "produce-report", "submit-report", "list", "validate", "diagnostics", "history", "q1004-contract"];
const endpoints = [{ method: "GET" as const, url: "/api/pillow/mission-runtime" },
  ...actions.map((action) => ({ method: "POST" as const, url: `/api/pillow/mission-runtime/${action}` }))];
const sessions = new InMemorySessionStore();
const app = Fastify();
let hostTouches = 0;
const founder: SessionUser = { id: "configured-founder", name: "Owner", role: "founder", email: env.FOUNDER_EMAIL, workspaceId: "ws_empire_1" };
const admin: SessionUser = { ...founder, id: "configured-admin", role: "admin", email: env.ADMIN_EMAIL };
const host = new Proxy({}, { get(_target, key) {
  return () => {
    hostTouches++;
    return key === "getStatus" ? { lifecycle: "running" } : { privateMission: "owner-organization-marker" };
  };
} }) as PillowHost;
before(async () => {
  await registerMissionRuntimeRoutes(app, { authenticate: createAuthMiddleware(sessions), pillowHost: host });
  await app.ready();
});
after(async () => { await app.close(); });

async function assertEveryEndpoint(status: number, user?: SessionUser, extraHeaders: Record<string, string> = {}, body: Record<string, unknown> = {}) {
  const token = user ? (await sessions.create(user)).token : undefined;
  const touchesBefore = hostTouches;
  for (const endpoint of endpoints) {
    const response = await app.inject({ ...endpoint,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...extraHeaders },
      ...(endpoint.method === "POST" ? { payload: body } : {}),
    });
    assert.equal(response.statusCode, status, `${endpoint.method} ${endpoint.url}`);
    if (status !== 200) assert.ok(!response.body.includes("owner-organization-marker"));
    else assert.match(response.body, /owner-organization-marker/);
  }
  if (status !== 200) assert.equal(hostTouches, touchesBefore, "denied calls must not touch or boot the mission host");
}

test("all actual mission read/action routes reject unauthenticated access before touching host", async () => {
  await assertEveryEndpoint(401);
});
test("configured founder can access the shared organization through authenticated session scope", async () => {
  await assertEveryEndpoint(200, founder);
});
test("configured admin has the intended shared organization access", async () => {
  await assertEveryEndpoint(200, admin, { "x-workspace-id": "ws_empire_1" }, { workspaceId: "ws_empire_1" });
});
test("foreign founder/admin identities cannot read or operate the organization's missions", async () => {
  await assertEveryEndpoint(403, { ...founder, email: "foreign-founder@invalid.test" });
  await assertEveryEndpoint(403, { ...admin, email: "foreign-admin@invalid.test" });
});
test("configured email alone cannot replace the correct role or authenticated workspace", async () => {
  for (const user of [{ ...founder, role: "admin" as const }, { ...admin, role: "founder" as const },
    { ...founder, role: "operator" as const }, { ...founder, workspaceId: "foreign-workspace" },
    { ...admin, workspaceId: "foreign-workspace" }]) await assertEveryEndpoint(403, user);
});
test("a caller-supplied workspace header cannot move or repair session authority", async () => {
  await assertEveryEndpoint(403, founder, { "x-workspace-id": "foreign-workspace" });
  await assertEveryEndpoint(403, founder, { "x-workspace-id": "ws_empire_1, foreign-workspace" });
  await assertEveryEndpoint(403, { ...founder, workspaceId: "foreign-workspace" }, { "x-workspace-id": "ws_empire_1" });
});
test("foreign workspace body is rejected on every actual action route", async () => {
  const token = (await sessions.create(founder)).token;
  const before = hostTouches;
  for (const action of actions) {
    const response = await app.inject({ method: "POST", url: `/api/pillow/mission-runtime/${action}`,
      headers: { authorization: `Bearer ${token}` }, payload: { workspaceId: "foreign-workspace" } });
    assert.equal(response.statusCode, 403);
  }
  assert.equal(hostTouches, before);
});
test("missing configured owner identity fails closed even for an authenticated founder", async () => {
  const original = env.FOUNDER_EMAIL;
  try { env.FOUNDER_EMAIL = ""; await assertEveryEndpoint(403, founder); }
  finally { env.FOUNDER_EMAIL = original; }
});
