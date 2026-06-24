import type { BrainTaskQueue } from "./task-queue.js";
import type { AuditLogger } from "./audit/audit-logger.js";
import type { BrainTaskPayload } from "./types.js";
import { logger } from "../config/logger.js";

export type ScheduledJobDefinition = {
  name: string;
  cron: string;
  payload: BrainTaskPayload;
};

export class BrainScheduler {
  constructor(
    private readonly taskQueue: BrainTaskQueue,
    private readonly auditLogger: AuditLogger,
  ) {}

  async register(definition: ScheduledJobDefinition): Promise<void> {
    await this.taskQueue.registerScheduledJob(definition);

    this.auditLogger.write({
      action: "scheduler.schedule",
      actor: "scheduler",
      workspaceId: definition.payload.workspaceId,
      companyId: definition.payload.companyId,
      agentId: definition.payload.agentId,
      correlationId: definition.payload.correlationId,
      metadata: { name: definition.name, cron: definition.cron },
    });

    logger.info({ job: definition.name, cron: definition.cron }, "Scheduled job registered");
  }

  async start(): Promise<void> {
    logger.info("Brain scheduler active (repeat jobs registered in queue)");
  }

  async close(): Promise<void> {
    // Repeat jobs live in the main queue; closed with TaskQueue
  }
}
