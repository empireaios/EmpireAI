import { Queue, type ConnectionOptions, type JobsOptions } from "bullmq";
import { randomUUID } from "node:crypto";
import { logger } from "../config/logger.js";
import type { AuditLogger } from "./audit/audit-logger.js";
import type { BrainTaskPayload, BrainTaskType, TaskPriority } from "./types.js";

export const BRAIN_QUEUE_NAME = "empireai-brain-tasks";

const PRIORITY_MAP: Record<TaskPriority, number> = {
  critical: 1,
  high: 2,
  normal: 3,
  low: 4,
};

export type ScheduledJobDefinition = {
  name: string;
  cron: string;
  payload: BrainTaskPayload;
};

export interface BrainTaskQueue {
  enqueue(
    payload: Omit<BrainTaskPayload, "correlationId"> & {
      correlationId?: string;
    },
    options?: JobsOptions,
  ): Promise<{ jobId: string; correlationId: string }>;
  registerScheduledJob(definition: ScheduledJobDefinition): Promise<void>;
  getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }>;
  close(): Promise<void>;
}

export class TaskQueue implements BrainTaskQueue {
  readonly queue: Queue<BrainTaskPayload, unknown, BrainTaskType>;

  constructor(
    connection: ConnectionOptions,
    private readonly auditLogger: AuditLogger,
  ) {
    this.queue = new Queue<BrainTaskPayload, unknown, BrainTaskType>(
      BRAIN_QUEUE_NAME,
      {
        connection,
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 5000,
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
        },
      },
    );
  }

  async enqueue(
    payload: Omit<BrainTaskPayload, "correlationId"> & {
      correlationId?: string;
    },
    options?: JobsOptions,
  ): Promise<{ jobId: string; correlationId: string }> {
    const correlationId = payload.correlationId ?? randomUUID();
    const jobPayload: BrainTaskPayload = { ...payload, correlationId };

    const priority = payload.priority
      ? PRIORITY_MAP[payload.priority]
      : PRIORITY_MAP.normal;

    const job = await this.queue.add(payload.type, jobPayload, {
      ...options,
      priority,
      jobId: options?.jobId,
    });

    this.auditLogger.write({
      action: "task.enqueue",
      actor: "task-queue",
      workspaceId: payload.workspaceId,
      companyId: payload.companyId,
      agentId: payload.agentId,
      correlationId,
      metadata: { type: payload.type, jobId: job.id },
    });

    logger.info(
      { jobId: job.id, type: payload.type, correlationId },
      "Task enqueued",
    );

    return { jobId: job.id!, correlationId };
  }

  async registerScheduledJob(definition: ScheduledJobDefinition): Promise<void> {
    await this.queue.add(definition.payload.type, definition.payload, {
      repeat: { pattern: definition.cron },
      jobId: `schedule:${definition.name}`,
    });
  }

  async getStats() {
    return {
      waiting: await this.queue.getWaitingCount(),
      active: await this.queue.getActiveCount(),
      completed: await this.queue.getCompletedCount(),
      failed: await this.queue.getFailedCount(),
      delayed: await this.queue.getDelayedCount(),
    };
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export class DegradedTaskQueue implements BrainTaskQueue {
  constructor(private readonly auditLogger: AuditLogger) {}

  async enqueue(
    payload: Omit<BrainTaskPayload, "correlationId"> & {
      correlationId?: string;
    },
    _options?: JobsOptions,
  ): Promise<{ jobId: string; correlationId: string }> {
    const correlationId = payload.correlationId ?? randomUUID();
    const jobId = `degraded:${randomUUID()}`;

    this.auditLogger.write({
      action: "task.enqueue",
      actor: "task-queue",
      workspaceId: payload.workspaceId,
      companyId: payload.companyId,
      agentId: payload.agentId,
      correlationId,
      metadata: { type: payload.type, jobId, degraded: true },
    });

    logger.info(
      { jobId, type: payload.type, correlationId },
      "Task would enqueue (Redis unavailable — degraded mode)",
    );

    return { jobId, correlationId };
  }

  async registerScheduledJob(definition: ScheduledJobDefinition): Promise<void> {
    logger.info(
      { job: definition.name, cron: definition.cron, type: definition.payload.type },
      "Scheduled job would register (Redis unavailable — degraded mode)",
    );
  }

  async getStats() {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }

  async close(): Promise<void> {
    // no-op
  }
}
