/**
 * GK vs harness path-parity differential (serialized probes).
 * Does not change Pillow semantics — observes BFF/Brain responses.
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

function infra(text) {
  return /completed executive answer was not produced within the infrastructure budget/i.test(
    String(text || ""),
  );
}

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

async function createSession(cookie, forceNew = true) {
  const r = await fetch(`${COCKPIT}/api/pillow/session`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(forceNew ? { forceNew: true } : {}),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await r.json().catch(() => ({}));
  return body.session?.sessionId || body.sessionId || `parity-${Date.now()}`;
}

async function chatRaw(cookie, sessionId, message, workspaceContext) {
  const t0 = Date.now();
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ sessionId, message, workspaceContext }),
    signal: AbortSignal.timeout(290_000),
  });
  const body = await r.json().catch(() => ({}));
  const text =
    body?.assistantMessage?.content ||
    body?.result?.message ||
    body?.message ||
    body?.reply ||
    "";
  return {
    status: r.status,
    ms: Date.now() - t0,
    text: String(text),
    kind: body?.result?.kind || body?.kind || null,
    bffRecovery: Boolean(body?.result?.bffRecovery),
    recoveryExhausted: Boolean(body?.result?.recoveryExhausted),
    requestId: body?.result?.requestId || null,
    upstreamStatus: body?.result?.upstreamStatus ?? null,
    surfaceClass: body?.result?.surfaceClass || null,
    infra: infra(text),
    preview: String(text).slice(0, 280),
  };
}

const SAME_PROMPT =
  "Short bounded supplier decision. Eligible if approval granted. NEXUS granted. ORBIT pending. Select eligible only. State contribution if price S$40 cost S$18 ship S$4 fee 6% refund S$1.";

const HARNESS_CTX = {
  screenPath: "/cockpit/development/pillow",
  screenId: "pillow-centre",
  screenTitle: "Pillow Centre",
};

const GK_CTX = {
  screenPath: "/cockpit/development/pillow",
  screenId: "SCR-800",
  screenTitle: "Pillow Centre",
  module: "executive",
};

async function main() {
  const h = await health();
  const cookie = await login();
  const results = [];

  // A harness fresh short
  {
    const sid = await createSession(cookie, true);
    const r = await chatRaw(
      cookie,
      sid,
      `Synthetic. ${SAME_PROMPT}`,
      HARNESS_CTX,
    );
    results.push({ id: "A_harness_fresh_synthetic", ...r, sessionId: sid });
  }

  // B actual-facing fresh short (no Synthetic, GK screen id)
  {
    const sid = await createSession(cookie, true);
    const r = await chatRaw(cookie, sid, SAME_PROMPT, GK_CTX);
    results.push({ id: "B_gk_facing_fresh", ...r, sessionId: sid });
  }

  // C harness warm short
  {
    const sid = await createSession(cookie, true);
    await chatRaw(
      cookie,
      sid,
      "How many realised orders has EmpireAI received? Briefly.",
      HARNESS_CTX,
    );
    const r = await chatRaw(
      cookie,
      sid,
      `Synthetic. ${SAME_PROMPT}`,
      {
        ...HARNESS_CTX,
        recentConversationTurns: [
          { role: "grand-king", content: "How many realised orders?" },
          { role: "pillow", content: "Zero realised orders." },
        ],
      },
    );
    results.push({ id: "C_harness_warm_synthetic", ...r, sessionId: sid });
  }

  // D GK-facing warm short
  {
    const sid = await createSession(cookie, true);
    await chatRaw(
      cookie,
      sid,
      "How many realised orders has EmpireAI received? Briefly.",
      GK_CTX,
    );
    const r = await chatRaw(cookie, sid, SAME_PROMPT, {
      ...GK_CTX,
      recentConversationTurns: [
        { role: "grand-king", content: "How many realised orders has EmpireAI received?" },
        {
          role: "pillow",
          content:
            "EmpireAI has received zero realised orders. Current product focus is Mini Fan. Birth remains unauthorised.",
        },
      ],
    });
    results.push({ id: "D_gk_facing_warm", ...r, sessionId: sid });
  }

  // E trivial one-sentence
  {
    const sid = await createSession(cookie, true);
    const r = await chatRaw(
      cookie,
      sid,
      "In one sentence, what is a hard gate in supplier selection?",
      GK_CTX,
    );
    results.push({ id: "E_gk_trivial_reasoning", ...r, sessionId: sid });
  }

  // F short commercial arithmetic GK-facing
  {
    const sid = await createSession(cookie, true);
    const r = await chatRaw(
      cookie,
      sid,
      "Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution per order?",
      GK_CTX,
    );
    results.push({ id: "F_gk_arith", ...r, sessionId: sid });
  }

  // G NovaCart-style short (no Synthetic) — decoration-prone
  {
    const sid = await createSession(cookie, true);
    const r = await chatRaw(
      cookie,
      sid,
      "Short NovaCart-style bounded supplier decision. Eligible if approval granted. VISTA granted. WISP pending. Select eligible only. Keep under 12 lines.",
      GK_CTX,
    );
    results.push({ id: "G_gk_novacart_short", ...r, sessionId: sid });
  }

  // H operating brief — often appends product focus / realised commerce
  {
    const sid = await createSession(cookie, true);
    const r = await chatRaw(
      cookie,
      sid,
      "Operating brief: what matters most for EmpireAI commerce this week? Be concise.",
      GK_CTX,
    );
    results.push({ id: "H_gk_operating_brief", ...r, sessionId: sid });
  }

  // Same-prompt differential core
  const a = results.find((x) => x.id === "A_harness_fresh_synthetic");
  const b = results.find((x) => x.id === "B_gk_facing_fresh");
  const summary = {
    generatedAt: new Date().toISOString(),
    DEPLOYMENT_ID: String(h?.deploy?.deploymentId || ""),
    RUNNING_BRAIN_SHA: String(h?.deploy?.gitCommitSha || ""),
    SAME_PROMPT_DIFFERENTIAL_ESTABLISHED: true,
    SAME_PROMPT: SAME_PROMPT,
    harness_ok: a && !a.infra,
    gk_facing_ok: b && !b.infra,
    first_material_divergence:
      a && b && a.infra !== b.infra
        ? "infra_flag_differs_on_same_prompt"
        : a && b && a.bffRecovery !== b.bffRecovery
          ? "bffRecovery_differs"
          : a && b && /14\.60/.test(a.text) !== /14\.60/.test(b.text)
            ? "arithmetic_visibility_differs"
            : "compare_latency_and_kind",
    results,
    INFRASTRUCTURE_BUDGET_FALLBACK_COUNT: results.filter((r) => r.infra).length,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    path.join(OUT, "GK_CHAT_PATH_PARITY_DIFFERENTIAL.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        deploy: summary.DEPLOYMENT_ID,
        sha: summary.RUNNING_BRAIN_SHA,
        infraCount: summary.INFRASTRUCTURE_BUDGET_FALLBACK_COUNT,
        rows: results.map((r) => ({
          id: r.id,
          infra: r.infra,
          bffRecovery: r.bffRecovery,
          kind: r.kind,
          ms: r.ms,
          preview: r.preview.slice(0, 120),
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
