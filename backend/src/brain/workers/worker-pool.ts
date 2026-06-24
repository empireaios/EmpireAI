import { Worker, type ConnectionOptions, type Job } from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { BRAIN_QUEUE_NAME } from "../task-queue.js";
import type { BrainTaskPayload, BrainTaskType } from "../types.js";
import { processBrainTask, type WorkerProcessorDeps } from "./processor.js";

export class BrainWorkerPool {
  private worker: Worker<BrainTaskPayload, unknown, BrainTaskType> | null =
    null;

  constructor(
    private readonly connection: ConnectionOptions | null,
    private readonly deps: WorkerProcessorDeps,
  ) {}

  start(): void {
    if (!this.connection) {
      logger.info("Brain worker pool skipped (Redis unavailable — degraded mode)");
      return;
    }
    this.worker = new Worker<BrainTaskPayload, unknown, BrainTaskType>(
      BRAIN_QUEUE_NAME,
      async (job: Job<BrainTaskPayload, unknown, BrainTaskType>) => {
        logger.info(
          {
            jobId: job.id,
            type: job.data.type,
            correlationId: job.data.correlationId,
          },
          "Processing brain task",
        );
        return processBrainTask(job.data, this.deps);
      },
      {
        connection: this.connection,
        concurrency: env.WORKER_CONCURRENCY,
      },
    );

    this.worker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Brain task completed");
    });

    this.worker.on("failed", (job, error) => {
      logger.error(
        { jobId: job?.id, error: error.message },
        "Brain task failed",
      );
    });

    logger.info(
      { concurrency: env.WORKER_CONCURRENCY },
      "Brain worker pool started",
    );
  }

  async stop(): Promise<void> {
    await this.worker?.close();
    this.worker = null;
  }

  isActive(): boolean {
    return this.worker != null;
  }
}
