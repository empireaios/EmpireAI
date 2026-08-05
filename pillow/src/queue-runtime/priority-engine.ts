import type { QueueJob } from "./types.js";

/**
 * Pure priority comparator — deterministic ordering:
 * priority desc, scheduledAt asc, enqueuedAt asc, jobId asc
 */
export function compareJobs(a: QueueJob, b: QueueJob): number {
  if (a.priority !== b.priority) return b.priority - a.priority;
  const aSched = a.scheduledAt ?? "9999-12-31T23:59:59.999Z";
  const bSched = b.scheduledAt ?? "9999-12-31T23:59:59.999Z";
  if (aSched !== bSched) return aSched.localeCompare(bSched);
  if (a.enqueuedAt !== b.enqueuedAt) return a.enqueuedAt.localeCompare(b.enqueuedAt);
  return a.jobId.localeCompare(b.jobId);
}

export function sortJobsDeterministic(jobs: QueueJob[]): QueueJob[] {
  return [...jobs].sort(compareJobs);
}

export class PriorityEngine {
  orderReadyJobs(jobs: QueueJob[]): QueueJob[] {
    return sortJobsDeterministic(jobs.filter((j) => j.status === "ready"));
  }

  orderQueuedJobs(jobs: QueueJob[]): QueueJob[] {
    return sortJobsDeterministic(jobs.filter((j) => j.status === "queued" || j.status === "ready"));
  }
}
