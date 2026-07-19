/**
 * Post-T Production Certification — Executive Home conversational validation.
 * Usage: node backend/scripts/post-t-executive-home-verify.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.EMPIRE_COCKPIT_URL ?? "https://empire-ai.co";
const BRAIN = process.env.RAILWAY_BRAIN_URL ?? "https://empireai-production.up.railway.app";
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL ?? "founder@empireai.com";
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD ?? "EmpireAI2026!";
const ARTIFACT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../artifacts/post-t-executive-home-validation.json",
);

const QUERIES = [
  {
    id: "screen_awareness",
    message: "What am I looking at?",
    mustNotMatch: /B6-01a — Inject shared LWA/i,
    shouldMatch: /Executive Home|screen|page|looking at/i,
  },
  {
    id: "screen_visibility",
    message: "Can you see my screen?",
    mustNotMatch: /B6-01a — Inject shared LWA/i,
    shouldMatch: /screen|Executive Home|context|view/i,
  },
  {
    id: "cursor_help",
    message: "Can you help me with Cursor?",
    mustNotMatch: /B6-01a — Inject shared LWA/i,
    shouldMatch: /Cursor|mission|build|Pillow|engineering/i,
  },
  {
    id: "blocker",
    message: "What is the biggest blocker?",
    shouldMatch: /blocker|B6|priority|action|credential/i,
  },
  {
    id: "next_action",
    message: "What should I do next?",
    shouldMatch: /next|action|recommend|blocker|B6|priority/i,
  },
];

const EXECUTIVE_HOME_CONTEXT = {
  screenPath: "/cockpit",
  screenId: "SCR-001",
  screenTitle: "Executive Home",
  module: "executive-home",
  workflow: "executive-operating",
  purpose: "Grand King daily operating screen",
  currentBusiness: "EmpireAI",
  currentMission: "Post-T Production Certification",
  recommendations: ["Validate Executive Home conversational routing"],
  risks: [],
};

function extractCookie(setCookies) {
  for (const header of setCookies) {
    const match = header.match(/^empireai_session=([^;]+)/);
    if (match) return `empireai_session=${match[1]}`;
  }
  return null;
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status} ${JSON.stringify(body)}`);
  const cookie = extractCookie(getSetCookies(res.headers));
  if (!cookie) throw new Error("No session cookie");
  return { cookie, user: body.user };
}

async function createPillowSession(cookie) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const res = await fetch(`${BASE}/api/pillow/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({}),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.session) return body.session;
    if (res.status === 503 && body.lifecycle === "starting") {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    throw new Error(`Pillow session failed: HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  }
  throw new Error("Pillow session timed out");
}

async function askBrainGlobalAssistant(cookie, message) {
  const res = await fetch(`${BASE}/api/brain/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      module: "cockpit-global-assistant",
      action: "ask",
      payload: {
        action: "ask",
        screenPath: "/cockpit",
        query: message,
        label: message,
      },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Brain ask failed: HTTP ${res.status}`);
  return body.result ?? null;
}

async function askPillowChat(cookie, sessionId, message) {
  const res = await fetch(`${BASE}/api/pillow/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      message,
      sessionId,
      workspaceContext: EXECUTIVE_HOME_CONTEXT,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Pillow chat failed: HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body.result ?? null;
}

function evaluateCase(testCase, pillowText, brainText) {
  const combined = `${pillowText ?? ""}\n${brainText?.interactionSummary ?? ""}`;
  const notes = [];
  let pass = Boolean(combined.trim());

  if (testCase.mustNotMatch && testCase.mustNotMatch.test(combined)) {
    pass = false;
    notes.push("Matched forbidden B6-01a generic blocker pattern");
  }
  if (testCase.shouldMatch && !testCase.shouldMatch.test(combined)) {
    pass = false;
    notes.push("Missing expected conversational content");
  }
  if (/Executive Home: B6-01a/i.test(combined)) {
    pass = false;
    notes.push("Detected stale explain_panel B6-01a template");
  }

  return { pass, notes, combined: combined.slice(0, 500) };
}

async function fetchDeploymentMeta(cookie) {
  const [health, pillowStatus] = await Promise.all([
    fetch(`${BRAIN}/health/live`).then((r) => r.json()).catch(() => null),
    fetch(`${BASE}/api/pillow/status`, { headers: { cookie } })
      .then((r) => r.json())
      .catch(() => null),
  ]);
  return { health, pillowStatus };
}

async function main() {
  console.log(`Post-T Executive Home validation — ${BASE}`);
  const startedAt = new Date().toISOString();
  const loginResult = await login();
  const meta = await fetchDeploymentMeta(loginResult.cookie);
  const session = await createPillowSession(loginResult.cookie);

  const results = [];
  for (const testCase of QUERIES) {
    console.log(`\n→ ${testCase.message}`);
    const [pillow, brain] = await Promise.all([
      askPillowChat(loginResult.cookie, session.sessionId, testCase.message),
      askBrainGlobalAssistant(loginResult.cookie, testCase.message),
    ]);
    const pillowText = pillow?.message ?? "";
    const evaluation = evaluateCase(testCase, pillowText, brain);
    console.log(`  pillow: ${pillowText.slice(0, 180).replace(/\s+/g, " ")}`);
    console.log(`  brain:  ${(brain?.interactionSummary ?? "").slice(0, 180).replace(/\s+/g, " ")}`);
    console.log(`  trace:  ${JSON.stringify(pillow?.trace ?? {})}`);
    console.log(`  kind:   ${pillow?.kind ?? "n/a"} command.intent=${pillow?.command?.intent ?? "n/a"}`);
    console.log(`  ${evaluation.pass ? "PASS" : "FAIL"} ${evaluation.notes.join("; ")}`);
    results.push({
      ...testCase,
      pass: evaluation.pass,
      notes: evaluation.notes,
      pillow: {
        message: pillowText.slice(0, 500),
        kind: pillow?.kind ?? null,
        trace: pillow?.trace ?? null,
        commandIntent: pillow?.command?.intent ?? null,
      },
      brain: {
        interactionIntent: brain?.interactionIntent ?? null,
        interactionSummary: brain?.interactionSummary?.slice(0, 500) ?? null,
      },
      combinedPreview: evaluation.combined,
    });
  }

  const passCount = results.filter((r) => r.pass).length;
  const artifact = {
    validatedAt: startedAt,
    baseUrl: BASE,
    brainUrl: BRAIN,
    deploymentMeta: meta,
    passCount,
    total: results.length,
    overallPass: passCount === results.length,
    results,
  };

  mkdirSync(path.dirname(ARTIFACT), { recursive: true });
  writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));

  console.log(`\nSummary: ${passCount}/${results.length} passed`);
  console.log(`Artifact: ${ARTIFACT}`);
  if (!artifact.overallPass) process.exit(1);
}

main().catch((error) => {
  console.error("Validation failed:", error.message);
  process.exit(1);
});
