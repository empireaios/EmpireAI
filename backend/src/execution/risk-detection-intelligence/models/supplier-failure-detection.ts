import { z } from "zod";

import {
  DETECTION_SEVERITIES,
  type DetectionSeverity,
} from "./traffic-drop-detection.js";

export { DETECTION_SEVERITIES };
export type { DetectionSeverity };

/** Supplier failure detection result. */
export type SupplierFailureDetection = {
  detectionId: string;
  supplierName: string;
  fulfillmentRatePercent: number;
  failedOrders: number;
  averageLeadTimeDays: number;
  detected: boolean;
  severity: DetectionSeverity;
  score: number;
  summary: string;
};

export const supplierFailureDetectionSchema = z.object({
  detectionId: z.string().min(1),
  supplierName: z.string().min(1),
  fulfillmentRatePercent: z.number().min(0).max(100),
  failedOrders: z.number().int().min(0),
  averageLeadTimeDays: z.number().min(0),
  detected: z.boolean(),
  severity: z.enum(DETECTION_SEVERITIES),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a SupplierFailureDetection record shape. */
export function validateSupplierFailureDetection(value: unknown): SupplierFailureDetection {
  return supplierFailureDetectionSchema.parse(value);
}
