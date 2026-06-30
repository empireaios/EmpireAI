import { z } from "zod";

import { ACCOUNT_PROVIDER_IDS } from "./account-provider.js";

export const HUMAN_ACTION_TYPES = [
  "identity_verification",
  "tax_verification",
  "banking_verification",
  "marketplace_approval",
  "document_upload",
  "oauth_authorization",
  "account_creation",
  "permission_renewal",
] as const;

export type HumanActionType = (typeof HUMAN_ACTION_TYPES)[number];

export const HUMAN_ACTION_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"] as const;

export type HumanActionStatus = (typeof HUMAN_ACTION_STATUSES)[number];

export const humanActionItemSchema = z.object({
  actionId: z.string().min(1),
  workspaceId: z.string().min(1),
  providerId: z.enum(ACCOUNT_PROVIDER_IDS),
  accountType: z.enum(["grand_king", "founder"]).default("grand_king"),
  actionType: z.enum(HUMAN_ACTION_TYPES),
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(HUMAN_ACTION_STATUSES),
  requiredBy: z.string().optional(),
  blockingOperations: z.array(z.string()).default([]),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type HumanActionItem = z.infer<typeof humanActionItemSchema>;
