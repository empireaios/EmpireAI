import { z } from "zod";
import type { EyeSignalDomain } from "../../../eye/types.js";

/** Workspace-scoped need category identifier. */
export type NeedCategoryId = string;

export const NEED_CATEGORY_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type NeedCategoryPriority = (typeof NEED_CATEGORY_PRIORITIES)[number];

/**
 * Classified buyer need linked to Eye observation domains.
 * Buyer Intelligence derives needs from observations; Product Intelligence consumes
 * need context independently downstream.
 */
export type NeedCategory = {
  id: NeedCategoryId;
  workspaceId: string;
  slug: string;
  label: string;
  description?: string;
  observationDomains: EyeSignalDomain[];
  parentCategoryId?: NeedCategoryId;
  priority: NeedCategoryPriority;
  keywords: string[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
};

export type NeedCategoryCreateInput = Omit<
  NeedCategory,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type NeedCategoryUpdateInput = Partial<NeedCategoryCreateInput>;

const eyeSignalDomainSchema = z.enum([
  "product",
  "trend",
  "supplier",
  "advertisement",
  "market",
  "risk",
]);

const isoTimestamp = z.string().datetime({ offset: true });

export const needCategorySchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  slug: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  observationDomains: z.array(eyeSignalDomainSchema).min(1),
  parentCategoryId: z.string().optional(),
  priority: z.enum(NEED_CATEGORY_PRIORITIES),
  keywords: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a NeedCategory record shape. */
export function validateNeedCategory(value: unknown): NeedCategory {
  return needCategorySchema.parse(value);
}

/** Returns whether a need category is informed by a given observation domain. */
export function needCategoryMatchesDomain(
  category: Pick<NeedCategory, "observationDomains">,
  domain: EyeSignalDomain,
): boolean {
  return category.observationDomains.includes(domain);
}
