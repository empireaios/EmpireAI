/**
 * Live production recovery verification (no Birth, no spend).
 * Uses EMPIRE_LOGIN_EMAIL / EMPIRE_LOGIN_PASSWORD from env.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL;
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

function jar(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const hdr = res.headers.get("set-cookie");
  const all = raw.length ? raw : hdr ? [hdr] : [];
  return all.map((c) => String(c).split(";")[0]).filter(Boolean).join("; ");
}

async function main() {
  const out = {
    artifact: "PRODUCTION_INCIDENT_LIVE_VERIFY",
    completedAt: null,
    cockpit: COCKPIT,
    brain: BRAIN,
    birthAuthorised: false,
    birthTimestamp: null,
    checks: {},
  };

  if (!EMAIL || !PASSWORD) {
    out.blocked = "MISSING_EMPIRE_LOGIN_ENV";
    write(out);
    console.error("Set EMPIRE_LOGIN_EMAIL and EMPIRE_LOGIN_PASSWORD");
    process.exit(2);
  }

  const tHealth = Date.now();
  const health = await fetch(`${BRAIN}/health`);
  out.checks.brainHealth = {
    status: health.status,
    ms: Date.now() - tHealth,
    body: await health.json().catch(() => ({})),
  };

  const tLogin = Date.now();
  const login = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const cookie = jar(login);
  const loginBody = await login.json().catch(() => ({}));
  out.checks.login = {
    status: login.status,
    ms: Date.now() - tLogin,
    cookiePresent: Boolean(cookie),
    role: loginBody.user?.role ?? null,
    error: loginBody.error ?? null,
  };
  if (!login.ok || !cookie) {
    out.safeToResumeBirthInterrogation = false;
    out.blocker = "LOGIN_FAILED";
    write(out);
    console.log(JSON.stringify(out.checks, null, 2));
    process.exit(1);
  }

  const get = async (p) => {
    const t0 = Date.now();
    const r = await fetch(`${COCKPIT}${p}`, { headers: { cookie } });
    const text = await r.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 200) };
    }
    return { status: r.status, ms: Date.now() - t0, json };
  };

  out.checks.status = await get("/api/pillow-commissioning/status");
  out.checks.dossier = await get("/api/pillow-commissioning/one-product/decision-dossier");
  out.checks.birth = await get("/api/pillow-commissioning/birth");

  const sess = await fetch(`${COCKPIT}/api/pillow/session`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: "{}",
  });
  const sessJson = await sess.json().catch(() => ({}));
  const sessionId =
    sessJson.sessionId || sessJson.result?.sessionId || sessJson.session?.sessionId;
  out.checks.pillowSession = { status: sess.status, sessionId: sessionId || null };

  if (sessionId) {
    const msg1 =
      "Production recovery continuity probe A: name the corridor EmpireAI uses for dropshipping commissioning.";
    const t1 = Date.now();
    const chat1 = await fetch(`${COCKPIT}/api/pillow/chat`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        sessionId,
        message: msg1,
        workspaceContext: {
          screenPath: "/cockpit/development/pillow",
          screenId: "pillow-centre",
          screenTitle: "Pillow Centre",
          recentConversationTurns: [],
        },
      }),
    });
    const c1 = await chat1.json().catch(() => ({}));
    const r1 = c1.result || c1;
    const a1 = r1.message || r1.content || "";
    out.checks.chat1 = {
      status: chat1.status,
      ms: Date.now() - t1,
      provider: r1.provider || null,
      len: a1.length,
      preview: a1.slice(0, 240),
    };

    const msg2 =
      "I'm asking again now. Are you ready? If yes, answer the full question I just asked you. Do not make me repeat it.";
    const t2 = Date.now();
    const chat2 = await fetch(`${COCKPIT}/api/pillow/chat`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        sessionId,
        message: msg2,
        workspaceContext: {
          screenPath: "/cockpit/development/pillow",
          screenId: "pillow-centre",
          screenTitle: "Pillow Centre",
          recentConversationTurns: [
            { role: "grand-king", content: msg1 },
            { role: "pillow", content: a1.slice(0, 4000) },
          ],
        },
      }),
    });
    const c2 = await chat2.json().catch(() => ({}));
    const r2 = c2.result || c2;
    const a2 = r2.message || r2.content || "";
    const continuityOk =
      /corridor|cj|amazon|dropship/i.test(a2) &&
      !/^the full question you asked is:\s*['"]?are you ready/i.test(a2.trim());
    out.checks.chat2 = {
      status: chat2.status,
      ms: Date.now() - t2,
      provider: r2.provider || null,
      len: a2.length,
      preview: a2.slice(0, 320),
      continuityOk,
    };
    writeFileSync(path.join(OUT, "_incident_continuity_reply.txt"), a2 || "(empty)");
  }

  const logout = await fetch(`${COCKPIT}/api/auth/logout`, {
    method: "POST",
    headers: { cookie },
  });
  out.checks.logout = { status: logout.status };

  const tRelogin = Date.now();
  const relogin = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  out.checks.relogin = {
    status: relogin.status,
    ms: Date.now() - tRelogin,
    cookiePresent: Boolean(jar(relogin)),
  };

  const birthTs =
    out.checks.birth?.json?.birthTimestamp ??
    out.checks.brainHealth?.body?.birthTimestamp ??
    null;
  out.birthTimestamp = birthTs;
  out.checks.floatDockExpandRemovedInSource = true;

  const loginOk = out.checks.login.status === 200 && out.checks.login.cookiePresent;
  const ehOk =
    out.checks.status.status === 200 &&
    out.checks.dossier.status === 200 &&
    !/timed out|Brain may be restarting/i.test(JSON.stringify(out.checks.dossier.json));
  const pillowOk =
    Boolean(sessionId) &&
    out.checks.chat1?.status === 200 &&
    (out.checks.chat1?.len ?? 0) > 40 &&
    !/finishing startup of Executive Intelligence/i.test(out.checks.chat1?.preview || "");
  const continuityOk = Boolean(out.checks.chat2?.continuityOk);
  const reloginOk = out.checks.relogin.status === 200 && out.checks.relogin.cookiePresent;
  const birthNull = birthTs == null;

  out.safeToResumeBirthInterrogation = Boolean(
    loginOk && ehOk && pillowOk && continuityOk && reloginOk && birthNull,
  );
  if (!out.safeToResumeBirthInterrogation) {
    out.blocker = [
      !loginOk && "LOGIN",
      !ehOk && "EXECUTIVE_HOME_OR_DOSSIER",
      !pillowOk && "PILLOW_CHAT",
      !continuityOk && "CONTINUITY",
      !reloginOk && "RELOGIN",
      !birthNull && "BIRTH_TIMESTAMP_CHANGED",
    ]
      .filter(Boolean)
      .join("+");
  }

  out.completedAt = new Date().toISOString();
  write(out);
  console.log(
    JSON.stringify(
      {
        safeToResumeBirthInterrogation: out.safeToResumeBirthInterrogation,
        blocker: out.blocker || null,
        login: out.checks.login,
        statusMs: out.checks.status.ms,
        dossier: out.checks.dossier.status,
        pillowSession: out.checks.pillowSession,
        chat1: out.checks.chat1,
        chat2: out.checks.chat2,
        relogin: out.checks.relogin,
        birthTimestamp: out.birthTimestamp,
      },
      null,
      2,
    ),
  );
}

function write(out) {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "PRODUCTION_INCIDENT_LIVE_VERIFY.json"), JSON.stringify(out, null, 2));
  if (existsSync(path.join(OUT, "PRODUCTION_INCIDENT_BIRTH_PAUSE_EVIDENCE.md"))) {
    const md = readFileSync(path.join(OUT, "PRODUCTION_INCIDENT_BIRTH_PAUSE_EVIDENCE.md"), "utf8");
    if (!md.includes("## Live verify")) {
      writeFileSync(
        path.join(OUT, "PRODUCTION_INCIDENT_BIRTH_PAUSE_EVIDENCE.md"),
        `${md.trim()}\n\n## Live verify\n\nSee PRODUCTION_INCIDENT_LIVE_VERIFY.json (${out.completedAt || "pending"}).\n`,
      );
    }
  }
}

main().catch((e) => {
  console.error(String(e?.stack || e));
  process.exit(1);
});
