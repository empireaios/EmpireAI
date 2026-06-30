import assert from "node:assert/strict";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { ContextBuilder } from "../../context/engine.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import {
  createOpenAIIntegrationLayer,
  resolveOperatingMode,
  type BrainLLMAdapter,
  type BrainLLMCompleteRequest,
  type BrainLLMCompleteResponse,
} from "../../openai/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function mockAdapter(): BrainLLMAdapter {
  return {
    listAvailableProviders() {
      return ["openai"];
    },
    async complete(
      request: BrainLLMCompleteRequest,
    ): Promise<BrainLLMCompleteResponse> {
      return {
        provider: "openai",
        model: "mock-model",
        content: `mock-response:${request.messages.at(-1)?.content ?? ""}`,
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
      };
    },
  };
}

describe("PILLOW-016 OpenAI Integration Layer", () => {
  let contextBuilder: ContextBuilder;

  before(async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    assert.equal(bootstrap.status, "ready");
    if (!isBootstrapReady(bootstrap)) return;
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    contextBuilder = new ContextBuilder(bootstrap, intelligence);
  });

  test("resolveOperatingMode maps journey tasks to empire operations", () => {
    assert.equal(resolveOperatingMode("journey_question"), "empire_operations");
    assert.equal(resolveOperatingMode("architecture"), "engineering_operations");
    assert.equal(resolveOperatingMode("general"), "general_intelligence");
  });

  test("OpenAIIntegrationLayer delegates to BrainLLMAdapter only", async () => {
    const layer = createOpenAIIntegrationLayer(mockAdapter());
    const operationalContext = await contextBuilder.build({
      userMessage: "Where is the empire in Journey?",
    });

    const result = await layer.complete({
      operationalContext,
      userMessage: "Where is the empire in Journey?",
      workspaceId: "ws_pillow_test",
      correlationId: "corr-openai-test",
    });

    assert.equal(result.provider, "openai");
    assert.ok(result.content.includes("mock-response:"));
    assert.equal(result.mode, "empire_operations");
    assert.ok(result.usage?.totalTokens === 150);
  });
});
