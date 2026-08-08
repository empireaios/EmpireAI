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

  // Web surface reachability (Vercel) + AUTHENTICATED EOS UX bundle markers
  // Unauthenticated /cockpit redirects to /login and cannot prove the Cockpit bundle.
  try {
    const webStarted = Date.now();
    const webRes = await fetch(`${WEB}/login`, { redirect: "follow" });
    const loginAgeSec = Number(webRes.headers.get("age") ?? NaN);
    evidence.stages.webLoginPage = {
      status: webRes.status,
      ms: Date.now() - webStarted,
      finalUrl: webRes.url,
      cdnAgeSec: Number.isFinite(loginAgeSec) ? loginAgeSec : null,
      vercelCache: webRes.headers.get("x-vercel-cache"),
    };
    const stampStarted = Date.now();
    const stampRes = await fetch(`${WEB}/api/eos-bundle-stamp`, { cache: "no-store" });
    const stampBody = stampRes.ok ? await stampRes.json().catch(() => null) : null;
    evidence.stages.eosBundleStamp = {
      status: stampRes.status,
      ms: Date.now() - stampStarted,
      body: stampBody,
    };

    const bffLogin = await fetch(`${WEB}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookie() },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const setCookie =
      typeof bffLogin.headers.getSetCookie === "function"
        ? bffLogin.headers.getSetCookie()
        : bffLogin.headers.get("set-cookie")
          ? [bffLogin.headers.get("set-cookie")]
          : [];
    for (const c of setCookie) {
      if (!c) continue;
      const n = String(c).split("=")[0];
      const i = jar.findIndex((x) => x.startsWith(`${n}=`));
      if (i >= 0) jar[i] = c;
      else jar.push(c);
    }

    const cockpitStarted = Date.now();
    const cockpitRes = await fetch(`${WEB}/cockpit`, {
      headers: { cookie: cookie() },
      redirect: "follow",
    });
    const cockpitHtml = await cockpitRes.text().catch(() => "");
    const scriptUrls = [...cockpitHtml.matchAll(/\/_next\/static\/[^"']+\.js/g)]
      .map((m) => m[0])
      .slice(0, 60);
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
    const composerAlwaysOn = /type now; Send when ready|Ask Pillow… \(Enter send/i.test(scan);
    const deferredStrips = /DeferredExecutiveSystemStrips|Load extended panels|Daily Operations/i.test(
      scan,
    );
    const postureClear = /Empire operating posture clear/i.test(scan);
    evidence.stages.webCockpitSurface = {
      status: cockpitRes.status,
      ms: Date.now() - cockpitStarted,
      finalUrl: cockpitRes.url,
      scriptsScanned: scriptUrls.length,
      composerAlwaysOn,
      deferredStrips,
      postureClear,
      eosFixInBundle: composerAlwaysOn || deferredStrips || postureClear || Boolean(stampBody?.eosFixInBundle),
      hasRetryPlaceholder: /Retry loading executive widgets|Retry when Brain is ready/i.test(scan),
      legacyUnlockCopy: /conversation will unlock when ready/i.test(scan),
      legacyPreparingCopy: /Preparing Executive Intelligence/i.test(scan),
    };
    evidence.stages.deploymentTruth = {
      sourcePushedNote: "Git push is not production deploy",
      loginCdnAgeSec: Number.isFinite(loginAgeSec) ? loginAgeSec : null,
      stampPresent: Boolean(stampBody?.eosFixInBundle),
      productionBundleVerified: Boolean(
        evidence.stages.webCockpitSurface.eosFixInBundle &&
          !evidence.stages.webCockpitSurface.legacyUnlockCopy &&
          !evidence.stages.webCockpitSurface.hasRetryPlaceholder,
      ),
    };
  } catch (e) {
    evidence.stages.webLoginPage = { error: String(e?.message || e) };
    evidence.blockers.push("web login page unreachable");
  }

  const ehOk = evidence.stages.executiveHome.status === 200;
  const chatBody = evidence.stages.pillowChat?.body;
  const chatText =
    (typeof chatBody?.result?.message === "string" && chatBody.result.message) ||
    (typeof chatBody?.message === "string" && chatBody.message) ||
    (typeof chatBody?.reply === "string" && chatBody.reply) ||
    (typeof chatBody?.content === "string" && chatBody.content) ||
    (typeof chatBody?.response === "string" && chatBody.response) ||
    (typeof chatBody?.interactionSummary === "string" && chatBody.interactionSummary) ||
    null;
  const chatOk = evidence.stages.pillowChat?.status === 200 && Boolean(chatText);
  const healthOk = evidence.stages.healthLive.status === 200;
  const loginOk = evidence.stages.login.status === 200;
  const sessionOk =
    (evidence.stages.pillowSession.status === 200 ||
      evidence.stages.pillowSession.status === 201) &&
    Boolean(sessionId);

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

  const apiPathPass = evidence.blockers.length === 0;
  // Tightening: Grand King UX bundle must ship — API-only PASS is not EOS certification.
  const uxBundleOk = Boolean(evidence.stages.webCockpitSurface?.eosFixInBundle);
  const uxBlockers = [];
  if (!uxBundleOk) {
    uxBlockers.push("eos UX bundle not detected on empire-ai.co (composer/widget repairs not live)");
  }
  if (evidence.stages.webCockpitSurface?.hasRetryPlaceholder) {
    uxBlockers.push("Retry placeholders still present in production frontend bundle");
  }
  evidence.derived.checks.uxBundleOk = uxBundleOk;
  evidence.derived.checks.apiPathPass = apiPathPass;
  evidence.uxBlockers = uxBlockers;
  evidence.verdict = !apiPathPass
    ? "API_PATH_FAIL"
    : uxBlockers.length === 0
      ? "EOS_FULL_PASS"
      : "API_PATH_PASS_UX_PENDING";
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
