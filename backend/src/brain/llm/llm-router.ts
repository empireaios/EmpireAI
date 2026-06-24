import { env } from "../../config/env.js";
import type {
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMProviderName,
} from "../types.js";
import { AnthropicProvider } from "./anthropic-provider.js";
import { GeminiProvider } from "./gemini-provider.js";
import { OpenAIProvider } from "./openai-provider.js";
import type { LLMProvider } from "./provider.js";

export class LLMRouter {
  private readonly providers: Map<LLMProviderName, LLMProvider>;

  constructor() {
    this.providers = new Map<LLMProviderName, LLMProvider>([
      ["openai", new OpenAIProvider()],
      ["anthropic", new AnthropicProvider()],
      ["gemini", new GeminiProvider()],
    ]);
  }

  listAvailable(): LLMProviderName[] {
    return [...this.providers.values()]
      .filter((provider) => provider.isAvailable())
      .map((provider) => provider.name);
  }

  resolve(providerName?: LLMProviderName): LLMProvider {
    const preferred = providerName ?? env.DEFAULT_LLM_PROVIDER;
    const provider = this.providers.get(preferred);

    if (provider?.isAvailable()) {
      return provider;
    }

    const fallback = this.listAvailable()[0];
    if (!fallback) {
      throw new Error(
        "No LLM providers configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_AI_API_KEY.",
      );
    }

    const resolved = this.providers.get(fallback)!;
    return resolved;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const provider = this.resolve(request.provider);
    return provider.complete({ ...request, provider: provider.name });
  }
}
