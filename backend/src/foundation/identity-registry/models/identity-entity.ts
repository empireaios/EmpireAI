import { z } from "zod";

export const IDENTITY_ENTITY_TYPES = [
  "empire",
  "organization",
  "account",
  "workspace",
  "founder_account",
  "brand",
  "platform",
] as const;

export type IdentityEntityType = (typeof IDENTITY_ENTITY_TYPES)[number];

export const IDENTITY_CHANGE_TYPES = [
  "CREATED",
  "DISPLAY_NAME",
  "ALIAS_ADDED",
  "ALIAS_REMOVED",
] as const;

export type IdentityChangeType = (typeof IDENTITY_CHANGE_TYPES)[number];

export const identityEntitySchema = z.object({
  canonicalId: z.string().min(1),
  entityType: z.enum(IDENTITY_ENTITY_TYPES),
  displayName: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  workspaceId: z.string().optional(),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type IdentityEntity = z.infer<typeof identityEntitySchema>;

export type IdentityHistoryEntry = {
  historyId: string;
  canonicalId: string;
  changeType: IdentityChangeType;
  previousValue: string | null;
  newValue: string | null;
  summary: string;
  actor: string;
  createdAt: string;
};

export type IdentityResolveResult = {
  matchedBy: "canonical_id" | "alias" | "display_name";
  entity: IdentityEntity;
};

export type IdentityRegisterInput = {
  canonicalId: string;
  entityType: IdentityEntityType;
  displayName: string;
  aliases?: string[];
  workspaceId?: string;
  metadata?: Record<string, string>;
  actor?: string;
};

/** Stable canonical IDs — modules must reference these, never display names. */
export const CANONICAL_ENTITY_IDS = {
  EMPIRE_AI: "id:empire:empire-ai",
  EMPIRE_CAPITAL: "id:organization:empire-capital",
  VENNYA: "id:organization:vennya",
  GRAND_KINGS_ACCOUNT: "id:account:grand-kings",
  FOUNDER_ACCOUNTS: "id:founder_account:founders",
} as const;

export function validateIdentityEntity(value: unknown): IdentityEntity {
  return identityEntitySchema.parse(value);
}
