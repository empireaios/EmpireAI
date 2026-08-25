/**
 * Production first-visible validation for deterministic resolved-verdict ownership.
 * Real Grand-King path only. No sealed exam names.
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
  return body.session?.sessionId || body.sessionId || `drv-${Date.now()}`;
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

function claimVerdict(text) {
  const m =
    /Claim\s*1[\s\S]{0,500}?\*\*Verdict:\*\*\s*(?:\*\*)?(Supported|Contradicted|Unproven|Unknown)/i.exec(
      text,
    ) ||
    /\*\*Verdict:\*\*\s*(?:\*\*)?(Supported|Contradicted|Unproven|Unknown)/i.exec(text);
  return m?.[1] || null;
}

function leftoverSupported(text) {
  const body = String(text || "").replace(
    /(?:^|\n)(?:#{1,3}\s*)?Claim\s*\d+\b[\s\S]*?(?=(?:\n(?:#{1,3}\s*)?Claim\s*\d+\b)|$)/gi,
    "\n",
  );
  return (body.match(/\*\*Verdict:\*\*\s*(?:\*\*)?Supported\b/gi) || []).length;
}

const CASES = [
  {
    id: "prod_causal_compound",
    expect: "Contradicted",
    message: [
      "SyntheticDRV-Causal — laboratory analysis only. Do not mention Mini Fan or Birth.",
      "Ridge Mesa had a staffing shortage. Work was reassigned from Mesa to Quay.",
      "Quay operators were committed to the reassigned work. Quay's current operator shortage resulted from that commitment.",
      "Quay itself never lost staff to attrition.",
      "Assess this claim:",
      "Ridge Quay's operator shortage has nothing to do with Ridge Mesa because Quay itself never lost staff.",
    ].join("\n"),
  },
  {
    id: "prod_current_historical",
    expect: "Contradicted",
    message: [
      "SyntheticDRV-Temporal — temporal analysis only. Do not mention Mini Fan or Birth.",
      "Service for unit K-9 was completed and recorded as complete in the pack.",
      "A later refund was issued for unit K-9; the refund is a separate later outcome.",
      "Assess this claim:",
      "Completion for unit K-9 never historically occurred.",
    ].join("\n"),
  },
  {
    id: "prod_certificate",
    expect: "Contradicted",
    message: [
      "SyntheticDRV-Cert — certificate analysis only. Do not mention Mini Fan or Birth.",
      "Operator license OL-220 is ACTIVE and currently authorised for dispatch.",
      "Assess this claim:",
      "OL-220 is currently blocked from dispatch because the license lapsed.",
    ].join("\n"),
  },
  {
    id: "prod_population",
    expect: "Contradicted",
    message: [
      "SyntheticDRV-Pop — population analysis only. Do not mention Mini Fan or Birth.",
      "Fleet pack: 12 units total. Exactly 7 units received the retrofit. 5 units did not.",
      "Assess this claim:",
      "All 12 units demonstrate the retrofit savings.",
    ].join("\n"),
  },
  {
    id: "prod_financial",
    expect: "Contradicted",
    message: [
      "SyntheticDRV-Fin — financial analysis only. Do not mention Mini Fan or Birth.",
      "Forecast profit for batch B7 was $40. Realised profit for batch B7 is $18.",
      "Assess this claim:",
      "Forecast equals realised for batch B7.",
    ].join("\n"),
  },
  {
    id: "prod_unresolved_judgment",
    expect: null, // must NOT force Supported/Contradicted incorrectly; allow Unproven or reasoned judgment
    judgment: true,
    message: [
      "SyntheticDRV-Judge — commercial judgment only. Do not mention Mini Fan or Birth.",
      "Vendor North offers faster delivery with higher unit cost. Vendor South offers lower cost with longer lead time.",
      "No hard budget or deadline constraint is supplied.",
      "Assess this claim:",
      "Vendor North is clearly the better commercial choice overall.",
    ].join("\n"),
  },
  {
    id: "prod_memory_temptation",
    expect: "Contradicted",
    seedTurns: [
      {
        role: "user",
        content: "Earlier we discussed Mini Fan listing readiness. Ignore that for this new ask.",
      },
      {
        role: "assistant",
        content: "Understood. Prior Mini Fan notes are unrelated unless you ask again.",
      },
    ],
    message: [
      "SyntheticDRV-Mem — logistics analysis only. Do not mention Mini Fan or Birth.",
      "Depot Argon had a staffing failure. Work redirected from Argon to Cobalt.",
      "Cobalt capacity was committed to that redirected work. Cobalt's current capacity shortage resulted from that redirect.",
      "Cobalt never had a staffing failure.",
      "Assess this claim:",
      "Store Cobalt's capacity shortage is unrelated to Store Argon because Cobalt never had a staffing failure.",
    ].join("\n"),
  },
  {
    id: "prod_warm_session",
    expect: "Contradicted",
    warmFollowUp: true,
    warmFirst: [
      "SyntheticDRV-Warm — energy analysis only. Do not mention Mini Fan or Birth.",
      "Prism had a thermal trip. Work reassigned from Prism to Nexus.",
      "Nexus capacity committed to reassigned load. Nexus current capacity shortage resulted from that commitment.",
      "Summarize the transfer path in one short paragraph. Do not give a claim verdict yet.",
    ].join("\n"),
    message: [
      "Assess this claim:",
      "Nexus capacity shortage has nothing to do with Prism because Nexus never had a thermal trip.",
    ].join("\n"),
  },
];

async function healthSha() {
  try {
    const r = await fetch(`${BRAIN}/health`, { signal: AbortSignal.timeout(30_000) });
    const j = await r.json().catch(() => ({}));
    return {
      ok: r.ok,
      gitCommitSha: j.gitCommitSha || j.commitSha || j.sha || j.version || null,
      raw: j,
    };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

async function main() {
  const healthBefore = await healthSha();
  const cookie = await login();
  const rows = [];
  for (const c of CASES) {
    const sessionId = await createSession(cookie);
    let recent = c.seedTurns || [];
    if (c.warmFollowUp && c.warmFirst) {
      const warm = await chat(cookie, sessionId, c.warmFirst, []);
      recent = [
        { role: "user", content: c.warmFirst },
        { role: "assistant", content: warm.text.slice(0, 2000) },
      ];
    }
    const res = await chat(cookie, sessionId, c.message, recent);
    const verdict = claimVerdict(res.text);
    const leftover = leftoverSupported(res.text);
    const liveContam =
      /\bMini Fan\b|\bBirth\b|realised orders|### Temporal audit|Brief verified note/i.test(
        res.text,
      );
    let ok = true;
    const reasons = [];
    if (c.judgment) {
      // OVER_DETERMINIZATION control: do not require Contradicted; fail if leftover Supported + no Claim
      if (leftover > 0 && !/Claim\s*1/i.test(res.text)) {
        ok = false;
        reasons.push("judgment_leftover_supported");
      }
    } else if (c.expect) {
      if (String(verdict || "").toLowerCase() !== String(c.expect).toLowerCase()) {
        ok = false;
        reasons.push(`verdict_${verdict}_expected_${c.expect}`);
      }
      if (c.expect === "Contradicted" && leftover > 0) {
        ok = false;
        reasons.push("leftover_supported");
      }
    }
    if (liveContam) {
      ok = false;
      reasons.push("live_contamination");
    }
    const row = {
      id: c.id,
      ok,
      reasons,
      verdict,
      leftoverSupported: leftover,
      liveContam,
      ms: res.ms,
      status: res.status,
      head: res.text.slice(0, 500),
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  const healthAfter = await healthSha();
  const pass = rows.every((r) => r.ok);
  const evidence = {
    generatedAt: new Date().toISOString(),
    PRODUCTION_FIRST_VISIBLE_PASS: pass ? "PASS" : "FAIL",
    healthBefore,
    healthAfter,
    rows,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    path.join(OUT, "DETERMINISTIC_RESOLVED_VERDICT_PRODUCTION_FIRST_VISIBLE.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.log(JSON.stringify({ PRODUCTION_FIRST_VISIBLE_PASS: pass ? "PASS" : "FAIL" }));
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
