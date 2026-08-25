/**
 * Differential repro — path parity catastrophic class (no sealed Meridian content).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  detectReasoningScope,
  hasSyntheticAnalysisMarker,
  isScopedAwayFromLiveEmpire,
} from "../src/orchestration/pillow-host/executive-scoped-reasoning.ts";
import { synthesizeTaskUnitAnswer } from "../src/orchestration/pillow-host/executive-task-contract.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

function truth() {
  return {
    product: {
      name: "Mini Fan",
      firstSale: false,
      realisedOrders: 0,
      publishedListings: 1,
      expectedProfitDisplay: "$2.00",
      expectedProfitTruthClass: "ESTIMATED",
      realisedTruthClass: "CURRENT_VERIFIED",
    },
    financial: { realisedOrders: 0, realisedRevenue: 0, realisedTruthClass: "CURRENT_VERIFIED" },
    birth: {
      status: "TECHNICALLY_READY_AWAITING_GRAND_KING",
      technicallyReady: true,
      birthTimestamp: null,
      gatesPassedCount: 12,
      gatesTotal: 12,
      truthClass: "CURRENT_VERIFIED",
    },
    deploy: {
      gitCommitSha: "deadbeef",
      serviceOnlineHint: "assume_online_if_answering",
      truthClass: "CURRENT_VERIFIED",
    },
    authority: {
      pillowMayPublish: false,
      pillowMaySupplierSpend: false,
      pillowMayAuthoriseBirth: false,
      pillowMayExecuteProductionDeploy: false,
      chatHasToolCallingLoop: false,
      executableNow: ["Answer questions"],
      requiresGrandKing: ["Authorise Birth"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
    notes: [],
  };
}

const CASES = [
  {
    id: "cert_style_synthetic_prefix",
    message: [
      "SyntheticParity-01 — logistics analysis only. Do not mention Mini Fan or Birth.",
      "Depot North had a routing failure. Work redirected to Depot South.",
      "Explain the causal chain and current eligibility of Depot South.",
    ].join("\n"),
  },
  {
    id: "real_style_no_synthetic_word",
    message: [
      "Operational scenario for plant MeridianLine (not a sealed exam).",
      "Unit A failed seal. Work moved to Unit B. Unit B has technician shortage.",
      "Explain causal connection and next verification. Keep answer on this scenario.",
    ].join("\n"),
  },
  {
    id: "isolation_cue_do_not_mention",
    message: [
      "Hospitality ops pack. Do not mention Mini Fan or Birth.",
      "Lodge Cedar staffing cleared. Harbor bed shortage after redirect from Cedar.",
      "Assess whether Harbor shortage is unrelated to Cedar.",
    ].join("\n"),
  },
  {
    id: "analysis_only_no_synthetic",
    message: [
      "Energy grid analysis only.",
      "Node Prism thermal trip → load to Nexus → Nexus capacity shortage.",
      "Give conclusions and causal chain.",
    ].join("\n"),
  },
];

const LIVE = /\bMini Fan\b|\bBirth\b|realised orders|Realised orders|### Temporal audit/i;

const rows = [];
for (const c of CASES) {
  const scope = detectReasoningScope(c.message);
  const marker = hasSyntheticAnalysisMarker(c.message);
  const scoped = isScopedAwayFromLiveEmpire(scope);
  const synth = synthesizeTaskUnitAnswer(
    {
      id: "t1",
      kind: "general",
      text: c.message.slice(0, 120),
      subject: "scenario",
      sourceSpan: c.message.slice(0, 80),
      required: true,
    },
    truth(),
    { scopeType: scope },
  );
  const contaminated = LIVE.test(synth);
  rows.push({
    id: c.id,
    scope,
    marker,
    scoped,
    contaminated,
    preview: synth.slice(0, 220),
  });
  console.log(JSON.stringify({ id: c.id, scope, marker, scoped, contaminated }));
}

mkdirSync(OUT, { recursive: true });
writeFileSync(
  path.join(OUT, "PATH_PARITY_CATASTROPHIC_CLASS_REPRO.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      hypothesis:
        "Unscoped scenario asks synthesize live Mini Fan + temporal templates; cert packs use Synthetic* markers.",
      rows,
      contaminatedCount: rows.filter((r) => r.contaminated).length,
    },
    null,
    2,
  ),
);
console.log("WROTE PATH_PARITY_CATASTROPHIC_CLASS_REPRO.json");
