import { z } from "zod";

export const STRATEGIC_MEMORY_CATEGORIES = [
  "failures",
  "successes",
  "architecture",
  "businessLessons",
  "capitalLessons",
  "supplierLessons",
  "marketingLessons",
] as const;

export type StrategicMemoryCategory = (typeof STRATEGIC_MEMORY_CATEGORIES)[number];

export const STRATEGIC_MEMORY_STATUSES = ["ACTIVE", "ARCHIVED", "SUPERSEDED"] as const;

export type StrategicMemoryStatus = (typeof STRATEGIC_MEMORY_STATUSES)[number];

export const STRATEGIC_MEMORY_LIFECYCLE_EVENTS = [
  "RECORDED",
  "MODIFIED",
  "RECALLED",
  "ARCHIVED",
  "SUPERSEDED",
] as const;

export type StrategicMemoryLifecycleEvent = (typeof STRATEGIC_MEMORY_LIFECYCLE_EVENTS)[number];

export const strategicMemoryEntrySchema = z.object({
  memoryId: z.string().min(1),
  workspaceId: z.string().min(1),
  category: z.enum(STRATEGIC_MEMORY_CATEGORIES),
  title: z.string().min(1),
  insight: z.string().min(1),
  context: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source: z.string().default("system"),
  importance: z.number().int().min(1).max(5).default(3),
  status: z.enum(STRATEGIC_MEMORY_STATUSES),
  supersededBy: z.string().optional(),
  recallCount: z.number().int().min(0).default(0),
  version: z.number().int().min(1),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type StrategicMemoryEntry = z.infer<typeof strategicMemoryEntrySchema>;

export type StrategicMemoryLifecycleRecord = {
  lifecycleId: string;
  memoryId: string;
  workspaceId: string;
  event: StrategicMemoryLifecycleEvent;
  summary: string;
  actor: string;
  correlationId?: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export type StrategicMemoryRecordInput = {
  workspaceId: string;
  memoryId: string;
  category: StrategicMemoryCategory;
  title: string;
  insight: string;
  context?: string;
  tags?: string[];
  source?: string;
  importance?: number;
  metadata?: Record<string, string>;
  actor?: string;
  correlationId?: string;
};

export type StrategicMemoryRecallInput = {
  workspaceId: string;
  category?: StrategicMemoryCategory;
  query?: string;
  tags?: string[];
  limit?: number;
  actor?: string;
};

export type StrategicMemorySummary = {
  workspaceId: string;
  totalMemories: number;
  byCategory: Record<StrategicMemoryCategory, number>;
  computedAt: string;
};

export function validateStrategicMemoryEntry(value: unknown): StrategicMemoryEntry {
  return strategicMemoryEntrySchema.parse(value);
}

export function isTerminalMemoryStatus(status: StrategicMemoryStatus): boolean {
  return status === "ARCHIVED" || status === "SUPERSEDED";
}
