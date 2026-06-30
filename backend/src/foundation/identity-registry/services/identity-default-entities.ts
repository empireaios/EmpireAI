import type { IdentityEntity } from "../models/identity-entity.js";
import { CANONICAL_ENTITY_IDS } from "../models/identity-entity.js";

function entity(
  input: Omit<IdentityEntity, "createdAt" | "updatedAt">,
): IdentityEntity {
  const timestamp = new Date().toISOString();
  return { ...input, createdAt: timestamp, updatedAt: timestamp };
}

/** Default identity registry entries — display names may change; canonical IDs never do. */
export function createDefaultIdentityEntities(workspaceId?: string): IdentityEntity[] {
  return [
    entity({
      canonicalId: CANONICAL_ENTITY_IDS.EMPIRE_AI,
      entityType: "empire",
      displayName: "EmpireAI",
      aliases: ["Empire AI", "empireai", "Empire-AI"],
      metadata: { role: "platform", owner: CANONICAL_ENTITY_IDS.FOUNDER_ACCOUNTS },
    }),
    entity({
      canonicalId: CANONICAL_ENTITY_IDS.EMPIRE_CAPITAL,
      entityType: "organization",
      displayName: "Empire Capital",
      aliases: ["EmpireCapital", "empire-capital"],
      metadata: { role: "treasury", parent: CANONICAL_ENTITY_IDS.EMPIRE_AI },
    }),
    entity({
      canonicalId: CANONICAL_ENTITY_IDS.VENNYA,
      entityType: "organization",
      displayName: "Vennya",
      aliases: ["vennya", "Vennya Commerce"],
      metadata: { role: "brand_holding", parent: CANONICAL_ENTITY_IDS.EMPIRE_AI },
    }),
    entity({
      canonicalId: CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT,
      entityType: "account",
      displayName: "Grand King's Account",
      aliases: ["Grand King Account", "GKA", "Grand Kings Account"],
      workspaceId,
      metadata: {
        role: "sovereign_account",
        platform: CANONICAL_ENTITY_IDS.EMPIRE_AI,
        capital: CANONICAL_ENTITY_IDS.EMPIRE_CAPITAL,
      },
    }),
    entity({
      canonicalId: CANONICAL_ENTITY_IDS.FOUNDER_ACCOUNTS,
      entityType: "founder_account",
      displayName: "Founder Accounts",
      aliases: ["Founder Account", "Grand King", "Founders"],
      metadata: { role: "founder_governance", platform: CANONICAL_ENTITY_IDS.EMPIRE_AI },
    }),
  ];
}
