import type { ContextTask } from "../context/types.js";

/** Canonical intelligence sources in deterministic priority order (Part A). */
export type IntelligenceSource =
  | "soul_file"
  | "ekls"
  | "openai_general"
  | "openai_web_search"
  | "marketplace_apis"
  | "supplier_apis"
  | "financial_apis"
  | "communication_apis";

/** OpenAI Intelligence Platform capabilities (Part D). */
export type OpenAICapability =
  | "gpt_reasoning"
  | "general_knowledge"
  | "web_search"
  | "file_search"
  | "file_analysis"
  | "image_generation"
  | "visual_generation"
  | "vision"
  | "code_execution";

/** EmpireAI permanent executive assets (Part F). */
export type EmpireAIArtifactType =
  | "chat_response"
  | "generated_image"
  | "generated_visual_asset"
  | "search_report"
  | "file_analysis"
  | "generated_document"
  | "vision_report"
  | "code_output";

export type ArtifactStatus = "draft" | "complete" | "failed";
export type ArtifactApprovalStatus = "none" | "pending" | "approved" | "rejected";

export interface EmpireAIArtifact {
  artifactId: string;
  artifactType: EmpireAIArtifactType;
  sourceTool: OpenAICapability | IntelligenceSource | "pillow";
  missionId: string | null;
  timestamp: string;
  owner: string;
  status: ArtifactStatus;
  destinationEngine: string | null;
  relatedBusinessEngine: string | null;
  approvalStatus: ArtifactApprovalStatus;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface IntelligenceRoutingInput {
  userMessage: string;
  contextTask: ContextTask;
  hasSoulContext: boolean;
  hasEklsContext: boolean;
  hasRepositoryAnswer: boolean;
  webSearchAvailable: boolean;
}

export interface IntelligenceRoutingDecision {
  /** Ordered sources to consult (may combine). */
  sources: IntelligenceSource[];
  primarySource: IntelligenceSource;
  capabilities: OpenAICapability[];
  primaryCapability: OpenAICapability;
  requiresLiveInformation: boolean;
  isRepositorySpecific: boolean;
  isHistoricalQuestion: boolean;
  combineSources: boolean;
  rationale: string;
}

export interface CapabilityExecutionInput {
  capability: OpenAICapability;
  userMessage: string;
  systemContext: string;
  workspaceId: string;
  correlationId: string;
  owner: string;
  missionId?: string | null;
}

export interface CapabilityExecutionResult {
  capability: OpenAICapability;
  content: string;
  artifactType: EmpireAIArtifactType;
  metadata: Record<string, unknown>;
  success: boolean;
}

export interface IntelligencePlatformResult {
  content: string;
  routing: IntelligenceRoutingDecision;
  artifacts: EmpireAIArtifact[];
  capabilitiesUsed: OpenAICapability[];
}

export interface RegisterArtifactInput {
  artifactType: EmpireAIArtifactType;
  sourceTool: EmpireAIArtifact["sourceTool"];
  missionId?: string | null;
  owner: string;
  status?: ArtifactStatus;
  destinationEngine?: string | null;
  relatedBusinessEngine?: string | null;
  approvalStatus?: ArtifactApprovalStatus;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ArtifactRegistrySnapshot {
  missionId: "PILLOW-IP-001";
  totalArtifacts: number;
  byType: Record<EmpireAIArtifactType, number>;
  recent: EmpireAIArtifact[];
}

export const INTELLIGENCE_SOURCE_PRIORITY: IntelligenceSource[] = [
  "soul_file",
  "ekls",
  "openai_general",
  "openai_web_search",
  "marketplace_apis",
  "supplier_apis",
  "financial_apis",
  "communication_apis",
];

export const OPENAI_CAPABILITY_REGISTRY: ReadonlyArray<{
  id: OpenAICapability;
  label: string;
  artifactType: EmpireAIArtifactType;
  description: string;
}> = [
  {
    id: "gpt_reasoning",
    label: "GPT Reasoning",
    artifactType: "chat_response",
    description: "Structured reasoning and executive analysis",
  },
  {
    id: "general_knowledge",
    label: "General Knowledge",
    artifactType: "chat_response",
    description: "Foundational knowledge from the OpenAI model",
  },
  {
    id: "web_search",
    label: "Web Search",
    artifactType: "search_report",
    description: "Current public information with citations",
  },
  {
    id: "file_search",
    label: "File Search",
    artifactType: "file_analysis",
    description: "Search uploaded executive documents",
  },
  {
    id: "file_analysis",
    label: "File Analysis",
    artifactType: "file_analysis",
    description: "Deep analysis of uploaded files",
  },
  {
    id: "image_generation",
    label: "Image Generation",
    artifactType: "generated_image",
    description: "Generate executive visual assets",
  },
  {
    id: "visual_generation",
    label: "Visual Generation",
    artifactType: "generated_visual_asset",
    description: "Produce branded designs and exports via EmpireAI Visual Generation Layer (Canva default)",
  },
  {
    id: "vision",
    label: "Vision",
    artifactType: "vision_report",
    description: "Image understanding and visual analysis",
  },
  {
    id: "code_execution",
    label: "Code Execution",
    artifactType: "code_output",
    description: "Execute code and return logs and outputs",
  },
];
