/**
 * Architecture MVA fault injection — Gen3 class + durability + recycle probes.
 * No sealed Wave cases. No Grand King courier.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/capability-extraction");
const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";

function loadDotEnv() {
  try {
    const raw = readFileSync(path.join(ROOT, "backend/.env"), "utf8");
    for (const line of raw.split(/\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
    }
  } catch {
    /* optional */
  }
}
loadDotEnv();
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL;
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("Missing credentials");
  process.exit(2);
}

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

function isDegraded(text) {
  return /completed executive answer was not produced|could not accept this request/i.test(
    String(text || ""),
  );
}

const GK_CTX = {
  screenPath: "/cockpit/development/pillow",
  screenId: "SCR-800",
  screenTitle: "Pillow Centre",
  module: "executive",
};

async function health() {
  const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) });
  return r.json();
}

async function login() {
  const r = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(60_000),
  });
  const cookie = extractCookie(r);
  if (!cookie) throw new Error(`login_failed ${r.status}`);
  return cookie;
}

async function createSession(cookie) {
  const r = await fetch(`${COCKPIT}/api/pillow/session`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ forceNew: true }),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await r.json().catch(() => ({}));
  return body.session?.sessionId || body.sessionId || `arch-${Date.now()}`;
}

async function chat(cookie, sessionId, message, workspaceContext) {
  const t0 = Date.now();
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ sessionId, message, workspaceContext }),
    signal: AbortSignal.timeout(290_000),
  });
  const body = await r.json().catch(() => ({}));
  const text = String(body?.result?.message || body?.message || "");
  const requestId =
    body?.result?.requestId || r.headers.get("x-empire-pillow-request-id") || null;
  return {
    status: r.status,
    ms: Date.now() - t0,
    text,
    degraded: isDegraded(text),
    kind: body?.result?.kind || null,
    failureClass: body?.result?.failureClass || r.headers.get("x-empire-failure-class"),
    requestId,
    durableRequest: Boolean(body?.result?.durableRequest),
    contextAdmitted: Boolean(body?.result?.contextAdmitted),
  };
}

async function getChatRequest(cookie, requestId) {
  const r = await fetch(`${BRAIN}/api/pillow/chat-request/${requestId}`, {
    headers: { cookie },
    signal: AbortSignal.timeout(20_000),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

const CHECKPOINT =
  "Eligibility gates only — do NOT compute unit economics. Atlas score 12 stock 900 deliveryDays 5 approval granted; Boreal score 16 stock 1400 deliveryDays 4 approval pending; Crest score 14 stock 1100 deliveryDays 8 approval granted. Gates: score>=10 stock>=800 deliveryDays<=6 approval granted. Answer: eligible set, selection, Boreal if granted?";

function hugeCtx() {
  return {
    ...GK_CTX,
    recentConversationTurns: [
      { role: "grand-king", content: "prior ask" },
      { role: "pillow", content: "P".repeat(12_000) },
      { role: "grand-king", content: "another" },
      { role: "pillow", content: "Q".repeat(9_500) },
    ],
  };
}

async function main() {
  const h0 = await health();
  const cookie = await login();

  const gen3 = [];
  console.log(JSON.stringify({ phase: "gen3_oversized_context", n: 10 }));
  for (let i = 0; i < 10; i++) {
    const sid = await createSession(cookie);
    const r = await chat(cookie, sid, `${CHECKPOINT} [#${i}]`, hugeCtx());
    const ok =
      !r.degraded &&
      r.kind !== "terminal_infrastructure" &&
      /Atlas/i.test(r.text) &&
      r.text.length > 40;
    gen3.push({ id: `G3_${i + 1}`, ok, ...r, text: r.text.slice(0, 220) });
    console.log(JSON.stringify({ id: `G3_${i + 1}`, ok, ms: r.ms, degraded: r.degraded, kind: r.kind }));
  }

  const fresh = [];
  console.log(JSON.stringify({ phase: "fresh", n: 5 }));
  for (let i = 0; i < 5; i++) {
    const sid = await createSession(cookie);
    const prompt =
      i === 0
        ? CHECKPOINT
        : i === 1
          ? "Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution per order?"
          : i === 2
            ? "How many realised orders has EmpireAI received? Briefly."
            : i === 3
              ? "In one sentence, what is a hard gate in supplier selection?"
              : "Short bounded. Eligible if approval granted. NEXUS granted. ORBIT pending. Select eligible only.";
    const r = await chat(cookie, sid, prompt, GK_CTX);
    const ok =
      !r.degraded &&
      r.kind !== "terminal_infrastructure" &&
      r.text.length > 20 &&
      (i !== 1 || /14\.60/.test(r.text)) &&
      (i !== 4 || /NEXUS/i.test(r.text));
    fresh.push({ id: `F${i + 1}`, ok, ...r, text: r.text.slice(0, 220) });
    console.log(JSON.stringify({ id: `F${i + 1}`, ok, ms: r.ms, degraded: r.degraded }));
  }

  const long = [];
  console.log(JSON.stringify({ phase: "long_warm_then_probes" }));
  const longSid = await createSession(cookie);
  for (let i = 0; i < 12; i++) {
    const r = await chat(
      cookie,
      longSid,
      `[W${i + 1}] Acknowledge warm turn briefly.`,
      i >= 8 ? hugeCtx() : GK_CTX,
    );
    long.push({ id: `W${i + 1}`, ok: !r.degraded && r.text.length > 0, ms: r.ms, degraded: r.degraded });
    console.log(JSON.stringify({ warm: i + 1, ok: long.at(-1).ok, ms: r.ms }));
  }
  const longProbes = [];
  for (let i = 0; i < 10; i++) {
    const r = await chat(
      cookie,
      longSid,
      i % 2 === 0 ? CHECKPOINT : "Name one hard gate. One sentence.",
      hugeCtx(),
    );
    const ok = !r.degraded && r.kind !== "terminal_infrastructure" && r.text.length > 30;
    longProbes.push({ id: `L${i + 1}`, ok, ...r, text: r.text.slice(0, 200) });
    console.log(JSON.stringify({ id: `L${i + 1}`, ok, ms: r.ms, degraded: r.degraded }));
  }

  const stateful = [];
  const stateSid = await createSession(cookie);
  const statePrompts = [
    "How many realised orders has EmpireAI received? Briefly.",
    "Synthetic. Eligible if approval granted. RADIX granted. SOLAR pending. Select eligible only.",
    "First executive move after selecting RADIX? One short paragraph.",
    "Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution/order?",
    CHECKPOINT,
  ];
  for (let i = 0; i < statePrompts.length; i++) {
    const r = await chat(cookie, stateSid, statePrompts[i], i === 4 ? hugeCtx() : GK_CTX);
    const ok = !r.degraded && r.kind !== "terminal_infrastructure" && r.text.length > 20;
    stateful.push({ id: `S${i + 1}`, ok, ...r, text: r.text.slice(0, 200) });
    console.log(JSON.stringify({ id: `S${i + 1}`, ok, ms: r.ms, degraded: r.degraded }));
  }

  // Durability: completed request should be GET-able
  const durSid = await createSession(cookie);
  const durChat = await chat(cookie, durSid, "Reply with the single word READY.", GK_CTX);
  let durableOk = false;
  if (durChat.requestId) {
    const got = await getChatRequest(cookie, durChat.requestId);
    durableOk =
      got.status === 200 &&
      (got.body?.request?.status === "COMPLETED" ||
        got.body?.request?.brainResult?.message?.length > 0);
  }

  // Worker recycle window: if worker offline, wait; then oversized chat must still work
  const recycle = [];
  for (let i = 0; i < 10; i++) {
    let h = await health();
    if (!h?.worker?.online) {
      const tWait = Date.now();
      while (Date.now() - tWait < 60_000) {
        await new Promise((r) => setTimeout(r, 2000));
        h = await health();
        if (h?.worker?.online) break;
      }
    }
    const sid = await createSession(cookie);
    const r = await chat(cookie, sid, `${CHECKPOINT} recycle#${i}`, hugeCtx());
    const ok = !r.degraded && r.kind !== "terminal_infrastructure" && r.text.length > 30;
    recycle.push({ id: `R${i + 1}`, ok, workerOnline: Boolean(h?.worker?.online), ms: r.ms, degraded: r.degraded });
    console.log(JSON.stringify({ id: `R${i + 1}`, ok, ms: r.ms, degraded: r.degraded }));
  }

  const transport = [];
  for (let i = 0; i < 5; i++) {
    const sid = await createSession(cookie);
    const r = await chat(cookie, sid, CHECKPOINT, hugeCtx());
    // Retrieve by request id after response (reconnect simulation)
    let retrieved = false;
    if (r.requestId) {
      const got = await getChatRequest(cookie, r.requestId);
      retrieved =
        got.status === 200 &&
        (got.body?.request?.status === "COMPLETED" || got.body?.request?.status === "FAILED");
    }
    const ok = !r.degraded && retrieved;
    transport.push({ id: `T${i + 1}`, ok, retrieved, requestId: r.requestId, degraded: r.degraded });
    console.log(JSON.stringify({ id: `T${i + 1}`, ok, retrieved }));
  }

  const all = [...gen3, ...fresh, ...longProbes, ...stateful, ...recycle, ...transport];
  const windowTerminal = all.filter((r) => r.degraded).length + long.filter((r) => r.degraded).length;
  const requestLost = transport.filter((r) => !r.retrieved).length;
  const completedLost = transport.filter((r) => r.ok === false && !r.degraded).length;
  const longFail = longProbes.filter((r) => !r.ok).length + long.filter((r) => !r.ok).length;
  const recycleFail = recycle.filter((r) => !r.ok).length;
  const retryable5xxTerminal = all.filter(
    (r) => r.degraded && String(r.failureClass || "").includes("5"),
  ).length;

  const ready =
    gen3.filter((r) => r.ok).length >= 10 &&
    fresh.filter((r) => r.ok).length >= 5 &&
    longProbes.filter((r) => r.ok).length >= 10 &&
    stateful.filter((r) => r.ok).length >= 5 &&
    recycle.filter((r) => r.ok).length >= 10 &&
    transport.filter((r) => r.ok).length >= 5 &&
    windowTerminal === 0 &&
    requestLost === 0 &&
    longFail === 0 &&
    recycleFail === 0 &&
    durableOk;

  const summary = {
    generatedAt: new Date().toISOString(),
    MISSION_TYPE: "CHAT_EXECUTION_ARCHITECTURE_REVIEW",
    DEPLOYMENT_ID: String(h0?.deploy?.deploymentId || ""),
    RUNNING_BRAIN_SHA: String(h0?.deploy?.gitCommitSha || ""),
    GEN3_OVERSIZED_CONTEXT: `${gen3.filter((r) => r.ok).length}/10`,
    FRESH_CASES: `${fresh.filter((r) => r.ok).length}/5`,
    LONG_SESSION_CASES: `${longProbes.filter((r) => r.ok).length}/10`,
    STATEFUL_CASES: `${stateful.filter((r) => r.ok).length}/5`,
    WORKER_RECYCLE_CASES: `${recycle.filter((r) => r.ok).length}/10`,
    TRANSPORT_INTERRUPTION_CASES: `${transport.filter((r) => r.ok).length}/5`,
    REQUEST_LOST: requestLost,
    COMPLETED_RESULT_LOST: completedLost,
    LONG_SESSION_DELIVERY_FAILURE: longFail,
    WORKER_RECYCLE_DELIVERY_FAILURE: recycleFail,
    RETRYABLE_5XX_TERMINAL: retryable5xxTerminal,
    RESPONSE_WINDOW_TERMINAL: windowTerminal,
    DURABLE_GET_OK: durableOk,
    ARCHITECTURE_READY_INTERNAL: ready,
    ARCHITECTURE_READY_EXTERNAL: "UNCONFIRMED",
    gen3,
    fresh,
    longWarm: long,
    longProbes,
    stateful,
    recycle,
    transport,
  };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "PILLOW_CHAT_ARCHITECTURE_FAULT_INJECTION.json"), JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      {
        ARCHITECTURE_READY_INTERNAL: ready,
        GEN3: summary.GEN3_OVERSIZED_CONTEXT,
        FRESH: summary.FRESH_CASES,
        LONG: summary.LONG_SESSION_CASES,
        STATEFUL: summary.STATEFUL_CASES,
        RECYCLE: summary.WORKER_RECYCLE_CASES,
        TRANSPORT: summary.TRANSPORT_INTERRUPTION_CASES,
        REQUEST_LOST: requestLost,
        WINDOW: windowTerminal,
      },
      null,
      2,
    ),
  );
  if (!ready) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
