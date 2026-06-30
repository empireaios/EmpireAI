import type {
  EmailMarketingRecord,
  EmailMarketingRecordCreateInput,
} from "../models/email-marketing-record.js";

export type EmailMarketingRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for email marketing intelligence records. */
export type EmailMarketingRepository = {
  save(
    workspaceId: string,
    input: EmailMarketingRecordCreateInput,
  ): Promise<EmailMarketingRecord>;
  getById(workspaceId: string, recordId: string): Promise<EmailMarketingRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<EmailMarketingRecord | null>;
  list(query: EmailMarketingRepositoryQuery): Promise<EmailMarketingRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
