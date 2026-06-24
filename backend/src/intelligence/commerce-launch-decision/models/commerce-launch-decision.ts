import { z } from "zod";

import { launchDecisionSignalSchema, type LaunchDecisionSignal } from "./launch-decision-signal.js";

export type CommerceLaunchDecisionId = string;

export const LAUNCH_DECISIONS = ["LAUNCH", "WATCH", "REJECT"] as const;
export type LaunchDecision = (typeof LAUNCH_DECISIONS)[number];

/** Final launch recommendation for Grand King's Account. */
export type CommerceLaunchDecision = {
  decisionId: CommerceLaunchDecisionId;
  workspaceId: string;
  productId: string;
  supplierId: string;
  buyerPersonaId: string;
  opportunityId: string;
  decision: LaunchDecision;
  launchScore: number;
  confidence: number;
  reasons: string[];
  risks: string[];
  recommendedChannels: string[];
  suggestedTestBudget: number;
  expectedOutcome: string;
  signals: LaunchDecisionSignal[];
  createdAt: string;
  updatedAt: string;
};

export type CommerceLaunchDecisionCreateInput = Omit<
  CommerceLaunchDecision,
  "decisionId" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type CommerceLaunchDecisionUpdateInput = Partial<
  Omit<CommerceLaunchDecisionCreateInput, "productId" | "supplierId" | "buyerPersonaId" | "opportunityId">
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const commerceLaunchDecisionSchema = z.object({
  decisionId: z.string().min(1),
  workspaceId: z.string().min(1),
  productId: z.string().min(1),
  supplierId: z.string().min(1),
  buyerPersonaId: z.string().min(1),
  opportunityId: z.string().min(1),
  decision: z.enum(LAUNCH_DECISIONS),
  launchScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  risks: z.array(z.string()),
  recommendedChannels: z.array(z.string()),
  suggestedTestBudget: z.number().min(0),
  expectedOutcome: z.string().min(1),
  signals: z.array(launchDecisionSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a CommerceLaunchDecision record shape. */
export function validateCommerceLaunchDecision(value: unknown): CommerceLaunchDecision {
  return commerceLaunchDecisionSchema.parse(value);
}

/** Maps a launch score to a launch decision label. */
export function resolveLaunchDecision(score: number, riskScore: number): LaunchDecision {
  if (score >= 75 && riskScore >= 55) return "LAUNCH";
  if (score >= 45) return "WATCH";
  return "REJECT";
}
