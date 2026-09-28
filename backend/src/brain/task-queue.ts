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

  /** A persistent owner key prevents two replicas from restoring each other's
   * queue. An uncertain restoration deliberately requires operator recovery. */
  async withPausedSharedProcessing<T>(capture: () => T | Promise<T>, timeoutMs = 30_000): Promise<T> {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) {
      throw new Error("Shared Brain drain timeout invalid");
    }
    // This installation creates BullMQ with ioredis (see redis-client.ts).
    const client = await this.queue.client as unknown as {
      set(key: string, value: string, mode: "NX"): Promise<string | null>;
      get(key: string): Promise<string | null>;
      eval(script: string, keyCount: number, key: string, owner: string): Promise<number>;
    };
    const key = `${this.queue.toKey("capture-owner")}`;
    const owner = randomUUID();
    if (await client.set(key, owner, "NX") !== "OK") {
      throw new Error("Shared Brain capture already owned; inspect before recovery");
    }
    let pausedByUs = false;
    let restored = false;
    let preexistingPause = false;
    try {
      if (await this.queue.isPaused()) {
        preexistingPause = true;
        throw new Error("Shared Brain queue already paused; ownership unknown");
      }
      await this.queue.pause();
      pausedByUs = true;
      // Pausing consumers does not stop a repeat scheduler from mutating Redis.
      // Refuse rather than treating a changing scheduler as a static snapshot.
      const noSchedulers = async () =>
        (await this.queue.getRepeatableJobs(0, 0)).length === 0 &&
        await this.queue.getJobSchedulersCount() === 0;
      if (!await noSchedulers()) throw new Error("Shared Brain repeat schedulers require a separate producer fence; no snapshot taken");
      const deadline = Date.now() + timeoutMs;
      while (await this.queue.getActiveCount() !== 0) {
        if (Date.now() >= deadline) throw new Error("Shared Brain jobs did not drain; no snapshot taken");
        await new Promise<void>(resolve => setTimeout(resolve, Math.min(100, Math.max(1, deadline - Date.now()))));
      }
      if (await client.get(key) !== owner || !await this.queue.isPaused() || !await noSchedulers()) {
        throw new Error("Shared Brain capture ownership or pause changed");
      }
      return await capture();
    } finally {
      if (pausedByUs && await client.get(key) === owner && await this.queue.isPaused()) {
        await this.queue.resume();
        restored = !await this.queue.isPaused();
      } else if (preexistingPause && await client.get(key) === owner) {
        restored = true;
      } else if (!pausedByUs && await client.get(key) === owner && !await this.queue.isPaused()) {
        restored = true;
      }
      if (restored) {
        await client.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", 1, key, owner);
      }
      if (!restored) throw new Error("Shared Brain queue restoration uncertain; capture owner retained for recovery");
    }
  }

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
