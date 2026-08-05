import type { QueueStore } from "./queue-store.js";
import type { QueueJob } from "./types.js";

export class DependencyResolver {
  areDependenciesSatisfied(store: QueueStore, job: QueueJob): boolean {
    if (!job.dependencyJobIds.length) return true;
    return job.dependencyJobIds.every((depId) => {
      const dep = store.getJob(depId);
      return dep?.status === "completed";
    });
  }

  resolveStatus(store: QueueStore, job: QueueJob): QueueJob["status"] {
    if (job.status === "cancelled" || job.status === "dead_lettered" || job.status === "completed") {
      return job.status;
    }
    if (!this.areDependenciesSatisfied(store, job)) {
      return "waiting_dependency";
    }
    return job.status;
  }

  summarize(store: QueueStore, jobs: QueueJob[]) {
    let totalDependencies = 0;
    let satisfiedDependencies = 0;
    let blockedJobs = 0;
    let readyJobs = 0;

    for (const job of jobs) {
      totalDependencies += job.dependencyJobIds.length;
      for (const depId of job.dependencyJobIds) {
        const dep = store.getJob(depId);
        if (dep?.status === "completed") satisfiedDependencies += 1;
      }
      if (job.status === "waiting_dependency") blockedJobs += 1;
      if (job.status === "ready") readyJobs += 1;
    }

    return { totalDependencies, satisfiedDependencies, blockedJobs, readyJobs };
  }
}
