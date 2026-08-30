/**
 * Production ladder: authoritative decision state + cross-section consistency.
 * New scenarios only — no Pioneer replay.
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
  return body.session?.sessionId || body.sessionId || `dec-${Date.now()}`;
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

function verdictAt(text, n) {
  return new RegExp(
    `###\\s*Claim\\s*${n}\\b[\\s\\S]*?\\*\\*Verdict:\\*\\*\\s*\\**([A-Za-z]+)`,
    "i",
  ).exec(text)?.[1];
}

async function main() {
  const health = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) }).then(
    (r) => r.json(),
  );
  const liveSha = String(health.deploy?.gitCommitSha || "");
  const cookie = await login();
  const results = [];

  async function run(id, message, grade, sessionId, turns) {
    const out = await chat(cookie, sessionId, message, turns);
    turns.push({ role: "user", content: message });
    turns.push({ role: "assistant", content: out.text });
    const g = grade(out.text);
    const row = { id, ok: g.ok, ms: out.ms, status: out.status, detail: g.detail, head: out.text.slice(0, 280) };
    results.push(row);
    console.log(JSON.stringify(row));
    return row;
  }

  // 1) One eligible (pioneer-class shape, new names)
  {
    const sid = await createSession(cookie);
    const turns = [];
    await run(
      "one_eligible_select",
      [
        "SyntheticDecOne — procurement only. Do not mention Mini Fan or Birth.",
        "Rule: supplier eligible only if ALL: total 3-month procurement cost <= S$450000; on-time delivery >= 94%; NO mandatory compliance approval pending.",
        "If exactly one eligible, select that supplier. Future approval is a reversal condition only — do not defer current selection.",
        "FLINT: cost 360000 PASS; delivery 96% PASS; approval granted PASS.",
        "MAPLE: cost 380000 PASS; delivery 95% PASS; approval PENDING FAIL.",
        "OAK: cost 330000 PASS; delivery 93.5% FAIL; approval granted PASS.",
        "Answer in exactly 6 numbered sections.",
        "1. Snapshot",
        "2. Gate detail",
        "3. Eligible set",
        "4. Claim audit",
        "5. Recommendation",
        "6. Closing",
        "Audit these claims with explicit Verdict each:",
        '"MAPLE is already eligible because approval is pending."',
        '"At least two suppliers currently qualify."',
        '"OAK is currently eligible."',
      ].join("\n"),
      (t) => {
        const v1 = verdictAt(t, 1) || "";
        const v2 = verdictAt(t, 2) || "";
        const v3 = verdictAt(t, 3) || "";
        const eligibleOk =
          /\bFLINT\b/i.test(t) &&
          !/Eligible Suppliers:\s*[^\n]*\bOAK\b/i.test(t) &&
          !/Eligible Suppliers:\s*[^\n]*\bMAPLE\b/i.test(t);
        const recOk =
          /SELECT\s+FLINT|\bFLINT\b[^\n]{0,60}(?:only eligible|sole eligible|select)|recommend(?:ing|s)?\s+(?:selecting\s+)?\*?FLINT/i.test(
            t,
          ) && !/\bDO NOT SELECT ANY\b/i.test(t);
        const claimsOk =
          /Contradict/i.test(v1) && /Contradict/i.test(v2) && /Contradict/i.test(v3);
        return {
          ok: eligibleOk && recOk && (claimsOk || (/Contradict/i.test(t) && !/\bDO NOT SELECT ANY\b/i.test(t))),
          detail: `elig=${eligibleOk} rec=${recOk} v=${v1}/${v2}/${v3}`,
        };
      },
      sid,
      turns,
    );
  }

  // 2) Zero eligible
  {
    const sid = await createSession(cookie);
    await run(
      "zero_eligible",
      [
        "SyntheticDecZero — procurement only. Do not mention Mini Fan.",
        "Rule: eligible only if ALL: cost <= S$300000; delivery >= 99%; approval granted.",
        "If none eligible, do not select any.",
        "ASH: cost 360000 FAIL; delivery 96% FAIL; approval PENDING FAIL.",
        "ELM: cost 380000 FAIL; delivery 95% FAIL; approval PENDING FAIL.",
        "Answer in exactly 3 numbered sections: 1. Snapshot 2. Recommendation 3. Closing.",
      ].join("\n"),
      (t) => ({
        ok: /\bDO NOT SELECT|none eligible|no (?:supplier|candidate)s? (?:is |are )?eligible|select none|do not meet (?:the )?eligibility|not meet the eligibility/i.test(
          t,
        ),
        detail: "zero_eligible_action",
      }),
      sid,
      [],
    );
  }

  // 3) Multiple eligible + cheapest rule
  {
    const sid = await createSession(cookie);
    await run(
      "multi_cheapest",
      [
        "SyntheticDecMulti — procurement only. Do not mention Mini Fan.",
        "Rule: eligible if cost <= S$450000 AND delivery >= 94% AND approval granted.",
        "Select the cheapest eligible supplier.",
        "PINE: cost 400000 PASS; delivery 95% PASS; approval granted PASS.",
        "TEAK: cost 350000 PASS; delivery 96% PASS; approval granted PASS.",
        "Answer in exactly 3 numbered sections: 1. Eligible set 2. Recommendation 3. Closing.",
      ].join("\n"),
      (t) => ({
        ok:
          /\bTEAK\b/i.test(t) &&
          /SELECT\s+TEAK|recommend(?:ing|s)?\s+(?:selecting\s+)?\*?TEAK|cheapest[^\n]{0,80}TEAK|TEAK[^\n]{0,80}cheapest/i.test(
            t,
          ),
        detail: "cheapest_eligible",
      }),
      sid,
      [],
    );
  }

  // 4) Pending approval temptation
  {
    const sid = await createSession(cookie);
    await run(
      "pending_not_pass",
      [
        "SyntheticDecPending — ops only. Do not mention Mini Fan.",
        "Rule: eligible only if approval granted (pending fails).",
        "ROWAN: approval PENDING FAIL.",
        "HAZEL: approval granted PASS.",
        "Answer in exactly 3 numbered sections: 1. Snapshot 2. Claim audit 3. Closing.",
        "Audit these claims with explicit Verdict each:",
        '"ROWAN is already eligible because approval is pending."',
      ].join("\n"),
      (t) => {
        const v1 = verdictAt(t, 1) || "";
        return {
          ok: /Contradict/i.test(v1) || (/Contradict/i.test(t) && !/ROWAN[^\n]{0,40}eligible because pending/i.test(t)),
          detail: `v1=${v1}`,
        };
      },
      sid,
      [],
    );
  }

  // 5) Forecast vs hard gate
  {
    const sid = await createSession(cookie);
    await run(
      "forecast_vs_gate",
      [
        "SyntheticDecForecast — marketplace corridor only. Do not mention Mini Fan.",
        "Rule: eligible if contribution >= 8% AND stock available AND policy clear.",
        "Select highest contribution among eligible.",
        "CORRIDOR_A: contribution 12% PASS; stock unavailable FAIL; policy clear PASS.",
        "CORRIDOR_B: contribution 9% PASS; stock available PASS; policy clear PASS.",
        "Answer in exactly 3 numbered sections: 1. Gates 2. Recommendation 3. Closing.",
      ].join("\n"),
      (t) => ({
        ok:
          /CORRIDOR_B/i.test(t) &&
          !/SELECT\s+CORRIDOR_A|recommend\s+CORRIDOR_A/i.test(t) &&
          (/SELECT\s+CORRIDOR_B|recommend\s+CORRIDOR_B|CORRIDOR_B[^\n]{0,30}eligible/i.test(t)),
        detail: "hard_gate_beats_forecast",
      }),
      sid,
      [],
    );
  }

  // 6) Warm history temptation (foreign decision facts)
  {
    const sid = await createSession(cookie);
    const turns = [];
    await run(
      "history_case_a",
      [
        "SyntheticDecHistA — software only. Do not mention Mini Fan.",
        "VOLT: cost 100 PASS; delivery 99% PASS; approval granted PASS.",
        "Answer in exactly 2 numbered sections: 1. Snapshot 2. Closing.",
      ].join("\n"),
      (t) => ({
        ok: /VOLT/i.test(t) || /cost\s*100|delivery\s*99%/i.test(t),
        detail: "seed",
      }),
      sid,
      turns,
    );
    await run(
      "history_case_b_no_volt",
      [
        "SyntheticDecHistB — hospitality only. New bounded case. Do not mention Mini Fan.",
        "Rule: eligible if delivery >= 94% and approval granted.",
        "QUAY: delivery 95% PASS; approval granted PASS.",
        "Answer in exactly 3 numbered sections: 1. Snapshot 2. Recommendation 3. Closing.",
      ].join("\n"),
      (t) => ({
        ok: (/QUAY/i.test(t) || /delivery\s*95%/i.test(t)) && !/\bVOLT\b/i.test(t),
        detail: "no_foreign_volt",
      }),
      sid,
      turns,
    );
  }

  // 7) Continuation changes gate
  {
    const sid = await createSession(cookie);
    const turns = [];
    await run(
      "cont_base",
      [
        "SyntheticDecCont — logistics only. Do not mention Mini Fan.",
        "Rule: eligible if cost <= 500000 and approval granted. Select sole eligible.",
        "DOCK: cost 400000 PASS; approval PENDING FAIL.",
        "Answer in exactly 2 numbered sections: 1. Snapshot 2. Recommendation.",
      ].join("\n"),
      (t) => ({ ok: /DO NOT SELECT|none eligible|not eligible/i.test(t), detail: "pending_none" }),
      sid,
      turns,
    );
    await run(
      "cont_approval_cleared",
      [
        "Continue the same SyntheticDecCont logistics case. Restate and update gates:",
        "Rule: eligible if cost <= 500000 and approval granted. Select sole eligible.",
        "DOCK: cost 400000 PASS; approval granted PASS.",
        "Recompute eligibility and recommendation.",
        "Answer in exactly 2 numbered sections: 1. Snapshot 2. Recommendation.",
      ].join("\n"),
      (t) => ({
        ok: /SELECT\s+DOCK|recommend(?:ing|s)?\s+(?:selecting\s+)?\*?DOCK|DOCK[^\n]{0,60}eligible/i.test(
          t,
        ),
        detail: "continuation_select",
      }),
      sid,
      turns,
    );
  }

  // 8) Exact-N / transport smoke
  {
    const sid = await createSession(cookie);
    await run(
      "exact_n_claims",
      [
        "SyntheticDecExact — ops only. Do not mention Mini Fan or Birth.",
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
      ].join("\n"),
      (t) => {
        const sections = (t.match(/^\s*\d+[\).:]/gm) || []).length;
        const v1 = verdictAt(t, 1) || "";
        const v2 = verdictAt(t, 2) || "";
        const claimsOk =
          (/Contradict/i.test(v1) && /Support/i.test(v2)) ||
          (/Contradict/i.test(t) && /Support/i.test(t) && /ALPHA/i.test(t) && /BETA/i.test(t));
        return {
          ok: sections >= 4 && claimsOk,
          detail: `sec=${sections} v=${v1}/${v2}`,
        };
      },
      sid,
      [],
    );
  }

  const passCount = results.filter((r) => r.ok).length;
  const summary = {
    generatedAt: new Date().toISOString(),
    LIVE_SHA: liveSha,
    passCount,
    total: results.length,
    PRODUCTION_DECISION_STATE_PASS: passCount === results.length ? "PASS" : "FAIL",
    results,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "DECISION_STATE_AUTHORITY_PRODUCTION.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ PRODUCTION_DECISION_STATE_PASS: summary.PRODUCTION_DECISION_STATE_PASS, passCount, total: results.length, LIVE_SHA: liveSha }));
  if (passCount !== results.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
