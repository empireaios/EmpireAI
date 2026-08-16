/**
 * Round C — live synthetic semantic-completion cert (NOT Wave 1 hidden exam).
 * Uses NEW synthetic prompts only. Does not rerun 1000-response availability qual.
 *
 * Env: EMPIRE_COCKPIT_URL, EMPIRE_LOGIN_EMAIL / EMPIRE_LOGIN_PASSWORD
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const EMAIL =
  process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL || "founder@empireai.com";
const PASSWORD =
  process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD || "EmpireAI2026!";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

const ASK_AGAIN =
  /\b(please ask again|ask again in a moment|realigning executive intelligence)\b/i;
const SAFE_COLLAPSE =
  /^EmpireAI is live and answering you in production right now\.\s*We're focused on .+\.\s*We haven't made our first sale yet\./i;

const CASES = [
  {
    id: "operating_briefing",
    prompt:
      "Synthetic RoundC briefing: Give a short operating briefing from verified state only — product focus, realised commerce, birth posture.",
    expect: /\b(live|orders|birth|product|focus|zero|0)\b/i,
  },
  {
    id: "premise_audit",
    prompt: [
      "Synthetic RoundC premise audit — evaluate each premise:",
      "1) We already have realised revenue this month.",
      "2) Our bound product identity is established in commissioning state.",
      "3) An external demand dashboard has confirmed corridor strength.",
    ].join("\n"),
    expect: /\b(premise|assumption|supported|unestablished|orders|zero|not treat|contradict)\b/i,
  },
  {
    id: "temporal_reconciliation",
    prompt:
      "Synthetic RoundC temporal: Reconcile historical waiting-to-go-live notes with current live answering evidence and a future hypothetical first-sale state. How do conclusions change?",
    expect: /\b(histor|current|future|supersed|live|reconcil)\b/i,
  },
  {
    id: "mixed_recommendation",
    prompt:
      "Synthetic RoundC: Given verified zero realised sales and unknown demand strength, recommend a bounded next verification — do not invent demand proof.",
    expect: /\b(recommend|bounded|verify|verification-first|should)\b/i,
  },
  {
    id: "ten_part",
    prompt: [
      "Synthetic RoundC 10-part:",
      ...Array.from({ length: 10 }, (_, i) => `${i + 1}) Brief verified note on theme ${i + 1}.`),
    ].join("\n"),
    expect: /\b(1\)|theme|orders|focus|verified)\b/i,
  },
  {
    id: "unsupported_subsection",
    prompt: [
      "Synthetic RoundC mixed:",
      "1) Realised order count?",
      "2) Confirm inbox sentiment from an unread supplier mailbox this week.",
      "3) Is Birth authorised?",
      "4) Recommend one next check.",
    ].join("\n"),
    expect: /\b(orders|birth|recommend|inbox|not|unverified|open|retrieved)\b/i,
  },
];

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

async function main() {
  const report = {
    artifact: "PILLOW_SEMANTIC_TASK_COMPLETION_ROUND_C",
    startedAt: new Date().toISOString(),
    cases: [],
    askAgain: 0,
    safeCollapse: 0,
    failures: 0,
    result: "IN_PROGRESS",
    birthAuthorised: false,
    birthTimestamp: null,
    sealedExamEncoded: false,
    deploySha: null,
  };

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

  let sessionId = null;
  for (let i = 0; i < 8; i++) {
    const sess = await fetch(`${COCKPIT}/api/pillow/session`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(90_000),
    });
    const sj = await sess.json().catch(() => ({}));
    sessionId = sj.session?.sessionId ?? null;
    if (sess.ok && sessionId) break;
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  if (!sessionId) {
    console.error(JSON.stringify({ pass: false, reason: "session" }));
    process.exit(2);
  }

  try {
    const live = await fetch(
      (process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app") +
        "/health/live",
      { signal: AbortSignal.timeout(20_000) },
    );
    const lj = await live.json();
    report.deploySha = lj.deploy?.gitCommitSha ?? null;
  } catch {
    /* non-blocking */
  }

  for (const c of CASES) {
    const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ sessionId, message: c.prompt }),
      signal: AbortSignal.timeout(120_000),
    });
    const body = await r.json().catch(() => ({}));
    if (body.reboundSessionId) sessionId = body.reboundSessionId;
    const text = String(body.result?.message ?? body.message ?? "").trim();
    const askAgain = ASK_AGAIN.test(text);
    const safeCollapse = SAFE_COLLAPSE.test(text);
    const expectOk = c.expect.test(text);
    const ok = r.ok && text.length >= 40 && !askAgain && !safeCollapse && expectOk;
    if (askAgain) report.askAgain += 1;
    if (safeCollapse) report.safeCollapse += 1;
    if (!ok) report.failures += 1;
    report.cases.push({
      id: c.id,
      ok,
      status: r.status,
      askAgain,
      safeCollapse,
      expectOk,
      preview: text.slice(0, 220),
    });
  }

  report.completedAt = new Date().toISOString();
  report.result =
    report.failures === 0 && report.askAgain === 0 && report.safeCollapse === 0
      ? "PASS"
      : "FAIL";
  mkdirSync(OUT, { recursive: true });
  const outPath = path.join(OUT, "PILLOW_SEMANTIC_TASK_COMPLETION_ROUND_C.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ result: report.result, failures: report.failures, outPath, deploySha: report.deploySha }, null, 2));
  process.exit(report.result === "PASS" ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
