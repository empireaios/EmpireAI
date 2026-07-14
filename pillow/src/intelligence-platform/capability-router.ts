import type { ContextTask } from "../context/types.js";
import { routeIntelligence } from "./intelligence-routing.js";
import type {
  IntelligenceRoutingInput,
  OpenAICapability,
} from "./types.js";

export interface CapabilityRouteInput {
  userMessage: string;
  contextTask: ContextTask;
  hasSoulContext: boolean;
  hasEklsContext: boolean;
  hasRepositoryAnswer: boolean;
  webSearchAvailable: boolean;
}

export interface CapabilityRouteResult {
  capability: OpenAICapability;
  fallbackCapabilities: OpenAICapability[];
  intelligenceSources: ReturnType<typeof routeIntelligence>["sources"];
  rationale: string;
}

/**
 * Capability Router (Part E) — maps executive intent to the correct OpenAI capability
 * or business integration source.
 */
export function routeCapability(input: CapabilityRouteInput): CapabilityRouteResult {
  const routing = routeIntelligence(input as IntelligenceRoutingInput);
  const primary = routing.primaryCapability;
  const fallbacks = routing.capabilities.filter((c) => c !== primary);

  return {
    capability: primary,
    fallbackCapabilities: fallbacks,
    intelligenceSources: routing.sources,
    rationale: routing.rationale,
  };
}

export function capabilityForRepositoryQuestion(): OpenAICapability {
  return "gpt_reasoning";
}

export function capabilityLabel(capability: OpenAICapability): string {
  const labels: Record<OpenAICapability, string> = {
    gpt_reasoning: "GPT Reasoning",
    general_knowledge: "General Knowledge",
    web_search: "Web Search",
    file_search: "File Search",
    file_analysis: "File Analysis",
    image_generation: "Image Generation",
    visual_generation: "Visual Generation",
    vision: "Vision",
    code_execution: "Code Execution",
  };
  return labels[capability];
}
