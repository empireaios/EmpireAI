import type {
  BrainLLMCompleteRequest,
  BrainLLMCompleteResponse,
  IntelligencePlatformAdapter,
} from "../openai/brain-adapter.js";
import type {
  CapabilityExecutionInput,
  CapabilityExecutionResult,
  OpenAICapability,
} from "./types.js";
import { OPENAI_CAPABILITY_REGISTRY } from "./types.js";

export type { IntelligencePlatformAdapter } from "../openai/brain-adapter.js";

export interface OpenAIPlatformConfig {
  webSearchEnabled: boolean;
  fileSearchEnabled: boolean;
  imageGenerationEnabled: boolean;
  visionEnabled: boolean;
  codeExecutionEnabled: boolean;
}

const DEFAULT_CONFIG: OpenAIPlatformConfig = {
  webSearchEnabled: true,
  fileSearchEnabled: true,
  imageGenerationEnabled: true,
  visionEnabled: true,
  codeExecutionEnabled: true,
};

/**
 * OpenAI Intelligence Platform abstraction — extensible capability registry.
 * Future OpenAI capabilities register here with minimal integration work.
 */
export class OpenAIIntelligencePlatform {
  private readonly config: OpenAIPlatformConfig;

  constructor(
    private readonly adapter: IntelligencePlatformAdapter,
    config?: Partial<OpenAIPlatformConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  listCapabilities(): OpenAICapability[] {
    return OPENAI_CAPABILITY_REGISTRY.map((c) => c.id).filter((c) =>
      this.isCapabilityAvailable(c),
    );
  }

  isCapabilityAvailable(capability: OpenAICapability): boolean {
    switch (capability) {
      case "web_search":
        return this.config.webSearchEnabled && this.adapter.isCapabilityAvailable(capability);
      case "file_search":
      case "file_analysis":
        return this.config.fileSearchEnabled && this.adapter.isCapabilityAvailable(capability);
      case "image_generation":
      case "visual_generation":
        return (
          this.config.imageGenerationEnabled &&
          this.adapter.isCapabilityAvailable(capability)
        );
      case "vision":
        return this.config.visionEnabled && this.adapter.isCapabilityAvailable(capability);
      case "code_execution":
        return (
          this.config.codeExecutionEnabled &&
          this.adapter.isCapabilityAvailable(capability)
        );
      default:
        return this.adapter.isCapabilityAvailable(capability);
    }
  }

  getCapabilityRegistry() {
    return OPENAI_CAPABILITY_REGISTRY.filter((c) => this.isCapabilityAvailable(c.id));
  }

  async complete(request: BrainLLMCompleteRequest): Promise<BrainLLMCompleteResponse> {
    return this.adapter.complete(request);
  }

  async executeCapability(
    input: CapabilityExecutionInput,
  ): Promise<CapabilityExecutionResult> {
    if (!this.isCapabilityAvailable(input.capability)) {
      return {
        capability: input.capability,
        content: `[${input.capability}] capability unavailable — configure OpenAI Intelligence Platform.`,
        artifactType: "chat_response",
        metadata: { unavailable: true },
        success: false,
      };
    }
    return this.adapter.executeCapability({
      capability: input.capability,
      userMessage: input.userMessage,
      systemContext: input.systemContext,
      workspaceId: input.workspaceId,
      correlationId: input.correlationId,
    }).then((response) => ({
      capability: response.capability,
      content: response.content,
      artifactType: response.artifactType,
      metadata: response.metadata,
      success: response.success,
    }));
  }
}

export function createOpenAIIntelligencePlatform(
  adapter: IntelligencePlatformAdapter,
  config?: Partial<OpenAIPlatformConfig>,
): OpenAIIntelligencePlatform {
  return new OpenAIIntelligencePlatform(adapter, config);
}

/** Default capability execution via standard LLM completion (Brain adapter fallback). */
export function buildCapabilitySystemPrompt(
  capability: OpenAICapability,
  baseContext: string,
): string {
  const entry = OPENAI_CAPABILITY_REGISTRY.find((c) => c.id === capability);
  const header = entry
    ? `OpenAI Intelligence Platform · ${entry.label}: ${entry.description}`
    : `OpenAI Intelligence Platform · ${capability}`;

  const instructions: Record<OpenAICapability, string> = {
    gpt_reasoning:
      "Provide structured executive reasoning with clear conclusions.",
    general_knowledge:
      "Answer from general knowledge. Begin with [General Knowledge]. Do not add live-information disclaimers for historical facts.",
    web_search:
      "Simulate a web search research report. Begin with [Web Search Report]. Include citations as [1], [2]. Summarize current public information.",
    file_search:
      "Search the referenced executive documents. Begin with [File Search Results].",
    file_analysis:
      "Produce a structured file analysis report. Begin with [File Analysis Report].",
    image_generation:
      "Describe the image that would be generated. Begin with [Generated Image]. Include prompt and visual description.",
    visual_generation:
      "Route visual production through the EmpireAI Visual Generation Layer. Begin with [Visual Generation]. Include provider, design intent, and export format.",
    vision:
      "Analyze the referenced image. Begin with [Vision Report]. Describe contents and executive relevance.",
    code_execution:
      "Execute or simulate code execution. Begin with [Code Output]. Show logs and results.",
  };

  return [
    header,
    instructions[capability],
    "",
    baseContext,
  ].join("\n");
}
