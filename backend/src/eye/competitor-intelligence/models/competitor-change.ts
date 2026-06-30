import { z } from "zod";

import {
  competitorChangeTypeSchema,
  type CompetitorChangeType,
} from "./competitor-change-types.js";

/** Detected change between consecutive competitor snapshots. */
export type CompetitorChange = {
  changeId: string;
  competitorId: string;
  competitorName: string;
  changeType: CompetitorChangeType;
  previousValue: string;
  newValue: string;
  magnitude: number;
  detectedAt: string;
  snapshotId: string;
  observationId: string;
};

export const competitorChangeSchema = z.object({
  changeId: z.string().min(1),
  competitorId: z.string().min(1),
  competitorName: z.string().min(1),
  changeType: competitorChangeTypeSchema,
  previousValue: z.string().min(1),
  newValue: z.string().min(1),
  magnitude: z.number().min(0),
  detectedAt: z.string().datetime({ offset: true }),
  snapshotId: z.string().min(1),
  observationId: z.string().min(1),
});

/** Validates a CompetitorChange record shape. */
export function validateCompetitorChange(value: unknown): CompetitorChange {
  return competitorChangeSchema.parse(value);
}
