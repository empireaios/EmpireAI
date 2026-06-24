import Anthropic from "@anthropic-ai/sdk";
import { env, requireProviderKey } from "../../config/env.js";
import type { LLMCompletionRequest, LLMCompletionResponse } from "../types.js";
import type { LLMProvider } from "./provider.js";

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic" as const;
  private client: Anthropic | null = null;

  isAvailable(): boolean {
    return Boolean(env.ANTHROPIC_API_KEY);
  }

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({ apiKey: requireProviderKey("anthropic") });
    }
    return this.client;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const client = this.getClient();
    const model = request.model ?? "claude-sonnet-4-20250514";

    const systemMessage = request.messages.find((m) => m.role === "system");
    const nonSystemMessages = request.messages.filter((m) => m.role !== "system");

    const response = await client.messages.create({
      model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.2,
      system: systemMessage?.content,
      messages: nonSystemMessages.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
      tools: request.tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters as Anthropic.Tool.InputSchema,
      })),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    return {
      provider: "anthropic",
      model,
      content: textBlock?.type === "text" ? textBlock.text : "",
      toolCalls: toolUseBlocks.map((block) => ({
        name: block.name,
        arguments: block.input as Record<string, unknown>,
      })),
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }
}
