import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";

import type {
  BrainLLMCapabilityRequest,
  BrainLLMCapabilityResponse,
  BrainLLMCompleteRequest,
  BrainLLMCompleteResponse,
  IntelligencePlatformAdapter,
} from "../../openai/brain-adapter.js";
import {
  ArtifactRegistry,
  createIntelligencePlatformEngine,
  createOpenAIIntelligencePlatform,
  isHistoricalQuestion,
  requiresCurrentInformation,
  routeCapability,
  routeIntelligence,
  type OpenAICapability,
} from "../../intelligence-platform/index.js";

function mockPlatformAdapter(
  onCapability?: (req: BrainLLMCapabilityRequest) => void,
): IntelligencePlatformAdapter {
  return {
    listAvailableProviders() {
      return ["openai"];
    },
    async complete(request: BrainLLMCompleteRequest): Promise<BrainLLMCompleteResponse> {
      return {
        provider: "openai",
        model: "mock",
        content: `mock:${request.messages.at(-1)?.content ?? ""}`,
      };
    },
    listCapabilities(): OpenAICapability[] {
      return [
        "gpt_reasoning",
        "general_knowledge",
        "web_search",
        "file_search",
        "file_analysis",
        "image_generation",
        "vision",
        "code_execution",
      ];
    },
    isCapabilityAvailable() {
      return true;
    },
    async executeCapability(
      request: BrainLLMCapabilityRequest,
    ): Promise<BrainLLMCapabilityResponse> {
      onCapability?.(request);
      const artifactMap: Record<OpenAICapability, BrainLLMCapabilityResponse["artifactType"]> = {
        gpt_reasoning: "chat_response",
        general_knowledge: "chat_response",
        web_search: "search_report",
        file_search: "file_analysis",
        file_analysis: "file_analysis",
        image_generation: "generated_image",
        vision: "vision_report",
        code_execution: "code_output",
      };
      return {
        capability: request.capability,
        content: `[${request.capability}] ${request.userMessage}`,
        artifactType: artifactMap[request.capability],
        metadata: { mock: true },
        success: true,
      };
    },
  };
}

describe("PILLOW-IP-001 Intelligence Platform", () => {
  test("repository routing prioritizes soul file and EKLS", () => {
    const decision = routeIntelligence({
      userMessage: "Where is pillow-host implemented?",
      contextTask: "repository_intelligence",
      hasSoulContext: true,
      hasEklsContext: true,
      hasRepositoryAnswer: true,
      webSearchAvailable: true,
    });
    assert.equal(decision.isRepositorySpecific, true);
    assert.ok(decision.sources.includes("soul_file"));
    assert.ok(decision.sources.includes("ekls"));
  });

  test("general knowledge routing for historical questions", () => {
    const question = "Who won the 2022 FIFA World Cup?";
    assert.equal(isHistoricalQuestion(question), true);
    assert.equal(requiresCurrentInformation(question), false);

    const decision = routeIntelligence({
      userMessage: question,
      contextTask: "general",
      hasSoulContext: false,
      hasEklsContext: false,
      hasRepositoryAnswer: false,
      webSearchAvailable: true,
    });
    assert.equal(decision.isHistoricalQuestion, true);
    assert.equal(decision.requiresLiveInformation, false);
    assert.equal(decision.primaryCapability, "general_knowledge");
  });

  test("current information invokes web search capability", () => {
    const question = "What is today's exchange rate for USD to EUR?";
    assert.equal(requiresCurrentInformation(question), true);

    const route = routeCapability({
      userMessage: question,
      contextTask: "general",
      hasSoulContext: false,
      hasEklsContext: false,
      hasRepositoryAnswer: false,
      webSearchAvailable: true,
    });
    assert.equal(route.capability, "web_search");
  });

  test("image generation capability routing", () => {
    const route = routeCapability({
      userMessage: "Generate an image of a golden crown for the executive brand",
      contextTask: "general",
      hasSoulContext: false,
      hasEklsContext: false,
      hasRepositoryAnswer: false,
      webSearchAvailable: true,
    });
    assert.equal(route.capability, "image_generation");
  });

  test("file search and file analysis capabilities", () => {
    const search = routeCapability({
      userMessage: "Search my uploaded file for revenue figures",
      contextTask: "general",
      hasSoulContext: false,
      hasEklsContext: false,
      hasRepositoryAnswer: false,
      webSearchAvailable: true,
    });
    assert.equal(search.capability, "file_search");

    const analysis = routeCapability({
      userMessage: "Analyze this uploaded PDF document",
      contextTask: "general",
      hasSoulContext: false,
      hasEklsContext: false,
      hasRepositoryAnswer: false,
      webSearchAvailable: true,
    });
    assert.equal(analysis.capability, "file_analysis");
  });

  test("vision and code execution capabilities", () => {
    const vision = routeCapability({
      userMessage: "Describe this image and what it shows",
      contextTask: "general",
      hasSoulContext: false,
      hasEklsContext: false,
      hasRepositoryAnswer: false,
      webSearchAvailable: true,
    });
    assert.equal(vision.capability, "vision");

    const code = routeCapability({
      userMessage: "Run this python script and show the output",
      contextTask: "general",
      hasSoulContext: false,
      hasEklsContext: false,
      hasRepositoryAnswer: false,
      webSearchAvailable: true,
    });
    assert.equal(code.capability, "code_execution");
  });

  test("artifact registry persists every capability artifact", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pillow-ip-"));
    after(() => {
      fs.rmSync(tmp, { recursive: true, force: true });
    });

    const registry = new ArtifactRegistry(tmp);
    const platform = createOpenAIIntelligencePlatform(mockPlatformAdapter());
    const engine = createIntelligencePlatformEngine(platform, registry);

    const result = await engine.execute({
      operationalContext: {
        manifest: {
          contextVersion: "PILLOW-004",
          task: "general",
          artifactIds: [],
          paths: [],
          sliceCount: 0,
          totalBytes: 0,
          estimatedTokens: 0,
          cached: false,
          repositoryFingerprint: "test",
          builtAt: new Date().toISOString(),
          durationMs: 0,
        },
        slices: [],
        intelligenceSnapshot: {
          healthScore: 100,
          currentMission: "PILLOW-IP-001",
          journeyPosition: null,
          healthIssueCount: 0,
        },
      },
      userMessage: "Generate an image of the EmpireAI logo",
      workspaceId: "ws_test",
      correlationId: "corr_test",
      owner: "grand_king",
      systemContext: "test context",
    });

    assert.ok(result.artifacts.length >= 1);
    assert.equal(result.artifacts[0]?.artifactType, "generated_image");
    assert.equal(registry.snapshot().totalArtifacts, 1);
  });
});
