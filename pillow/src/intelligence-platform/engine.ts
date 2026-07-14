import type { OperationalContext } from "../context/types.js";
import type { BrainLLMCompleteRequest } from "../openai/brain-adapter.js";
import { buildKnowledgeRoutingPromptSection } from "../openai/knowledge-routing.js";
import { assessKnowledgeRouting } from "../openai/knowledge-routing.js";
import type { ArtifactRegistry } from "./artifact-registry.js";
import { routeCapability } from "./capability-router.js";
import { routeIntelligence } from "./intelligence-routing.js";
import {
  buildCapabilitySystemPrompt,
  type OpenAIIntelligencePlatform,
} from "./openai-platform.js";
import type {
  EmpireAIArtifact,
  EmpireAIArtifactType,
  IntelligencePlatformResult,
  OpenAICapability,
} from "./types.js";
import { OPENAI_CAPABILITY_REGISTRY } from "./types.js";

export interface IntelligencePlatformRequest {
  operationalContext: OperationalContext;
  userMessage: string;
  workspaceId: string;
  correlationId: string;
  owner: string;
  missionId?: string | null;
  systemContext: string;
}

function artifactTypeForCapability(capability: OpenAICapability): EmpireAIArtifactType {
  return (
    OPENAI_CAPABILITY_REGISTRY.find((c) => c.id === capability)?.artifactType ??
    "chat_response"
  );
}

function titleForCapability(capability: OpenAICapability, userMessage: string): string {
  const label =
    OPENAI_CAPABILITY_REGISTRY.find((c) => c.id === capability)?.label ?? capability;
  const preview = userMessage.slice(0, 60);
  return `${label}: ${preview}${userMessage.length > 60 ? "…" : ""}`;
}

/**
 * Pillow Intelligence Platform Engine — orchestrates routing, capabilities, and artifacts.
 */
export class IntelligencePlatformEngine {
  constructor(
    private readonly platform: OpenAIIntelligencePlatform,
    private readonly artifactRegistry: ArtifactRegistry,
  ) {}

  assessRouting(
    userMessage: string,
    context: OperationalContext,
  ) {
    const hasSoul = context.slices.some((s) =>
      /soul|constitution|vision/i.test(s.path),
    );
    const hasEkls =
      context.slices.some((s) => /learning|ekls|executive-learning/i.test(s.path)) ||
      Boolean(context.executiveReasoning);
    const hasRepositoryAnswer = Boolean(context.repositoryKnowledgeAnswer?.trim());

    return routeIntelligence({
      userMessage,
      contextTask: context.manifest.task,
      hasSoulContext: hasSoul,
      hasEklsContext: hasEkls,
      hasRepositoryAnswer,
      webSearchAvailable: this.platform.isCapabilityAvailable("web_search"),
    });
  }

  buildRoutingPromptSection(
    userMessage: string,
    context: OperationalContext,
  ): string {
    const routing = this.assessRouting(userMessage, context);
    const knowledgeAssessment = assessKnowledgeRouting(userMessage, {
      hasRepositoryAnswer: Boolean(context.repositoryKnowledgeAnswer?.trim()),
      contextTask: context.manifest.task,
    });
    const base = buildKnowledgeRoutingPromptSection(
      knowledgeAssessment,
      Boolean(context.repositoryKnowledgeAnswer?.trim()),
    );

    const lines = [
      base,
      "",
      "## Intelligence Platform Routing (PILLOW-IP-001)",
      `Primary source: ${routing.primarySource}`,
      `Primary capability: ${routing.primaryCapability}`,
      `Sources: ${routing.sources.join(" → ")}`,
      `Rationale: ${routing.rationale}`,
    ];

    if (routing.requiresLiveInformation && this.platform.isCapabilityAvailable("web_search")) {
      lines.push(
        "",
        "Live Knowledge Policy: Invoke Web Search for current information.",
        "Do NOT respond with 'I don't have access to real-time information' when Web Search is available.",
        "Produce a [Web Search Report] with citations.",
      );
    } else if (routing.isHistoricalQuestion) {
      lines.push(
        "",
        "Historical question detected: answer directly from general knowledge.",
        "Do NOT add unnecessary real-time disclaimers.",
      );
    }

    return lines.join("\n");
  }

  async execute(request: IntelligencePlatformRequest): Promise<IntelligencePlatformResult> {
    const routing = this.assessRouting(request.userMessage, request.operationalContext);
    const capabilityRoute = routeCapability({
      userMessage: request.userMessage,
      contextTask: request.operationalContext.manifest.task,
      hasSoulContext: routing.sources.includes("soul_file"),
      hasEklsContext: routing.sources.includes("ekls"),
      hasRepositoryAnswer: routing.isRepositorySpecific,
      webSearchAvailable: this.platform.isCapabilityAvailable("web_search"),
    });

    const capabilitiesUsed: OpenAICapability[] = [];
    const artifacts: EmpireAIArtifact[] = [];
    let content = "";

    const primaryCapability = capabilityRoute.capability;

    if (
      primaryCapability !== "general_knowledge" &&
      primaryCapability !== "gpt_reasoning" &&
      this.platform.isCapabilityAvailable(primaryCapability)
    ) {
      const capabilityResult = await this.platform.executeCapability({
        capability: primaryCapability,
        userMessage: request.userMessage,
        systemContext: request.systemContext,
        workspaceId: request.workspaceId,
        correlationId: request.correlationId,
        owner: request.owner,
        missionId: request.missionId,
      });
      capabilitiesUsed.push(primaryCapability);
      content = capabilityResult.content;

      const artifact = this.artifactRegistry.register({
        artifactType: capabilityResult.artifactType,
        sourceTool: primaryCapability,
        missionId: request.missionId,
        owner: request.owner,
        status: capabilityResult.success ? "complete" : "failed",
        title: titleForCapability(primaryCapability, request.userMessage),
        content: capabilityResult.content,
        metadata: {
          ...capabilityResult.metadata,
          routing: routing.rationale,
          capabilitiesUsed: [primaryCapability],
        },
      });
      artifacts.push(artifact);
    } else {
      const capabilitySystem = buildCapabilitySystemPrompt(
        routing.isRepositorySpecific ? "gpt_reasoning" : "general_knowledge",
        request.systemContext,
      );
      const llmRequest: BrainLLMCompleteRequest = {
        messages: [
          { role: "system", content: capabilitySystem },
          { role: "user", content: request.userMessage },
        ],
        workspaceId: request.workspaceId,
        correlationId: request.correlationId,
      };
      const response = await this.platform.complete(llmRequest);
      const usedCap = routing.isRepositorySpecific ? "gpt_reasoning" : "general_knowledge";
      capabilitiesUsed.push(usedCap);
      content = response.content;

      const chatArtifact = this.artifactRegistry.register({
        artifactType: artifactTypeForCapability(usedCap),
        sourceTool: usedCap,
        missionId: request.missionId,
        owner: request.owner,
        title: titleForCapability(usedCap, request.userMessage),
        content: response.content,
        metadata: {
          provider: response.provider,
          model: response.model,
          routing: routing.rationale,
        },
      });
      artifacts.push(chatArtifact);
    }

    return {
      content,
      routing,
      artifacts,
      capabilitiesUsed,
    };
  }

  getArtifactRegistry(): ArtifactRegistry {
    return this.artifactRegistry;
  }
}

export function createIntelligencePlatformEngine(
  platform: OpenAIIntelligencePlatform,
  artifactRegistry: ArtifactRegistry,
): IntelligencePlatformEngine {
  return new IntelligencePlatformEngine(platform, artifactRegistry);
}
