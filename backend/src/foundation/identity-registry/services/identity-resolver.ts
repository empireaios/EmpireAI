import type { IdentityEntity, IdentityResolveResult } from "../models/identity-entity.js";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Resolves an entity by canonical ID, alias, or display name — modules must store canonical IDs. */
export function resolveIdentityEntity(
  query: string,
  entities: IdentityEntity[],
): IdentityResolveResult | null {
  const normalizedQuery = normalize(query);

  for (const entity of entities) {
    if (entity.canonicalId === query) {
      return { matchedBy: "canonical_id", entity };
    }
  }

  for (const entity of entities) {
    if (normalize(entity.displayName) === normalizedQuery) {
      return { matchedBy: "display_name", entity };
    }
  }

  for (const entity of entities) {
    if (entity.aliases.some((alias) => normalize(alias) === normalizedQuery)) {
      return { matchedBy: "alias", entity };
    }
  }

  return null;
}

/** Returns the current display name for a canonical ID without coupling modules to names. */
export function getIdentityDisplayName(
  canonicalId: string,
  entities: IdentityEntity[],
  fallback = canonicalId,
): string {
  const entity = entities.find((entry) => entry.canonicalId === canonicalId);
  return entity?.displayName ?? fallback;
}
