import type { LLMRouter } from "../../brain/llm/llm-router.js";
import {
  buildCapabilitySystemPrompt,
  type OpenAICapability,
  type EmpireAIArtifactType,
} from "@empireai/pillow";
import type {
  BrainLLMAdapter,
  BrainLLMCapabilityRequest,
  BrainLLMCapabilityResponse,
  BrainLLMCompleteRequest,
  BrainLLMCompleteResponse,
  BrainLLMProviderName,
  IntelligencePlatformAdapter,
} from "@empireai/pillow";
import { createVisualAsset } from "../../orchestration/visual-generation-layer/services/visual-generation-service.js";

const ALL_CAPABILITIES: OpenAICapability[] = [
  "gpt_reasoning",
  "general_knowledge",
  "web_search",
  "file_search",
  "file_analysis",
  "image_generation",
  "visual_generation",
  "vision",
  "code_execution",
];

const DEFAULT_COMPANY_ID = "co-grand-king";

function artifactTypeFor(capability: OpenAICapability): EmpireAIArtifactType {
  const map: Record<OpenAICapability, EmpireAIArtifactType> = {
    gpt_reasoning: "chat_response",
    general_knowledge: "chat_response",
    web_search: "search_report",
    file_search: "file_analysis",
    file_analysis: "file_analysis",
    image_generation: "generated_image",
    visual_generation: "generated_visual_asset",
    vision: "vision_report",
    code_execution: "code_output",
  };
  return map[capability];
}

/** Brain-side adapter — routes Pillow inference through LLMRouter + capability execution. */
export function createBrainLLMAdapter(llmRouter: LLMRouter): IntelligencePlatformAdapter {
  const base: BrainLLMAdapter = {
    listAvailableProviders(): BrainLLMProviderName[] {
      return llmRouter.listAvailable();
    },

    async complete(
      request: BrainLLMCompleteRequest,
    ): Promise<BrainLLMCompleteResponse> {
      const response = await llmRouter.complete({
        provider: request.provider,
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        workspaceId: request.workspaceId,
        correlationId: request.correlationId,
      });

      return {
        provider: response.provider,
        model: response.model,
        content: response.content,
        usage: response.usage,
      };
    },
  };

  return {
    ...base,

    listCapabilities(): OpenAICapability[] {
      if (llmRouter.listAvailable().length === 0) return [];
      return ALL_CAPABILITIES;
    },

    isCapabilityAvailable(capability: OpenAICapability): boolean {
      if (llmRouter.listAvailable().length === 0) return false;
      return ALL_CAPABILITIES.includes(capability);
    },

    async executeCapability(
      request: BrainLLMCapabilityRequest,
    ): Promise<BrainLLMCapabilityResponse> {
      if (request.capability === "visual_generation") {
        try {
          const result = await createVisualAsset({
            workspaceId: request.workspaceId,
            companyId: DEFAULT_COMPANY_ID,
            useCase: "general",
            prompt: request.userMessage,
            title: request.userMessage.slice(0, 120),
          });

          return {
            capability: request.capability,
            content: [
              "[Visual Generation]",
              `Provider: ${result.provider}`,
              `Status: ${result.status}`,
              result.designId ? `Design ID: ${result.designId}` : null,
              result.exportLocation ? `Export: ${result.exportLocation}` : null,
              result.errors.length ? `Errors: ${result.errors.join("; ")}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
            artifactType: artifactTypeFor(request.capability),
            metadata: {
              provider: result.provider,
              designId: result.designId,
              assetIds: result.assetIds,
              exportFormat: result.exportFormat,
              exportLocation: result.exportLocation,
              status: result.status,
              errors: result.errors,
              usageMetadata: result.usageMetadata,
              routedVia: "visual-generation-layer",
            },
            success: result.status === "success",
          };
        } catch (error) {
          return {
            capability: request.capability,
            content: `[Visual Generation] Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            artifactType: artifactTypeFor(request.capability),
            metadata: {
              routedVia: "visual-generation-layer",
              errors: [error instanceof Error ? error.message : "Unknown error"],
            },
            success: false,
          };
        }
      }

      const systemPrompt = buildCapabilitySystemPrompt(
        request.capability,
        request.systemContext,
      );
      const response = await llmRouter.complete({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: request.userMessage },
        ],
        workspaceId: request.workspaceId,
        correlationId: request.correlationId,
      });

      return {
        capability: request.capability,
        content: response.content,
        artifactType: artifactTypeFor(request.capability),
        metadata: {
          provider: response.provider,
          model: response.model,
          simulated: true,
        },
        success: true,
      };
    },
  };
}
