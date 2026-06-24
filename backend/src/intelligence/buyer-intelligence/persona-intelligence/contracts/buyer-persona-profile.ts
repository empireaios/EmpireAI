import { z } from "zod";

/** M023 BuyerPersona contract — flat persona profile derived from Eye buyer signals. */
export type BuyerPersonaSpendingPower = "budget" | "moderate" | "premium" | "luxury";

export type BuyerPersonaUrgencyLevel = "low" | "medium" | "high" | "critical";

export type BuyerPersonaProfile = {
  personaId: string;
  name: string;
  ageRange: string;
  interests: string[];
  spendingPower: BuyerPersonaSpendingPower;
  purchaseTriggers: string[];
  urgencyLevel: BuyerPersonaUrgencyLevel;
  preferredPlatforms: string[];
  searchPatterns: string[];
  confidence: number;
};

export const BUYER_PERSONA_SPENDING_POWERS = ["budget", "moderate", "premium", "luxury"] as const;
export const BUYER_PERSONA_URGENCY_LEVELS = ["low", "medium", "high", "critical"] as const;

export const buyerPersonaProfileSchema = z.object({
  personaId: z.string().min(1),
  name: z.string().min(1),
  ageRange: z.string().min(1),
  interests: z.array(z.string()),
  spendingPower: z.enum(BUYER_PERSONA_SPENDING_POWERS),
  purchaseTriggers: z.array(z.string()),
  urgencyLevel: z.enum(BUYER_PERSONA_URGENCY_LEVELS),
  preferredPlatforms: z.array(z.string()),
  searchPatterns: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});

/** Validates the M023 BuyerPersona profile contract. */
export function validateBuyerPersonaProfile(value: unknown): BuyerPersonaProfile {
  return buyerPersonaProfileSchema.parse(value);
}
