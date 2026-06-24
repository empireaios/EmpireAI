import { z } from "zod";
import type { BuyerPersonaId } from "./buyer-persona.js";
import type { BuyerIntentStage } from "./buyer-intent.js";
import type { NeedCategoryId } from "./need-category.js";

/** Workspace-scoped audience segment identifier. */
export type AudienceSegmentId = string;

export const AUDIENCE_SEGMENT_STATUSES = ["draft", "active", "archived"] as const;
export type AudienceSegmentStatus = (typeof AUDIENCE_SEGMENT_STATUSES)[number];

export type SegmentRuleOperator = "and" | "or";

export type SegmentRule = {
  field:
    | "persona_id"
    | "intent_stage"
    | "need_category_id"
    | "urgency"
    | "tag"
    | "region"
    | "custom";
  operator: "eq" | "neq" | "in" | "contains" | "gte" | "lte";
  value: string | number | string[];
};

export type AudienceSizeEstimate = {
  pointEstimate?: number;
  min?: number;
  max?: number;
  confidence: number;
  estimatedAt: string;
};

/** Audience segment — rule-based grouping with size estimates. */
export type AudienceSegment = {
  id: AudienceSegmentId;
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  status: AudienceSegmentStatus;
  ruleOperator: SegmentRuleOperator;
  rules: SegmentRule[];
  personaIds: BuyerPersonaId[];
  needCategoryIds: NeedCategoryId[];
  intentStages: BuyerIntentStage[];
  sizeEstimate?: AudienceSizeEstimate;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type SegmentMembershipId = string;

/** Membership link between a segment and a matched buyer subject. */
export type SegmentMembership = {
  id: SegmentMembershipId;
  workspaceId: string;
  segmentId: AudienceSegmentId;
  memberRef: string;
  memberType: "persona" | "subject" | "external";
  matchedAt: string;
  matchScore: number;
  metadata?: Record<string, unknown>;
};

export type AudienceSegmentCreateInput = Omit<
  AudienceSegment,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type AudienceSegmentUpdateInput = Partial<AudienceSegmentCreateInput>;

const isoTimestamp = z.string().datetime({ offset: true });

const segmentRuleSchema = z.object({
  field: z.enum([
    "persona_id",
    "intent_stage",
    "need_category_id",
    "urgency",
    "tag",
    "region",
    "custom",
  ]),
  operator: z.enum(["eq", "neq", "in", "contains", "gte", "lte"]),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

const sizeEstimateSchema = z.object({
  pointEstimate: z.number().int().nonnegative().optional(),
  min: z.number().int().nonnegative().optional(),
  max: z.number().int().nonnegative().optional(),
  confidence: z.number().min(0).max(100),
  estimatedAt: isoTimestamp,
});

export const audienceSegmentSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(AUDIENCE_SEGMENT_STATUSES),
  ruleOperator: z.enum(["and", "or"]),
  rules: z.array(segmentRuleSchema),
  personaIds: z.array(z.string()),
  needCategoryIds: z.array(z.string()),
  intentStages: z.array(z.enum(["awareness", "consideration", "purchase"])),
  sizeEstimate: sizeEstimateSchema.optional(),
  tags: z.array(z.string()),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

export const segmentMembershipSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  segmentId: z.string().min(1),
  memberRef: z.string().min(1),
  memberType: z.enum(["persona", "subject", "external"]),
  matchedAt: isoTimestamp,
  matchScore: z.number().min(0).max(100),
  metadata: z.record(z.unknown()).optional(),
});

/** Validates an AudienceSegment record shape. */
export function validateAudienceSegment(value: unknown): AudienceSegment {
  return audienceSegmentSchema.parse(value);
}

/** Validates a SegmentMembership record shape. */
export function validateSegmentMembership(value: unknown): SegmentMembership {
  return segmentMembershipSchema.parse(value);
}

/** Returns true when a segment can be used for downstream scoring inputs. */
export function isActiveAudienceSegment(
  segment: Pick<AudienceSegment, "status">,
): boolean {
  return segment.status === "active";
}
