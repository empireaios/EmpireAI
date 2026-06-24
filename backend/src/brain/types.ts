export type AuthorityLevel = "L0" | "L1" | "L2" | "L3" | "L4";

export type BrainEventType =
  | "request"
  | "signal"
  | "task_complete"
  | "escalation"
  | "approval_needed"
  | "workflow_started"
  | "workflow_completed"
  | "workflow_failed"
  | "agent_invoked"
  | "tool_executed"
  | "decision_made"
  | "memory_stored";

export type BrainEvent<TPayload = Record<string, unknown>> = {
  id: string;
  type: BrainEventType;
  source: string;
  target?: string;
  workspaceId: string;
  companyId?: string;
  agentId?: string;
  payload: TPayload;
  correlationId: string;
  timestamp: string;
};

export type TaskPriority = "critical" | "high" | "normal" | "low";

export type BrainTaskType =
  | "agent.run"
  | "workflow.run"
  | "tool.execute"
  | "scheduler.tick";

export type BrainTaskPayload = {
  type: BrainTaskType;
  workspaceId: string;
  companyId?: string;
  agentId?: string;
  workflowId?: string;
  toolName?: string;
  input: Record<string, unknown>;
  correlationId: string;
  priority?: TaskPriority;
};

export type LLMProviderName = "openai" | "anthropic" | "gemini";

export type LLMMessageRole = "system" | "user" | "assistant" | "tool";

export type LLMMessage = {
  role: LLMMessageRole;
  content: string;
  name?: string;
};

export type LLMCompletionRequest = {
  provider?: LLMProviderName;
  model?: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: LLMToolDefinition[];
  workspaceId: string;
  correlationId: string;
};

export type LLMToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type LLMCompletionResponse = {
  provider: LLMProviderName;
  model: string;
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

export type ToolContext = {
  workspaceId: string;
  companyId?: string;
  agentId: string;
  correlationId: string;
};

export type ToolHandler = (
  args: Record<string, unknown>,
  context: ToolContext,
) => Promise<unknown>;

export type RegisteredTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  module: string;
  authorityLevel: AuthorityLevel;
  handler: ToolHandler;
};

export type AgentDefinition = {
  id: string;
  name: string;
  role: string;
  module: string;
  description: string;
  systemPrompt: string;
  authorityLevel: AuthorityLevel;
  defaultProvider?: LLMProviderName;
  defaultModel?: string;
  tools: string[];
};

export type AgentRunRequest = {
  workspaceId: string;
  companyId?: string;
  agentId: string;
  objective: string;
  context?: Record<string, unknown>;
  correlationId?: string;
  provider?: LLMProviderName;
  model?: string;
};

export type AgentRunResult = {
  agentId: string;
  correlationId: string;
  output: string;
  toolResults: Array<{ tool: string; result: unknown }>;
  decisions: DecisionRecord[];
};

export type DecisionRecord = {
  id: string;
  agentId: string;
  action: string;
  authorityLevel: AuthorityLevel;
  approved: boolean;
  requiresFounderApproval: boolean;
  rationale: string;
  timestamp: string;
};

export type WorkflowStep = {
  id: string;
  agentId?: string;
  toolName?: string;
  input?: Record<string, unknown>;
  dependsOn?: string[];
};

export type WorkflowDefinition = {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
};

export type WorkflowRunRequest = {
  workflowId: string;
  workspaceId: string;
  companyId?: string;
  input?: Record<string, unknown>;
  correlationId?: string;
};

export type MemoryScope = "session" | "workspace" | "company" | "agent";

export type MemoryRecord = {
  id: string;
  scope: MemoryScope;
  workspaceId: string;
  companyId?: string;
  agentId?: string;
  key: string;
  value: unknown;
  embedding?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditAction =
  | "orchestrator.dispatch"
  | "agent.run"
  | "workflow.run"
  | "tool.execute"
  | "llm.complete"
  | "decision.evaluate"
  | "memory.write"
  | "event.publish"
  | "task.enqueue"
  | "scheduler.schedule"
  | "auth.login"
  | "auth.logout"
  | "auth.failed"
  | "guardian.block"
  | "guardian.health_check"
  | "guardian.risk_resolved";

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  actor: string;
  workspaceId: string;
  companyId?: string;
  agentId?: string;
  correlationId: string;
  metadata: Record<string, unknown>;
  timestamp: string;
};

export type OrchestratorDispatchRequest = {
  module: string;
  action: string;
  workspaceId: string;
  companyId?: string;
  payload: Record<string, unknown>;
  correlationId?: string;
};

export type OrchestratorDispatchResult = {
  correlationId: string;
  status: "queued" | "completed" | "requires_approval";
  result?: unknown;
  taskId?: string;
};
