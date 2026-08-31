/**
 * Production ladder: bounded commercial routing + fallback authority.
 * New scenarios only — no Orion/Pioneer replay.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL || "founder@empireai.com";
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD || "EmpireAI2026!";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

async function login() {
  const r = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(60_000),
  });
  const cookie = extractCookie(r);
  if (!cookie) throw new Error(`login_failed status=${r.status}`);
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
  return body.session?.sessionId || body.sessionId || `bcr-${Date.now()}`;
}

async function chat(cookie, sessionId, message, recentTurns = []) {
  const t0 = Date.now();
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      sessionId,
      message,
      workspaceContext: {
        screenPath: "/cockpit/development/pillow",
        screenId: "pillow-centre",
        screenTitle: "Pillow Centre",
        module: "executive",
        recentConversationTurns: recentTurns.slice(-12),
      },
    }),
    signal: AbortSignal.timeout(300_000),
  });
  const body = await r.json().catch(() => ({}));
  const text =
    body.result?.message || body.message || body.reply || body.text || JSON.stringify(body);
  return { text: String(text || ""), ms: Date.now() - t0, status: r.status };
}

function unsupportedTakeover(t) {
  const n = (t.match(/Unsupported as established fact/gi) || []).length;
  return n >= 3;
}

async function main() {
  const health = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) }).then(
    (r) => r.json(),
  );
  const liveSha = String(health.deploy?.gitCommitSha || "");
  const deploymentId = String(health.deploy?.deploymentId || "");
  const cookie = await login();
  const results = [];

  async function run(id, message, grade, sessionId, turns) {
    const out = await chat(cookie, sessionId, message, turns);
    turns.push({ role: "user", content: message });
    turns.push({ role: "assistant", content: out.text });
    const g = grade(out.text);
    const row = {
      id,
      ok: g.ok,
      ms: out.ms,
      status: out.status,
      detail: g.detail,
      head: out.text.slice(0, 320),
    };
    results.push(row);
    console.log(JSON.stringify(row));
    return row;
  }

  // 1 bounded supplier decision
  {
    const sid = await createSession(cookie);
    await run(
      "bounded_supplier",
      [
        "SyntheticBoundSup — procurement only. Do not mention Mini Fan or Birth.",
        "Rule: eligible if cost <= 450000 AND delivery >= 94% AND approval granted. Select sole eligible.",
        "FLINT: cost 360000 PASS; delivery 96% PASS; approval granted PASS.",
        "MAPLE: cost 380000 PASS; delivery 95% PASS; approval PENDING FAIL.",
        "OAK: cost 330000 PASS; delivery 93.5% FAIL; approval granted PASS.",
        "Answer in exactly 5 numbered sections: 1. Snapshot 2. Gate detail 3. Eligible set 4. Recommendation 5. Closing.",
      ].join("\n"),
      (t) => ({
        ok:
          !unsupportedTakeover(t) &&
          /\bFLINT\b/i.test(t) &&
          (/SELECT\s+FLINT|recommend(?:ing|s)?\s+(?:selecting\s+)?\*?FLINT|sole eligible/i.test(t) ||
            /Eligible Suppliers:\s*FLINT/i.test(t)),
        detail: `takeover=${unsupportedTakeover(t)}`,
      }),
      sid,
      [],
    );
  }

  // 2 marketplace-like
  {
    const sid = await createSession(cookie);
    await run(
      "bounded_corridor",
      [
        "SyntheticBoundCorr — corridor only. Do not mention Mini Fan.",
        "Rule: eligible if contribution >= 8% AND stock available AND policy clear. Select highest contribution among eligible.",
        "CORRIDOR_A: contribution 12% PASS; stock unavailable FAIL; policy clear PASS.",
        "CORRIDOR_B: contribution 9% PASS; stock available PASS; policy clear PASS.",
        "Answer in exactly 3 numbered sections: 1. Gates 2. Recommendation 3. Closing.",
      ].join("\n"),
      (t) => ({
        ok: !unsupportedTakeover(t) && /CORRIDOR_B/i.test(t) && !/SELECT\s+CORRIDOR_A/i.test(t),
        detail: "corridor",
      }),
      sid,
      [],
    );
  }

  // 3 non-commercial bounded
  {
    const sid = await createSession(cookie);
    await run(
      "bounded_noncommercial",
      [
        "SyntheticBoundLane — logistics lanes only. Do not mention Mini Fan.",
        "Rule: eligible if transit hours <= 48 AND approval granted. Select sole eligible.",
        "LANE_X: transit 36 PASS; approval granted PASS.",
        "LANE_Y: transit 55 FAIL; approval granted PASS.",
        "Answer in exactly 3 numbered sections: 1. Snapshot 2. Recommendation 3. Closing.",
      ].join("\n"),
      (t) => ({
        ok: !unsupportedTakeover(t) && /LANE_X/i.test(t),
        detail: "lane",
      }),
      sid,
      [],
    );
  }

  // 4 no magic hypothetical wording
  {
    const sid = await createSession(cookie);
    await run(
      "no_magic_marker",
      [
        "Acme has three suppliers. Choose one using these rules.",
        "Rule: eligible only if cost <= 400000 AND delivery >= 94% AND approval granted.",
        "If exactly one eligible, select that supplier.",
        "RIVER: cost 350000 PASS; delivery 96% PASS; approval granted PASS.",
        "STONE: cost 360000 PASS; delivery 95% PASS; approval PENDING FAIL.",
        "HILL: cost 340000 PASS; delivery 93% FAIL; approval granted PASS.",
        "Answer in exactly 4 numbered sections: 1. Snapshot 2. Eligible set 3. Recommendation 4. Closing.",
      ].join("\n"),
      (t) => ({
        ok: !unsupportedTakeover(t) && /RIVER/i.test(t) && /SELECT\s+RIVER|Eligible Suppliers:\s*RIVER|recommend[\s\S]{0,40}RIVER/i.test(t),
        detail: "no_magic",
      }),
      sid,
      [],
    );
  }

  // 5 genuine live fact query
  {
    const sid = await createSession(cookie);
    await run(
      "live_orders_query",
      "How many realised orders has EmpireAI received? Answer briefly with verified state only.",
      (t) => ({
        ok:
          /order/i.test(t) &&
          !/SELECT\s+FLINT|Eligible Suppliers:\s*RIVER/i.test(t) &&
          (/0|zero|realised/i.test(t) || /verified|commissioning|KPI/i.test(t)),
        detail: "live",
      }),
      sid,
      [],
    );
  }

  // 6 bounded after live
  {
    const sid = await createSession(cookie);
    const turns = [];
    await run(
      "live_then_seed",
      "Briefly: is EmpireAI live and answering?",
      (t) => ({ ok: /live|answering|EmpireAI/i.test(t), detail: "seed_live" }),
      sid,
      turns,
    );
    await run(
      "bounded_after_live",
      [
        "SyntheticBoundAfterLive — new bounded case. Do not mention Mini Fan.",
        "Rule: eligible if approval granted. Select sole eligible.",
        "QUILL: approval granted PASS.",
        "INK: approval PENDING FAIL.",
        "Answer in exactly 3 numbered sections: 1. Snapshot 2. Recommendation 3. Closing.",
      ].join("\n"),
      (t) => ({
        ok: !unsupportedTakeover(t) && /QUILL/i.test(t) && !/Unsupported as established fact[\s\S]{0,80}Unsupported as established fact[\s\S]{0,80}Unsupported/i.test(t),
        detail: "after_live",
      }),
      sid,
      turns,
    );
  }

  // 7 live after bounded
  {
    const sid = await createSession(cookie);
    const turns = [];
    await run(
      "bounded_then_seed",
      [
        "SyntheticBoundBeforeLive — ops only.",
        "Rule: eligible if approval granted.",
        "WASP: approval granted PASS.",
        "Answer in exactly 2 numbered sections: 1. Snapshot 2. Closing.",
      ].join("\n"),
      (t) => ({ ok: /WASP/i.test(t) || !unsupportedTakeover(t), detail: "seed_bound" }),
      sid,
      turns,
    );
    await run(
      "live_after_bounded",
      "What is EmpireAI's current realised order count from verified state?",
      (t) => ({
        ok: /order/i.test(t) && !/SELECT\s+WASP/i.test(t),
        detail: "live_after",
      }),
      sid,
      turns,
    );
  }

  // 8 five-claim audit
  {
    const sid = await createSession(cookie);
    await run(
      "five_claim_audit",
      [
        "SyntheticBoundFive — ops only. Do not mention Mini Fan.",
        "Rule: eligible if approval granted.",
        "ALPHA: approval granted PASS.",
        "BETA: approval PENDING FAIL.",
        "Answer in exactly 4 numbered sections.",
        "1. Snapshot",
        "2. Eligible set",
        "3. Claim audit",
        "4. Closing",
        "Audit these claims with explicit Verdict each:",
        '"BETA is currently eligible."',
        '"ALPHA is currently eligible."',
        '"At least two currently qualify."',
        '"Pending approval is enough for eligibility."',
        '"ALPHA should be selected now."',
      ].join("\n"),
      (t) => {
        const verdicts = (t.match(/\*\*Verdict:\*\*/gi) || []).length;
        return {
          ok: !unsupportedTakeover(t) && verdicts >= 3 && /ALPHA/i.test(t),
          detail: `verdicts=${verdicts}`,
        };
      },
      sid,
      [],
    );
  }

  // 9 seven-section contract
  {
    const sid = await createSession(cookie);
    await run(
      "seven_section",
      [
        "SyntheticBoundSeven — procurement only. Do not mention Mini Fan.",
        "Rule: eligible if cost <= 500000 AND delivery >= 94% AND approval granted. Select sole eligible.",
        "PINE: cost 400000 PASS; delivery 95% PASS; approval granted PASS.",
        "TEAK: cost 410000 PASS; delivery 96% PASS; approval PENDING FAIL.",
        "Answer in exactly 7 numbered sections.",
        "1. Snapshot",
        "2. Economics",
        "3. Gate detail",
        "4. Evidence",
        "5. Eligible set",
        "6. Recommendation",
        "7. Closing",
      ].join("\n"),
      (t) => {
        const markers = [...t.matchAll(/^(?:#{1,3}\s*)?(\d+)[.)]/gm)].map((m) => Number(m[1]));
        const uniq = new Set(markers);
        return {
          ok:
            !unsupportedTakeover(t) &&
            markers.length >= 5 &&
            !(uniq.size === 1 && markers[0] === 1) &&
            /PINE/i.test(t),
          detail: `markers=${markers.slice(0, 8).join(",")}`,
        };
      },
      sid,
      [],
    );
  }

  // 10 warm session
  {
    const sid = await createSession(cookie);
    const turns = [];
    await run(
      "warm_a",
      [
        "SyntheticBoundWarmA — software only.",
        "VOLT: cost 100 PASS; delivery 99% PASS; approval granted PASS.",
        "Answer in exactly 2 numbered sections: 1. Snapshot 2. Closing.",
      ].join("\n"),
      (t) => ({ ok: /VOLT|cost\s*100|delivery\s*99/i.test(t), detail: "warm_a" }),
      sid,
      turns,
    );
    await run(
      "warm_b",
      [
        "SyntheticBoundWarmB — hospitality only. New bounded case.",
        "Rule: eligible if delivery >= 94% and approval granted. Select sole eligible.",
        "QUAY: delivery 95% PASS; approval granted PASS.",
        "Answer in exactly 3 numbered sections: 1. Snapshot 2. Recommendation 3. Closing.",
      ].join("\n"),
      (t) => ({
        ok: (/QUAY/i.test(t) || /delivery\s*95/i.test(t)) && !/\bVOLT\b/i.test(t) && !unsupportedTakeover(t),
        detail: "warm_b",
      }),
      sid,
      turns,
    );
  }

  const passCount = results.filter((r) => r.ok).length;
  const summary = {
    generatedAt: new Date().toISOString(),
    LIVE_SHA: liveSha,
    DEPLOYMENT_ID: deploymentId,
    passCount,
    total: results.length,
    PRODUCTION_BOUNDED_ROUTING_PASS: passCount === results.length ? "PASS" : "FAIL",
    results,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    path.join(OUT, "BOUNDED_COMMERCIAL_ROUTING_PRODUCTION.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(
    JSON.stringify({
      PRODUCTION_BOUNDED_ROUTING_PASS: summary.PRODUCTION_BOUNDED_ROUTING_PASS,
      passCount,
      total: results.length,
      LIVE_SHA: liveSha,
    }),
  );
  if (passCount !== results.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
