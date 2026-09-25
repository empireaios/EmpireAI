import { env } from "../../config/env.js";
import {
  assertPaidAutonomousAllowed,
  recordCostSpend,
} from "../../orchestration/pillow-commissioning/cost-guard.js";
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

/** Rough USD estimate before the call — Cost Guard uses this for projection only. */
const LLM_PREFLIGHT_ESTIMATE_USD = 0.02;

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
    const gate = assertPaidAutonomousAllowed(request.workspaceId, LLM_PREFLIGHT_ESTIMATE_USD);
    if (!gate.allowed) {
      throw new Error(`Cost Guard HARD STOP: ${gate.reason}`);
    }

    const timeoutMs = parseLLMTimeout(process.env.LLM_REQUEST_TIMEOUT_MS);
    request.signal?.throwIfAborted();
    const provider = this.resolve(request.provider);
    const result = await withLLMDeadline(
      signal => provider.complete({ ...request, provider: provider.name, signal }), timeoutMs, request.signal,
    );
    const tokens = result.usage?.totalTokens ?? 0;
    // Conservative token→USD estimate when provider does not return invoice cents.
    const attributableUsd =
      tokens > 0 ? Math.max(0.0001, (tokens / 1000) * 0.01) : LLM_PREFLIGHT_ESTIMATE_USD;
    try {
      recordCostSpend({
        workspaceId: request.workspaceId,
        kind: "ai",
        amountUsd: attributableUsd,
        provider: result.provider,
        attribution: {
          model: result.model,
          correlationId: request.correlationId,
          tokens: String(tokens),
        },
      });
    } catch {
      /* cost ledger must not break completions */
    }
    return result;
  }
}
