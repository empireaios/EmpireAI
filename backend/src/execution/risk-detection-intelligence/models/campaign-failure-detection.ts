import { z } from "zod";

import { DETECTION_SEVERITIES, type DetectionSeverity } from "./traffic-drop-detection.js";

/** Campaign failure detection result. */
export type CampaignFailureDetection = {
  detectionId: string;
  campaignName: string;
  channel: string;
  currentRoas: number;
  targetRoas: number;
  spendWasted: number;
  detected: boolean;
  severity: DetectionSeverity;
  currency: string;
  score: number;
  summary: string;
};

export const campaignFailureDetectionSchema = z.object({
  detectionId: z.string().min(1),
  campaignName: z.string().min(1),
  channel: z.string().min(1),
  currentRoas: z.number().min(0),
  targetRoas: z.number().min(0),
  spendWasted: z.number().min(0),
  detected: z.boolean(),
  severity: z.enum(DETECTION_SEVERITIES),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a CampaignFailureDetection record shape. */
export function validateCampaignFailureDetection(value: unknown): CampaignFailureDetection {
  return campaignFailureDetectionSchema.parse(value);
}
