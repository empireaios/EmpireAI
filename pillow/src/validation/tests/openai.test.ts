import assert from "node:assert/strict";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { ContextBuilder } from "../../context/engine.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import {
  assessKnowledgeRouting,
  buildKnowledgeRoutingPromptSection,
  createOpenAIIntegrationLayer,
  isRepositorySpecificQuestion,
  requiresLiveInformation,
  resolveOperatingMode,
  type BrainLLMAdapter,
  type BrainLLMCompleteRequest,
  type BrainLLMCompleteResponse,
  type BrainLLMMessage,
} from "../../openai/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function mockAdapter(onComplete?: (request: BrainLLMCompleteRequest) => void): BrainLLMAdapter {
  return {
    listAvailableProviders() {
      return ["openai"];
    },
    async complete(
      request: BrainLLMCompleteRequest,
    ): Promise<BrainLLMCompleteResponse> {
      onComplete?.(request);
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

function systemContent(messages: BrainLLMMessage[]): string {
  const system = messages.find((m) => m.role === "system");
  assert.ok(system, "expected system message");
  return system.content;
}

function assertKnowledgeRoutingPolicy(content: string): void {
  assert.match(content, /Repository knowledge is the PRIMARY source — not the EXCLUSIVE source/);
  assert.match(content, /\[Repository Fact\]/);
  assert.match(content, /\[General Knowledge\]/);
  assert.match(content, /\[Live Information Unavailable\]/);
  assert.match(content, /Never invent repository facts/);
  assert.match(content, /Do NOT reject general-knowledge questions/);
  assert.match(content, /never fabricate/i);
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

describe("Pillow General Knowledge Routing", () => {
  let contextBuilder: ContextBuilder;

  before(async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    assert.equal(bootstrap.status, "ready");
    if (!isBootstrapReady(bootstrap)) return;
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    contextBuilder = new ContextBuilder(bootstrap, intelligence);
  });

  test("system prompt includes constitutional knowledge routing policy", async () => {
    let captured: BrainLLMCompleteRequest | undefined;
    const layer = createOpenAIIntegrationLayer(mockAdapter((req) => {
      captured = req;
    }));

    const operationalContext = await contextBuilder.build({
      userMessage: "What is React?",
    });

    await layer.complete({
      operationalContext,
      userMessage: "What is React?",
      workspaceId: "ws_routing_policy",
      correlationId: "corr-routing-policy",
    });

    assert.ok(captured);
    const content = systemContent(captured!.messages);
    assertKnowledgeRoutingPolicy(content);
    assert.match(content, /general-knowledge question/i);
  });

  const generalKnowledgeQuestions = [
    {
      question: "Who won the 2022 FIFA World Cup?",
      expectLabel: "General Knowledge",
    },
    {
      question: "What is React?",
      expectLabel: "General Knowledge",
    },
    {
      question: "What is email marketing?",
      expectLabel: "General Knowledge",
    },
    {
      question: "Explain PostgreSQL.",
      expectLabel: "General Knowledge",
    },
    {
      question: "What is the capital of Japan?",
      expectLabel: "General Knowledge",
    },
  ] as const;

  for (const { question, expectLabel } of generalKnowledgeQuestions) {
    test(`validation: "${question}" routes to general knowledge (not rejected)`, async () => {
      assert.equal(isRepositorySpecificQuestion(question, "general"), false);
      assert.equal(requiresLiveInformation(question), false);

      const routing = assessKnowledgeRouting(question, {
        hasRepositoryAnswer: false,
        contextTask: "general",
      });
      assert.equal(routing.isRepositorySpecificQuestion, false);
      assert.equal(routing.primarySource, "general");

      let captured: BrainLLMCompleteRequest | undefined;
      const layer = createOpenAIIntegrationLayer(mockAdapter((req) => {
        captured = req;
      }));

      const operationalContext = await contextBuilder.build({ userMessage: question });

      const result = await layer.complete({
        operationalContext,
        userMessage: question,
        workspaceId: "ws_validation",
        correlationId: `corr-${question.slice(0, 12)}`,
      });

      assert.equal(result.mode, "general_intelligence");
      assert.ok(captured);
      const content = systemContent(captured!.messages);
      assertKnowledgeRoutingPolicy(content);
      assert.match(content, /general-knowledge question/i);
      assert.doesNotMatch(content, /reject general-knowledge questions simply because they are absent from the repository\.[\s\S]*Do NOT answer/i);
      assert.ok(
        content.includes("[General Knowledge]"),
        `expected [${expectLabel}] label guidance in system prompt`,
      );
    });
  }

  test("repository-specific questions remain repository-only and never fabricate", async () => {
    const question = "Where is pillow-host implemented?";
    assert.equal(isRepositorySpecificQuestion(question, "repository_intelligence"), true);

    let captured: BrainLLMCompleteRequest | undefined;
    const layer = createOpenAIIntegrationLayer(mockAdapter((req) => {
      captured = req;
    }));

    const operationalContext = await contextBuilder.build({ userMessage: question });

    await layer.complete({
      operationalContext,
      userMessage: question,
      workspaceId: "ws_repo_only",
      correlationId: "corr-repo-only",
    });

    assert.ok(captured);
    const content = systemContent(captured!.messages);
    assertKnowledgeRoutingPolicy(content);
    assert.match(content, /Repository-specific questions: use repository context ONLY/);
    assert.match(content, /never fabricate/i);

    const routing = assessKnowledgeRouting(question, {
      hasRepositoryAnswer: Boolean(operationalContext.repositoryKnowledgeAnswer),
      contextTask: operationalContext.manifest.task,
    });
    assert.equal(routing.isRepositorySpecificQuestion, true);
    if (operationalContext.repositoryKnowledgeAnswer) {
      assert.match(content, /Repository intelligence matched/i);
    }
  });

  test("live information questions receive web search routing hint", async () => {
    const question = "What is the current stock price of Apple right now?";
    assert.equal(requiresLiveInformation(question), true);

    let captured: BrainLLMCompleteRequest | undefined;
    const layer = createOpenAIIntegrationLayer(mockAdapter((req) => {
      captured = req;
    }));

    const operationalContext = await contextBuilder.build({ userMessage: question });

    await layer.complete({
      operationalContext,
      userMessage: question,
      workspaceId: "ws_live",
      correlationId: "corr-live",
    });

    assert.ok(captured);
    const content = systemContent(captured!.messages);
    assert.match(content, /Web Search|current public information/i);
  });

  test("historical questions do not require live information", () => {
    const question = "Who won the 2022 FIFA World Cup?";
    assert.equal(requiresLiveInformation(question), false);
  });

  test("repository-specific question without match instructs no fabrication", async () => {
    const question = "Where is the nonexistent-xyz-module-9000 implemented?";
    assert.equal(isRepositorySpecificQuestion(question, "general"), true);

    const noMatchPolicy = buildKnowledgeRoutingPromptSection(
      assessKnowledgeRouting(question, {
        hasRepositoryAnswer: false,
        contextTask: "repository_intelligence",
      }),
      false,
    );
    assert.match(noMatchPolicy, /repository-specific question but no deterministic repository answer/i);
    assert.match(noMatchPolicy, /do not fabricate/i);

    let captured: BrainLLMCompleteRequest | undefined;
    const layer = createOpenAIIntegrationLayer(mockAdapter((req) => {
      captured = req;
    }));

    const operationalContext = await contextBuilder.build({ userMessage: question });

    await layer.complete({
      operationalContext,
      userMessage: question,
      workspaceId: "ws_missing_repo",
      correlationId: "corr-missing-repo",
    });

    assert.ok(captured);
    const content = systemContent(captured!.messages);
    assert.match(content, /Repository-specific questions: use repository context ONLY/);
    assert.match(content, /never fabricate/i);
  });
});
