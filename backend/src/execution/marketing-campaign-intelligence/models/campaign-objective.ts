import { z } from "zod";

export const CAMPAIGN_OBJECTIVES = [
  "SALES",
  "TRAFFIC",
  "LEADS",
  "AWARENESS",
  "ENGAGEMENT",
] as const;

export type CampaignObjective = (typeof CAMPAIGN_OBJECTIVES)[number];

export const campaignObjectiveSchema = z.enum(CAMPAIGN_OBJECTIVES);

/** Validates a campaign objective value. */
export function validateCampaignObjective(value: unknown): CampaignObjective {
  return campaignObjectiveSchema.parse(value);
}

/** Display label for a campaign objective. */
export function campaignObjectiveLabel(objective: CampaignObjective): string {
  const labels: Record<CampaignObjective, string> = {
    SALES: "Sales",
    TRAFFIC: "Traffic",
    LEADS: "Leads",
    AWARENESS: "Awareness",
    ENGAGEMENT: "Engagement",
  };
  return labels[objective];
}

/** Optimal campaign objective with scoring rationale. */
export type CampaignObjectiveIntelligence = {
  recommendedObjective: CampaignObjective;
  objectiveScores: Array<{
    objective: CampaignObjective;
    score: number;
    rationale: string;
  }>;
  rationale: string;
};

export const campaignObjectiveIntelligenceSchema = z.object({
  recommendedObjective: campaignObjectiveSchema,
  objectiveScores: z.array(
    z.object({
      objective: campaignObjectiveSchema,
      score: z.number().min(0).max(100),
      rationale: z.string().min(1),
    }),
  ),
  rationale: z.string().min(1),
});

/** Validates CampaignObjectiveIntelligence shape. */
export function validateCampaignObjectiveIntelligence(
  value: unknown,
): CampaignObjectiveIntelligence {
  return campaignObjectiveIntelligenceSchema.parse(value);
}
