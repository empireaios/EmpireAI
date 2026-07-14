export type PillowHealth = "Running" | "Idle" | "Busy" | "Recovering" | "Error";

export type PillowHostStatus = {
  lifecycle: string;
  health: PillowHealth;
  repositoryRoot: string | null;
  repositoryFingerprint: string | null;
  journeyPosition: string | null;
  currentMission: string | null;
  llmProviders: string[];
  missionId: string;
};

export type PillowWorkspaceSession = {
  sessionId: string;
  workspaceId: string;
  conversationHistory: PillowTurn[];
  approvalState: string;
  repositoryFingerprint: string;
  currentMission: string | null;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requestCount: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type PillowTurn = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  requestId?: string;
  provider?: string;
};

export type PillowChatArtifact = {
  artifactId: string;
  artifactType: string;
  sourceTool: string;
  title: string;
  content: string;
  timestamp: string;
  status: string;
  metadata?: Record<string, unknown>;
};

export type PillowChatResult = {
  requestId: string;
  sessionId: string;
  message: string;
  kind: "llm" | "command_fallback" | "error";
  provider?: string;
  latencyMs: number;
  command?: {
    intent: string;
    category: string;
    plan?: { objective: string; steps?: Array<{ label: string }> };
    awareness?: {
      journeyPosition: string | null;
      currentMission: string | null;
      repositoryHealthScore: number;
    };
  };
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
  artifacts?: PillowChatArtifact[];
  intelligenceRouting?: {
    primarySource: string;
    primaryCapability: string;
    rationale: string;
  };
};

export type PillowApproval = {
  approvalId: string;
  type: string;
  status: string;
  proposal: {
    title: string;
    summary: string;
    missionId?: string;
    evidence?: string[];
  };
  createdAt: string;
};
