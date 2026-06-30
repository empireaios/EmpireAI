import { z } from "zod";

import { manufacturingSignalSchema, type ManufacturingSignal } from "./manufacturing-signal.js";
import {
  manufacturingStageRecordSchema,
  type ManufacturingStageRecord,
} from "./manufacturing-stage.js";
import { nextActionSchema, type NextAction } from "./next-action.js";
import {
  manufacturingRunStatusSchema,
  type ManufacturingRunStatus,
} from "./manufacturing-run-status.js";

export type CompanyManufacturingRunId = string;

/** End-to-end autonomous company manufacturing run connecting all empire systems. */
export type CompanyManufacturingRun = {
  runId: CompanyManufacturingRunId;
  productId: string;
  opportunityId: string;
  brandId: string;
  storeId: string;
  campaignId: string;
  deploymentRecordId: string;
  stages: ManufacturingStageRecord[];
  runStatus: ManufacturingRunStatus;
  nextActions: NextAction[];
  confidence: number;
  signals: ManufacturingSignal[];
};

export type CompanyManufacturingRunCreateInput = Omit<CompanyManufacturingRun, "runId">;

export const companyManufacturingRunSchema = z.object({
  runId: z.string().min(1),
  productId: z.string().min(1),
  opportunityId: z.string().min(1),
  brandId: z.string().min(1),
  storeId: z.string().min(1),
  campaignId: z.string().min(1),
  deploymentRecordId: z.string().min(1),
  stages: z.array(manufacturingStageRecordSchema).min(1),
  runStatus: manufacturingRunStatusSchema,
  nextActions: z.array(nextActionSchema),
  confidence: z.number().min(0).max(100),
  signals: z.array(manufacturingSignalSchema),
});

/** Validates a CompanyManufacturingRun record shape. */
export function validateCompanyManufacturingRun(value: unknown): CompanyManufacturingRun {
  return companyManufacturingRunSchema.parse(value);
}
