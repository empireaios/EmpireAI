import type {
  DispatchRecord,
  QueueDefinition,
  QueueJob,
  QueueRuntimeReport,
} from "./types.js";

let sequence = 0;

export function resetQrtSequenceForTesting() {
  sequence = 0;
}

export function nextQrtId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export class QueueStore {
  private queues = new Map<string, QueueDefinition>();
  private jobs = new Map<string, QueueJob>();
  private dispatches: DispatchRecord[] = [];
  private reports: QueueRuntimeReport[] = [];
  private auditTrail: string[] = [];

  saveQueue(queue: QueueDefinition) {
    this.queues.set(queue.queueId, { ...queue });
    this.auditTrail.push(`queue_saved:${queue.queueId}@${queue.updatedAt}`);
    return queue;
  }

  getQueue(queueId: string) {
    const queue = this.queues.get(queueId);
    return queue ? { ...queue } : null;
  }

  getQueueByName(queueName: string) {
    for (const queue of this.queues.values()) {
      if (queue.queueName === queueName) return { ...queue };
    }
    return null;
  }

  listQueues() {
    return [...this.queues.values()].map((q) => ({ ...q }));
  }

  saveJob(job: QueueJob) {
    this.jobs.set(job.jobId, {
      ...job,
      dependencyJobIds: [...job.dependencyJobIds],
      traceabilityRefs: [...job.traceabilityRefs],
    });
    this.auditTrail.push(`job_saved:${job.jobId}@${job.updatedAt}`);
    return job;
  }

  getJob(jobId: string) {
    const job = this.jobs.get(jobId);
    return job
      ? {
          ...job,
          dependencyJobIds: [...job.dependencyJobIds],
          traceabilityRefs: [...job.traceabilityRefs],
        }
      : null;
  }

  listJobs(queueId?: string) {
    const list = queueId
      ? [...this.jobs.values()].filter((j) => j.queueId === queueId)
      : [...this.jobs.values()];
    return list.map((j) => ({
      ...j,
      dependencyJobIds: [...j.dependencyJobIds],
      traceabilityRefs: [...j.traceabilityRefs],
    }));
  }

  saveDispatch(dispatch: DispatchRecord) {
    this.dispatches.push({ ...dispatch });
    this.auditTrail.push(`dispatch:${dispatch.dispatchId}@${dispatch.timestamp}`);
    return dispatch;
  }

  listDispatches(queueId?: string) {
    const list = queueId
      ? this.dispatches.filter((d) => d.queueId === queueId)
      : this.dispatches;
    return list.map((d) => ({ ...d }));
  }

  saveReport(report: QueueRuntimeReport) {
    this.reports.push({
      ...report,
      queueInventory: report.queueInventory.map((q) => ({ ...q })),
      activeJobs: report.activeJobs.map((j) => ({
        ...j,
        dependencyJobIds: [...j.dependencyJobIds],
        traceabilityRefs: [...j.traceabilityRefs],
      })),
      waitingJobs: report.waitingJobs.map((j) => ({
        ...j,
        dependencyJobIds: [...j.dependencyJobIds],
        traceabilityRefs: [...j.traceabilityRefs],
      })),
      runningJobs: report.runningJobs.map((j) => ({
        ...j,
        dependencyJobIds: [...j.dependencyJobIds],
        traceabilityRefs: [...j.traceabilityRefs],
      })),
      completedJobs: report.completedJobs.map((j) => ({
        ...j,
        dependencyJobIds: [...j.dependencyJobIds],
        traceabilityRefs: [...j.traceabilityRefs],
      })),
      failedJobs: report.failedJobs.map((j) => ({
        ...j,
        dependencyJobIds: [...j.dependencyJobIds],
        traceabilityRefs: [...j.traceabilityRefs],
      })),
      supportingEvidence: [...report.supportingEvidence],
      outstandingIssues: [...report.outstandingIssues],
    });
    this.auditTrail.push(`report:${report.reportId}@${report.timestamp}`);
    return report;
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  getAuditTrail() {
    return [...this.auditTrail];
  }

  getHistory() {
    return {
      queues: this.listQueues(),
      jobs: this.listJobs(),
      dispatches: this.listDispatches(),
      reports: this.listReports(),
    };
  }
}
