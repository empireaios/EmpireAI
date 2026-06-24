import { z } from "zod";

/** Workspace-scoped buyer persona identifier. */
export type BuyerPersonaId = string;

export type BuyerDemographics = {
  ageRange?: string;
  gender?: string;
  incomeLevel?: "low" | "lower_middle" | "middle" | "upper_middle" | "high" | "unknown";
  locationRegions?: string[];
  occupation?: string;
  householdSize?: number;
};

export type BuyerPsychographics = {
  values: string[];
  interests: string[];
  lifestyle: string[];
  buyingMotivations?: string[];
};

/** Buyer persona — demographics, psychographics, pain points, and goals. */
export type BuyerPersona = {
  id: BuyerPersonaId;
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  demographics: BuyerDemographics;
  psychographics: BuyerPsychographics;
  painPoints: string[];
  goals: string[];
  sourceObservationIds: string[];
  confidence: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type BuyerPersonaCreateInput = Omit<
  BuyerPersona,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type BuyerPersonaUpdateInput = Partial<BuyerPersonaCreateInput>;

const isoTimestamp = z.string().datetime({ offset: true });

const demographicsSchema = z.object({
  ageRange: z.string().optional(),
  gender: z.string().optional(),
  incomeLevel: z
    .enum(["low", "lower_middle", "middle", "upper_middle", "high", "unknown"])
    .optional(),
  locationRegions: z.array(z.string()).optional(),
  occupation: z.string().optional(),
  householdSize: z.number().int().positive().optional(),
});

const psychographicsSchema = z.object({
  values: z.array(z.string()),
  interests: z.array(z.string()),
  lifestyle: z.array(z.string()),
  buyingMotivations: z.array(z.string()).optional(),
});

export const buyerPersonaSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  demographics: demographicsSchema,
  psychographics: psychographicsSchema,
  painPoints: z.array(z.string()),
  goals: z.array(z.string()),
  sourceObservationIds: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  tags: z.array(z.string()),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a BuyerPersona record shape. */
export function validateBuyerPersona(value: unknown): BuyerPersona {
  return buyerPersonaSchema.parse(value);
}

/** Normalizes a persona slug for stable lookup keys. */
export function normalizeBuyerPersonaSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
