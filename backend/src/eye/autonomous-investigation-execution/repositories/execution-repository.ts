import type { ExecutionResult, ExecutionResultCreateInput } from "../models/execution-result.js";
import type {
  InvestigationExecution,
  InvestigationExecutionCreateInput,
  ExecutionStatus,
} from "../models/investigation-execution.js";
import type {
  InvestigationExecutionTask,
  InvestigationExecutionTaskCreateInput,
} from "../models/investigation-execution-task.js";

export type ExecutionRepositoryQuery = {
  workspaceId: string;
  investigationPlanId?: string;
  status?: ExecutionStatus;
  limit?: number;
  offset?: number;
};

/** Persists investigation executions, task states, and results. */
export interface ExecutionRepository {
  createExecution(
    workspaceId: string,
    input: InvestigationExecutionCreateInput,
  ): Promise<InvestigationExecution>;
  updateExecution(
    workspaceId: string,
    executionId: string,
    input: Partial<
      Pick<
        InvestigationExecution,
        | "status"
        | "progressPercent"
        | "completedTaskCount"
        | "retryCount"
        | "startedAt"
        | "completedAt"
      >
    >,
  ): Promise<InvestigationExecution>;
  getExecutionById(
    workspaceId: string,
    executionId: string,
  ): Promise<InvestigationExecution | null>;
  getExecutionByPlan(
    workspaceId: string,
    investigationPlanId: string,
  ): Promise<InvestigationExecution | null>;
  listExecutions(query: ExecutionRepositoryQuery): Promise<InvestigationExecution[]>;

  createExecutionTask(
    input: InvestigationExecutionTaskCreateInput & { executionId: string },
  ): Promise<InvestigationExecutionTask>;
  updateExecutionTask(
    executionTaskId: string,
    input: Partial<
      Pick<
        InvestigationExecutionTask,
        | "status"
        | "assignedConnectorId"
        | "stepsCompleted"
        | "progressPercent"
        | "pollingJobId"
        | "lastResultId"
        | "errorMessage"
        | "startedAt"
        | "completedAt"
      >
    >,
  ): Promise<InvestigationExecutionTask>;
  listExecutionTasks(executionId: string): Promise<InvestigationExecutionTask[]>;
  getExecutionTaskByTaskId(
    executionId: string,
    taskId: string,
  ): Promise<InvestigationExecutionTask | null>;

  recordResult(input: ExecutionResultCreateInput): Promise<ExecutionResult>;
  listResults(executionId: string): Promise<ExecutionResult[]>;
}
