import OpenAI from "openai";
import { env, requireProviderKey } from "../../config/env.js";
import type { LLMCompletionRequest, LLMCompletionResponse, LLMMessage } from "../types.js";
import type { LLMProvider } from "./provider.js";

function toOpenAIMessage(message: LLMMessage): OpenAI.Chat.ChatCompletionMessageParam {
  switch (message.role) {
    case "system":
      return { role: "system", content: message.content };
    case "user":
      return { role: "user", content: message.content };
    case "assistant":
      return { role: "assistant", content: message.content };
    case "tool":
      return { role: "user", content: `[tool:${message.name ?? "unknown"}] ${message.content}` };
  }
}

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai" as const;
  private client: OpenAI | null = null;

  isAvailable(): boolean {
    return Boolean(env.OPENAI_API_KEY);
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey: requireProviderKey("openai") });
    }
    return this.client;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const client = this.getClient();
    const model = request.model ?? env.DEFAULT_LLM_MODEL;

    const response = await client.chat.completions.create({
      model,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 4096,
      messages: request.messages.map(toOpenAIMessage),
      tools: request.tools?.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      })),
    });

    const choice = response.choices[0];
    const toolCalls = choice?.message.tool_calls?.map((call) => ({
      name: call.function.name,
      arguments: JSON.parse(call.function.arguments) as Record<string, unknown>,
    }));

    return {
      provider: "openai",
      model,
      content: choice?.message.content ?? "",
      toolCalls,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }
}
