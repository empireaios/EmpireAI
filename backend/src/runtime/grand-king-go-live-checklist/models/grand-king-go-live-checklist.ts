import { z } from "zod";

export const GO_LIVE_CHECKLIST_CATEGORIES = [
  "operational",
  "commercial",
  "marketplace",
  "supplier",
  "security",
  "deployment",
  "executive",
  "revenue",
] as const;

export const goLiveChecklistItemSchema = z.object({
  itemId: z.string(),
  category: z.enum(GO_LIVE_CHECKLIST_CATEGORIES),
  label: z.string(),
  status: z.enum(["READY", "BLOCKED", "PENDING"]),
  blockerExplanation: z.string().nullable(),
  programId: z.string().nullable(),
});

export const grandKingGoLiveChecklistSchema = z.object({
  moduleId: z.literal("grand-king-go-live-checklist"),
  missionId: z.literal("REAL-049"),
  workspaceId: z.string(),
  companyId: z.string(),
  checklists: z.array(goLiveChecklistItemSchema),
  readyCount: z.number(),
  blockedCount: z.number(),
  totalCount: z.number(),
  goLiveReady: z.boolean(),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type GoLiveChecklistCategory = (typeof GO_LIVE_CHECKLIST_CATEGORIES)[number];
export type GrandKingGoLiveChecklist = z.infer<typeof grandKingGoLiveChecklistSchema>;
