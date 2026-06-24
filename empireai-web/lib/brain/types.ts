export type BrainDispatchStatus = "queued" | "completed" | "requires_approval";

export type BrainDispatchResult<T = unknown> = {
  correlationId: string;
  status: BrainDispatchStatus;
  result?: T;
  taskId?: string;
};

export type BrainDispatchRequest = {
  module: string;
  action: string;
  companyId?: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
};

export type BrainError = {
  message: string;
  status?: number;
  retryable: boolean;
  correlationId?: string;
};

export type BrainEvent = {
  id: string;
  type: string;
  source: string;
  workspaceId: string;
  companyId?: string;
  payload: Record<string, unknown>;
  correlationId: string;
  timestamp: string;
};
