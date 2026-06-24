import type { EyeConnector } from "../../connector-registry/models/eye-connector.js";
import type { ConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { ConnectorPollingSchedulerModule } from "../../connector-polling-scheduler/contract/connector-polling-scheduler-module.js";
import type { InvestigationPlan } from "../../autonomous-investigation-planner/models/investigation-plan.js";
import type { InvestigationTask } from "../../autonomous-investigation-planner/models/investigation-task.js";
import type { InvestigationExecution } from "../models/investigation-execution.js";
import type { InvestigationExecutionTask } from "../models/investigation-execution-task.js";
import type { ExecutionRepository } from "../repositories/execution-repository.js";
import { computeExecutionProgress } from "../models/investigation-execution.js";

export type InvestigationTaskRunOutcome = {
  success: boolean;
  reason: string;
  signalId?: string | null;
  pollingResultId?: string | null;
  pollingJobId?: string | null;
  durationMs: number;
};

export type InvestigationTaskRunner = (input: {
  workspaceId: string;
  plan: InvestigationPlan;
  task: InvestigationTask;
  assignedConnectorId: string | null;
}) => Promise<InvestigationTaskRunOutcome>;

export type InvestigationExecutionOptions = {
  maxRetries?: number;
  failTaskIds?: Set<string>;
};

const TASK_CONNECTOR_FALLBACK: Partial<Record<InvestigationTask["taskType"], string[]>> = {
  CHECK_TREND: ["google-trends", "youtube"],
  CHECK_SUPPLIER: ["cj-dropshipping"],
  CHECK_COMPETITOR: ["amazon", "shopify"],
  CHECK_MARKETPLACE: ["amazon", "shopify"],
  CHECK_SOCIAL: ["tiktok", "pinterest", "reddit"],
  CHECK_SEARCH: ["google-trends", "youtube"],
  CHECK_PRICING: ["amazon", "shopify"],
  CHECK_DEMAND: ["google-trends", "reddit", "tiktok"],
};

function nowIso(): string {
  return new Date().toISOString();
}

/** Resolves a connector for an investigation task. */
export function assignConnectorForTask(
  task: InvestigationTask,
  connectors: EyeConnector[],
): string | null {
  if (task.connectorId) {
    const direct = connectors.find((connector) => connector.connectorId === task.connectorId);
    if (direct && direct.status !== "DISABLED" && direct.status !== "PAUSED") {
      return direct.connectorId;
    }
  }

  const candidates = TASK_CONNECTOR_FALLBACK[task.taskType] ?? [];
  for (const connectorId of candidates) {
    const match = connectors.find((connector) => connector.connectorId === connectorId);
    if (match && match.status !== "DISABLED" && match.status !== "PAUSED") {
      return match.connectorId;
    }
  }

  return null;
}

/** Default task runner that delegates connector work to the polling scheduler. */
export function createPollingTaskRunner(
  pollingScheduler: ConnectorPollingSchedulerModule,
): InvestigationTaskRunner {
  return async ({ workspaceId, plan, task, assignedConnectorId }) => {
    const started = Date.now();

    if (!assignedConnectorId) {
      return {
        success: true,
        reason: "Investigation task completed without connector assignment",
        durationMs: Date.now() - started,
      };
    }

    const job = await pollingScheduler.createPollingJob(workspaceId, {
      connectorId: assignedConnectorId,
      productId: plan.productId,
      pollQuery: {
        investigationTaskId: task.taskId,
        taskType: task.taskType,
      },
    });

    await pollingScheduler.createPollingSchedule(workspaceId, {
      jobId: job.jobId,
      connectorId: assignedConnectorId,
      intervalSec: 3600,
      nextRunAt: nowIso(),
    });

    const pollResult = await pollingScheduler.triggerManualPoll(workspaceId, job.jobId);

    return {
      success: pollResult.status === "SUCCESS",
      reason: pollResult.reason,
      signalId: pollResult.signalId,
      pollingResultId: pollResult.resultId,
      pollingJobId: job.jobId,
      durationMs: Date.now() - started,
    };
  };
}

/** Executes investigation plans into completed investigations. */
export class InvestigationExecutionEngine {
  constructor(
    private readonly repository: ExecutionRepository,
    private readonly connectorRegistry: ConnectorRegistryModule,
    private readonly taskRunner: InvestigationTaskRunner,
  ) {}

  async startExecution(
    workspaceId: string,
    plan: InvestigationPlan,
    options: InvestigationExecutionOptions = {},
  ): Promise<InvestigationExecution> {
    const maxRetries = options.maxRetries ?? 2;
    const execution = await this.repository.createExecution(workspaceId, {
      investigationPlanId: plan.investigationPlanId,
      targetId: plan.targetId,
      productId: plan.productId,
      status: "PENDING",
      progressPercent: 0,
      completedTaskCount: 0,
      totalTaskCount: plan.tasks.length,
      retryCount: 0,
      maxRetries,
      startedAt: null,
      completedAt: null,
    });

    const connectors = await this.connectorRegistry.listConnectors(workspaceId);
    for (const task of plan.tasks) {
      await this.repository.createExecutionTask({
        executionId: execution.executionId,
        taskId: task.taskId,
        taskType: task.taskType,
        title: task.title,
        status: "PENDING",
        assignedConnectorId: assignConnectorForTask(task, connectors),
        stepsCompleted: 0,
        stepsTotal: task.steps.length,
        progressPercent: 0,
      });
    }

    return this.runExecution(workspaceId, plan, execution.executionId, options.failTaskIds);
  }

  async retryExecution(
    workspaceId: string,
    plan: InvestigationPlan,
    executionId: string,
  ): Promise<InvestigationExecution> {
    const execution = await this.repository.getExecutionById(workspaceId, executionId);
    if (!execution) {
      throw new Error(`Investigation execution not found: ${executionId}`);
    }
    if (execution.retryCount >= execution.maxRetries) {
      throw new Error(`Maximum retry attempts reached for execution: ${executionId}`);
    }

    await this.repository.updateExecution(workspaceId, executionId, {
      status: "RETRYING",
      retryCount: execution.retryCount + 1,
      completedAt: null,
    });

    const failedTasks = (await this.repository.listExecutionTasks(executionId)).filter(
      (task) => task.status === "FAILED",
    );

    for (const task of failedTasks) {
      await this.repository.updateExecutionTask(task.executionTaskId, {
        status: "PENDING",
        stepsCompleted: 0,
        progressPercent: 0,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      });
    }

    return this.runExecution(workspaceId, plan, executionId);
  }

  private async runExecution(
    workspaceId: string,
    plan: InvestigationPlan,
    executionId: string,
    failTaskIds?: Set<string>,
  ): Promise<InvestigationExecution> {
    const startedAt = nowIso();
    await this.repository.updateExecution(workspaceId, executionId, {
      status: "RUNNING",
      startedAt,
    });

    let completedTaskCount = 0;
    let failed = false;
    const connectors = await this.connectorRegistry.listConnectors(workspaceId);

    for (const taskId of plan.recommendedOrder) {
      const planTask = plan.tasks.find((task) => task.taskId === taskId);
      if (!planTask) {
        continue;
      }

      const executionTask = await this.repository.getExecutionTaskByTaskId(executionId, taskId);
      if (!executionTask || executionTask.status === "COMPLETED") {
        if (executionTask?.status === "COMPLETED") {
          completedTaskCount += 1;
        }
        continue;
      }

      const assignedConnectorId =
        executionTask.assignedConnectorId ?? assignConnectorForTask(planTask, connectors);

      await this.repository.updateExecutionTask(executionTask.executionTaskId, {
        status: "RUNNING",
        assignedConnectorId,
        startedAt: nowIso(),
      });

      const forcedFailure = failTaskIds?.has(taskId) ?? false;
      const outcome = forcedFailure
        ? {
            success: false,
            reason: "Forced investigation task failure",
            durationMs: 0,
          }
        : await this.taskRunner({
            workspaceId,
            plan,
            task: planTask,
            assignedConnectorId,
          });

      for (let step = 1; step <= planTask.steps.length; step += 1) {
        await this.repository.updateExecutionTask(executionTask.executionTaskId, {
          stepsCompleted: step,
          progressPercent: Math.round((step / planTask.steps.length) * 100),
        });
      }

      const result = await this.repository.recordResult({
        executionId,
        executionTaskId: executionTask.executionTaskId,
        taskId,
        status: outcome.success ? "SUCCESS" : "FAILED",
        reason: outcome.reason,
        signalId: outcome.signalId ?? null,
        pollingResultId: outcome.pollingResultId ?? null,
        stepsCompleted: planTask.steps.length,
        durationMs: outcome.durationMs,
      });

      if (outcome.success) {
        completedTaskCount += 1;
        await this.repository.updateExecutionTask(executionTask.executionTaskId, {
          status: "COMPLETED",
          pollingJobId: outcome.pollingJobId ?? executionTask.pollingJobId,
          lastResultId: result.resultId,
          progressPercent: 100,
          completedAt: nowIso(),
        });
      } else {
        failed = true;
        await this.repository.updateExecutionTask(executionTask.executionTaskId, {
          status: "FAILED",
          lastResultId: result.resultId,
          errorMessage: outcome.reason,
          completedAt: nowIso(),
        });
      }

      await this.repository.updateExecution(workspaceId, executionId, {
        completedTaskCount,
        progressPercent: computeExecutionProgress(completedTaskCount, plan.tasks.length),
      });
    }

    const finalStatus = failed ? "FAILED" : "COMPLETED";
    return this.repository.updateExecution(workspaceId, executionId, {
      status: finalStatus,
      completedTaskCount,
      progressPercent: computeExecutionProgress(completedTaskCount, plan.tasks.length),
      completedAt: nowIso(),
    });
  }
}

export const investigationExecution = {
  assignConnectorForTask,
  createPollingTaskRunner,
} as const;
