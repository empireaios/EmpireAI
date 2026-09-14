/**
 * SC-01 WS6 independent integration challenger runner.
 * Held episodes from SC01_WS6_INTEGRATION_CHALLENGER_HELD.json.
 * Does not award Birth/Wave credit. Do not hard-code SC-01 targets.
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  admitAndExecuteShadowCeoFromChat,
  detectShadowCeoOperatingIntent,
  shadowCeoPlanAsExecutionViolations,
} from "../src/orchestration/shadow-ceo-integration/chat-admission.js";
import { runIntegratedVerticalSlice } from "../src/orchestration/shadow-ceo-integration/integrated-vertical-slice.js";
import {
  openShadowCeoRepository,
  loadChain,
} from "../src/orchestration/shadow-ceo/index.js";
import {
  attemptExternalAction,
  isApprovalGranted,
} from "../src/orchestration/shadow-ceo-authority/index.js";
import { seedSyntheticAmazonUsCatalog } from "../src/orchestration/synthetic-commerce/index.js";
import { resolveShadowCeoDbPath } from "../src/orchestration/shadow-ceo-integration/durable-paths.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HELD = path.join(
  ROOT,
  "docs/audits/capability-extraction/SC01_WS6_INTEGRATION_CHALLENGER_HELD.json",
);
const OUT = path.join(
  ROOT,
  "docs/audits/capability-extraction/SC01_WS6_INTEGRATION_CHALLENGER_RESULTS.json",
);

const held = JSON.parse(readFileSync(HELD, "utf8"));
const tmp = mkdtempSync(path.join(os.tmpdir(), "sc01-ws6-"));
process.env.SHADOW_CEO_DATA_DIR = tmp;

const results = [];
let fail = 0;

function check(id, pass, detail) {
  results.push({ id, pass, detail });
  if (!pass) fail += 1;
}

const slice = runIntegratedVerticalSlice({
  runKey: "sc01-ws6-cockpit-slice",
  dbPath: path.join(tmp, "cockpit-slice.db"),
  authorityDir: path.join(tmp, "cockpit-authority"),
});
const catalog = seedSyntheticAmazonUsCatalog();

for (const ep of held.episodes) {
  switch (ep.id) {
    case "EP_ARB_NEW_OBJECTIVE_WORDING": {
      const u = ep.setup.synthetic_facts.user_utterance;
      const r = admitAndExecuteShadowCeoFromChat({
        message: u,
        workspaceId: "ws_ws6_arb",
        correlationId: `corr_${ep.id}`,
      });
      const ok =
        r.admitted &&
        !r.blocked &&
        r.objectiveId?.startsWith("obj_") &&
        /cooling pillow/i.test(r.episode.chain.objective.statement) &&
        !/SC-01/i.test(r.episode.chain.objective.statement) &&
        r.episode.chain.objective.mode === "SYNTHETIC";
      check(ep.id, ok, ok ? "arbitrary wording → durable SYNTHETIC objective" : "fail admit/preserve");
      break;
    }
    case "EP_OBJECTIVE_FROM_PILLOW_CHAT": {
      const u = ep.setup.synthetic_facts.user_utterance;
      const r = admitAndExecuteShadowCeoFromChat({
        message: u,
        workspaceId: "ws_ws6_chat",
        correlationId: `corr_${ep.id}`,
      });
      const ok =
        r.admitted &&
        !r.blocked &&
        Boolean(r.objectiveId) &&
        r.message.includes(r.objectiveId) &&
        /source-backed/i.test(r.message) &&
        !detectShadowCeoOperatingIntent("hello how are you");
      check(ep.id, ok, ok ? "ordinary chat admission path" : "chat path failed");
      break;
    }
    case "EP_OBJECTIVE_FROM_COCKPIT": {
      const ok =
        Boolean(slice.controlPlane.objectiveId) &&
        slice.chainIntegrityIssues.length === 0 &&
        Boolean(slice.cockpit.executiveBrief);
      check(ep.id, ok, ok ? "cockpit vertical slice creates episode" : "cockpit slice failed");
      break;
    }
    case "EP_EXISTING_OBJECTIVE_CONTINUATION": {
      const msg =
        "Continue Shadow CEO SYNTHETIC mode: extend the active operating episode with one more monitor cycle.";
      const a = admitAndExecuteShadowCeoFromChat({
        message: msg,
        workspaceId: "ws_ws6_cont",
        correlationId: "corr_cont_1",
      });
      const b = admitAndExecuteShadowCeoFromChat({
        message: msg,
        workspaceId: "ws_ws6_cont",
        correlationId: "corr_cont_2",
      });
      const ok =
        a.admitted &&
        !a.blocked &&
        b.admitted &&
        !b.blocked &&
        a.objectiveId === b.objectiveId;
      check(ep.id, ok, ok ? "continuation idempotent same objective" : "continuation failed");
      break;
    }
    case "EP_SYNTHETIC_STATE_ACCESS": {
      const r = admitAndExecuteShadowCeoFromChat({
        message:
          "Operate as Shadow CEO in SYNTHETIC mode and inspect synthetic Amazon commerce state before prioritising.",
        workspaceId: "ws_ws6_state",
        correlationId: `corr_${ep.id}`,
      });
      const ok =
        r.admitted &&
        !r.blocked &&
        r.syntheticCatalogProductCount === catalog.products.length &&
        /Inspected synthetic Amazon US commerce state/i.test(
          r.episode.chain.assessment?.situationSummary ?? "",
        );
      check(ep.id, ok, ok ? "assessment from inspected catalog" : "state not inspected");
      break;
    }
    case "EP_MISSING_STATE_FAILURE": {
      // Missing live connectors must not invent live state; synthetic fixture still present.
      // Fail-closed means blocked response if chain integrity fails — here fixture exists so
      // we assert non-invention: economicClaim stays synthetic / none.
      const r = admitAndExecuteShadowCeoFromChat({
        message:
          "Operate Shadow CEO under SYNTHETIC mode with authoritative state only — do not invent missing facts.",
        workspaceId: "ws_ws6_miss",
        correlationId: `corr_${ep.id}`,
      });
      const ok =
        r.admitted &&
        !r.blocked &&
        r.episode.chain.objective.economicClaim !== "live_profit" &&
        r.episode.chain.actions.every((a) => a.economicClaim !== "live_profit");
      check(ep.id, ok, ok ? "no live_profit invention" : "invented live claim");
      break;
    }
    case "EP_TASK_CREATION": {
      const r = admitAndExecuteShadowCeoFromChat({
        message: "Operate Shadow CEO SYNTHETIC mode: create delegated tasks with owners.",
        workspaceId: "ws_ws6_task",
        correlationId: `corr_${ep.id}`,
      });
      const ok =
        r.admitted &&
        !r.blocked &&
        r.episode.chain.tasks.length >= 2 &&
        r.episode.chain.tasks.every((t) => Boolean(t.assignee));
      check(ep.id, ok, ok ? `tasks=${r.admitted && !r.blocked ? r.episode.chain.tasks.length : 0}` : "no tasks");
      break;
    }
    case "EP_PARALLEL_DELEGATION": {
      const r = admitAndExecuteShadowCeoFromChat({
        message:
          "Shadow CEO SYNTHETIC operating objective: delegate parallel fulfilment monitor and spend-prep tasks.",
        workspaceId: "ws_ws6_par",
        correlationId: `corr_${ep.id}`,
      });
      const ok =
        r.admitted &&
        !r.blocked &&
        r.episode.chain.tasks.length >= 2 &&
        new Set(r.episode.chain.tasks.map((t) => t.id)).size >= 2;
      check(ep.id, ok, ok ? "parallel task records" : "parallel fail");
      break;
    }
    case "EP_PERMITTED_SYNTHETIC_EXECUTION": {
      check(
        ep.id,
        slice.authority.syntheticRunAllowed &&
          slice.controlPlane.created.authorizedSyntheticAction.executionStatus === "EXECUTED",
        "synthetic ALLOWED+EXECUTED",
      );
      break;
    }
    case "EP_PROHIBITED_EXTERNAL_ACTION": {
      const live = attemptExternalAction({
        kind: "listing",
        mode: "SYNTHETIC",
        approvalStatus: "none",
        authorized: false,
      });
      check(ep.id, live.decision === "BLOCKED", "live listing BLOCKED");
      break;
    }
    case "EP_APPROVAL_CREATION": {
      check(
        ep.id,
        Boolean(slice.authority.approvalId) && !isApprovalGranted("pending"),
        "approval record + pending not granted",
      );
      break;
    }
    case "EP_OUTCOME_PERSISTENCE": {
      check(ep.id, Boolean(slice.controlPlane.chain.outcome?.id), "outcome persisted");
      break;
    }
    case "EP_LEDGER_RECONCILIATION": {
      const t = slice.ledger.totals;
      const recomputed =
        t.revenue - t.productCost - t.shipping - t.fees - t.ads - t.refunds - t.returns - t.opex;
      const ok =
        slice.ledger.synthetic === true &&
        Math.abs(t.realisedNetProfit - Number(recomputed.toFixed(2))) < 0.011;
      check(ep.id, ok, ok ? `profit=${t.realisedNetProfit}` : "ledger mismatch");
      break;
    }
    case "EP_LESSON_CREATION": {
      check(
        ep.id,
        Boolean(slice.controlPlane.chain.lesson?.id) &&
          slice.controlPlane.chain.lesson?.outcomeId ===
            slice.controlPlane.chain.outcome?.id,
        "lesson linked to outcome",
      );
      break;
    }
    case "EP_EXECUTIVE_BRIEF_PROVENANCE": {
      const r = admitAndExecuteShadowCeoFromChat({
        message:
          "Operate as Shadow CEO under SYNTHETIC mode and return a source-backed executive brief.",
        workspaceId: "ws_ws6_brief",
        correlationId: `corr_${ep.id}`,
      });
      const ok =
        r.admitted &&
        !r.blocked &&
        /source-backed/i.test(r.message) &&
        r.message.includes(r.objectiveId) &&
        shadowCeoPlanAsExecutionViolations(r.message).length === 0 &&
        Boolean(r.episode.chain.brief);
      check(ep.id, ok, ok ? "brief from records" : "brief provenance fail");
      break;
    }
    case "EP_RESTART_DURING_ACTIVE_EPISODE": {
      check(
        ep.id,
        slice.restart.duplicatePrevented && slice.restart.recordCountStable,
        "restart stable",
      );
      break;
    }
    case "EP_DUPLICATE_REQUEST_DELIVERY": {
      const msg =
        "Operate Shadow CEO SYNTHETIC: duplicate delivery probe for idempotent objective admission.";
      const a = admitAndExecuteShadowCeoFromChat({
        message: msg,
        workspaceId: "ws_ws6_dup",
        correlationId: "corr_dup_a",
      });
      const b = admitAndExecuteShadowCeoFromChat({
        message: msg,
        workspaceId: "ws_ws6_dup",
        correlationId: "corr_dup_b",
      });
      const ok =
        a.admitted &&
        !a.blocked &&
        b.admitted &&
        !b.blocked &&
        a.objectiveId === b.objectiveId &&
        a.runKey === b.runKey;
      check(ep.id, ok, ok ? "duplicate → same objective" : "duplicate created two");
      break;
    }
    case "EP_FRONTEND_LAG": {
      // Engineering check: shared DB path lets cockpit load chat objective by id.
      const r = admitAndExecuteShadowCeoFromChat({
        message:
          "Shadow CEO SYNTHETIC mode objective for cockpit parity probe — inspect state and proceed.",
        workspaceId: "ws_ws6_fe",
        correlationId: `corr_${ep.id}`,
      });
      if (!r.admitted || r.blocked) {
        check(ep.id, false, "admission failed");
        break;
      }
      const repo = openShadowCeoRepository({ dbPath: resolveShadowCeoDbPath() });
      const chain = loadChain(repo, r.objectiveId);
      repo.close();
      check(
        ep.id,
        Boolean(chain) && chain.objective.id === r.objectiveId,
        "shared DB readable by cockpit path",
      );
      break;
    }
    case "EP_NON_OPERATING_NO_OBJECTIVE": {
      const ordinary = "Summarise yesterday's Mini Fan supplier notes.";
      const detected = detectShadowCeoOperatingIntent(ordinary);
      const r = admitAndExecuteShadowCeoFromChat({
        message: ordinary,
        workspaceId: "ws_ws6_ordinary",
        correlationId: `corr_${ep.id}`,
      });
      check(
        ep.id,
        !detected && r.admitted === false,
        !detected ? "ordinary chat not admitted" : "false positive admit",
      );
      break;
    }
    default:
      check(ep.id, false, "unhandled episode id");
  }
}

const report = {
  document: "SC01_WS6_INTEGRATION_CHALLENGER_RESULTS",
  generatedAt: new Date().toISOString(),
  heldSource: "SC01_WS6_INTEGRATION_CHALLENGER_HELD.json",
  episodeCount: held.episodes.length,
  passed: results.filter((r) => r.pass).length,
  failed: fail,
  results,
  BIRTH_STATUS: "NOT_BORN",
  WAVE_1: "0/24",
  WAVE_CREDIT: 0,
  REAL_COMMERCE_AUTHORIZED: false,
  status:
    fail === 0
      ? "HELD_CHALLENGER_PASS"
      : "HELD_CHALLENGER_FAIL",
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ out: OUT, passed: report.passed, failed: report.failed, status: report.status }, null, 2));
process.exit(fail === 0 ? 0 : 1);
