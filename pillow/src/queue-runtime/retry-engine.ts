import type { QueueJob } from "./types.js";

export class RetryEngine {
  isEligibleForRetry(job: QueueJob): boolean {
    return job.status === "failed" && job.retryCount < job.maxRetries;
  }

  shouldDeadLetter(job: QueueJob): boolean {
    return job.status === "failed" && job.retryCount >= job.maxRetries;
  }

  nextRetryStatus(job: QueueJob): QueueJob["status"] {
    if (this.isEligibleForRetry(job)) return "retrying";
    if (this.shouldDeadLetter(job)) return "dead_lettered";
    return job.status;
  }

  summarize(jobs: QueueJob[]) {
    let totalRetries = 0;
    let jobsRetried = 0;
    let jobsDeadLettered = 0;
    let maxRetriesObserved = 0;

    for (const job of jobs) {
      totalRetries += job.retryCount;
      if (job.retryCount > 0) jobsRetried += 1;
      if (job.status === "dead_lettered") jobsDeadLettered += 1;
      if (job.retryCount > maxRetriesObserved) maxRetriesObserved = job.retryCount;
    }

    return { totalRetries, jobsRetried, jobsDeadLettered, maxRetriesObserved };
  }
}
