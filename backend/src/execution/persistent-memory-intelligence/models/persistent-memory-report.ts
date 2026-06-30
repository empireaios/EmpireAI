import { z } from "zod";

import { brandMemorySchema, type BrandMemory } from "./brand-memory.js";
import { campaignMemorySchema, type CampaignMemory } from "./campaign-memory.js";
import {
  decisionImprovementSchema,
  type DecisionImprovement,
} from "./decision-improvement.js";
import { failureMemorySchema, type FailureMemory } from "./failure-memory.js";
import {
  persistentMemorySignalSchema,
  type PersistentMemorySignal,
} from "./persistent-memory-signal.js";
import { productMemorySchema, type ProductMemory } from "./product-memory.js";
import { storeHistorySchema, type StoreHistory } from "./store-history.js";
import { successMemorySchema, type SuccessMemory } from "./success-memory.js";
import { supplierMemorySchema, type SupplierMemory } from "./supplier-memory.js";

export type PersistentMemoryReportId = string;

/** Complete persistent memory report — intelligence only, no auto-write. */
export type PersistentMemoryReport = {
  reportId: PersistentMemoryReportId;
  storeId: string;
  brandId: string;
  memoryName: string;
  products: ProductMemory[];
  campaigns: CampaignMemory[];
  suppliers: SupplierMemory[];
  brands: BrandMemory[];
  failures: FailureMemory[];
  successes: SuccessMemory[];
  storeHistory: StoreHistory;
  decisionImprovements: DecisionImprovement[];
  overallScore: number;
  confidence: number;
  signals: PersistentMemorySignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoWriteEnabled: false;
};

export type PersistentMemoryReportCreateInput = Omit<PersistentMemoryReport, "reportId">;

export const persistentMemoryReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  memoryName: z.string().min(1),
  products: z.array(productMemorySchema).min(1),
  campaigns: z.array(campaignMemorySchema).min(1),
  suppliers: z.array(supplierMemorySchema).min(1),
  brands: z.array(brandMemorySchema).min(1),
  failures: z.array(failureMemorySchema).min(1),
  successes: z.array(successMemorySchema).min(1),
  storeHistory: storeHistorySchema,
  decisionImprovements: z.array(decisionImprovementSchema).min(1),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(persistentMemorySignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoWriteEnabled: z.literal(false),
});

/** Validates a PersistentMemoryReport record shape. */
export function validatePersistentMemoryReport(value: unknown): PersistentMemoryReport {
  return persistentMemoryReportSchema.parse(value);
}
