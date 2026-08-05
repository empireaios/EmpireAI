import { QRT_METADATA_VERSION } from "./paths.js";
import { nextQrtId } from "./queue-store.js";
import type { DispatchRecord, QueueJob } from "./types.js";

export class DispatchEngine {
  createDispatchRecord(job: QueueJob, timestamp: string): DispatchRecord {
    return {
      dispatchId: nextQrtId("qrt-dispatch"),
      jobId: job.jobId,
      queueId: job.queueId,
      queueName: job.queueName,
      timestamp,
      priority: job.priority,
      businessLogicExecuted: false,
      structuralSignalOnly: true,
      highRisk: job.highRisk,
      grandKingApproved: job.grandKingApproved,
      metadataVersion: QRT_METADATA_VERSION,
    };
  }

  selectNextReady(jobs: QueueJob[], limit = 1): QueueJob[] {
    return jobs.slice(0, limit);
  }
}
