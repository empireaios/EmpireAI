import { GoogleGenerativeAI } from "@google/generative-ai";
import { env, requireProviderKey } from "../../config/env.js";
import type { LLMCompletionRequest, LLMCompletionResponse } from "../types.js";
import type { LLMProvider } from "./provider.js";

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini" as const;
  private client: GoogleGenerativeAI | null = null;

  isAvailable(): boolean {
    return Boolean(env.GOOGLE_AI_API_KEY);
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      this.client = new GoogleGenerativeAI(requireProviderKey("gemini"));
    }
    return this.client;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const client = this.getClient();
    const modelName = request.model ?? "gemini-2.0-flash";
    const model = client.getGenerativeModel({ model: modelName });

    const systemMessage = request.messages.find((m) => m.role === "system");
    const conversation = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = systemMessage
      ? `${systemMessage.content}\n\n${conversation}`
      : conversation;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: request.temperature ?? 0.2,
        maxOutputTokens: request.maxTokens ?? 4096,
      },
    });

    const text = result.response.text();

    return {
      provider: "gemini",
      model: modelName,
      content: text,
      usage: result.response.usageMetadata
        ? {
            promptTokens: result.response.usageMetadata.promptTokenCount ?? 0,
            completionTokens:
              result.response.usageMetadata.candidatesTokenCount ?? 0,
            totalTokens: result.response.usageMetadata.totalTokenCount ?? 0,
          }
        : undefined,
    };
  }
}
