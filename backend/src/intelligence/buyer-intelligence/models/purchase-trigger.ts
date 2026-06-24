import { z } from "zod";
import type { NeedCategoryId } from "./need-category.js";

/** Workspace-scoped purchase trigger identifier. */
export type PurchaseTriggerId = string;

export const PURCHASE_TRIGGER_TYPES = [
  "event",
  "season",
  "trend",
  "lifecycle",
  "competitor",
  "price",
  "social",
] as const;
export type PurchaseTriggerType = (typeof PURCHASE_TRIGGER_TYPES)[number];

export type PurchaseTriggerCondition = {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in";
  value: string | number | boolean | string[];
};

/** Events or conditions that elevate purchase likelihood. */
export type PurchaseTrigger = {
  id: PurchaseTriggerId;
  workspaceId: string;
  name: string;
  triggerType: PurchaseTriggerType;
  description?: string;
  conditions: PurchaseTriggerCondition[];
  linkedNeedCategoryIds: NeedCategoryId[];
  strength: number;
  observationIds: string[];
  active: boolean;
  windowStart?: string;
  windowEnd?: string;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseTriggerCreateInput = Omit<
  PurchaseTrigger,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type PurchaseTriggerUpdateInput = Partial<PurchaseTriggerCreateInput>;

const isoTimestamp = z.string().datetime({ offset: true });

const triggerConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export const purchaseTriggerSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  triggerType: z.enum(PURCHASE_TRIGGER_TYPES),
  description: z.string().optional(),
  conditions: z.array(triggerConditionSchema),
  linkedNeedCategoryIds: z.array(z.string()),
  strength: z.number().min(0).max(100),
  observationIds: z.array(z.string()),
  active: z.boolean(),
  windowStart: isoTimestamp.optional(),
  windowEnd: isoTimestamp.optional(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a PurchaseTrigger record shape. */
export function validatePurchaseTrigger(value: unknown): PurchaseTrigger {
  return purchaseTriggerSchema.parse(value);
}

/** Returns whether a trigger is active for a given ISO timestamp. */
export function isPurchaseTriggerActiveAt(
  trigger: Pick<PurchaseTrigger, "active" | "windowStart" | "windowEnd">,
  atIso: string,
): boolean {
  if (!trigger.active) {
    return false;
  }
  const at = Date.parse(atIso);
  if (trigger.windowStart && at < Date.parse(trigger.windowStart)) {
    return false;
  }
  if (trigger.windowEnd && at > Date.parse(trigger.windowEnd)) {
    return false;
  }
  return true;
}
