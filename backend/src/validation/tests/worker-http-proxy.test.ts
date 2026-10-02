import assert from "node:assert/strict";
import { createServer, type Server, type RequestListener } from "node:http";
import { gzipSync } from "node:zlib";
import { test, type TestContext } from "node:test";
import Fastify from "fastify";
import { forwardWorkerHttpRequest, sendWorkerHttpResponse, workerRequestHeaders } from "../../runtime/worker-http-proxy.js";
import { buildTier0ProxyFailure, runSingleWorkerProxyAttempt } from "../../runtime/tier0-isolated-primary.js";
import { assertCommerceAutomationAllowed } from "../../runtime/engineering-test-mode.js";

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}

async function fixture(t: TestContext, handler: RequestListener, options: { ready?: boolean; timeoutMs?: number } = {}) {
  const server = createServer(handler);
  const origin = await listen(server);
  const edge = Fastify();
  let forwards = 0;
  edge.setNotFoundHandler(async (request, reply) => {
    const result = await runSingleWorkerProxyAttempt(
      async () => options.ready !== false,
      async () => {
        forwards += 1;
        return forwardWorkerHttpRequest({
          target: `${origin}${request.url}`, method: request.method,
          headers: workerRequestHeaders(request.headers),
          body: request.body == null ? undefined : typeof request.body === "string" ? request.body : JSON.stringify(request.body),
          timeoutMs: options.timeoutMs ?? 2_000,
        });
      },
    );
    return result.ok ? sendWorkerHttpResponse(reply, result) : reply.code(503).send(buildTier0ProxyFailure(result.reason));
  });
  t.after(async () => {
    await edge.close();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  return { edge, server, origin, forwards: () => forwards };
}

test("unauthenticated Birth response keeps 401, exact body and authentication headers", async (t) => {
  const body = JSON.stringify({ error: "Authentication required" });
  const { edge, forwards } = await fixture(t, (request, response) => {
    assert.equal(request.url, "/pillow-commissioning/birth");
    assert.equal(request.headers.authorization, undefined);
    response.writeHead(401, { "content-type": "application/json", "www-authenticate": 'Bearer realm="EmpireAI"', "cache-control": "no-store" });
    response.end(body);
  });
  const result = await edge.inject({ method: "GET", url: "/pillow-commissioning/birth" });
  assert.equal(result.statusCode, 401);
  assert.equal(result.body, body);
  assert.equal(result.headers["www-authenticate"], 'Bearer realm="EmpireAI"');
  assert.equal(result.headers["cache-control"], "no-store");
  assert.equal(forwards(), 1);
});

test("real engineering commerce guard keeps its blocked explanation through the proxy", async (t) => {
  const previous = process.env.EMPIRE_ENGINEERING_TEST_MODE;
  process.env.EMPIRE_ENGINEERING_TEST_MODE = "true";
  t.after(() => { if (previous == null) delete process.env.EMPIRE_ENGINEERING_TEST_MODE; else process.env.EMPIRE_ENGINEERING_TEST_MODE = previous; });
  let passedGuard = false;
  const { edge } = await fixture(t, (_request, response) => {
    try {
      assertCommerceAutomationAllowed();
      passedGuard = true;
      response.end("unexpected");
    } catch (error) {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : "unknown" }));
    }
  });
  const result = await edge.inject({ method: "POST", url: "/pillow-commerce-presale/run-cycle", payload: { async: false, maxCandidates: 1 } });
  assert.equal(result.statusCode, 500);
  assert.match(result.json().error, /Commerce automation is disabled/);
  assert.equal(passedGuard, false);
});

test("owner authentication, request body, query and permission errors survive one forwarding attempt", async (t) => {
  const payload = { workspaceId: "other-workspace", message: "do not execute" };
  const { edge, forwards } = await fixture(t, (request, response) => {
    assert.equal(request.url, "/protected/action?scope=held");
    assert.equal(request.headers.authorization, "Bearer local-test-only");
    assert.equal(request.headers.cookie, "empireai_session=local-test-cookie");
    assert.equal(request.headers["x-remove-me"], undefined);
    let body = "";
    request.on("data", (part) => { body += part; });
    request.on("end", () => {
      assert.deepEqual(JSON.parse(body), payload);
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "workspace_forbidden" }));
    });
  });
  const result = await edge.inject({ method: "POST", url: "/protected/action?scope=held", payload,
    headers: { authorization: "Bearer local-test-only", cookie: "empireai_session=local-test-cookie", connection: "x-remove-me", "x-remove-me": "discard" } });
  assert.equal(result.statusCode, 403);
  assert.deepEqual(result.json(), { error: "workspace_forbidden" });
  assert.equal(forwards(), 1);
});

for (const status of [404, 409, 429, 500, 503]) {
  test(`worker ${status} remains an application response with its exact explanation`, async (t) => {
    const body = `worker-response-${status}`;
    const { edge, forwards } = await fixture(t, (_request, response) => {
      response.writeHead(status, { "content-type": "text/plain", "retry-after": "17", "x-request-id": "held-request" });
      response.end(body);
    });
    const result = await edge.inject({ method: "GET", url: "/held" });
    assert.equal(result.statusCode, status);
    assert.equal(result.body, body);
    assert.equal(result.headers["retry-after"], "17");
    assert.equal(result.headers["x-request-id"], "held-request");
    assert.equal(forwards(), 1);
  });
}

test("redirect is relayed without sending owner credentials to the redirect target", async (t) => {
  let targetCalls = 0;
  const { edge, origin } = await fixture(t, (request, response) => {
    if (request.url === "/redirect-target") { targetCalls += 1; response.end("must not follow"); return; }
    response.writeHead(302, { location: `${origin}/redirect-target`, "set-cookie": ["first=a; HttpOnly", "second=b; Secure"] });
    response.end("redirect body");
  });
  const result = await edge.inject({ method: "GET", url: "/redirect", headers: { authorization: "Bearer local-only" } });
  assert.equal(result.statusCode, 302);
  assert.equal(result.headers.location, `${origin}/redirect-target`);
  assert.deepEqual(result.headers["set-cookie"], ["first=a; HttpOnly", "second=b; Secure"]);
  assert.equal(result.body, "redirect body");
  assert.equal(targetCalls, 0);
});

test("decoded error body has correct length and excludes hop-by-hop response headers", async (t) => {
  const body = JSON.stringify({ error: "an intentionally compressed denial" });
  const compressed = gzipSync(body);
  const { edge } = await fixture(t, (_request, response) => {
    response.writeHead(401, { "content-type": "application/json", "content-encoding": "gzip", "content-length": compressed.length,
      connection: "x-private-hop", "x-private-hop": "must-not-forward" });
    response.end(compressed);
  });
  const result = await edge.inject({ method: "GET", url: "/compressed" });
  assert.equal(result.statusCode, 401);
  assert.equal(result.body, body);
  assert.equal(result.headers["content-length"], String(Buffer.byteLength(body)));
  assert.equal(result.headers["content-encoding"], undefined);
  assert.equal(result.headers["x-private-hop"], undefined);
});

test("HEAD and no-content responses preserve empty bodies", async (t) => {
  const { edge } = await fixture(t, (request, response) => {
    response.writeHead(request.method === "HEAD" ? 401 : 204, { "x-result": "empty" });
    response.end();
  });
  for (const method of ["HEAD", "GET"] as const) {
    const result = await edge.inject({ method, url: "/empty" });
    assert.equal(result.statusCode, method === "HEAD" ? 401 : 204);
    assert.equal(result.body, "");
    assert.equal(result.headers["x-result"], "empty");
  }
});

test("failed readiness never sends the request and remains retryable 503", async (t) => {
  const { edge, forwards } = await fixture(t, () => { assert.fail("must not forward"); }, { ready: false });
  const result = await edge.inject({ method: "GET", url: "/held" });
  assert.equal(result.statusCode, 503);
  assert.equal(result.json().code, "BRAIN_WORKER_UNAVAILABLE");
  assert.equal(result.json().retryable, true);
  assert.equal(forwards(), 0);
});

test("network failure remains proxy 503 and is not an application success", async (t) => {
  const { edge, server, forwards } = await fixture(t, () => { assert.fail("closed worker"); });
  await new Promise<void>((resolve) => server.close(() => resolve()));
  const result = await edge.inject({ method: "GET", url: "/held" });
  assert.equal(result.statusCode, 503);
  assert.equal(result.json().code, "BRAIN_WORKER_PROXY_FAILED");
  assert.equal(forwards(), 1);
});

test("timed-out worker remains proxy 503 with only one forwarded attempt", async (t) => {
  const { edge, forwards } = await fixture(t, () => { /* intentionally never responds */ }, { timeoutMs: 30 });
  const result = await edge.inject({ method: "GET", url: "/held" });
  assert.equal(result.statusCode, 503);
  assert.equal(result.json().code, "BRAIN_WORKER_PROXY_FAILED");
  assert.equal(forwards(), 1);
});
