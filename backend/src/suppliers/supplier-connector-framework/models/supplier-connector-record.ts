import { z } from "zod";

import {
  supplierConnectorCapabilitySchema,
  type SupplierConnectorCapability,
} from "./supplier-capabilities.js";
import { supplierConnectorSchema, type SupplierConnector } from "./supplier-connector.js";
import {
  supplierConnectorSignalSchema,
  type SupplierConnectorSignal,
} from "./supplier-connector-signal.js";
import { supplierHealthSchema, type SupplierHealth } from "./supplier-health.js";
import { syncMetadataSchema, type SyncMetadata } from "./sync-metadata.js";

export type SupplierConnectorRecordId = string;

/** Prepared supplier connector profile with health, capabilities, and sync metadata. */
export type SupplierConnectorRecord = {
  recordId: SupplierConnectorRecordId;
  workspaceId: string;
  supplierConnector: SupplierConnector;
  supplierHealth: SupplierHealth;
  supplierCapabilities: SupplierConnectorCapability[];
  syncMetadata: SyncMetadata;
  confidence: number;
  signals: SupplierConnectorSignal[];
  createdAt: string;
  updatedAt: string;
};

export type SupplierConnectorRecordCreateInput = Omit<
  SupplierConnectorRecord,
  "recordId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const supplierConnectorRecordSchema = z.object({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  supplierConnector: supplierConnectorSchema,
  supplierHealth: supplierHealthSchema,
  supplierCapabilities: z.array(supplierConnectorCapabilitySchema).min(1),
  syncMetadata: syncMetadataSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(supplierConnectorSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a SupplierConnectorRecord record shape. */
export function validateSupplierConnectorRecord(value: unknown): SupplierConnectorRecord {
  return supplierConnectorRecordSchema.parse(value);
}
