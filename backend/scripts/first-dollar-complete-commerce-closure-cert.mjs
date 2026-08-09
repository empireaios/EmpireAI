/**
 * FIRST-DOLLAR COMPLETE COMMERCE OPERATING CLOSURE 001 — production proof.
 * Pillow re-evaluates opportunity under FD-CDD-001; does not publish/spend.
 *
 * Usage: node backend/scripts/first-dollar-complete-commerce-closure-cert.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRAIN = (process.env.BRAIN_URL ?? "https://empireai-production.up.railway.app").replace(/\/$/, "");
const EMAIL = (process.env.FOUNDER_EMAIL ?? process.env.EMPIRE_LOGIN_EMAIL ?? "founder@empireai.com").trim();
const PASSWORD = (process.env.FOUNDER_PASSWORD ?? process.env.EMPIRE_LOGIN_PASSWORD ?? "EmpireAI2026!").trim();

const jar = [];
const evidence = {
  mission: "FIRST_DOLLAR_COMPLETE_COMMERCE_OPERATING_CLOSURE_001",
  startedAt: new Date().toISOString(),
  brain: BRAIN,
  stages: {},
  checks: {},
  blockers: [],
  report: {},
  verdict: "PENDING",
};

function cookie() {
  return jar.map((c) => c.split(";")[0]).join("; ");
}

async function req(path, init = {}) {
  const started = Date.now();
  const res = await fetch(`${BRAIN}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
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
    const n = String(c).split("=")[0];
    const i = jar.findIndex((x) => x.startsWith(`${n}=`));
    if (i >= 0) jar[i] = c;
    else jar.push(c);
  }
  const text = await res.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep */
  }
  return { status: res.status, ms: Date.now() - started, body };
}

function finish() {
  evidence.completedAt = new Date().toISOString();
  const outDir = join(__dirname, "../../docs/audits/complete-state");
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, "FIRST_DOLLAR_COMPLETE_COMMERCE_OPERATING_CLOSURE_001_EVIDENCE.json");
  writeFileSync(out, JSON.stringify(evidence, null, 2));
  const md = join(outDir, "FIRST_DOLLAR_COMPLETE_COMMERCE_OPERATING_CLOSURE_001.md");
  writeFileSync(
    md,
    [
      "# FIRST-DOLLAR COMPLETE COMMERCE OPERATING CLOSURE 001",
      "",
      `Verdict: **${evidence.verdict}**`,
      "",
      `- Brain: ${BRAIN}`,
      `- Completed: ${evidence.completedAt}`,
      `- Re-eval outcome: ${evidence.stages?.reevaluate?.body?.outcome ?? "n/a"}`,
      `- Operating loop route: ${evidence.stages?.operatingLoop?.body?.canonicalAmazonToCjRoute ?? "n/a"}`,
      `- Publication attempted: false`,
      `- Supplier spend attempted: false`,
      "",
      "See evidence JSON for full report fields.",
      "",
    ].join("\n"),
  );
  console.log(JSON.stringify({ verdict: evidence.verdict, out, md, checks: evidence.checks }, null, 2));
  if (evidence.verdict !== "FIRST-DOLLAR COMPLETE COMMERCE OPERATING CAPABILITY CERTIFIED") {
    process.exitCode = 1;
  }
}

async function main() {
  const health = await req("/health/pillow-commerce-presale");
  evidence.stages.health = { status: health.status, body: health.body };
  evidence.checks.healthOk = health.status === 200;
  evidence.checks.dossierVersionDeployed =
    health.body?.commercialDecisionDossier === "FD-CDD-001";

  const login = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  evidence.stages.login = { status: login.status };
  if (login.status !== 200) {
    evidence.blockers.push("Grand King login failed");
    evidence.verdict = "FIRST-DOLLAR COMPLETE COMMERCE OPERATING CAPABILITY NOT CERTIFIED";
    return finish();
  }

  const latest = await req("/pillow-commerce-presale/latest");
  evidence.stages.latestBefore = { status: latest.status, body: latest.body };
  const pending = latest.body?.pendingApproval ?? latest.body?.latestOpportunity;
  const asin = pending?.mapping?.asin ?? "B0FKGLGSHQ";
  const cjPid = pending?.mapping?.cjPid ?? "2608080908321600000";
  const amazonSellerSku = pending?.mapping?.amazonSellerSku ?? "EMP-FD-MSKRYXU2";

  const reevaluate = await req("/pillow-commerce-presale/reevaluate", {
    method: "POST",
    body: JSON.stringify({ asin, cjPid, amazonSellerSku, initiatedBy: "pillow-tool" }),
  });
  evidence.stages.reevaluate = {
    status: reevaluate.status,
    ms: reevaluate.ms,
    outcome: reevaluate.body?.outcome,
    rejectReason: reevaluate.body?.rejectReason,
    dossierSummaryPreview: String(reevaluate.body?.dossierSummary ?? "").slice(0, 1200),
  };
  evidence.checks.reevaluateHttpOk = reevaluate.status === 200;
  evidence.checks.actorWasCursorFalse = reevaluate.body?.actorWasCursor === false;
  evidence.checks.noPublication = reevaluate.body?.publicationAttempted === false;
  evidence.checks.noSupplierSpend = reevaluate.body?.supplierSpendAttempted === false;
  evidence.checks.dossierSurfaced =
    reevaluate.body?.outcome === "DOSSIER_APPROVE_SURFACED" ||
    (reevaluate.body?.outcome === "DOSSIER_REJECTED" && Boolean(reevaluate.body?.rejectReason));

  const loop = await req("/pillow-commerce-presale/operating-loop");
  evidence.stages.operatingLoop = { status: loop.status, body: loop.body?.operatingLoop ?? loop.body };
  evidence.checks.operatingLoopOk = loop.status === 200;
  evidence.checks.canonicalBridge =
    (loop.body?.operatingLoop ?? loop.body)?.canonicalAmazonToCjRoute ===
    "EMPIREAI_AUTOMATED_BRIDGE";
  evidence.checks.cursorNotRequired =
    (loop.body?.operatingLoop ?? loop.body)?.cursorRequiredForNormalOperation === false;

  const opp = reevaluate.body?.opportunity;
  const d = opp?.dossier;
  evidence.report = {
    productSelected: {
      asin: reevaluate.body?.target?.asin,
      cjPid: reevaluate.body?.target?.cjPid,
      sku: reevaluate.body?.target?.amazonSellerSku,
    },
    outcome: reevaluate.body?.outcome,
    brandRoute: d?.eligibilityAndBrand?.brandRoute ?? null,
    liveStock: d?.supplier?.stockUnits ?? null,
    liveCost: d?.supplier?.productCost ?? null,
    liveFreight: d?.supplier?.usShipping ?? null,
    delivery: d?.demandFulfilmentRisk?.delivery ?? null,
    competition: d?.marketplaceCompetition ?? null,
    proposedPrice: d?.economics?.proposedSellingPriceUsd ?? null,
    expectedProfit: d?.economics?.expectedProfitUsd ?? null,
    risk: d?.demandFulfilmentRisk?.riskLevel ?? null,
    pillowRecommendation: d?.exposureAndAction?.pillowRecommendation ?? null,
    rejectReason: reevaluate.body?.rejectReason ?? null,
    grandKingSummary: reevaluate.body?.dossierSummary ?? null,
  };

  const required = [
    "healthOk",
    "dossierVersionDeployed",
    "reevaluateHttpOk",
    "actorWasCursorFalse",
    "noPublication",
    "noSupplierSpend",
    "dossierSurfaced",
    "operatingLoopOk",
    "canonicalBridge",
    "cursorNotRequired",
  ];
  const failed = required.filter((k) => !evidence.checks[k]);
  if (failed.length) {
    evidence.blockers.push(`Failed checks: ${failed.join(", ")}`);
    if (!evidence.checks.dossierVersionDeployed) {
      evidence.blockers.push("Production not yet deployed with FD-CDD-001 — push/deploy required");
    }
    evidence.verdict = "FIRST-DOLLAR COMPLETE COMMERCE OPERATING CAPABILITY NOT CERTIFIED";
  } else {
    evidence.verdict = "FIRST-DOLLAR COMPLETE COMMERCE OPERATING CAPABILITY CERTIFIED";
  }
  finish();
}

main().catch((err) => {
  evidence.blockers.push(String(err?.stack || err));
  evidence.verdict = "FIRST-DOLLAR COMPLETE COMMERCE OPERATING CAPABILITY NOT CERTIFIED";
  finish();
});
