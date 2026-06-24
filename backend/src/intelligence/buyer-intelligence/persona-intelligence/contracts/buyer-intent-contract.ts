import { z } from "zod";
import {
  BUYER_INTENT_STAGES,
  BUYER_INTENT_URGENCY_LEVELS,
  type BuyerIntentStage,
  type BuyerIntentUrgency,
} from "../../models/buyer-intent.js";

/**
 * M023 BuyerIntent contract — intent snapshot derived from buyer signals and mapped persona.
 * Complements the M022 workspace-scoped BuyerIntent persistence model.
 */
export type BuyerIntentContract = {
  intentId: string;
  personaId: string;
  stage: BuyerIntentStage;
  urgency: BuyerIntentUrgency;
  confidence: number;
  sourceSignalId: string;
  searchPatterns: string[];
  purchaseTriggers: string[];
};

export const buyerIntentContractSchema = z.object({
  intentId: z.string().min(1),
  personaId: z.string().min(1),
  stage: z.enum(BUYER_INTENT_STAGES),
  urgency: z.enum(BUYER_INTENT_URGENCY_LEVELS),
  confidence: z.number().min(0).max(100),
  sourceSignalId: z.string().min(1),
  searchPatterns: z.array(z.string()),
  purchaseTriggers: z.array(z.string()),
});

/** Validates the M023 BuyerIntent contract. */
export function validateBuyerIntentContract(value: unknown): BuyerIntentContract {
  return buyerIntentContractSchema.parse(value);
}
