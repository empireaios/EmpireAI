import { z } from "zod";

export const DECISION_CATEGORIES = [
  "architectural",
  "strategic",
  "operational",
  "technical",
] as const;

export type DecisionCategory = (typeof DECISION_CATEGORIES)[number];

export const DECISION_STATUSES = ["PROPOSED", "APPROVED", "SUPERSEDED", "DEPRECATED"] as const;

export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const DECISION_LIFECYCLE_EVENTS = [
  "RECORDED",
  "MODIFIED",
  "APPROVED",
  "SUPERSEDED",
  "DEPRECATED",
] as const;

export type DecisionLifecycleEvent = (typeof DECISION_LIFECYCLE_EVENTS)[number];

export const decisionAlternativeSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  rejectedReason: z.string().optional(),
});

export type DecisionAlternative = z.infer<typeof decisionAlternativeSchema>;

export const decisionTradeoffSchema = z.object({
  benefit: z.string().min(1),
  cost: z.string().min(1),
});

export type DecisionTradeoff = z.infer<typeof decisionTradeoffSchema>;

export const empireDecisionSchema = z.object({
  decisionId: z.string().min(1),
  workspaceId: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(DECISION_CATEGORIES),
  decision: z.string().min(1),
  reason: z.string().min(1),
  alternatives: z.array(decisionAlternativeSchema).default([]),
  tradeoffs: z.array(decisionTradeoffSchema).default([]),
  approver: z.string().min(1),
  approvedAt: z.string().datetime({ offset: true }),
  status: z.enum(DECISION_STATUSES),
  supersededBy: z.string().optional(),
  version: z.number().int().min(1),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type EmpireDecision = z.infer<typeof empireDecisionSchema>;

export type DecisionLifecycleRecord = {
  lifecycleId: string;
  decisionId: string;
  workspaceId: string;
  event: DecisionLifecycleEvent;
  summary: string;
  actor: string;
  correlationId?: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export type DecisionRecordInput = {
  workspaceId: string;
  decisionId: string;
  title: string;
  category: DecisionCategory;
  decision: string;
  reason: string;
  alternatives?: DecisionAlternative[];
  tradeoffs?: DecisionTradeoff[];
  approver: string;
  approvedAt?: string;
  metadata?: Record<string, string>;
  actor?: string;
};

export type DecisionModifyInput = {
  decisionId: string;
  title?: string;
  decision?: string;
  reason?: string;
  alternatives?: DecisionAlternative[];
  tradeoffs?: DecisionTradeoff[];
  metadata?: Record<string, string>;
  actor?: string;
};

/** Stable decision IDs — architectural record, never deleted. */
export const CANONICAL_DECISION_IDS = {
  SOUL_FILE_FOUNDATION: "decision:soul-file-foundation",
  GOVERNANCE_BEFORE_GUARDIAN: "decision:governance-before-guardian",
  DOCTRINE_AS_POLICY: "decision:doctrine-as-executable-policy",
  POLICY_WITHOUT_CODE_CHANGE: "decision:policy-without-code-change",
} as const;

export function validateEmpireDecision(value: unknown): EmpireDecision {
  return empireDecisionSchema.parse(value);
}

export function isTerminalDecisionStatus(status: DecisionStatus): boolean {
  return status === "SUPERSEDED" || status === "DEPRECATED";
}
