import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, before, after } from "node:test";

import {
  admitAndExecuteShadowCeoFromChat,
  detectShadowCeoOperatingIntent,
  shadowCeoPlanAsExecutionViolations,
} from "../../orchestration/shadow-ceo-integration/chat-admission.js";
import { openShadowCeoRepository, loadChain } from "../../orchestration/shadow-ceo/index.js";
import { getRequestOwner } from "../../orchestration/shadow-ceo-integration/request-owner.js";
import { seedSyntheticAmazonUsCatalog } from "../../orchestration/synthetic-commerce/index.js";

const KESTREL_PACK = `Shadow CEO SYNTHETIC mode. Do not touch live commerce.

Candidates:
Kestrel:
- contribution: US$11 per order
- stock: 1,200
- delivery: 5 days
- approval: granted

Lumen:
- contribution: US$13 per order
- stock: 1,500
- delivery: 8 days
- approval: granted

Morrow:
- contribution: US$15 per order
- stock: 1,300
- delivery: 4 days
- approval: pending

Eligibility required:
- contribution at least US$8
- stock at least 1,000
- delivery no more than 6 days
- approval granted

Permitted action: synthetic candidate evaluation only.
Answer exactly 2 lines:
Eligible candidates: ...
Candidate selected: ...
`;

describe("Shadow CEO chat admission — request control", () => {
  let prevDataDir: string | undefined;
  let tmpRoot: string;

  before(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sc-req-ctrl-"));
    prevDataDir = process.env.SHADOW_CEO_DATA_DIR;
    process.env.SHADOW_CEO_DATA_DIR = tmpRoot;
  });

  after(() => {
    if (prevDataDir === undefined) delete process.env.SHADOW_CEO_DATA_DIR;
    else process.env.SHADOW_CEO_DATA_DIR = prevDataDir;
  });

  it("does not admit ordinary non-operating chat", () => {
    assert.equal(
      detectShadowCeoOperatingIntent("What is the Mini Fan margin this week?"),
      false,
    );
    const r = admitAndExecuteShadowCeoFromChat({
      message: "What is the Mini Fan margin this week?",
      workspaceId: "ws_test",
      correlationId: "corr_ordinary",
    });
    assert.equal(r.admitted, false);
  });

  it("evaluates supplied Kestrel/Lumen/Morrow — never demo catalog", () => {
    // Demo catalog exists in process memory but must not control the episode.
    const demo = seedSyntheticAmazonUsCatalog();
    assert.ok(demo.products.length >= 3);

    assert.equal(detectShadowCeoOperatingIntent(KESTREL_PACK), true);
    const r = admitAndExecuteShadowCeoFromChat({
      message: KESTREL_PACK,
      workspaceId: "ws_kestrel",
      correlationId: "corr_kestrel_1",
    });
    assert.equal(r.admitted, true);
    assert.equal(r.blocked, false);
    if (!r.admitted || r.blocked) throw new Error("expected candidate evaluation");

    assert.equal(r.message, "Eligible candidates: Kestrel\nCandidate selected: Kestrel");
    assert.equal(r.kind, "candidate_evaluation");
    assert.equal(r.ledgerRealisedSyntheticNetProfitUsd, 0);
    assert.equal(r.syntheticCatalogProductCount, 0);
    assert.equal(r.financialEffect.profitUsd, 0);
    assert.equal(r.financialEffect.ledgerMoved, false);
    assert.deepEqual(r.suppliedProductNames.sort(), ["Kestrel", "Lumen", "Morrow"].sort());
    assert.ok(!/Shadow CEO Executive Brief/i.test(r.message));
    assert.ok(!/fulfilment monitor/i.test(r.message));
    assert.ok(!/6\.87/.test(r.message));
    assert.ok(!/desk fan/i.test(r.message));

    const owner = getRequestOwner(r.requestId);
    assert.ok(owner);
    assert.equal(owner!.operatingMode, "SYNTHETIC");
    assert.equal(owner!.birthStatus, "NOT_BORN");
    assert.equal(owner!.realCommerceAuthority, "unauthorized");
    assert.ok(owner!.permittedActions.includes("synthetic_candidate_evaluation"));
    assert.ok(owner!.prohibitedActions.includes("fulfilment_monitor"));
    assert.ok(owner!.prohibitedActions.includes("financial_ledger"));

    const repo = openShadowCeoRepository({
      dbPath: path.join(tmpRoot, "shadow-ceo.db"),
    });
    const chain = loadChain(repo, r.objectiveId);
    repo.close();
    assert.ok(chain);
    assert.equal(chain!.tasks.length, 1);
    assert.match(chain!.tasks[0]!.title, /candidate evaluation/i);
    assert.equal(chain!.actions.length, 1);
    assert.equal(chain!.approvals.length, 0);
    assert.ok(!chain!.tasks.some((t) => /fulfilment|supplier spend/i.test(t.title)));
    const art =
      chain!.actions[0]!.completion.status === "COMPLETED"
        ? chain!.actions[0]!.completion.evidence?.artifacts
        : null;
    assert.equal(art?.requestId, r.requestId);
    assert.equal(art?.demoCatalogUsed, false);
    assert.equal(art?.profitUsd, 0);
  });

  it("is idempotent for duplicate delivery of the same candidate pack", () => {
    const a = admitAndExecuteShadowCeoFromChat({
      message: KESTREL_PACK,
      workspaceId: "ws_kestrel",
      correlationId: "corr_kestrel_retry_a",
    });
    const b = admitAndExecuteShadowCeoFromChat({
      message: KESTREL_PACK,
      workspaceId: "ws_kestrel",
      correlationId: "corr_kestrel_retry_b",
    });
    assert.equal(a.admitted && !a.blocked, true);
    assert.equal(b.admitted && !b.blocked, true);
    if (!a.admitted || a.blocked || !b.admitted || b.blocked) return;
    assert.equal(a.objectiveId, b.objectiveId);
    assert.equal(a.requestId, b.requestId);
    assert.equal(a.runKey, b.runKey);
    assert.equal(a.message, b.message);
  });

  it("blocks generic Shadow CEO operate chat instead of substituting demo slice", () => {
    const message =
      "Operate through the Shadow CEO environment under SYNTHETIC mode. " +
      "Assess synthetic Amazon state, prioritize, delegate, and proceed autonomously.";
    assert.equal(detectShadowCeoOperatingIntent(message), true);
    const r = admitAndExecuteShadowCeoFromChat({
      message,
      workspaceId: "ws_sc01_chat",
      correlationId: "corr_sc01_chat",
    });
    assert.equal(r.admitted, true);
    assert.equal(r.blocked, true);
    if (!r.admitted || !r.blocked) throw new Error("expected block");
    assert.match(r.message, /REQUEST_FACT_BINDING_FAILED/);
    assert.match(r.message, /not substituted|isolated/i);
    assert.ok(!/Shadow CEO Executive Brief \(source-backed\)/i.test(r.message));
    assert.ok(!/6\.87/.test(r.message));
  });

  it("blocks arbitrary synthetic trial wording without supplied candidates", () => {
    const message =
      "Stand up a bounded synthetic Amazon US trial to prove whether a mid-price cooling pillow " +
      "can clear contribution after ads and refunds — do not touch live commerce.";
    assert.equal(detectShadowCeoOperatingIntent(message), true);
    const r = admitAndExecuteShadowCeoFromChat({
      message,
      workspaceId: "ws_arb",
      correlationId: "corr_arb",
    });
    assert.equal(r.admitted && r.blocked, true);
    if (!r.admitted || !r.blocked) return;
    assert.match(r.reason, /REQUEST_FACT_BINDING_FAILED/);
  });

  it("selects none when no candidate is eligible", () => {
    const msg = `SYNTHETIC candidate evaluation.
Alpha:
- contribution: US$5 per order
- stock: 500
- delivery: 9 days
- approval: pending
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Answer exactly 2 lines:
Eligible candidates: ...
Candidate selected: ...
`;
    const r = admitAndExecuteShadowCeoFromChat({
      message: msg,
      workspaceId: "ws_none",
      correlationId: "corr_none",
    });
    assert.equal(r.admitted && !r.blocked, true);
    if (!r.admitted || r.blocked) return;
    assert.equal(r.message, "Eligible candidates: none\nCandidate selected: none");
  });

  it("ranks multiple eligible by highest contribution when asked", () => {
    const msg = `SYNTHETIC. Select highest contribution among eligible.
Pico:
- contribution: US$10
- stock: 2000
- delivery: 3 days
- approval: granted
Nova:
- contribution: US$14
- stock: 2000
- delivery: 4 days
- approval: granted
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Answer exactly 2 lines:
Eligible candidates: ...
Candidate selected: ...
`;
    const r = admitAndExecuteShadowCeoFromChat({
      message: msg,
      workspaceId: "ws_rank",
      correlationId: "corr_rank",
    });
    assert.equal(r.admitted && !r.blocked, true);
    if (!r.admitted || r.blocked) return;
    assert.match(r.message, /^Eligible candidates: .+\nCandidate selected: Nova$/);
  });

  it("isolates two concurrent requests with different products", () => {
    const aMsg = `SYNTHETIC. Candidates:
Zephyr: contribution US$12, stock 1500, delivery 4 days, approval granted
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Eligible candidates: ...
Candidate selected: ...
`;
    const bMsg = `SYNTHETIC. Candidates:
Quill: contribution US$9, stock 1100, delivery 5 days, approval granted
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Eligible candidates: ...
Candidate selected: ...
`;
    const a = admitAndExecuteShadowCeoFromChat({
      message: aMsg,
      workspaceId: "ws_conc",
      correlationId: "corr_a",
    });
    const b = admitAndExecuteShadowCeoFromChat({
      message: bMsg,
      workspaceId: "ws_conc",
      correlationId: "corr_b",
    });
    assert.equal(a.admitted && !a.blocked, true);
    assert.equal(b.admitted && !b.blocked, true);
    if (!a.admitted || a.blocked || !b.admitted || b.blocked) return;
    assert.notEqual(a.requestId, b.requestId);
    assert.notEqual(a.objectiveId, b.objectiveId);
    assert.match(a.message, /Zephyr/);
    assert.match(b.message, /Quill/);
    assert.ok(!a.message.includes("Quill"));
    assert.ok(!b.message.includes("Zephyr"));
  });

  it("blocks plan-as-execution DNS on source-backed brief text", () => {
    const fake =
      "### Shadow CEO Executive Brief (source-backed)\nCurrent action: DO NOT SELECT ANY.";
    assert.ok(shadowCeoPlanAsExecutionViolations(fake).includes("dns_appender_on_shadow_ceo_brief"));
  });
});
