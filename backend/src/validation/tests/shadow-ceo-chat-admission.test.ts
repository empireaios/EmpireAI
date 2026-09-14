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

describe("Shadow CEO chat admission (SC-01 path integration)", () => {
  let prevDataDir: string | undefined;
  let tmpRoot: string;

  before(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sc01-chat-admit-"));
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

  it("admits Shadow CEO SYNTHETIC operating chat and persists linked chain", () => {
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
    assert.equal(r.blocked, false);
    if (!r.admitted || r.blocked) throw new Error("expected admitted episode");

    assert.match(r.objectiveId, /^obj_/);
    assert.match(r.message, /Shadow CEO Executive Brief \(source-backed\)/);
    assert.match(r.message, new RegExp(r.objectiveId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(shadowCeoPlanAsExecutionViolations(r.message).length, 0);
    assert.ok(!/DO\s+NOT\s+SELECT\s+ANY/i.test(r.message));
    assert.ok(r.syntheticCatalogProductCount > 0);

    const repo = openShadowCeoRepository({
      dbPath: path.join(tmpRoot, "shadow-ceo.db"),
    });
    const chain = loadChain(repo, r.objectiveId);
    repo.close();
    assert.ok(chain);
    assert.equal(chain!.objective.mode, "SYNTHETIC");
    assert.ok(chain!.assessment);
    assert.ok(chain!.priorities.length >= 1);
    assert.ok(chain!.tasks.length >= 1);
    assert.ok(chain!.decision);
    assert.ok(chain!.actions.some((a) => a.executionStatus === "EXECUTED"));
    assert.ok(chain!.actions.some((a) => a.executionStatus === "BLOCKED"));
    assert.ok(chain!.outcome);
    assert.ok(chain!.lesson);
    assert.ok(chain!.brief);
    assert.match(chain!.objective.statement, /Shadow CEO environment/i);
    assert.match(
      chain!.assessment!.situationSummary,
      /Inspected synthetic Amazon US commerce state/i,
    );
  });

  it("is idempotent for duplicate delivery of the same objective text", () => {
    const message =
      "Continue Shadow CEO SYNTHETIC mode objective: run one more synthetic experiment cycle.";
    const a = admitAndExecuteShadowCeoFromChat({
      message,
      workspaceId: "ws_idem",
      correlationId: "corr_idem_1",
    });
    const b = admitAndExecuteShadowCeoFromChat({
      message,
      workspaceId: "ws_idem",
      correlationId: "corr_idem_2",
    });
    assert.equal(a.admitted && !a.blocked, true);
    assert.equal(b.admitted && !b.blocked, true);
    if (!a.admitted || a.blocked || !b.admitted || b.blocked) return;
    assert.equal(a.objectiveId, b.objectiveId);
    assert.equal(a.runKey, b.runKey);
  });

  it("admits arbitrary synthetic commerce operating wording without SC-01 hard-keys", () => {
    const message =
      "Stand up a bounded synthetic Amazon US trial to prove whether a mid-price cooling pillow " +
      "can clear contribution after ads and refunds — do not touch live commerce.";
    assert.equal(detectShadowCeoOperatingIntent(message), true);
    const r = admitAndExecuteShadowCeoFromChat({
      message,
      workspaceId: "ws_arb",
      correlationId: "corr_arb",
    });
    assert.equal(r.admitted && !r.blocked, true);
    if (!r.admitted || r.blocked) return;
    assert.match(r.episode.chain.objective.statement, /cooling pillow/i);
    assert.ok(!/SC-01/i.test(r.episode.chain.objective.statement));
    assert.ok(!/\$1,?000/.test(r.episode.chain.objective.title));
  });

  it("blocks plan-as-execution DNS on source-backed brief text", () => {
    const fake =
      "### Shadow CEO Executive Brief (source-backed)\nCurrent action: DO NOT SELECT ANY.";
    assert.ok(shadowCeoPlanAsExecutionViolations(fake).includes("dns_appender_on_shadow_ceo_brief"));
  });
});
