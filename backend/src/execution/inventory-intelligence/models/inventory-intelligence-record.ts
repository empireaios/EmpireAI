import { z } from "zod";

import {
  inventoryPredictionReportSchema,
  type InventoryPredictionReport,
} from "./inventory-prediction-report.js";

export type InventoryIntelligenceRecordId = string;

/** Persisted inventory intelligence record. */
export type InventoryIntelligenceRecord = InventoryPredictionReport & {
  recordId: InventoryIntelligenceRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryIntelligenceRecordCreateInput = Omit<
  InventoryIntelligenceRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const inventoryIntelligenceRecordSchema = inventoryPredictionReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an InventoryIntelligenceRecord record shape. */
export function validateInventoryIntelligenceRecord(value: unknown): InventoryIntelligenceRecord {
  return inventoryIntelligenceRecordSchema.parse(value);
}
