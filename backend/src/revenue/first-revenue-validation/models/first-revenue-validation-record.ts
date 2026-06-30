import { z } from "zod";

export const VALIDATION_STAGE_NAMES = [
  "PRODUCT",
  "STORE",
  "DEPLOY",
  "ADS",
  "VISITOR",
  "CHECKOUT",
  "PAYMENT",
  "ORDER",
  "FULFILLMENT",
  "TRACKING",
  "LEDGER",
  "PROFIT",
] as const;

export type ValidationStageName = (typeof VALIDATION_STAGE_NAMES)[number];

export const VALIDATION_STAGE_STATUSES = ["PASS", "FAIL", "SKIPPED"] as const;
export type ValidationStageStatus = (typeof VALIDATION_STAGE_STATUSES)[number];

export type ValidationStageResult = {
  stage: ValidationStageName;
  status: ValidationStageStatus;
  mode: "MOCK" | "LIVE";
  message: string;
  evidence: Record<string, string | number | boolean>;
  durationMs: number;
};

/** First revenue validation report — full Product → Profit cycle. */
export type FirstRevenueValidationRecord = {
  validationId: string;
  workspaceId: string;
  companyId: string;
  correlationId: string;
  mode: "MOCK" | "LIVE";
  stages: ValidationStageResult[];
  allStagesPassed: boolean;
  productionReady: boolean;
  productionBlockers: string[];
  revenueCents: number;
  profitCents: number;
  ledgerVerified: boolean;
  storeId: string | null;
  pipelineId: string | null;
  paymentId: string | null;
  campaignId: string | null;
  mock: boolean;
  createdAt: string;
};

export const validationStageResultSchema = z.object({
  stage: z.enum(VALIDATION_STAGE_NAMES),
  status: z.enum(VALIDATION_STAGE_STATUSES),
  mode: z.enum(["MOCK", "LIVE"]),
  message: z.string(),
  evidence: z.record(z.union([z.string(), z.number(), z.boolean()])),
  durationMs: z.number().int().min(0),
});

export const firstRevenueValidationRecordSchema = z.object({
  validationId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  correlationId: z.string().min(1),
  mode: z.enum(["MOCK", "LIVE"]),
  stages: z.array(validationStageResultSchema).length(12),
  allStagesPassed: z.boolean(),
  productionReady: z.boolean(),
  productionBlockers: z.array(z.string()),
  revenueCents: z.number().int().min(0),
  profitCents: z.number().int(),
  ledgerVerified: z.boolean(),
  storeId: z.string().nullable(),
  pipelineId: z.string().nullable(),
  paymentId: z.string().nullable(),
  campaignId: z.string().nullable(),
  mock: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

export function validateFirstRevenueValidationRecord(
  value: unknown,
): FirstRevenueValidationRecord {
  return firstRevenueValidationRecordSchema.parse(value);
}
