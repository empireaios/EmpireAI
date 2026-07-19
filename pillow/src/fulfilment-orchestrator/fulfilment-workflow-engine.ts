/** R2-10 — Fulfilment Workflow Engine. */

import type { FulfilmentRecord, FulfilmentStatus } from "./types.js";

export class FulfilmentWorkflowEngine {
  advanceToInProgress(record: FulfilmentRecord): FulfilmentRecord {
    return { ...record, fulfilmentStatus: "in_progress" };
  }

  markFulfilled(record: FulfilmentRecord): FulfilmentRecord {
    return { ...record, fulfilmentStatus: "fulfilled", failureStatus: "none" };
  }

  markBlocked(record: FulfilmentRecord): FulfilmentRecord {
    return {
      ...record,
      fulfilmentStatus: "blocked",
      failureStatus: "workflow_blocked",
    };
  }

  markFailed(record: FulfilmentRecord, failureStatus: FulfilmentRecord["failureStatus"]): FulfilmentRecord {
    return {
      ...record,
      fulfilmentStatus: "failed",
      failureStatus,
    };
  }

  coordinateWorkflow(record: FulfilmentRecord): FulfilmentRecord {
    if (record.fulfilmentStatus === "routed") {
      return this.advanceToInProgress(record);
    }
    if (record.fulfilmentStatus === "in_progress") {
      return this.markFulfilled(record);
    }
    return record;
  }
}
