import { z } from "zod";

import { DETECTION_SEVERITIES, type DetectionSeverity } from "./traffic-drop-detection.js";

/** SEO penalty detection result. */
export type SeoPenaltyDetection = {
  detectionId: string;
  organicTrafficChangePercent: number;
  indexedPages: number;
  deindexedPages: number;
  rankingDropKeywords: number;
  suspectedPenalty: string;
  detected: boolean;
  severity: DetectionSeverity;
  score: number;
  summary: string;
};

export const seoPenaltyDetectionSchema = z.object({
  detectionId: z.string().min(1),
  organicTrafficChangePercent: z.number(),
  indexedPages: z.number().int().min(0),
  deindexedPages: z.number().int().min(0),
  rankingDropKeywords: z.number().int().min(0),
  suspectedPenalty: z.string().min(1),
  detected: z.boolean(),
  severity: z.enum(DETECTION_SEVERITIES),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a SeoPenaltyDetection record shape. */
export function validateSeoPenaltyDetection(value: unknown): SeoPenaltyDetection {
  return seoPenaltyDetectionSchema.parse(value);
}
