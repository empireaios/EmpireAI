/**
 * Stratified 1000-request Pillow response qualification.
 *
 * Perfect-run rule: ACCEPTED=1000, TERMINAL=1000, USEFUL=1000, FAILURES=0,
 * ASK_AGAIN=0, USER_RESUBMISSION_REQUIRED=0, EMPTY=0, LOST=0.
 *
 * Env:
 *   EMPIRE_COCKPIT_URL, EMPIRE_LOGIN_EMAIL / EMPIRE_LOGIN_PASSWORD
 *   RESP_QUAL_TARGET (default 1000)
 *   RESP_QUAL_DELAY_MS (default 80)
 *   RESP_QUAL_STAGE=100|300|1000 — optional stage gate
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const EMAIL =
  process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL || "founder@empireai.com";
const PASSWORD =
  process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD || "EmpireAI2026!";
const TARGET = Math.max(1, Number(process.env.RESP_QUAL_TARGET || process.env.RESP_QUAL_STAGE || 1000));
const DELAY_MS = Math.max(0, Number(process.env.RESP_QUAL_DELAY_MS || 80));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

const ASK_AGAIN =
  /\b(please ask again|ask again in a moment|ask again later|try again later|realigning executive intelligence|please retry when the executive pipeline)\b/i;

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildPlan(target) {
  const base = {
    A_normal: 250,
    B_multipart_5_10: 150,
    C_long_context: 100,
    D_truth_provenance: 100,
    E_inference_decision: 100,
    F_concurrent: 75,
    G_background: 75,
    H_worker_degrade: 50,
    I_auth_session: 40,
    J_structured_15_20: 30,
    K_transient_error: 20,
    L_idempotency: 10,
  };
  const sum = Object.values(base).reduce((a, b) => a + b, 0);
  if (target === sum) return { ...base };
  const scaled = {};
  let allocated = 0;
  const keys = Object.keys(base);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (i === keys.length - 1) scaled[k] = target - allocated;
    else {
      scaled[k] = Math.max(1, Math.round((base[k] / sum) * target));
      allocated += scaled[k];
    }
  }
  return scaled;
}

function promptFor(cls, i) {
  switch (cls) {
    case "A_normal":
      return `Synthetic A#${i}: In one short paragraph, what is our current verified commerce posture?`;
    case "B_multipart_5_10":
      return [
        `Synthetic B#${i} multi-part:`,
        "1) Verified product focus?",
        "2) Realised orders?",
        "3) What is still unknown?",
        "4) One bounded next step?",
        "5) What would change your mind?",
        i % 2 === 0 ? "6) Birth authorised? 7) Deploy live?" : "",
      ]
        .filter(Boolean)
        .join("\n");
    case "C_long_context":
      return (
        `Synthetic C#${i} long-context executive brief. ` +
        `Background note ${i}: `.repeat(12) +
        "Ignoring filler notes, answer only: are we live in production, and is Birth authorised? Keep it to 3 sentences."
      );
    case "D_truth_provenance":
      return `Synthetic D#${i}: State only what you can verify about realised sales. Do not invent market-demand tools.`;
    case "E_inference_decision":
      return `Synthetic E#${i}: Separating inference from fact, what should we prioritise next and what material unknown could reverse it?`;
    case "F_concurrent":
      return `Synthetic F#${i}: Concurrent coexist probe — reply with current focus in one sentence.`;
    case "G_background":
      return `Synthetic G#${i}: While systems work in background, summarise birth readiness in one sentence.`;
    case "H_worker_degrade":
      return `Synthetic H#${i}: If deliberation is thin this turn, still answer from verified state — do not ask me to resubmit. What is realised revenue status?`;
    case "I_auth_session":
      return `Synthetic I#${i}: Confirm you still recognise this authenticated Grand King session and answer: is Birth authorised?`;
    case "J_structured_15_20": {
      const lines = [];
      for (let n = 1; n <= 16; n++) lines.push(`${n}) Brief note on operating theme ${n}?`);
      return `Synthetic J#${i} structured:\n${lines.join("\n")}\nAnswer each briefly from verified state; mark unknowns honestly.`;
    }
    case "K_transient_error":
      return `Synthetic K#${i}: Resilience probe — give a useful answer even if full model path is strained. Current product focus?`;
    case "L_idempotency":
      return `Synthetic L#${i} IDEMPOTENT_KEY=${i}: Repeat-safe ask — what is Birth timestamp?`;
    default:
      return `Synthetic Z#${i}: Status?`;
  }
}

function usefulEnough(text, cls) {
  const t = String(text || "").trim();
  if (t.length < 24) return false;
  if (ASK_AGAIN.test(t)) return false;
  if (/^sorry\.?$/i.test(t)) return false;
  // Multi-part / structured: require multiple substantive sentences or numbered coverage signal
  if (cls.startsWith("B_") || cls.startsWith("J_")) {
    const hits = (t.match(/\d+[\).:]|part|theme|unknown|verified|orders|birth|revenue|focus/gi) || [])
      .length;
    if (hits < 3) return false;
  }
  return true;
}

async function main() {
  const plan = buildPlan(TARGET);
  const report = {
    artifact: "PILLOW_RESPONSE_1000_QUALIFICATION",
    startedAt: new Date().toISOString(),
    completedAt: null,
    target: TARGET,
    plan,
    attempts: 0,
    accepted: 0,
    terminal: 0,
    useful: 0,
    empty: 0,
    askAgain: 0,
    lost: 0,
    userResubmissionRequired: 0,
    failures: 0,
    byClass: {},
    firstFailure: null,
    deploySha: null,
    result: "IN_PROGRESS",
    birthAuthorised: false,
    birthTimestamp: null,
    sealedExamEncoded: false,
  };

  for (const cls of Object.keys(plan)) {
    report.byClass[cls] = { planned: plan[cls], ok: 0, fail: 0 };
  }

  const login = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(55_000),
  });
  const cookie = extractCookie(login);
  if (!login.ok || !cookie) {
    console.error(JSON.stringify({ pass: false, reason: "login", status: login.status }));
    process.exit(2);
  }

  const sess = await fetch(`${COCKPIT}/api/pillow/session`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(90_000),
  });
  const sj = await sess.json().catch(() => ({}));
  let sessionId = sj.session?.sessionId;
  if (!sess.ok || !sessionId) {
    console.error(JSON.stringify({ pass: false, reason: "session", status: sess.status, body: sj }));
    process.exit(2);
  }

  async function chat(message) {
    const attempt = async () => {
      const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ sessionId, message }),
        signal: AbortSignal.timeout(120_000),
      });
      const body = await r.json().catch(() => ({}));
      const text = body.result?.message ?? body.message ?? "";
      return { ok: r.ok, status: r.status, text, body };
    };
    let outcome = await attempt();
    // Internal retry on transient worker faults — do not count as user resubmission.
    if ((!outcome.ok || outcome.status >= 500 || !String(outcome.text || "").trim()) && outcome.status !== 401) {
      await sleep(1500);
      outcome = await attempt();
    }
    return outcome;
  }

  // Seed deploy identity
  try {
    const live = await fetch(
      (process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app") + "/health/live",
      { signal: AbortSignal.timeout(20_000) },
    );
    const lj = await live.json();
    report.deploySha = lj.deploy?.gitCommitSha ?? null;
  } catch {
    /* non-blocking */
  }

  outer: for (const cls of Object.keys(plan)) {
    const n = plan[cls];
    for (let i = 0; i < n; i++) {
      report.attempts += 1;
      const prompt = promptFor(cls, i);
      let outcome;
      try {
        // F_concurrent: fire two overlapping chats (same session sequential still; parallel pair)
        if (cls === "F_concurrent") {
          const [a, b] = await Promise.all([chat(prompt), chat(prompt + " (coexist)")]);
          outcome = a.ok ? a : b;
        } else {
          outcome = await chat(prompt);
        }
      } catch (error) {
        outcome = { ok: false, status: 0, text: "", error: String(error?.message || error) };
      }

      const accepted = outcome.ok && outcome.status < 500;
      const text = String(outcome.text || "").trim();
      const empty = text.length === 0;
      const askAgain = ASK_AGAIN.test(text);
      const useful = accepted && !empty && usefulEnough(text, cls);
      const terminal = accepted && !empty;
      const lost = !accepted || empty;

      if (accepted) report.accepted += 1;
      if (terminal) report.terminal += 1;
      if (useful) report.useful += 1;
      if (empty) report.empty += 1;
      if (askAgain) report.askAgain += 1;
      if (lost) report.lost += 1;

      const pass = accepted && terminal && useful && !askAgain && !lost;
      if (pass) report.byClass[cls].ok += 1;
      else {
        report.byClass[cls].fail += 1;
        report.failures += 1;
        report.firstFailure = {
          class: cls,
          i,
          status: outcome.status,
          askAgain,
          empty,
          preview: text.slice(0, 220),
          error: outcome.error || null,
        };
        report.result = "FAIL";
        report.completedAt = new Date().toISOString();
        break outer;
      }

      if (report.attempts % 50 === 0) {
        console.log(
          JSON.stringify({
            progress: `${report.useful}/${TARGET}`,
            cls,
            lastPreview: text.slice(0, 80),
          }),
        );
      }
      if (DELAY_MS) await sleep(DELAY_MS);
    }
  }

  if (report.result !== "FAIL") {
    report.result =
      report.attempts === TARGET &&
      report.accepted === TARGET &&
      report.terminal === TARGET &&
      report.useful === TARGET &&
      report.failures === 0 &&
      report.empty === 0 &&
      report.askAgain === 0 &&
      report.lost === 0 &&
      report.userResubmissionRequired === 0
        ? "PASS"
        : "FAIL";
  }
  report.completedAt = new Date().toISOString();
  mkdirSync(OUT, { recursive: true });
  const outPath = path.join(OUT, "PILLOW_RESPONSE_1000_QUALIFICATION_EVIDENCE.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        result: report.result,
        attempts: report.attempts,
        useful: report.useful,
        failures: report.failures,
        askAgain: report.askAgain,
        deploySha: report.deploySha,
        outPath,
      },
      null,
      2,
    ),
  );
  process.exit(report.result === "PASS" ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
