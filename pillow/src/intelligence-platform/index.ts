export type {
  ArtifactApprovalStatus,
  ArtifactRegistrySnapshot,
  ArtifactStatus,
  CapabilityExecutionInput,
  CapabilityExecutionResult,
  EmpireAIArtifact,
  EmpireAIArtifactType,
  IntelligencePlatformResult,
  IntelligenceRoutingDecision,
  IntelligenceRoutingInput,
  IntelligenceSource,
  OpenAICapability,
  RegisterArtifactInput,
} from "./types.js";
export {
  INTELLIGENCE_SOURCE_PRIORITY,
  OPENAI_CAPABILITY_REGISTRY,
} from "./types.js";

export {
  isHistoricalQuestion,
  requiresCurrentInformation,
  routeIntelligence,
} from "./intelligence-routing.js";

export {
  capabilityForRepositoryQuestion,
  capabilityLabel,
  routeCapability,
  type CapabilityRouteInput,
  type CapabilityRouteResult,
} from "./capability-router.js";

export {
  ArtifactRegistry,
  createArtifactRegistry,
} from "./artifact-registry.js";

export {
  OpenAIIntelligencePlatform,
  buildCapabilitySystemPrompt,
  createOpenAIIntelligencePlatform,
  type IntelligencePlatformAdapter,
  type OpenAIPlatformConfig,
} from "./openai-platform.js";

export {
  IntelligencePlatformEngine,
  createIntelligencePlatformEngine,
  type IntelligencePlatformRequest,
} from "./engine.js";

export const PILLOW_INTELLIGENCE_PLATFORM_MISSION = "PILLOW-IP-001" as const;
