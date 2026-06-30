import { z } from "zod";

export const OPERATIONS_MODES = [
  "DEVELOPMENT",
  "SIMULATION",
  "PRODUCTION",
  "EMERGENCY_STOP",
  "MAINTENANCE",
  "READ_ONLY",
] as const;

export const grandKingLiveOperationsModeSchema = z.object({
  moduleId: z.literal("grand-king-live-operations-mode"),
  missionId: z.literal("REAL-036"),
  workspaceId: z.string(),
  companyId: z.string(),
  currentMode: z.enum(OPERATIONS_MODES),
  availableModes: z.array(z.enum(OPERATIONS_MODES)),
  transitionRequires: z.object({
    executiveReview: z.literal(true),
    soulRecommendation: z.literal(true),
    grandKingApproval: z.literal(true),
  }),
  pendingTransition: z.object({
    targetMode: z.enum(OPERATIONS_MODES),
    requestedAt: z.string(),
    evidence: z.string(),
  }).nullable(),
  transitionHistory: z.array(z.object({
    from: z.enum(OPERATIONS_MODES),
    to: z.enum(OPERATIONS_MODES),
    approvedAt: z.string(),
    evidence: z.string(),
  })),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type OperationsMode = (typeof OPERATIONS_MODES)[number];
export type GrandKingLiveOperationsMode = z.infer<typeof grandKingLiveOperationsModeSchema>;
