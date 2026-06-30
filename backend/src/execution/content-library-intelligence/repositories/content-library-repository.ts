import type {
  ContentLibraryRecord,
  ContentLibraryRecordCreateInput,
} from "../models/content-library-record.js";

export type ContentLibraryRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for content library records. */
export type ContentLibraryRepository = {
  save(
    workspaceId: string,
    input: ContentLibraryRecordCreateInput,
  ): Promise<ContentLibraryRecord>;
  getById(workspaceId: string, recordId: string): Promise<ContentLibraryRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<ContentLibraryRecord | null>;
  list(query: ContentLibraryRepositoryQuery): Promise<ContentLibraryRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
