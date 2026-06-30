import type { LLMRouter } from "../../brain/llm/llm-router.js";
import type {
  BrainLLMAdapter,
  BrainLLMCompleteRequest,
  BrainLLMCompleteResponse,
  BrainLLMProviderName,
} from "@empireai/pillow";

/** Brain-side BrainLLMAdapter — routes Pillow inference through LLMRouter only. */
export function createBrainLLMAdapter(llmRouter: LLMRouter): BrainLLMAdapter {
  return {
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
}
