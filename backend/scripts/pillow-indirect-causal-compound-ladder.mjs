/**
 * Indirect causal compound — production-equivalent first-visible ladder.
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
const EVIDENCE = path.join(OUT, "INDIRECT_CAUSAL_COMPOUND_PRODUCTION_LADDER.json");
const EXPECT_SHA = process.env.EXPECT_SHA || "";

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
  const numbered = new RegExp(
    `(?:^|\\n)\\s*${index}\\.\\s*[\\s\\S]{0,400}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven)`,
    "im",
  );
  return claimHdr.exec(visible)?.[1] || numbered.exec(visible)?.[1] || null;
}

const TRIALS = [
  {
    id: "ICC_ops_independent",
    message: [
      "SyntheticICC-01 — industrial analysis only. Do not mention Mini Fan or Birth.",
      "Cedar had a sealant failure at 09:10. That failure caused operations to shift workload onto Inlet.",
      "Inlet's current capacity constraint resulted from that workload transfer.",
      "Inlet does not share Cedar's direct mechanism.",
      "Answer with conclusions first, then assess this claim:",
      "Inlet is causally independent of Cedar because Inlet has a different direct cause.",
    ].join("\n"),
    expectVerdict: "Contradicted",
    claimIndex: 1,
  },
  {
    id: "ICC_logistics_share_mech",
    message: [
      "SyntheticICC-02 — logistics desk only. Do not mention Mini Fan or Birth.",
      "Orbit stockout at Depot triggered a failover to Quay.",
      "The failover then caused overload on Quay.",
      "Quay lacks Orbit's direct mechanism.",
      "Separate verdict on: Quay is unrelated to Orbit because Quay did not share Orbit's direct mechanism.",
    ].join("\n"),
    expectVerdict: "Contradicted",
    claimIndex: 1,
  },
  {
    id: "ICC_energy_lacks",
    message: [
      "SyntheticICC-03 — energy brief only. Do not mention Mini Fan or Birth.",
      "Pylon transformer trip led to a mitigation handoff to Basin.",
      "Workload was transferred from Pylon to Basin.",
      "Basin's current overload problem resulted from that transfer.",
      "Judge: Basin is unrelated to Pylon because Basin lacks Pylon's direct mechanism.",
    ].join("\n"),
    expectVerdict: "Contradicted",
    claimIndex: 1,
  },
  {
    id: "ICC_true_premise_false_conclusion",
    message: [
      "SyntheticICC-04 — ops analysis only. Do not mention Mini Fan or Birth.",
      "Inventory was redirected from Mesa to Cove after Mesa's earlier failure.",
      "Cove's current capacity problem resulted from that redirected inventory.",
      "Mesa and Cove have different direct causes.",
      'Separate verdict on: "Mesa and Cove have different direct causes, therefore they are unrelated."',
    ].join("\n"),
    expectVerdict: "Contradicted",
    claimIndex: 1,
  },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const health = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(30_000) }).then(
    (r) => r.json(),
  );
  const liveSha = String(health.deploy?.gitCommitSha || "");
  if (EXPECT_SHA && !liveSha.startsWith(EXPECT_SHA.slice(0, 8))) {
    console.error("SHA_MISMATCH", { liveSha, EXPECT_SHA });
    process.exit(2);
  }

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
  for (const t of TRIALS) {
    const sessionId = `icc-${t.id}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const r = await chat(cookie, sessionId, t.message);
    const got = explicitClaimVerdict(r.text, t.claimIndex);
    const reasons = [];
    if (!(r.status >= 200 && r.status < 300)) reasons.push(`http_${r.status}`);
    if (r.kind === "terminal_infrastructure") reasons.push("terminal");
    if (!got) reasons.push("VERDICT_MISSING");
    else if (got.toLowerCase() !== t.expectVerdict.toLowerCase()) {
      reasons.push(`got_${got}_want_${t.expectVerdict}`);
    }
    if (got?.toLowerCase() === "supported" && t.expectVerdict.toLowerCase() !== "supported") {
      wrongSupported += 1;
    }
    const ok = reasons.length === 0;
    if (ok) pass += 1;
    results.push({
      id: t.id,
      ok,
      reasons,
      got,
      expect: t.expectVerdict,
      ms: r.ms,
      preview: r.text.slice(0, 900),
    });
    console.log(JSON.stringify({ id: t.id, ok, got, reasons }));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    liveSha,
    expectSha: EXPECT_SHA || null,
    trials: results.length,
    pass,
    passRate: `${pass}/${results.length}`,
    wrongSupportedVerdicts: wrongSupported,
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
      FINAL_UNCHANGED_LIVE_SHA: liveSha,
    }),
  );
  process.exit(pass === results.length && wrongSupported === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
