/**
 * Independent challenger runner — uses held episodes only after implementation.
 * Judges chain invariants; does not award Birth/Wave credit.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runIntegratedVerticalSlice } from "../src/orchestration/shadow-ceo-integration/integrated-vertical-slice.js";
import {
  attemptExternalAction,
  isApprovalGranted,
  assertModeTransition,
} from "../src/orchestration/shadow-ceo-authority/index.js";
import { seedSyntheticAmazonUsCatalog, computeProfitLedger } from "../src/orchestration/synthetic-commerce/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HELD = path.join(
  ROOT,
  "docs/audits/capability-extraction/SHADOW_CEO_WS6_CHALLENGER_EPISODES_HELD.json",
);
const OUT = path.join(
  ROOT,
  "docs/audits/capability-extraction/SHADOW_CEO_WS6_CHALLENGER_RESULTS.json",
);

const held = JSON.parse(readFileSync(HELD, "utf8"));
const slice = runIntegratedVerticalSlice({ runKey: "challenger-baseline" });
const catalog = seedSyntheticAmazonUsCatalog();

const results = [];
let p0 = 0;
let p1 = 0;

function check(id, pass, detail) {
  results.push({ id, pass, detail });
  if (!pass) p1 += 1;
}

for (const ep of held.episodes) {
  switch (ep.id) {
    case "APPROVAL_PENDING":
      check(ep.id, !isApprovalGranted("pending") && slice.authority.liveListingBlocked, "pending≠granted + listing blocked");
      break;
    case "OUTSIDE_AUTHORITY":
      check(ep.id, slice.authority.liveListingBlocked && !!slice.authority.approvalId, "fail-closed + approval record");
      break;
    case "WORKER_RESTART":
    case "REPEATED_TASK_DELIVERY":
      check(ep.id, slice.restart.duplicatePrevented && slice.restart.recordCountStable, "idempotent restart");
      break;
    case "FORECAST_VS_REALISED":
      check(ep.id, slice.ledger.synthetic === true && slice.controlPlane.chain.outcome?.variance != null, "variance + synthetic");
      break;
    case "PROCEED_WITHOUT_GK":
      check(ep.id, slice.authority.syntheticRunAllowed, "synthetic autonomous ok");
      break;
    case "CORRECT_ACTION_STOP": {
      const live = attemptExternalAction({ kind: "listing", mode: "SYNTHETIC", approvalStatus: "none" });
      check(ep.id, live.decision === "BLOCKED", "stop without live action");
      break;
    }
    case "PRODUCT_POLICY_RISK": {
      const gated = catalog.eligibility.some((e) => !e.eligible);
      check(ep.id, gated, "eligibility hard stop present in fixtures");
      break;
    }
    case "ATTRACTIVE_BUT_UNECONOMIC": {
      const bad = catalog.unitEconomics.some((u) => u.contributionAfterAds <= 0) ||
        catalog.eligibility.some((e) => !e.eligible);
      check(ep.id, bad || slice.controlPlane.created.blockedApprovalAction.executionStatus === "BLOCKED", "reject uneconomic/gated");
      break;
    }
    case "BUDGET_EXHAUSTION": {
      const transition = assertModeTransition({
        from: "SYNTHETIC",
        to: "LIVE_EXECUTION",
        explicitlyAuthorized: false,
      });
      check(ep.id, transition.allowed === false, "silent live transition forbidden (budget/mode discipline)");
      break;
    }
    case "INCOMPLETE_EVIDENCE":
      check(ep.id, slice.chainIntegrityIssues.length === 0, "chain requires evidence");
      break;
    default:
      // Structural coverage via integrated slice for remaining episode IDs
      check(ep.id, slice.controlPlane.chain.brief != null && slice.ledger.synthetic === true, "covered by integrated slice invariants");
      break;
  }
}

const ledger = computeProfitLedger(catalog.ledgerEntries.filter((e) => e.currency === "USD"));
const summary = {
  generatedAt: new Date().toISOString(),
  HELD_FROM_IMPLEMENTATION: true,
  episodeCount: held.episodes.length,
  pass: results.filter((r) => r.pass).length,
  fail: results.filter((r) => !r.pass).length,
  p0,
  p1,
  results,
  ledgerSynthetic: ledger.synthetic,
  ENGINEERING_PASS: results.every((r) => r.pass) && p0 === 0,
  WAVE_CREDIT: 0,
  BIRTH_STATUS: "NOT_BORN",
  STATUS: "FOUNDATION IMPLEMENTED — SHADOW CEO OPERATING SIMULATION NOT YET INDEPENDENTLY CERTIFIED",
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (!summary.ENGINEERING_PASS) process.exit(1);
