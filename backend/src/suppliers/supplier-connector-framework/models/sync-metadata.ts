import { z } from "zod";

export const SUPPLIER_SYNC_MODES = ["STUB", "SANDBOX", "LIVE"] as const;

export type SupplierSyncMode = (typeof SUPPLIER_SYNC_MODES)[number];

/** Sync metadata for supplier connector preparation and future live sync. */
export type SyncMetadata = {
  syncMode: SupplierSyncMode;
  orderingEnabled: boolean;
  lastSyncAttemptAt: string | null;
  lastSuccessfulSyncAt: string | null;
  recordsSynced: number;
  nextScheduledSyncAt: string | null;
  notes: string;
};

export const syncMetadataSchema = z.object({
  syncMode: z.enum(SUPPLIER_SYNC_MODES),
  orderingEnabled: z.boolean(),
  lastSyncAttemptAt: z.string().datetime({ offset: true }).nullable(),
  lastSuccessfulSyncAt: z.string().datetime({ offset: true }).nullable(),
  recordsSynced: z.number().int().min(0),
  nextScheduledSyncAt: z.string().datetime({ offset: true }).nullable(),
  notes: z.string().min(1),
});

/** Validates SyncMetadata record shape. */
export function validateSyncMetadata(value: unknown): SyncMetadata {
  return syncMetadataSchema.parse(value);
}

/** Default sync metadata for stub supplier connector preparation. */
export function createDefaultSyncMetadata(notes: string): SyncMetadata {
  return {
    syncMode: "STUB",
    orderingEnabled: false,
    lastSyncAttemptAt: null,
    lastSuccessfulSyncAt: null,
    recordsSynced: 0,
    nextScheduledSyncAt: null,
    notes,
  };
}
