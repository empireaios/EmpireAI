import { randomUUID } from "node:crypto";

import type { ExecutionResult, ExecutionResultCreateInput } from "../models/execution-result.js";
import {
  computeExecutionProgress,
  type InvestigationExecution,
  type InvestigationExecutionCreateInput,
} from "../models/investigation-execution.js";
import type {
  InvestigationExecutionTask,
  InvestigationExecutionTaskCreateInput,
} from "../models/investigation-execution-task.js";
import type { ExecutionRepository, ExecutionRepositoryQuery } from "./execution-repository.js";

function executionKey(workspaceId: string, executionId: string): string {
  return `${workspaceId}:execution:${executionId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory ExecutionRepository for Mission 041 tests and local development. */
export class InMemoryExecutionRepository implements ExecutionRepository {
  private readonly executions = new Map<string, InvestigationExecution>();
  private readonly planIndex = new Map<string, string>();
  private readonly tasks = new Map<string, InvestigationExecutionTask>();
  private readonly taskIndex = new Map<string, string>();
  private readonly results = new Map<string, ExecutionResult>();

  async createExecution(
    workspaceId: string,
    input: InvestigationExecutionCreateInput,
  ): Promise<InvestigationExecution> {
    const timestamp = nowIso();
    const execution: InvestigationExecution = {
      executionId: randomUUID(),
      workspaceId,
      investigationPlanId: input.investigationPlanId,
      targetId: input.targetId,
      productId: input.productId,
      status: input.status,
      progressPercent: input.progressPercent,
      completedTaskCount: input.completedTaskCount,
      totalTaskCount: input.totalTaskCount,
      retryCount: input.retryCount,
      maxRetries: input.maxRetries,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.executions.set(executionKey(workspaceId, execution.executionId), execution);
    this.planIndex.set(`${workspaceId}:${input.investigationPlanId}`, execution.executionId);
    return structuredClone(execution);
  }

  async updateExecution(
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
  ): Promise<InvestigationExecution> {
    const key = executionKey(workspaceId, executionId);
    const existing = this.executions.get(key);
    if (!existing) {
      throw new Error(`Investigation execution not found: ${executionId}`);
    }

    const updated: InvestigationExecution = {
      ...existing,
      status: input.status ?? existing.status,
      progressPercent: input.progressPercent ?? existing.progressPercent,
      completedTaskCount: input.completedTaskCount ?? existing.completedTaskCount,
      retryCount: input.retryCount ?? existing.retryCount,
      startedAt: input.startedAt === undefined ? existing.startedAt : input.startedAt,
      completedAt: input.completedAt === undefined ? existing.completedAt : input.completedAt,
      updatedAt: nowIso(),
    };
    this.executions.set(key, updated);
    return structuredClone(updated);
  }

  async getExecutionById(
    workspaceId: string,
    executionId: string,
  ): Promise<InvestigationExecution | null> {
    const execution = this.executions.get(executionKey(workspaceId, executionId));
    return execution ? structuredClone(execution) : null;
  }

  async getExecutionByPlan(
    workspaceId: string,
    investigationPlanId: string,
  ): Promise<InvestigationExecution | null> {
    const executionId = this.planIndex.get(`${workspaceId}:${investigationPlanId}`);
    if (!executionId) {
      return null;
    }
    return this.getExecutionById(workspaceId, executionId);
  }

  async listExecutions(query: ExecutionRepositoryQuery): Promise<InvestigationExecution[]> {
    let results = [...this.executions.values()].filter(
      (execution) => execution.workspaceId === query.workspaceId,
    );

    if (query.investigationPlanId) {
      results = results.filter(
        (execution) => execution.investigationPlanId === query.investigationPlanId,
      );
    }
    if (query.status) {
      results = results.filter((execution) => execution.status === query.status);
    }

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.productId.localeCompare(right.productId),
    );

    return paginate(results.map((execution) => structuredClone(execution)), query.limit, query.offset);
  }

  async createExecutionTask(
    input: InvestigationExecutionTaskCreateInput & { executionId: string },
  ): Promise<InvestigationExecutionTask> {
    const task: InvestigationExecutionTask = {
      executionTaskId: randomUUID(),
      executionId: input.executionId,
      taskId: input.taskId,
      taskType: input.taskType,
      title: input.title,
      status: input.status,
      assignedConnectorId: input.assignedConnectorId,
      stepsCompleted: input.stepsCompleted,
      stepsTotal: input.stepsTotal,
      progressPercent: input.progressPercent,
      pollingJobId: input.pollingJobId ?? null,
      lastResultId: null,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    };

    this.tasks.set(task.executionTaskId, task);
    this.taskIndex.set(`${input.executionId}:${input.taskId}`, task.executionTaskId);
    return structuredClone(task);
  }

  async updateExecutionTask(
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
  ): Promise<InvestigationExecutionTask> {
    const existing = this.tasks.get(executionTaskId);
    if (!existing) {
      throw new Error(`Investigation execution task not found: ${executionTaskId}`);
    }

    const updated: InvestigationExecutionTask = {
      ...existing,
      status: input.status ?? existing.status,
      assignedConnectorId:
        input.assignedConnectorId === undefined
          ? existing.assignedConnectorId
          : input.assignedConnectorId,
      stepsCompleted: input.stepsCompleted ?? existing.stepsCompleted,
      progressPercent: input.progressPercent ?? existing.progressPercent,
      pollingJobId: input.pollingJobId === undefined ? existing.pollingJobId : input.pollingJobId,
      lastResultId: input.lastResultId === undefined ? existing.lastResultId : input.lastResultId,
      errorMessage: input.errorMessage === undefined ? existing.errorMessage : input.errorMessage,
      startedAt: input.startedAt === undefined ? existing.startedAt : input.startedAt,
      completedAt: input.completedAt === undefined ? existing.completedAt : input.completedAt,
    };
    this.tasks.set(executionTaskId, updated);
    return structuredClone(updated);
  }

  async listExecutionTasks(executionId: string): Promise<InvestigationExecutionTask[]> {
    return [...this.tasks.values()]
      .filter((task) => task.executionId === executionId)
      .map((task) => structuredClone(task));
  }

  async getExecutionTaskByTaskId(
    executionId: string,
    taskId: string,
  ): Promise<InvestigationExecutionTask | null> {
    const executionTaskId = this.taskIndex.get(`${executionId}:${taskId}`);
    if (!executionTaskId) {
      return null;
    }
    const task = this.tasks.get(executionTaskId);
    return task ? structuredClone(task) : null;
  }

  async recordResult(input: ExecutionResultCreateInput): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      resultId: randomUUID(),
      executionId: input.executionId,
      executionTaskId: input.executionTaskId,
      taskId: input.taskId,
      status: input.status,
      reason: input.reason,
      signalId: input.signalId ?? null,
      pollingResultId: input.pollingResultId ?? null,
      stepsCompleted: input.stepsCompleted,
      durationMs: input.durationMs,
      executedAt: input.executedAt ?? nowIso(),
    };

    this.results.set(result.resultId, result);

    const task = this.tasks.get(input.executionTaskId);
    if (task) {
      task.lastResultId = result.resultId;
      this.tasks.set(input.executionTaskId, task);
    }

    return structuredClone(result);
  }

  async listResults(executionId: string): Promise<ExecutionResult[]> {
    return [...this.results.values()]
      .filter((result) => result.executionId === executionId)
      .sort((left, right) => right.executedAt.localeCompare(left.executedAt))
      .map((result) => structuredClone(result));
  }
}

/** Factory for a fresh in-memory execution repository. */
export function createInMemoryExecutionRepository(): InMemoryExecutionRepository {
  return new InMemoryExecutionRepository();
}
