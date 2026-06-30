import { z } from "zod";

export const FounderJourneyStageIdSchema = z.enum([
  "registration",
  "business_creation",
  "brand_selection",
  "product_approval",
  "infrastructure_review",
  "marketplace_readiness",
  "launch_approval",
  "growth_review",
  "expansion_approval",
]);

export type FounderJourneyStageId = z.infer<typeof FounderJourneyStageIdSchema>;

export const FounderJourneyStageSchema = z.object({
  stageId: FounderJourneyStageIdSchema,
  displayName: z.string(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "AWAITING_FOUNDER", "COMPLETE", "BLOCKED"]),
  progressPercent: z.number().min(0).max(100),
  blockingReason: z.string().optional(),
  humanActionsCount: z.number().int().min(0),
  automatableActionsCount: z.number().int().min(0),
});

export type FounderJourneyStage = z.infer<typeof FounderJourneyStageSchema>;

export const FounderJourneySchema = z.object({
  journeyId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  accountType: z.enum(["grand_king", "founder"]),
  currentStageId: FounderJourneyStageIdSchema,
  stages: z.array(FounderJourneyStageSchema),
  overallProgressPercent: z.number().min(0).max(100),
  computedAt: z.string(),
});

export type FounderJourney = z.infer<typeof FounderJourneySchema>;

export const FOUNDER_JOURNEY_STAGE_DEFINITIONS: Array<{ stageId: FounderJourneyStageId; displayName: string }> = [
  { stageId: "registration", displayName: "Registration" },
  { stageId: "business_creation", displayName: "Business Creation" },
  { stageId: "brand_selection", displayName: "Brand Selection" },
  { stageId: "product_approval", displayName: "Product Approval" },
  { stageId: "infrastructure_review", displayName: "Infrastructure Review" },
  { stageId: "marketplace_readiness", displayName: "Marketplace Readiness" },
  { stageId: "launch_approval", displayName: "Launch Approval" },
  { stageId: "growth_review", displayName: "Growth Review" },
  { stageId: "expansion_approval", displayName: "Expansion Approval" },
];
