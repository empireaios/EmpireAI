import { z } from "zod";

/** Tracked competitor profile under Eye watch. */
export type CompetitorProfile = {
  competitorId: string;
  competitorName: string;
  competitorDomain: string;
  marketplace: string;
  category: string;
  watchPriority: number;
};

export const competitorProfileSchema = z.object({
  competitorId: z.string().min(1),
  competitorName: z.string().min(1),
  competitorDomain: z.string().min(1),
  marketplace: z.string().min(1),
  category: z.string().min(1),
  watchPriority: z.number().int().min(1).max(10),
});

/** Validates a CompetitorProfile record shape. */
export function validateCompetitorProfile(value: unknown): CompetitorProfile {
  return competitorProfileSchema.parse(value);
}
