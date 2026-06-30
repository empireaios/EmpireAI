import { z } from "zod";

import { croAreaTypeSchema, type CroAreaType } from "./cro-area-types.js";

export const CRO_AREA_STATUSES = ["STRONG", "ADEQUATE", "NEEDS_IMPROVEMENT"] as const;

export type CroAreaStatus = (typeof CRO_AREA_STATUSES)[number];

/** Analysis of a single CRO dimension for the store. */
export type CroAreaAnalysis = {
  analysisId: string;
  areaType: CroAreaType;
  displayName: string;
  score: number;
  benchmarkScore: number;
  status: CroAreaStatus;
  findings: string[];
  strengths: string[];
  weaknesses: string[];
};

export const croAreaAnalysisSchema = z.object({
  analysisId: z.string().min(1),
  areaType: croAreaTypeSchema,
  displayName: z.string().min(1),
  score: z.number().min(0).max(100),
  benchmarkScore: z.number().min(0).max(100),
  status: z.enum(CRO_AREA_STATUSES),
  findings: z.array(z.string().min(1)).min(1),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
});

/** Validates a CroAreaAnalysis record shape. */
export function validateCroAreaAnalysis(value: unknown): CroAreaAnalysis {
  return croAreaAnalysisSchema.parse(value);
}
