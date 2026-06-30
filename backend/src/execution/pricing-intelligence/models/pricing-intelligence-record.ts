import { z } from "zod";

import {
  pricingIntelligenceBlueprintSchema,
  type PricingIntelligenceBlueprint,
} from "./pricing-intelligence-blueprint.js";

export type PricingIntelligenceRecordId = string;

/** Persisted pricing intelligence record. */
export type PricingIntelligenceRecord = PricingIntelligenceBlueprint & {
  recordId: PricingIntelligenceRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type PricingIntelligenceRecordCreateInput = Omit<
  PricingIntelligenceRecord,
  "recordId" | "workspaceId" | "blueprintId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const pricingIntelligenceRecordSchema = pricingIntelligenceBlueprintSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a PricingIntelligenceRecord record shape. */
export function validatePricingIntelligenceRecord(value: unknown): PricingIntelligenceRecord {
  return pricingIntelligenceRecordSchema.parse(value);
}
