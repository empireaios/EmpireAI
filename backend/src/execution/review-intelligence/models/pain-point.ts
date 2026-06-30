import { z } from "zod";

export const PAIN_POINT_SEVERITIES = ["HIGH", "MEDIUM", "LOW"] as const;

export type PainPointSeverity = (typeof PAIN_POINT_SEVERITIES)[number];

/** Extracted customer pain point from review analysis. */
export type PainPoint = {
  painPointId: string;
  theme: string;
  description: string;
  mentionCount: number;
  severity: PainPointSeverity;
  score: number;
};

export const painPointSchema = z.object({
  painPointId: z.string().min(1),
  theme: z.string().min(1),
  description: z.string().min(1),
  mentionCount: z.number().int().min(1),
  severity: z.enum(PAIN_POINT_SEVERITIES),
  score: z.number().min(0).max(100),
});

/** Validates a PainPoint record shape. */
export function validatePainPoint(value: unknown): PainPoint {
  return painPointSchema.parse(value);
}
