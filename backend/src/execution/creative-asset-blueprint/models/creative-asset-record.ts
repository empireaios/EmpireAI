import { z } from "zod";

import {
  creativeAssetBlueprintSchema,
  type CreativeAssetBlueprint,
} from "./creative-asset-blueprint.js";

export type CreativeAssetRecordId = string;

/** Persisted creative asset blueprint record. */
export type CreativeAssetRecord = CreativeAssetBlueprint & {
  recordId: CreativeAssetRecordId;
  workspaceId: string;
  brandId: string;
  campaignId: string | null;
  storeId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreativeAssetRecordCreateInput = Omit<
  CreativeAssetRecord,
  "recordId" | "workspaceId" | "blueprintId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const creativeAssetRecordSchema = creativeAssetBlueprintSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  brandId: z.string().min(1),
  campaignId: z.string().nullable(),
  storeId: z.string().nullable(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a CreativeAssetRecord record shape. */
export function validateCreativeAssetRecord(value: unknown): CreativeAssetRecord {
  return creativeAssetRecordSchema.parse(value);
}
