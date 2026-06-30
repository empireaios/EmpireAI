import type {
  FulfillmentAttemptRecord,
  LiveCjFulfillmentRecord,
} from "../models/live-cj-fulfillment-record.js";

export interface LiveCjFulfillmentRepository {
  saveFulfillment(record: LiveCjFulfillmentRecord): LiveCjFulfillmentRecord;
  getFulfillmentById(fulfillmentId: string): LiveCjFulfillmentRecord | null;
  getFulfillmentByPipelineId(pipelineId: string): LiveCjFulfillmentRecord | null;
  listFulfillments(workspaceId: string, companyId?: string): LiveCjFulfillmentRecord[];

  saveAttempt(attempt: FulfillmentAttemptRecord): FulfillmentAttemptRecord;
  listAttempts(fulfillmentId: string): FulfillmentAttemptRecord[];
}
