/** PILLOW-016 — Pillow host types. */

import type { BrainLLMProviderName } from "@empireai/pillow";
import type { CommandResponse } from "@empireai/pillow";
import type { GovernanceKnowledgeDiagnostics } from "./governance-knowledge.js";

export type { GovernanceKnowledgeDiagnostics };

export type PillowHealthState =
  | "Running"
  | "Idle"
  | "Busy"
  | "Recovering"
  | "Error";

export type PillowHostLifecycle = "stopped" | "starting" | "running" | "stopping" | "error";

export interface ConversationTurn {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  requestId?: string;
  provider?: BrainLLMProviderName;
}

export interface TokenUsageSummary {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
}

export interface WorkspaceSession {
  sessionId: string;
  workspaceId: string;
  conversationHistory: ConversationTurn[];
  /** Placeholder until PILLOW-017 Approval Gate */
  approvalState: "none" | "pending" | "approved" | "rejected";
  repositoryFingerprint: string;
  currentMission: string | null;
  tokenUsage: TokenUsageSummary;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface PillowHostStatus {
  lifecycle: PillowHostLifecycle;
  health: PillowHealthState;
  startedAt: string | null;
  stoppedAt: string | null;
  lastHeartbeatAt: string | null;
  lastError: string | null;
  activeRequests: number;
  activeSessions: number;
  repositoryRoot: string | null;
  repositoryFingerprint: string | null;
  journeyPosition: string | null;
  currentMission: string | null;
  llmProviders: BrainLLMProviderName[];
  pillowVersion: string;
  missionId: "PILLOW-016";
  governanceKnowledge: GovernanceKnowledgeDiagnostics | null;
}

import type { PillowWorkspaceContext } from "./workspace-context.js";

export interface RoutePromptInput {
  workspaceId: string;
  sessionId: string;
  message: string;
  actor: string;
  correlationId: string;
  provider?: BrainLLMProviderName;
  /** Session-scoped Executive Companion workspace (not permanent memory). */
  workspaceContext?: PillowWorkspaceContext;
}

export type RoutePromptResultKind = "llm" | "command_fallback" | "error";

export interface RoutePromptResult {
  requestId: string;
  sessionId: string;
  workspaceId: string;
  message: string;
  kind: RoutePromptResultKind;
  provider?: BrainLLMProviderName;
  model?: string;
  mode?: string;
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  /** Stage timings for production trace (ms per stage). */
  trace?: Record<string, number>;
  command?: Pick<
    CommandResponse,
    "intent" | "category" | "plan" | "awareness"
  >;
  executiveRecommendation?: {
    recommendationId: string;
    debateId?: string;
    currentObjective: string | null;
    recommendation: string;
    reason: string;
    confidence: number;
    expectedProfitImpact: string;
    expectedEngineeringCost: string;
    expectedRisk: string;
    objectiveAlignment: string;
    status: string;
  };
  artifacts?: Array<{
    artifactId: string;
    artifactType: string;
    sourceTool: string;
    title: string;
    content: string;
    timestamp: string;
    status: string;
    metadata?: Record<string, unknown>;
  }>;
  intelligenceRouting?: {
    primarySource: string;
    primaryCapability: string;
    rationale: string;
  };
}

export interface PillowRequestLogEntry {
  requestId: string;
  sessionId: string;
  workspaceId: string;
  action: string;
  latencyMs: number;
  provider?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  result: "success" | "fallback" | "error";
  error?: string;
  timestamp: string;
}
