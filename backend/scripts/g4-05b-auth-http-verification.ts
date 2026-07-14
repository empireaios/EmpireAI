/**
 * G4-05B — Authentication HTTP verification script.
 * Uses Node fetch (not PowerShell curl alias) with correctly formatted JSON.
 *
 * Usage:
 *   node --import tsx scripts/g4-05b-auth-http-verification.ts
 *   node --import tsx scripts/g4-05b-auth-http-verification.ts --production
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "../src/app.js";
import { configureValidationEnvironment } from "../src/validation/harness.js";
import { env } from "../src/config/env.js";

type TestResult = {
  id: string;
  target: "local" | "production";
  method: string;
  url: string;
  requestBody?: unknown;
  status: number;
  responseBody: unknown;
  responseHeaders: Record<string, string>;
  cookiePresent: boolean;
  pass: boolean;
  notes?: string;
};

const PRODUCTION_BASE = "https://empireai-five.vercel.app";
const ARTIFACT_JSON = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../artifacts/g4-05b-auth-verification-results.json",
);

function redactBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const copy = { ...(body as Record<string, unknown>) };
  if ("password" in copy) copy.password = "[REDACTED]";
  return copy;
}

function pickHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of ["content-type", "location", "set-cookie"]) {
    const value = headers.get(key);
    if (value) out[key] = value;
  }
  return out;
}

function extractSessionCookie(setCookieHeaders: string[]): string | null {
  for (const header of setCookieHeaders) {
    const match = header.match(/^empireai_session=([^;]+)/);
    if (match) return `empireai_session=${match[1]}`;
  }
  return null;
}

function getSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

async function runFetchCase(
  target: "local" | "production",
  id: string,
  method: string,
  url: string,
  options: {
    body?: unknown;
    cookie?: string | null;
    redirect?: RequestRedirect;
    expectStatus?: number;
    notes?: string;
  } = {},
): Promise<TestResult> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    redirect: options.redirect ?? "manual",
  });

  const setCookies = getSetCookies(response.headers);
  const text = await response.text();
  let responseBody: unknown = text;
  try {
    responseBody = JSON.parse(text);
  } catch {
    // keep text
  }

  const expectStatus = options.expectStatus ?? response.status;
  const cookiePresent = setCookies.some((c) => c.startsWith("empireai_session="));

  return {
    id,
    target,
    method,
    url,
    requestBody: options.body !== undefined ? redactBody(options.body) : undefined,
    status: response.status,
    responseBody,
    responseHeaders: pickHeaders(response.headers),
    cookiePresent,
    pass: response.status === expectStatus,
    notes: options.notes,
  };
}

async function verifyLocalBrain(): Promise<TestResult[]> {
  configureValidationEnvironment();
  const empire = await buildApp({ startWorkers: false, startScheduler: false, pillowEnabled: false });

  await empire.app.listen({ port: 0, host: "127.0.0.1" });
  const address = empire.app.server.address();
  const port = typeof address === "object" && address ? address.port : 4000;
  const base = `http://127.0.0.1:${port}`;
  const results: TestResult[] = [];

  try {
    results.push(
      await runFetchCase("local", "L1-invalid-login", "POST", `${base}/auth/login`, {
        body: { email: "wrong@test.com", password: "wrong" },
        expectStatus: 401,
        notes: "Invalid credentials rejected",
      }),
    );

    const validLogin = await runFetchCase("local", "L2-valid-login", "POST", `${base}/auth/login`, {
      body: { email: env.FOUNDER_EMAIL, password: env.FOUNDER_PASSWORD },
      expectStatus: 200,
      notes: "Seed founder account (project fixture)",
    });
    results.push(validLogin);

    const setCookies = validLogin.responseHeaders["set-cookie"]
      ? [validLogin.responseHeaders["set-cookie"]]
      : [];
    const sessionCookie = extractSessionCookie(setCookies);

    results.push(
      await runFetchCase("local", "L3-auth-me", "GET", `${base}/auth/me`, {
        cookie: sessionCookie,
        expectStatus: 200,
        notes: "Session validated; platformIdentity returned",
      }),
    );

    results.push(
      await runFetchCase("local", "L4-executive-home-dispatch", "POST", `${base}/brain/dispatch`, {
        cookie: sessionCookie,
        body: { module: "executive-home", action: "load" },
        expectStatus: 200,
        notes: "Executive Home Brain module accessible when authenticated",
      }),
    );

    results.push(
      await runFetchCase("local", "L5-protected-without-cookie", "GET", `${base}/auth/me`, {
        expectStatus: 401,
        notes: "Protected route without session",
      }),
    );

    const logout = await runFetchCase("local", "L6-logout", "POST", `${base}/auth/logout`, {
      cookie: sessionCookie,
      expectStatus: 200,
      notes: "Session destroyed",
    });
    results.push(logout);

    results.push(
      await runFetchCase("local", "L7-auth-me-after-logout", "GET", `${base}/auth/me`, {
        cookie: sessionCookie,
        expectStatus: 401,
        notes: "Stale cookie rejected after logout",
      }),
    );
  } finally {
    await empire.shutdown();
  }

  return results;
}

async function verifyProduction(): Promise<TestResult[]> {
  const base = PRODUCTION_BASE;
  const results: TestResult[] = [];

  results.push(
    await runFetchCase("production", "P1-invalid-login", "POST", `${base}/api/auth/login`, {
      body: { email: "wrong@test.com", password: "wrong" },
      expectStatus: 401,
      notes: "Invalid credentials via Next BFF proxy",
    }),
  );

  results.push(
    await runFetchCase("production", "P2-auth-me-unauthenticated", "GET", `${base}/api/auth/me`, {
      expectStatus: 401,
      notes: "Unauthenticated session check",
    }),
  );

  results.push(
    await runFetchCase("production", "P3-cockpit-redirect", "GET", `${base}/cockpit`, {
      expectStatus: 307,
      notes: "Middleware redirects to login with next param",
    }),
  );

  results.push(
    await runFetchCase("production", "P4-cockpit-deep-link-redirect", "GET", `${base}/cockpit/command`, {
      expectStatus: 307,
      notes: "Deep link preserves return path in Location header",
    }),
  );

  results.push(
    await runFetchCase("production", "P5-login-page", "GET", `${base}/login`, {
      expectStatus: 200,
      redirect: "follow",
      notes: "Login page reachable",
    }),
  );

  return results;
}

async function main() {
  const productionOnly = process.argv.includes("--production");
  const results: TestResult[] = [];

  if (!productionOnly) {
    console.log("Running local Brain auth verification (Node fetch)…");
    results.push(...(await verifyLocalBrain()));
  }

  console.log("Running production auth verification (Node fetch)…");
  results.push(...(await verifyProduction()));

  mkdirSync(path.dirname(ARTIFACT_JSON), { recursive: true });
  writeFileSync(ARTIFACT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

  const failed = results.filter((r) => !r.pass);
  console.log(`\nG4-05B verification: ${results.length - failed.length}/${results.length} passed`);
  for (const result of results) {
    const mark = result.pass ? "PASS" : "FAIL";
    console.log(`  [${mark}] ${result.id} ${result.method} ${result.url} → ${result.status}`);
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
