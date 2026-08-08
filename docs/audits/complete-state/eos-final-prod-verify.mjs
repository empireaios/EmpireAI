/**
 * EOS final production verification — login, EH, Pillow chat.
 * No secrets printed. Writes evidence JSON.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRAIN = (process.env.BRAIN_URL ?? "https://empireai-production.up.railway.app").replace(/\/$/, "");
const WEB = (process.env.WEB_URL ?? "https://empire-ai.co").replace(/\/$/, "");
const EMAIL = (process.env.FOUNDER_EMAIL ?? process.env.EMPIRE_LOGIN_EMAIL ?? "founder@empireai.com").trim();
const PASSWORD = (process.env.FOUNDER_PASSWORD ?? process.env.EMPIRE_LOGIN_PASSWORD ?? "EmpireAI2026!").trim();
const OUT = join(__dirname, "EOS_FINAL_PROD_VERIFY_EVIDENCE.json");

const jar = [];
const evidence = {
  mission: "EOS_FINAL_OPERATIONAL_CERTIFICATION",
  startedAt: new Date().toISOString(),
  brain: BRAIN,
  web: WEB,
  stages: {},
  blockers: [],
  verdict: "PENDING",
};

function cookie() {
  return jar.map((c) => c.split(";")[0]).join("; ");
}

function redact(body) {
  if (!body || typeof body !== "object") return body;
  const clone = JSON.parse(JSON.stringify(body));
  const walk = (o) => {
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      if (/token|secret|password|authorization|cookie/i.test(k)) o[k] = "***";
      else walk(o[k]);
    }
  };
  walk(clone);
  return clone;
}

async function req(base, path, init = {}) {
  const started = Date.now();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
      cookie: cookie(),
    },
  });
  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie")]
        : [];
  for (const c of setCookie) {
    if (!c) continue;
    const n = String(c).split("=")[0];
    const i = jar.findIndex((x) => x.startsWith(`${n}=`));
    if (i >= 0) jar[i] = c;
    else jar.push(c);
  }
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 2000);
  }
  return { status: res.status, ms: Date.now() - started, body };
}

async function main() {
  evidence.stages.healthLive = await req(BRAIN, "/health/live");
  evidence.stages.login = await req(BRAIN, "/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (evidence.stages.login.status !== 200) {
    evidence.blockers.push("login failed");
    evidence.verdict = "NOT_CERTIFIED";
    writeFileSync(OUT, JSON.stringify(redact(evidence), null, 2));
    console.log(JSON.stringify({ ok: false, out: OUT, blockers: evidence.blockers }));
    process.exit(1);
  }

  evidence.stages.me = await req(BRAIN, "/auth/me");
  // Brain mounts /brain/dispatch (BFF maps /api/brain/dispatch → Brain).
  evidence.stages.executiveHome = await req(BRAIN, "/brain/dispatch", {
    method: "POST",
    body: JSON.stringify({
      module: "executive-home",
      action: "load",
      companyId: "co-grand-king",
      payload: {},
    }),
  });

  // Pillow session create is admission-gated under event-loop lag — retry briefly.
  let sessionId = null;
  const sessionAttempts = [];
  for (let i = 0; i < 6; i++) {
    const attempt = await req(BRAIN, "/api/pillow/session", {
      method: "POST",
      body: JSON.stringify({}),
    });
    sessionAttempts.push({
      status: attempt.status,
      ms: attempt.ms,
      error: attempt.body?.error ?? null,
      retryAfterSec: attempt.body?.retryAfterSec ?? null,
    });
    sessionId =
      attempt.body?.sessionId ||
      attempt.body?.session?.sessionId ||
      attempt.body?.id ||
      null;
    // Pillow host returns 201 Created on successful session bootstrap.
    if ((attempt.status === 200 || attempt.status === 201) && sessionId) {
      evidence.stages.pillowSession = attempt;
      break;
    }
    const waitSec = Number(attempt.body?.retryAfterSec ?? 2);
    await new Promise((r) => setTimeout(r, Math.max(1, waitSec) * 1000));
  }
  if (!evidence.stages.pillowSession) {
    evidence.stages.pillowSession = {
      status: sessionAttempts.at(-1)?.status ?? 0,
      attempts: sessionAttempts,
    };
  }
  evidence.derived = { sessionId, sessionAttempts };

  if (sessionId) {
    evidence.stages.pillowChat = await req(BRAIN, "/api/pillow/chat", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        message: "EOS final certification: reply with exactly one short sentence confirming you are operational.",
        screenPath: "/cockpit",
      }),
    });
  } else {
    evidence.blockers.push("pillow sessionId missing");
  }

  evidence.stages.healthReady = await req(BRAIN, "/health/ready");

  // Web surface reachability (Vercel) + EOS UX bundle markers
  try {
    const webStarted = Date.now();
    const webRes = await fetch(`${WEB}/login`, { redirect: "follow" });
    evidence.stages.webLoginPage = {
      status: webRes.status,
      ms: Date.now() - webStarted,
      finalUrl: webRes.url,
    };
    const cockpitStarted = Date.now();
    const cockpitRes = await fetch(`${WEB}/cockpit`, { redirect: "manual" });
    const cockpitHtml = await cockpitRes.text().catch(() => "");
    // App Router keeps component strings in JS chunks, not the HTML shell.
    const scriptUrls = [...cockpitHtml.matchAll(/\/_next\/static\/[^"']+\.js/g)]
      .map((m) => m[0])
      .slice(0, 12);
    let chunkText = "";
    for (const rel of scriptUrls) {
      try {
        const chunkRes = await fetch(`${WEB}${rel}`);
        if (chunkRes.ok) chunkText += await chunkRes.text();
      } catch {
        /* ignore */
      }
    }
    const scan = `${cockpitHtml}\n${chunkText}`;
    evidence.stages.webCockpitSurface = {
      status: cockpitRes.status,
      ms: Date.now() - cockpitStarted,
      scriptsScanned: scriptUrls.length,
      eosFixInBundle:
        /DeferredExecutiveSystemStrips|Load extended panels|Daily Operations|type now; Send when ready|Empire operating posture clear/i.test(
          scan,
        ),
      hasRetryPlaceholder: /Retry loading executive widgets|Retry when Brain is ready/i.test(scan),
      composerAlwaysOn: /type now; Send when ready|Ask Pillow… \(Enter send/i.test(scan),
    };
  } catch (e) {
    evidence.stages.webLoginPage = { error: String(e?.message || e) };
    evidence.blockers.push("web login page unreachable");
  }

  const ehOk = evidence.stages.executiveHome.status === 200;
  const chatBody = evidence.stages.pillowChat?.body;
  const chatText =
    (typeof chatBody?.message === "string" && chatBody.message) ||
    (typeof chatBody?.reply === "string" && chatBody.reply) ||
    (typeof chatBody?.content === "string" && chatBody.content) ||
    (typeof chatBody?.response === "string" && chatBody.response) ||
    (typeof chatBody?.result?.message === "string" && chatBody.result.message) ||
    null;
  const chatOk = evidence.stages.pillowChat?.status === 200 && Boolean(chatText);
  const healthOk = evidence.stages.healthLive.status === 200;
  const loginOk = evidence.stages.login.status === 200;
  const sessionOk = evidence.stages.pillowSession.status === 200 && Boolean(sessionId);

  const readyOk =
    evidence.stages.healthReady?.status === 200 &&
    (evidence.stages.healthReady.body?.grandKingAccess === "ready" ||
      evidence.stages.healthReady.body?.ready === true);
  const chatLeaksConstitutional =
    typeof chatText === "string" && /constitutional gate|digital soul unavailable/i.test(chatText);

  evidence.derived.checks = {
    healthOk,
    authReadyOk: readyOk,
    loginOk,
    executiveHomeOk: ehOk,
    pillowSessionOk: sessionOk,
    pillowChatOk: chatOk,
    chatPreview: chatText ? String(chatText).slice(0, 240) : null,
    chatLeaksConstitutional,
    eventLoopLagMs: evidence.stages.healthLive.body?.eventLoopLagMs ?? null,
    ehFallback: Boolean(evidence.stages.executiveHome.body?.result?._fallback),
    ehCached: Boolean(evidence.stages.executiveHome.body?.result?._cached),
    topBlocker: evidence.stages.executiveHome.body?.result?.greeting?.topBlocker ?? null,
    eosFixInBundle: evidence.stages.webCockpitSurface?.eosFixInBundle ?? null,
  };

  if (!healthOk) evidence.blockers.push("health/live not ok");
  if (!readyOk) evidence.blockers.push("health/ready not ok");
  if (!loginOk) evidence.blockers.push("login not ok");
  if (!ehOk) evidence.blockers.push("executive-home dispatch not ok");
  if (!sessionOk) evidence.blockers.push("pillow session not ok");
  if (!chatOk) evidence.blockers.push("pillow chat not ok");
  if (chatLeaksConstitutional) evidence.blockers.push("pillow chat leaked constitutional language");

  evidence.verdict = evidence.blockers.length === 0 ? "API_PATH_PASS" : "API_PATH_FAIL";
  evidence.finishedAt = new Date().toISOString();
  writeFileSync(OUT, JSON.stringify(redact(evidence), null, 2));
  console.log(
    JSON.stringify(
      {
        ok: evidence.blockers.length === 0,
        verdict: evidence.verdict,
        out: OUT,
        checks: evidence.derived.checks,
        blockers: evidence.blockers,
      },
      null,
      2,
    ),
  );
  process.exit(evidence.blockers.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
