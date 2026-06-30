import type {
  CustomerJourneyRecord,
  CustomerJourneyRecordCreateInput,
} from "../models/customer-journey-record.js";

export type CustomerJourneyRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for customer journey intelligence records. */
export type CustomerJourneyRepository = {
  save(
    workspaceId: string,
    input: CustomerJourneyRecordCreateInput,
  ): Promise<CustomerJourneyRecord>;
  getById(workspaceId: string, recordId: string): Promise<CustomerJourneyRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<CustomerJourneyRecord | null>;
  list(query: CustomerJourneyRepositoryQuery): Promise<CustomerJourneyRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
