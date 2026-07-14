/** PILLOW-016 — Brain LLM transport adapter interface (implemented in backend host). */

export type BrainLLMProviderName = "openai" | "anthropic" | "gemini";

export type BrainLLMMessageRole = "system" | "user" | "assistant";

export interface BrainLLMMessage {
  role: BrainLLMMessageRole;
  content: string;
}

export interface BrainLLMCompleteRequest {
  messages: BrainLLMMessage[];
  provider?: BrainLLMProviderName;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  workspaceId: string;
  correlationId: string;
}

export interface BrainLLMCompleteResponse {
  provider: BrainLLMProviderName;
  model: string;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** Pillow delegates all inference to Brain — never calls provider APIs directly. */
export interface BrainLLMAdapter {
  complete(request: BrainLLMCompleteRequest): Promise<BrainLLMCompleteResponse>;
  listAvailableProviders(): BrainLLMProviderName[];
}

/** Capability execution request for OpenAI Intelligence Platform. */
export interface BrainLLMCapabilityRequest {
  capability: import("../intelligence-platform/types.js").OpenAICapability;
  userMessage: string;
  systemContext: string;
  workspaceId: string;
  correlationId: string;
}

export interface BrainLLMCapabilityResponse {
  capability: import("../intelligence-platform/types.js").OpenAICapability;
  content: string;
  artifactType: import("../intelligence-platform/types.js").EmpireAIArtifactType;
  metadata: Record<string, unknown>;
  success: boolean;
}

/** Extended adapter supporting OpenAI Intelligence Platform capabilities. */
export interface IntelligencePlatformAdapter extends BrainLLMAdapter {
  listCapabilities(): import("../intelligence-platform/types.js").OpenAICapability[];
  isCapabilityAvailable(
    capability: import("../intelligence-platform/types.js").OpenAICapability,
  ): boolean;
  executeCapability(
    request: BrainLLMCapabilityRequest,
  ): Promise<BrainLLMCapabilityResponse>;
}
