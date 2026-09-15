/**
 * Held adversarial pack for request control — run after repair only.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { admitAndExecuteShadowCeoFromChat } from "../src/orchestration/shadow-ceo-integration/chat-admission.ts";
import {
  assertActionPermitted,
  classifyActionFromTitle,
} from "../src/orchestration/shadow-ceo-integration/action-permit.ts";
import {
  assertSameRequestOwnership,
  getRequestOwner,
  persistRequestOwner,
  findOwnerByDigest,
  instructionDigest,
} from "../src/orchestration/shadow-ceo-integration/request-owner.ts";
import { seedSyntheticAmazonUsCatalog } from "../src/orchestration/synthetic-commerce/index.ts";
import { openShadowCeoRepository, loadChain } from "../src/orchestration/shadow-ceo/index.ts";

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "req-ctrl-held-"));
process.env.SHADOW_CEO_DATA_DIR = tmpRoot;

const checks = [];
function check(id, ok, detail) {
  checks.push({ id, ok, detail });
  if (!ok) console.error("FAIL", id, detail);
}

const demo = seedSyntheticAmazonUsCatalog();
check("C05_demo_exists", demo.products.length >= 3, `demo products=${demo.products.length}`);

const sole = `SYNTHETIC. Candidates:
Kite: contribution US$11, stock 1200, delivery 5 days, approval granted
Lantern: contribution US$13, stock 1500, delivery 8 days, approval granted
Mire: contribution US$15, stock 1300, delivery 4 days, approval pending
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Permitted action: synthetic candidate evaluation only.
Answer exactly 2 lines:
Eligible candidates: ...
Candidate selected: ...
`;
const r1 = admitAndExecuteShadowCeoFromChat({
  message: sole,
  workspaceId: "ws_held",
  correlationId: randomUUID(),
});
check(
  "C01_sole_eligible",
  r1.admitted && !r1.blocked && r1.message === "Eligible candidates: Kite\nCandidate selected: Kite",
  r1.admitted && !r1.blocked ? r1.message : JSON.stringify(r1),
);

const multi = `SYNTHETIC. Select highest contribution among eligible.
Nexus: contribution US$10, stock 2000, delivery 3 days, approval granted
Orbit: contribution US$14, stock 2000, delivery 4 days, approval granted
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Eligible candidates: ...
Candidate selected: ...
`;
const r2 = admitAndExecuteShadowCeoFromChat({
  message: multi,
  workspaceId: "ws_held",
  correlationId: randomUUID(),
});
check(
  "C02_ranking",
  r2.admitted && !r2.blocked && /Candidate selected: Orbit/.test(r2.message),
  r2.admitted && !r2.blocked ? r2.message : r2,
);

const none = `SYNTHETIC. Candidates:
Pebble: contribution US$3, stock 10, delivery 20 days, approval pending
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Eligible candidates: ...
Candidate selected: ...
`;
const r3 = admitAndExecuteShadowCeoFromChat({
  message: none,
  workspaceId: "ws_held",
  correlationId: randomUUID(),
});
check(
  "C03_none",
  r3.admitted && !r3.blocked && r3.message.includes("none"),
  r3.admitted && !r3.blocked ? r3.message : r3,
);

const corr = `SYNTHETIC. Candidates:
Reed:
- contribution US$12
- stock 1500
- earlier delivery: 9 days
- later corrected delivery: 4 days
- approval granted
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Eligible candidates: ...
Candidate selected: ...
`;
const r4 = admitAndExecuteShadowCeoFromChat({
  message: corr,
  workspaceId: "ws_held",
  correlationId: randomUUID(),
});
check(
  "C04_correction",
  r4.admitted && !r4.blocked && /Reed/.test(r4.message) && /Candidate selected: Reed/.test(r4.message),
  r4.admitted && !r4.blocked ? r4.message : r4,
);

check(
  "C05_no_demo_leak",
  r1.admitted && !r1.blocked && !/desk fan|prod-synth|6\.87/i.test(r1.message),
  "demo leak check",
);

check(
  "C06_no_selling_price",
  r1.admitted && !r1.blocked && !/selling\s*price/i.test(r1.message),
  "no selling price",
);

check(
  "C07_approval_pending_excluded",
  r1.admitted && !r1.blocked && !/Mire/.test(r1.message.split("\n")[0]),
  r1.admitted && !r1.blocked ? r1.message : r1,
);

check(
  "C08_delivery_outside_excluded",
  r1.admitted && !r1.blocked && !/Lantern/.test(r1.message.split("\n")[0]),
  r1.admitted && !r1.blocked ? r1.message : r1,
);

check(
  "C09_exact_lines",
  r1.admitted && !r1.blocked && r1.message.split("\n").length === 2,
  r1.admitted && !r1.blocked ? r1.message : r1,
);

const tok = `SYNTHETIC. Checkpoint token: HELD-777
Candidates:
Sable: contribution US$11, stock 1200, delivery 4 days, approval granted
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Answer exactly 2 lines:
Eligible candidates: ...
Candidate selected: ...
`;
const r10 = admitAndExecuteShadowCeoFromChat({
  message: tok,
  workspaceId: "ws_held",
  correlationId: randomUUID(),
});
check(
  "C10_token_owner",
  r10.admitted &&
    !r10.blocked &&
    getRequestOwner(r10.requestId)?.completeInstruction.includes("HELD-777") &&
    r10.message.split("\n").length === 2,
  r10.admitted && !r10.blocked ? r10.requestId : r10,
);

check(
  "C11_no_extra_prose",
  r1.admitted && !r1.blocked && !/#|Executive Brief|^- /.test(r1.message),
  r1.admitted && !r1.blocked ? r1.message : r1,
);

if (r1.admitted && !r1.blocked) {
  const owner = getRequestOwner(r1.requestId);
  const fin = assertActionPermitted(
    "financial_ledger",
    owner.permittedActions,
    owner.prohibitedActions,
    "financial",
  );
  const fulfil = assertActionPermitted(
    classifyActionFromTitle("Run synthetic fulfilment monitor"),
    owner.permittedActions,
    owner.prohibitedActions,
    "task_create",
  );
  check("C12_permit_only_eval", owner.permittedActions.length === 1, owner.permittedActions.join(","));
  check("C13_unrelated_task_rejected", !fulfil.allowed, fulfil.reason);
  check("C14_financial_rejected", !fin.allowed, fin.reason);

  const repo = openShadowCeoRepository({ dbPath: path.join(tmpRoot, "shadow-ceo.db") });
  const chain = loadChain(repo, r1.objectiveId);
  repo.close();
  check("C12b_one_task", chain && chain.tasks.length === 1, chain?.tasks.map((t) => t.title).join("|"));
  check("C14b_zero_finance", r1.financialEffect.profitUsd === 0 && r1.financialEffect.ledgerMoved === false, r1.financialEffect);

  try {
    assertSameRequestOwnership(owner, { requestId: "req_forged", runId: owner.runId, correlationId: owner.correlationId }, "forged");
    check("C22_forged_id", false, "should throw");
  } catch (e) {
    check("C22_forged_id", /REQUEST_MIX_DETECTED/.test(String(e.message || e)), String(e.message || e));
  }

  // Mix: old outcome foreign request id
  try {
    assertSameRequestOwnership(owner, { requestId: "req_other_run", runId: "run_other", correlationId: owner.correlationId }, "old_outcome");
    check("C15_old_outcome_mix", false, "should throw");
  } catch (e) {
    check("C15_old_outcome_mix", /REQUEST_MIX/.test(String(e.message || e)), String(e.message || e));
  }
  try {
    assertSameRequestOwnership(owner, { requestId: "req_lesson_other", runId: owner.runId, correlationId: "corr_other" }, "old_lesson");
    check("C16_old_lesson_mix", false, "should throw");
  } catch (e) {
    check("C16_old_lesson_mix", /REQUEST_MIX/.test(String(e.message || e)), String(e.message || e));
  }
}

const retryA = admitAndExecuteShadowCeoFromChat({
  message: sole,
  workspaceId: "ws_held",
  correlationId: randomUUID(),
});
const retryB = admitAndExecuteShadowCeoFromChat({
  message: sole,
  workspaceId: "ws_held",
  correlationId: randomUUID(),
});
check(
  "C17_retry_idempotent",
  retryA.admitted &&
    !retryA.blocked &&
    retryB.admitted &&
    !retryB.blocked &&
    retryA.requestId === retryB.requestId &&
    retryA.objectiveId === retryB.objectiveId,
  `${retryA.admitted && !retryA.blocked ? retryA.requestId : "fail"} vs ${retryB.admitted && !retryB.blocked ? retryB.requestId : "fail"}`,
);

const digest = instructionDigest("ws_held", sole);
const recovered = findOwnerByDigest(digest);
check("C18_memory_recovery", !!recovered && recovered.requestId === retryA.requestId, recovered?.requestId);

check("C19_durable_owner_file", fs.existsSync(path.join(tmpRoot, "shadow-ceo-request-owners.json")), "owners json");

const aMsg = `SYNTHETIC. Candidates:
TwinA: contribution US$12, stock 1500, delivery 4 days, approval granted
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Eligible candidates: ...
Candidate selected: ...
`;
const bMsg = `SYNTHETIC. Candidates:
TwinB: contribution US$12, stock 1500, delivery 4 days, approval granted
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Eligible candidates: ...
Candidate selected: ...
`;
const ca = admitAndExecuteShadowCeoFromChat({ message: aMsg, workspaceId: "ws_held", correlationId: randomUUID() });
const cb = admitAndExecuteShadowCeoFromChat({ message: bMsg, workspaceId: "ws_held", correlationId: randomUUID() });
check(
  "C20_concurrent_isolation",
  ca.admitted &&
    !ca.blocked &&
    cb.admitted &&
    !cb.blocked &&
    ca.requestId !== cb.requestId &&
    /TwinA/.test(ca.message) &&
    /TwinB/.test(cb.message),
  `${ca.message} || ${cb.message}`,
);

const missing = admitAndExecuteShadowCeoFromChat({
  message: "Operate Shadow CEO under SYNTHETIC mode with no products supplied.",
  workspaceId: "ws_held",
  correlationId: randomUUID(),
});
check(
  "C21_missing_facts_blocked",
  missing.admitted && missing.blocked && /REQUEST_FACT_BINDING_FAILED/.test(missing.reason || missing.message),
  missing.reason || missing.message,
);

check(
  "C23_no_generic_brief",
  r1.admitted && !r1.blocked && !/Executive Brief \(source-backed\)/i.test(r1.message),
  r1.admitted && !r1.blocked ? r1.message : r1,
);

check(
  "C24_zero_financial",
  r1.admitted &&
    !r1.blocked &&
    r1.financialEffect.spendingUsd === 0 &&
    r1.financialEffect.revenueUsd === 0 &&
    r1.financialEffect.profitUsd === 0 &&
    r1.financialEffect.ledgerMoved === false &&
    r1.ledgerRealisedSyntheticNetProfitUsd === 0,
  r1.admitted && !r1.blocked ? r1.financialEffect : r1,
);

const pass = checks.filter((c) => c.ok).length;
const fail = checks.filter((c) => !c.ok).length;
const out = {
  generatedAt: new Date().toISOString(),
  MISSION: "REQUEST_CONTROL_HELD_ADVERSARIAL",
  pass,
  fail,
  total: checks.length,
  WAVE_CREDIT: 0,
  SC01: "FROZEN",
  checks,
};
const outPath = path.resolve(
  process.cwd(),
  "../docs/audits/capability-extraction/REQUEST_CONTROL_WS8_HELD_RESULTS.json",
);
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ pass, fail, total: checks.length, outPath }, null, 2));
if (fail > 0) process.exit(1);
