import type { QueueRuntimeConfiguration } from "./configuration.js";
import { DependencyResolver } from "./dependency-resolver.js";
import { DispatchEngine } from "./dispatch-engine.js";
import { PriorityEngine } from "./priority-engine.js";
import { RetryEngine } from "./retry-engine.js";
import { Scheduler } from "./scheduler.js";
import { nextQrtId, type QueueStore } from "./queue-store.js";
import { QRT_METADATA_VERSION } from "./paths.js";
import type { DispatchRecord, QueueDefinition, QueueJob, QrtInput } from "./types.js";

export class QueueManagerCore {
  private readonly priorityEngine = new PriorityEngine();
  private readonly dependencyResolver = new DependencyResolver();
  private readonly scheduler = new Scheduler();
  private readonly retryEngine = new RetryEngine();
  private readonly dispatchEngine = new DispatchEngine();

  resolveNow(input: QrtInput): string {
    return input.now ?? new Date().toISOString();
  }

  createQueue(
    store: QueueStore,
    input: QrtInput,
    config: QueueRuntimeConfiguration,
  ): QueueDefinition {
    const now = this.resolveNow(input);
    const queueName = input.queueName ?? `queue-${nextQrtId("qrt")}`;
    const existing = store.getQueueByName(queueName);
    if (existing) return existing;

    const queue: QueueDefinition = {
      queueId: nextQrtId("qrt-queue"),
      queueName,
      queueType: input.queueType ?? "fifo",
      paused: false,
      createdAt: now,
      updatedAt: now,
      maxRetries: input.maxRetries ?? config.defaultMaxRetries,
      metadataVersion: QRT_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };
    return store.saveQueue(queue);
  }

  enqueue(
    store: QueueStore,
    input: QrtInput,
    config: QueueRuntimeConfiguration,
    queue: QueueDefinition,
  ): QueueJob {
    const now = this.resolveNow(input);
    const jobId = input.jobId ?? nextQrtId("qrt-job");
    const existing = store.getJob(jobId);
    if (existing) return existing;

    let status: QueueJob["status"] = "queued";
    const scheduledAt = input.scheduledAt ?? null;
    const dependencyJobIds = [...(input.dependencyJobIds ?? [])];

    if (dependencyJobIds.length) {
      status = "waiting_dependency";
    } else if (scheduledAt && scheduledAt > now) {
      status = queue.queueType === "delayed" ? "deferred" : "scheduled";
    }

    const job: QueueJob = {
      jobId,
      queueId: queue.queueId,
      queueName: queue.queueName,
      jobPayloadRef: input.jobPayloadRef ?? `payload://${jobId}`,
      priority: input.priority ?? 0,
      scheduledAt,
      enqueuedAt: now,
      updatedAt: now,
      status,
      dependencyJobIds,
      retryCount: 0,
      maxRetries: input.maxRetries ?? queue.maxRetries ?? config.defaultMaxRetries,
      highRisk: input.highRisk ?? false,
      pillowConfirmed: input.pillowConfirmed ?? false,
      grandKingApproved: input.grandKingApproved ?? false,
      traceabilityRefs: [`enqueue:${now}`],
      metadataVersion: QRT_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };

    store.saveJob(job);
    return this.refreshJobStatus(store, job, now);
  }

  prioritize(store: QueueStore, input: QrtInput): QueueJob | null {
    if (!input.jobId || input.priority == null) return null;
    const job = store.getJob(input.jobId);
    if (!job) return null;
    const now = this.resolveNow(input);
    const updated: QueueJob = {
      ...job,
      priority: input.priority,
      updatedAt: now,
      traceabilityRefs: [...job.traceabilityRefs, `prioritize:${now}`],
    };
    store.saveJob(updated);
    return updated;
  }

  pauseQueue(store: QueueStore, queue: QueueDefinition, input: QrtInput): QueueDefinition {
    const now = this.resolveNow(input);
    const updated: QueueDefinition = { ...queue, paused: true, updatedAt: now };
    return store.saveQueue(updated);
  }

  resumeQueue(store: QueueStore, queue: QueueDefinition, input: QrtInput): QueueDefinition {
    const now = this.resolveNow(input);
    const updated: QueueDefinition = { ...queue, paused: false, updatedAt: now };
    return store.saveQueue(updated);
  }

  cancelJob(store: QueueStore, input: QrtInput): QueueJob | null {
    if (!input.jobId) return null;
    const job = store.getJob(input.jobId);
    if (!job) return null;
    const now = this.resolveNow(input);
    const updated: QueueJob = {
      ...job,
      status: "cancelled",
      updatedAt: now,
      traceabilityRefs: [...job.traceabilityRefs, `cancelled:${now}`],
    };
    return store.saveJob(updated);
  }

  refreshAllJobs(store: QueueStore, input: QrtInput, queueId?: string) {
    const now = this.resolveNow(input);
    for (const job of store.listJobs(queueId)) {
      this.refreshJobStatus(store, job, now);
    }
  }

  refreshJobStatus(store: QueueStore, job: QueueJob, now: string): QueueJob {
    if (
      job.status === "cancelled" ||
      job.status === "dead_lettered" ||
      job.status === "completed" ||
      job.status === "dispatched" ||
      job.status === "running" ||
      job.status === "failed" ||
      job.status === "retrying"
    ) {
      return job;
    }

    if (!this.dependencyResolver.areDependenciesSatisfied(store, job)) {
      return store.saveJob({ ...job, status: "waiting_dependency", updatedAt: now });
    }

    if (job.scheduledAt && job.scheduledAt > now) {
      const queue = store.getQueue(job.queueId);
      const status = queue?.queueType === "delayed" ? "deferred" : "scheduled";
      return store.saveJob({ ...job, status, updatedAt: now });
    }

    return store.saveJob({ ...job, status: "ready", updatedAt: now });
  }

  dispatchReady(
    store: QueueStore,
    input: QrtInput,
    queue: QueueDefinition,
  ): { dispatches: DispatchRecord[]; jobs: QueueJob[] } {
    if (queue.paused) return { dispatches: [], jobs: [] };

    const now = this.resolveNow(input);
    this.refreshAllJobs(store, input, queue.queueId);

    const readyJobs = this.priorityEngine.orderReadyJobs(store.listJobs(queue.queueId));
    const selected = this.dispatchEngine.selectNextReady(readyJobs, 1);
    const dispatches: DispatchRecord[] = [];
    const jobs: QueueJob[] = [];

    for (const job of selected) {
      if (job.highRisk && !job.grandKingApproved) continue;
      const dispatch = this.dispatchEngine.createDispatchRecord(job, now);
      store.saveDispatch(dispatch);
      dispatches.push(dispatch);

      const dispatched: QueueJob = {
        ...job,
        status: "dispatched",
        updatedAt: now,
        traceabilityRefs: [...job.traceabilityRefs, `dispatched:${dispatch.dispatchId}`],
      };
      store.saveJob(dispatched);
      jobs.push(dispatched);
    }

    return { dispatches, jobs };
  }

  retryFailed(store: QueueStore, input: QrtInput): QueueJob | null {
    if (!input.jobId) return null;
    const job = store.getJob(input.jobId);
    if (!job || job.status !== "failed") return null;
    if (!this.retryEngine.isEligibleForRetry(job)) return null;

    const now = this.resolveNow(input);
    const updated: QueueJob = {
      ...job,
      status: "retrying",
      retryCount: job.retryCount + 1,
      updatedAt: now,
      traceabilityRefs: [...job.traceabilityRefs, `retry:${now}`],
    };
    store.saveJob(updated);

    if (input.forceFail === true) {
      const failed: QueueJob = {
        ...updated,
        status: "failed",
        updatedAt: now,
        traceabilityRefs: [...updated.traceabilityRefs, `retry-failed:${now}`],
      };
      return store.saveJob(failed);
    }

    const ready: QueueJob = {
      ...updated,
      status: "ready",
      updatedAt: now,
      traceabilityRefs: [...updated.traceabilityRefs, `retry-ready:${now}`],
    };
    return store.saveJob(ready);
  }

  markJobFailed(store: QueueStore, input: QrtInput): QueueJob | null {
    if (!input.jobId) return null;
    const job = store.getJob(input.jobId);
    if (!job) return null;
    const now = this.resolveNow(input);
    const updated: QueueJob = {
      ...job,
      status: "failed",
      updatedAt: now,
      traceabilityRefs: [...job.traceabilityRefs, `failed:${now}`],
    };
    return store.saveJob(updated);
  }

  completeJob(store: QueueStore, jobId: string, input: QrtInput = {}): QueueJob | null {
    const job = store.getJob(jobId);
    if (!job) return null;
    const now = this.resolveNow(input);
    const updated: QueueJob = {
      ...job,
      status: "completed",
      updatedAt: now,
      traceabilityRefs: [...job.traceabilityRefs, `completed:${now}`],
    };
    store.saveJob(updated);
    this.refreshAllJobs(store, input, job.queueId);
    return updated;
  }

  moveToDeadLetter(store: QueueStore, input: QrtInput): QueueJob | null {
    if (!input.jobId) return null;
    const job = store.getJob(input.jobId);
    if (!job) return null;
    const now = this.resolveNow(input);
    const updated: QueueJob = {
      ...job,
      status: "dead_lettered",
      updatedAt: now,
      traceabilityRefs: [...job.traceabilityRefs, `dead_letter:${now}`],
    };
    return store.saveJob(updated);
  }

  getDependencyResolver() {
    return this.dependencyResolver;
  }

  getRetryEngine() {
    return this.retryEngine;
  }

  getPriorityEngine() {
    return this.priorityEngine;
  }
}
