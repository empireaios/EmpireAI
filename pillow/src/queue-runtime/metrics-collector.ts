import type { QueueStore } from "./queue-store.js";
import type { QueueHealth } from "./types.js";

export class MetricsCollector {
  collect(store: QueueStore): {
    totalQueues: number;
    totalJobs: number;
    activeJobs: number;
    waitingJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalDispatches: number;
    pausedQueues: number;
  } {
    const queues = store.listQueues();
    const jobs = store.listJobs();
    const dispatches = store.listDispatches();

    return {
      totalQueues: queues.length,
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => ["queued", "ready", "scheduled", "deferred"].includes(j.status)).length,
      waitingJobs: jobs.filter((j) => j.status === "waiting_dependency").length,
      runningJobs: jobs.filter((j) => ["dispatched", "running", "retrying"].includes(j.status)).length,
      completedJobs: jobs.filter((j) => j.status === "completed").length,
      failedJobs: jobs.filter((j) => j.status === "failed" || j.status === "dead_lettered").length,
      totalDispatches: dispatches.length,
      pausedQueues: queues.filter((q) => q.paused).length,
    };
  }

  buildHealth(store: QueueStore): QueueHealth {
    const metrics = this.collect(store);
    const backlogSize = metrics.activeJobs + metrics.waitingJobs;
    const healthScore = Math.max(0, 100 - metrics.failedJobs * 5 - metrics.pausedQueues * 10);

    let status: QueueHealth["status"] = "healthy";
    if (metrics.failedJobs > 0) status = "degraded";
    if (metrics.pausedQueues > 0 && metrics.activeJobs === 0) status = "standby";

    return {
      status,
      healthScore,
      pausedQueues: metrics.pausedQueues,
      activeQueues: metrics.totalQueues - metrics.pausedQueues,
      backlogSize,
      notes: [
        `Queues: ${metrics.totalQueues}, Jobs: ${metrics.totalJobs}, Dispatches: ${metrics.totalDispatches}`,
      ],
    };
  }
}
