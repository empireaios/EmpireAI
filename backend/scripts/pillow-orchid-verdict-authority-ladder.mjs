/**
 * Orchid-class verdict authority — production first-visible ladder.
 * New scenarios only. No sealed exams. No Wave certification.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const EMAIL =
  process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL || "founder@empireai.com";
const PASSWORD =
  process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD || "EmpireAI2026!";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");
const EVIDENCE = path.join(OUT, "ORCHID_VERDICT_AUTHORITY_PRODUCTION_LADDER.json");

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

async function chat(cookie, sessionId, message) {
  const t0 = Date.now();
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ sessionId, message }),
    signal: AbortSignal.timeout(300_000),
  });
  const body = await r.json().catch(() => ({}));
  return {
    status: r.status,
    text: String(body.result?.message ?? body.message ?? "").trim(),
    kind: body.result?.kind ?? null,
    ms: Date.now() - t0,
  };
}

function explicitClaimVerdict(visible, index) {
  const claimHdr = new RegExp(
    `Claim\\s*${index}\\b[\\s\\S]{0,500}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven)`,
    "i",
  );
  return claimHdr.exec(visible)?.[1] || null;
}

function competingSupported(visible) {
  const body = String(visible || "").replace(
    /(?:^|\n)(?:#{1,3}\s*)?Claim\s*\d+\b[\s\S]*?(?=(?:\n(?:#{1,3}\s*)?Claim\s*\d+\b)|$)/gi,
    "\n",
  );
  return /\*\*Verdict:\*\*\s*(?:\*\*)?Supported\b/i.test(body);
}

const TRIALS = [
  {
    id: "OVA_ops_reassign",
    message: [
      "SyntheticOVA-01 — industrial staffing analysis only. Do not mention Mini Fan or Birth.",
      "Earlier today Cedar had a staffing shortage. That shortage caused a job to be reassigned from Cedar to Inlet.",
      "Inlet's capacity was then committed to the reassigned work. Inlet's current capacity shortage resulted from that committed capacity.",
      "Inlet never had an operator shortage.",
      "Answer with conclusions first. Then assess this claim:",
      "Inlet's current capacity shortage is unrelated to Cedar because Inlet never had an operator shortage.",
    ].join("\n"),
    expect: "Contradicted",
  },
  {
    id: "OVA_hospitality",
    message: [
      "SyntheticOVA-02 — hospitality desk only. Do not mention Mini Fan or Birth.",
      "Lodge had an earlier staffing shortage. Operations reassigned the booking load from Lodge to Harbor.",
      "Harbor's current capacity shortage resulted from that reassignment. Harbor never had a staffing shortage.",
      "Separate verdict on: Harbor's current capacity shortage is unrelated to Lodge because Harbor never had a staffing shortage.",
    ].join("\n"),
    expect: "Contradicted",
  },
  {
    id: "OVA_logistics",
    message: [
      "SyntheticOVA-03 — logistics brief only. Do not mention Mini Fan or Birth.",
      "Depot had an earlier operator shortage. The shortage caused work to be reassigned to Quay.",
      "Quay's current capacity shortage resulted from that committed load. Quay never had an operator shortage.",
      "Judge: Quay's current capacity shortage is unrelated to Depot because Quay never had an operator shortage.",
    ].join("\n"),
    expect: "Contradicted",
  },
  {
    id: "OVA_entity",
    message: [
      "SyntheticOVA-04 — registry analysis only. Do not mention Mini Fan or Birth.",
      "Verified asset registry: ZX-11 = North Pier Module. ZX-22 = Partner Assembly. Distinct.",
      'Separate verdict on: "ZX-11 is Partner Assembly."',
    ].join("\n"),
    expect: "Contradicted",
  },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const health = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(30_000) }).then(
    (r) => r.json(),
  );
  const liveSha = String(health.deploy?.gitCommitSha || "");
  const deploymentId = String(health.deploy?.deploymentId || "");

  const login = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(60_000),
  });
  const cookie = extractCookie(login);
  if (!cookie) {
    console.error("LOGIN_FAILED", login.status);
    process.exit(1);
  }

  const results = [];
  let pass = 0;
  let wrongSupported = 0;
  let leftoverSupported = 0;
  for (const t of TRIALS) {
    const sessionId = `ova-${t.id}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const r = await chat(cookie, sessionId, t.message);
    const got = explicitClaimVerdict(r.text, 1);
    const leftover = competingSupported(r.text);
    const reasons = [];
    if (!(r.status >= 200 && r.status < 300)) reasons.push(`http_${r.status}`);
    if (r.kind === "terminal_infrastructure") reasons.push("terminal");
    if (!got) reasons.push("VERDICT_MISSING");
    else if (got.toLowerCase() !== t.expect.toLowerCase()) {
      reasons.push(`got_${got}_want_${t.expect}`);
    }
    if (leftover) {
      leftoverSupported += 1;
      reasons.push("LEFTOVER_SUPPORTED");
    }
    if (got?.toLowerCase() === "supported" && t.expect.toLowerCase() !== "supported") {
      wrongSupported += 1;
    }
    const ok = reasons.length === 0;
    if (ok) pass += 1;
    results.push({
      id: t.id,
      ok,
      reasons,
      got,
      expect: t.expect,
      leftover,
      ms: r.ms,
      preview: r.text.slice(0, 900),
    });
    console.log(JSON.stringify({ id: t.id, ok, got, leftover, reasons }));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    liveSha,
    deploymentId,
    trials: results.length,
    pass,
    passRate: `${pass}/${results.length}`,
    wrongSupportedVerdicts: wrongSupported,
    leftoverSupported,
    results,
    wave1: "UNCERTIFIED",
    birthAuthorised: "NO",
  };
  writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
  console.log("WROTE", EVIDENCE);
  console.log(
    JSON.stringify({
      PRODUCTION_FIRST_VISIBLE_VALIDATION: pass === results.length ? "PASS" : "FAIL",
      WRONG_SUPPORTED_VERDICTS: wrongSupported,
      LEFTOVER_SUPPORTED: leftoverSupported,
      FINAL_UNCHANGED_LIVE_SHA: liveSha || null,
      DEPLOYMENT_ID: deploymentId,
    }),
  );
  process.exit(pass === results.length && wrongSupported === 0 && leftoverSupported === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
