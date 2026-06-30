import type {
  CompanyManufacturingRecord,
  CompanyManufacturingRecordCreateInput,
} from "../models/company-manufacturing-record.js";

export type CompanyManufacturingRepositoryQuery = {
  workspaceId: string;
  productId?: string;
  brandId?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persistence contract for autonomous company manufacturing loop records. */
export type CompanyManufacturingRepository = {
  save(
    workspaceId: string,
    input: CompanyManufacturingRecordCreateInput,
  ): Promise<CompanyManufacturingRecord>;
  getById(
    workspaceId: string,
    recordId: string,
  ): Promise<CompanyManufacturingRecord | null>;
  getLatest(workspaceId: string): Promise<CompanyManufacturingRecord | null>;
  getByProduct(
    workspaceId: string,
    productId: string,
  ): Promise<CompanyManufacturingRecord | null>;
  list(query: CompanyManufacturingRepositoryQuery): Promise<CompanyManufacturingRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
