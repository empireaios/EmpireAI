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
