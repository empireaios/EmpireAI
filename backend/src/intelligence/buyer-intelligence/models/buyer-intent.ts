import { z } from "zod";

/** Workspace-scoped buyer intent identifier. */
export type BuyerIntentId = string;

export const BUYER_INTENT_STAGES = ["awareness", "consideration", "purchase"] as const;
export type BuyerIntentStage = (typeof BUYER_INTENT_STAGES)[number];

export const BUYER_INTENT_URGENCY_LEVELS = ["low", "medium", "high", "critical"] as const;
export type BuyerIntentUrgency = (typeof BUYER_INTENT_URGENCY_LEVELS)[number];

export type BuyerIntentSignal = {
  signalType: string;
  source: string;
  strength: number;
  observationId?: string;
  detectedAt: string;
  metadata?: Record<string, unknown>;
};

/** Buyer intent — stage, urgency, and supporting signals from observations. */
export type BuyerIntent = {
  id: BuyerIntentId;
  workspaceId: string;
  personaId?: string;
  subjectKey?: string;
  stage: BuyerIntentStage;
  urgency: BuyerIntentUrgency;
  signals: BuyerIntentSignal[];
  observationIds: string[];
  needCategoryIds: string[];
  confidence: number;
  summary?: string;
  detectedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type BuyerIntentCreateInput = Omit<
  BuyerIntent,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type BuyerIntentUpdateInput = Partial<BuyerIntentCreateInput>;

const isoTimestamp = z.string().datetime({ offset: true });

const intentSignalSchema = z.object({
  signalType: z.string().min(1),
  source: z.string().min(1),
  strength: z.number().min(0).max(100),
  observationId: z.string().optional(),
  detectedAt: isoTimestamp,
  metadata: z.record(z.unknown()).optional(),
});

export const buyerIntentSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  personaId: z.string().optional(),
  subjectKey: z.string().optional(),
  stage: z.enum(BUYER_INTENT_STAGES),
  urgency: z.enum(BUYER_INTENT_URGENCY_LEVELS),
  signals: z.array(intentSignalSchema),
  observationIds: z.array(z.string()),
  needCategoryIds: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  summary: z.string().optional(),
  detectedAt: isoTimestamp,
  expiresAt: isoTimestamp.optional(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a BuyerIntent record shape. */
export function validateBuyerIntent(value: unknown): BuyerIntent {
  return buyerIntentSchema.parse(value);
}

/** Returns true when the intent stage is purchase-ready. */
export function isPurchaseReadyIntent(stage: BuyerIntentStage): boolean {
  return stage === "purchase";
}

/** Maps urgency to a numeric weight for downstream ranking. */
export function urgencyWeight(urgency: BuyerIntentUrgency): number {
  switch (urgency) {
    case "critical":
      return 1;
    case "high":
      return 0.75;
    case "medium":
      return 0.5;
    case "low":
      return 0.25;
  }
}
