import { z } from "zod";

import { manufacturingRunStatusSchema, type ManufacturingRunStatus } from "./manufacturing-run-status.js";

export const MANUFACTURING_LOOP_STAGES = [
  "EYE",
  "OPPORTUNITY",
  "SUPPLIER",
  "BRAND",
  "STORE",
  "MARKETING",
  "DEPLOYMENT",
] as const;

export type ManufacturingLoopStage = (typeof MANUFACTURING_LOOP_STAGES)[number];

/** Progress record for a single stage in the manufacturing loop. */
export type ManufacturingStageRecord = {
  stage: ManufacturingLoopStage;
  moduleId: string;
  label: string;
  status: ManufacturingRunStatus;
  progress: number;
  detail: string;
};

export const manufacturingStageRecordSchema = z.object({
  stage: z.enum(MANUFACTURING_LOOP_STAGES),
  moduleId: z.string().min(1),
  label: z.string().min(1),
  status: manufacturingRunStatusSchema,
  progress: z.number().min(0).max(100),
  detail: z.string().min(1),
});

/** Validates a ManufacturingStageRecord record shape. */
export function validateManufacturingStageRecord(value: unknown): ManufacturingStageRecord {
  return manufacturingStageRecordSchema.parse(value);
}

/** Display label for a manufacturing loop stage. */
export function manufacturingLoopStageLabel(stage: ManufacturingLoopStage): string {
  const labels: Record<ManufacturingLoopStage, string> = {
    EYE: "Eye Intelligence",
    OPPORTUNITY: "Opportunity Portfolio",
    SUPPLIER: "Supplier Integration",
    BRAND: "Brand Genesis",
    STORE: "Store Manufacturing",
    MARKETING: "Marketing Campaign",
    DEPLOYMENT: "Store Deployment",
  };
  return labels[stage];
}
