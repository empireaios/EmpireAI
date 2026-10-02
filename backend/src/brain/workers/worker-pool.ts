import { Worker, type ConnectionOptions, type Job } from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { BRAIN_QUEUE_NAME } from "../task-queue.js";
import type { BrainTaskPayload, BrainTaskType } from "../types.js";
import { processBrainTask, type WorkerProcessorDeps } from "./processor.js";

export class BrainWorkerPool {
  private worker: Worker<BrainTaskPayload, unknown, BrainTaskType> | null =
    null;
  private capturePaused = false;

  constructor(
    private readonly connection: ConnectionOptions | null,
    private readonly deps: WorkerProcessorDeps,
  ) {}

  start(): void {
    if (this.capturePaused) throw new Error("Brain worker capture pause active");
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
    if (this.capturePaused) throw new Error("Brain worker capture pause active; stop must wait");
    await this.worker?.close();
    this.worker = null;
  }

  /** Pause this process's BullMQ consumer and drain in-flight jobs before a
   * caller's capture. Redis producers and other consumers need separate gates.
   */
  async withPausedProcessing<T>(capture: () => T | Promise<T>, timeoutMs = 30_000): Promise<T> {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000 || this.capturePaused) {
      throw new Error("Brain worker capture pause unavailable or timeout invalid");
    }
    this.capturePaused = true;
    const worker = this.worker;
    if (!worker) {
      try { return await capture(); }
      finally { this.capturePaused = false; }
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let drained = false;
    let pause: Promise<void> | undefined;
    try {
      pause = worker.pause(false);
      await Promise.race([
        pause.then(() => { drained = true; }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Brain worker drain timed out; no snapshot taken")), timeoutMs);
        }),
      ]);
      if (this.worker !== worker) throw new Error("Brain worker identity changed during capture");
      return await capture();
    } finally {
      if (timer) clearTimeout(timer);
      if (drained) {
        worker.resume();
        this.capturePaused = false;
      } else if (pause) {
        // A timed-out pause may still be draining active work. Keep capture
        // unavailable until that same pause resolves, then restore the worker.
        void pause.then(() => worker.resume()).catch(error =>
          logger.error({ error: error instanceof Error ? error.message : String(error) },
            "Brain worker failed to resume after capture drain refusal"))
          .finally(() => { this.capturePaused = false; });
      } else this.capturePaused = false;
    }
  }

  isActive(): boolean {
    return this.worker != null;
  }
}
