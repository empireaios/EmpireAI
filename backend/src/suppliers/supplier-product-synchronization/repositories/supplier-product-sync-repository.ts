import type { SupplierProductSyncRecord } from "../models/supplier-product-sync-record.js";
import type { SupplierPlatform } from "../../supplier-connector-framework/models/supplier-platform.js";

export type SupplierProductSyncRepositoryQuery = {
  workspaceId: string;
  connectorId?: string;
  platform?: SupplierPlatform;
  supplierSku?: string;
  productEntityId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for supplier product sync records. */
export type SupplierProductSyncRepository = {
  save(
    workspaceId: string,
    input: import("../models/supplier-product-sync-record.js").SupplierProductSyncRecordCreateInput,
  ): Promise<SupplierProductSyncRecord>;
  getById(workspaceId: string, recordId: string): Promise<SupplierProductSyncRecord | null>;
  getBySupplierSku(
    workspaceId: string,
    connectorId: string,
    supplierSku: string,
  ): Promise<SupplierProductSyncRecord | null>;
  list(query: SupplierProductSyncRepositoryQuery): Promise<SupplierProductSyncRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
