import type {
  MobileMessagingRecord,
  MobileMessagingRecordCreateInput,
} from "../models/mobile-messaging-record.js";

export type MobileMessagingRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for mobile messaging intelligence records. */
export type MobileMessagingRepository = {
  save(
    workspaceId: string,
    input: MobileMessagingRecordCreateInput,
  ): Promise<MobileMessagingRecord>;
  getById(workspaceId: string, recordId: string): Promise<MobileMessagingRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<MobileMessagingRecord | null>;
  list(query: MobileMessagingRepositoryQuery): Promise<MobileMessagingRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
