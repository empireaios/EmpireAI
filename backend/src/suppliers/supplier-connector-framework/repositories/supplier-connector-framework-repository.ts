import type { SupplierConnectorRecord } from "../models/supplier-connector-record.js";
import type { SupplierPlatform } from "../models/supplier-platform.js";

export type SupplierConnectorFrameworkRepositoryQuery = {
  workspaceId: string;
  platform?: SupplierPlatform;
  connectorId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for prepared supplier connector records. */
export type SupplierConnectorFrameworkRepository = {
  save(
    workspaceId: string,
    input: import("../models/supplier-connector-record.js").SupplierConnectorRecordCreateInput,
  ): Promise<SupplierConnectorRecord>;
  getById(workspaceId: string, recordId: string): Promise<SupplierConnectorRecord | null>;
  getByPlatform(
    workspaceId: string,
    platform: SupplierPlatform,
  ): Promise<SupplierConnectorRecord | null>;
  getByConnectorId(
    workspaceId: string,
    connectorId: string,
  ): Promise<SupplierConnectorRecord | null>;
  list(query: SupplierConnectorFrameworkRepositoryQuery): Promise<SupplierConnectorRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
