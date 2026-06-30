import { z } from "zod";

export const PROMISE_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "FULFILLED",
  "OBSOLETE",
  "SUPERSEDED",
] as const;

export type PromiseStatus = (typeof PROMISE_STATUSES)[number];

export const PROMISE_LIFECYCLE_EVENTS = [
  "REGISTERED",
  "MODIFIED",
  "PROGRESS_UPDATED",
  "DEPENDENCY_ADDED",
  "DEPENDENCY_REMOVED",
  "FULFILLED",
  "OBSOLETED",
  "SUPERSEDED",
] as const;

export type PromiseLifecycleEvent = (typeof PROMISE_LIFECYCLE_EVENTS)[number];

export const promiseSchema = z.object({
  promiseId: z.string().min(1),
  workspaceId: z.string().min(1),
  title: z.string().min(1),
  statement: z.string().min(1),
  madeToKingId: z.string().min(1),
  status: z.enum(PROMISE_STATUSES),
  progressPercent: z.number().int().min(0).max(100),
  progressNotes: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  supersededBy: z.string().optional(),
  fulfilledAt: z.string().datetime({ offset: true }).optional(),
  version: z.number().int().min(1),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type KingPromise = z.infer<typeof promiseSchema>;

export type PromiseLifecycleRecord = {
  lifecycleId: string;
  promiseId: string;
  workspaceId: string;
  event: PromiseLifecycleEvent;
  summary: string;
  actor: string;
  correlationId?: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export type PromiseRegisterInput = {
  workspaceId: string;
  promiseId: string;
  title: string;
  statement: string;
  madeToKingId?: string;
  dependencies?: string[];
  metadata?: Record<string, string>;
  actor?: string;
};

export type PromiseProgressInput = {
  promiseId: string;
  progressPercent: number;
  progressNotes?: string;
  status?: Extract<PromiseStatus, "PENDING" | "IN_PROGRESS">;
  actor?: string;
};

export type PromiseModifyInput = {
  promiseId: string;
  title?: string;
  statement?: string;
  metadata?: Record<string, string>;
  actor?: string;
};

/** Stable promise IDs — the register never deletes, only transitions status. */
export const CANONICAL_PROMISE_IDS = {
  REVENUE_TRUTH: "promise:revenue-truth-to-king",
  LIVING_SOUL: "promise:living-soul-to-king",
  EMPIRE_PROTECTION: "promise:empire-protection-to-king",
} as const;

export function validateKingPromise(value: unknown): KingPromise {
  return promiseSchema.parse(value);
}

export function isTerminalPromiseStatus(status: PromiseStatus): boolean {
  return status === "FULFILLED" || status === "OBSOLETE" || status === "SUPERSEDED";
}
