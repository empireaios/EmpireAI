import { z } from "zod";

import { GOVERNANCE_DOMAINS, GOVERNANCE_EFFECTS } from "../../empire-governance/models/governance-policy.js";

export const DOCTRINE_STATUSES = ["ACTIVE", "DEPRECATED", "SUPERSEDED"] as const;

export type DoctrineStatus = (typeof DOCTRINE_STATUSES)[number];

export const DOCTRINE_LIFECYCLE_EVENTS = [
  "CREATED",
  "MODIFIED",
  "DEPRECATED",
  "SUPERSEDED",
  "REFERENCED",
] as const;

export type DoctrineLifecycleEvent = (typeof DOCTRINE_LIFECYCLE_EVENTS)[number];

export const doctrineExecutablePolicySchema = z.object({
  domain: z.enum(GOVERNANCE_DOMAINS),
  module: z.string().optional(),
  action: z.string().optional(),
  effect: z.enum(GOVERNANCE_EFFECTS),
  envFlag: z.string().optional(),
  requiredRole: z.enum(["founder", "admin", "operator"]).optional(),
  priority: z.number().int().min(0).default(100),
});

export type DoctrineExecutablePolicy = z.infer<typeof doctrineExecutablePolicySchema>;

export const doctrineSchema = z.object({
  doctrineId: z.string().min(1),
  workspaceId: z.string().min(1),
  title: z.string().min(1),
  statement: z.string().min(1),
  status: z.enum(DOCTRINE_STATUSES),
  version: z.number().int().min(1),
  supersededBy: z.string().optional(),
  executablePolicy: doctrineExecutablePolicySchema.optional(),
  referenceCount: z.number().int().min(0).default(0),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type Doctrine = z.infer<typeof doctrineSchema>;

export type DoctrineLifecycleRecord = {
  lifecycleId: string;
  doctrineId: string;
  workspaceId: string;
  event: DoctrineLifecycleEvent;
  summary: string;
  actor: string;
  correlationId?: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export type DoctrinePublishInput = {
  workspaceId: string;
  doctrineId: string;
  title: string;
  statement: string;
  executablePolicy?: DoctrineExecutablePolicy;
  metadata?: Record<string, string>;
  actor?: string;
};

export type DoctrineModifyInput = {
  doctrineId: string;
  title?: string;
  statement?: string;
  executablePolicy?: DoctrineExecutablePolicy;
  metadata?: Record<string, string>;
  actor?: string;
};

/** Stable doctrine IDs — modules reference doctrines by ID, not by title. */
export const CANONICAL_DOCTRINE_IDS = {
  PROTECT_THE_EMPIRE: "doctrine:protect-the-empire",
  NO_LIVE_WITHOUT_GATES: "doctrine:no-live-without-gates",
  FOUNDER_SOVEREIGNTY: "doctrine:founder-sovereignty",
  SANDBOX_FIRST: "doctrine:sandbox-first",
  REVENUE_TRUTH: "doctrine:revenue-truth",
  LIVING_SOUL: "doctrine:living-soul",
  EA_EXECUTION: "doctrine:ea-execution",
} as const;

export function validateDoctrine(value: unknown): Doctrine {
  return doctrineSchema.parse(value);
}
