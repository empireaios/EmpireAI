import type { QueueJob } from "./types.js";

export class Scheduler {
  evaluateReadiness(job: QueueJob, now: string): QueueJob["status"] {
    if (
      job.status === "cancelled" ||
      job.status === "dead_lettered" ||
      job.status === "completed" ||
      job.status === "dispatched" ||
      job.status === "running" ||
      job.status === "waiting_dependency"
    ) {
      return job.status;
    }

    if (job.scheduledAt && job.scheduledAt > now) {
      return job.scheduledAt === job.enqueuedAt && job.priority === 0 ? "deferred" : "scheduled";
    }

    if (job.status === "scheduled" || job.status === "deferred" || job.status === "queued") {
      return "ready";
    }

    return job.status;
  }

  isScheduledReady(job: QueueJob, now: string): boolean {
    if (!job.scheduledAt) return true;
    return job.scheduledAt <= now;
  }
}
