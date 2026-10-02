import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OpenAIIntegrationLayer } from "../../openai/engine.js";
import type { BrainLLMAdapter } from "../../openai/brain-adapter.js";
import type { OperationalContext } from "../../context/types.js";
import type { IntelligencePlatformEngine } from "../../intelligence-platform/engine.js";

const context: OperationalContext = {
  manifest: { contextVersion: "PILLOW-004", task: "general", artifactIds: [], paths: [], sliceCount: 0,
    totalBytes: 0, estimatedTokens: 0, cached: false, repositoryFingerprint: "isolated-test",
    builtAt: "2026-09-20T00:00:00.000Z", durationMs: 0 },
  slices: [], intelligenceSnapshot: { healthScore: 0, currentMission: null, journeyPosition: null, healthIssueCount: 0 },
};

describe("reasoning-only completion cannot execute tools", () => {
  for (const executiveConversationMode of [false, true]) {
    it(`blocks capabilities and artifact writes with conversational mode ${executiveConversationMode}`, async () => {
      let modelCalls = 0;
      let platformTouches = 0;
      const adapter: BrainLLMAdapter = {
        listAvailableProviders: () => ["openai"],
        complete: async (request) => {
          modelCalls++;
          assert.match(request.messages.find(m => m.role === "system")!.content, /REASONING ONLY: No tools/);
          assert.match(request.messages.find(m => m.role === "system")!.content, /Repository health was not assessed/);
          assert.doesNotMatch(request.messages.find(m => m.role === "system")!.content, /Repository health score:/);
          return { content: "This is advice only; nothing was executed.", provider: "openai", model: "mock" };
        },
      };
      const platform = new Proxy({}, { get() { platformTouches++; throw new Error("tool_or_artifact_path_reached"); } }) as IntelligencePlatformEngine;
      const layer = new OpenAIIntegrationLayer(adapter, platform);
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await layer.complete({
          operationalContext: context, userMessage: "Create an image, publish it and execute code now",
          workspaceId: "ws-isolated", correlationId: "retry-same-request", reasoningOnly: true,
          executiveConversationMode,
          constitutionalGateAttestation: { passed: true, gatedAt: "test", purpose: "chat" },
        });
        assert.equal(result.artifacts, undefined);
        assert.equal(result.capabilitiesUsed, undefined);
        assert.equal(result.intelligenceRouting, undefined);
      }
      assert.equal(modelCalls, 3);
      assert.equal(platformTouches, 0);
    });
  }
  it("does not bypass the constitutional gate", async () => {
    const adapter: BrainLLMAdapter = { listAvailableProviders: () => ["openai"], complete: async () => { throw new Error("model must not run"); } };
    await assert.rejects(new OpenAIIntegrationLayer(adapter).complete({
      operationalContext: context, userMessage: "advice", workspaceId: "ws-isolated", correlationId: "test", reasoningOnly: true,
    }), /Constitutional gate required/);
  });
});
