import { env } from "../../config/env.js";
import { quoteBoundedLLMCall, reserveBoundedLLMCall } from "./llm-spend-reservation.js";
import type {
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMProviderName,
} from "../types.js";
import { AnthropicProvider } from "./anthropic-provider.js";
import { GeminiProvider } from "./gemini-provider.js";
import { OpenAIProvider } from "./openai-provider.js";
import type { LLMProvider } from "./provider.js";
import { parseLLMTimeout, withLLMDeadline } from "./call-control.js";

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

    // An unreviewed provider substitution changes pricing, data destination,
    // and model behavior. Require an explicit selection/approval for each provider.
    if (!provider?.isAvailable()) {
      throw new Error(`Requested LLM provider ${preferred} is unavailable; implicit fallback refused`);
    }
    return provider;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const timeoutMs = parseLLMTimeout(process.env.LLM_REQUEST_TIMEOUT_MS);
    request.signal?.throwIfAborted();
    const provider = this.resolve(request.provider);
    const quote = quoteBoundedLLMCall(request, provider.name);
    await reserveBoundedLLMCall({ request, provider: provider.name, quote });
    const result = await withLLMDeadline(
      signal => provider.complete({
        ...request, provider: provider.name, model: quote.model,
        maxTokens: quote.maxOutputTokens, signal,
      }), timeoutMs, request.signal,
    );
    if (result.provider !== provider.name || result.model !== quote.model) {
      throw new Error("LLM provider/model response mismatch; charge reservation remains");
    }
    // The conservative commitment remains until actual provider billing is
    // reconciled. Usage tokens are not a verified invoice and do not release it.
    return result;
  }
}
