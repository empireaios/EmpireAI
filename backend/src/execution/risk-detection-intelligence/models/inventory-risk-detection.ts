import { z } from "zod";

import { DETECTION_SEVERITIES, type DetectionSeverity } from "./traffic-drop-detection.js";

/** Inventory risk detection result. */
export type InventoryRiskDetection = {
  detectionId: string;
  lowStockSkus: number;
  outOfStockSkus: number;
  daysOfCover: number;
  reorderThresholdDays: number;
  predictedStockoutDate: string | null;
  detected: boolean;
  severity: DetectionSeverity;
  score: number;
  summary: string;
};

export const inventoryRiskDetectionSchema = z.object({
  detectionId: z.string().min(1),
  lowStockSkus: z.number().int().min(0),
  outOfStockSkus: z.number().int().min(0),
  daysOfCover: z.number().min(0),
  reorderThresholdDays: z.number().min(0),
  predictedStockoutDate: z.string().datetime({ offset: true }).nullable(),
  detected: z.boolean(),
  severity: z.enum(DETECTION_SEVERITIES),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates an InventoryRiskDetection record shape. */
export function validateInventoryRiskDetection(value: unknown): InventoryRiskDetection {
  return inventoryRiskDetectionSchema.parse(value);
}
