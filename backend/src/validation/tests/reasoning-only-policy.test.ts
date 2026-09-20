import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { isReasoningOnlyRequest, runChatActionStage } from "../../runtime/reasoning-only-policy.js";

describe("durable chat reasoning-only boundary", () => {
  it("never calls the command, episode or learning callbacks under durable retries", () => {
    let mutations = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      for (const _stage of ["command", "shadow-episode", "learning-write"]) {
        assert.equal(runChatActionStage(true, () => { mutations++; return "executed"; }), undefined);
      }
    }
    assert.equal(mutations, 0);
  });
  it("retains ordinary authorized non-durable action callbacks", () => {
    let mutations = 0;
    assert.equal(runChatActionStage(false, () => { mutations++; return "executed"; }), "executed");
    assert.equal(mutations, 1);
  });
  it("uses a restrictive transport mode, never prompt text as an authority grant", () => {
    assert.equal(isReasoningOnlyRequest({ "x-empire-pillow-request-kind": "reasoning" }), true);
    assert.equal(isReasoningOnlyRequest({ message: "reasoning" }), false);
    assert.equal(isReasoningOnlyRequest({ "x-empire-pillow-request-kind": "side_effect" }), false);
  });
  it("wires the guarded stages into the real host source and both route attempts", () => {
    const host = readFileSync(new URL("../../orchestration/pillow-host/pillow-host.ts", import.meta.url), "utf8");
    assert.match(host, /runChatActionStage\(reasoningOnly, \(\) => admitAndExecuteShadowCeoFromChat/);
    assert.match(host, /runChatActionStage\(reasoningOnly, \(\) => pillow\.command\.processCommand/);
    assert.match(host, /runChatActionStage\(reasoningOnly, \(\) => observeExecutiveConversation/);
    assert.match(host, /!reasoningOnly && !useMinimalProductionPath && shouldRunExecutiveCouncil/);
    const route = readFileSync(new URL("../../orchestration/pillow-host/routes/pillow-routes.ts", import.meta.url), "utf8");
    assert.ok(route.split("reasoningOnly: isReasoningOnlyRequest(request.headers)").length - 1 >= 2);
  });
});
