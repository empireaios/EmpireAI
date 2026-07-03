/**
 * Version Lock Doctrine — permanent governance for EmpireAI version certification.
 *
 * Only the Grand King may authorize a version lock.
 * Pillow may recommend versions but must never create versions automatically.
 */

export const VERSION_LOCK_DOCTRINE_ID = "EMPIRE-VERSION-LOCK-DOCTRINE" as const;

export const VERSION_LOCK_DOCTRINE_RULES = [
  "Only the Grand King may authorize Lock Version",
  "Pillow may recommend a version but must never create a version automatically",
  "Locked versions are immutable — future work accumulates as unreleased changes",
  "Version history is append-only and must never be rewritten",
  "Future versions require release notes, executive audit, version report, certification summary, and change summary",
  "Version baselines remain traceable in repository history",
  "No mission may modify a locked version baseline",
] as const;

export const GRAND_KING_VERSION_LOCK_AUTHORITY = "grand-king" as const;

export const VERSION_LOCK_FUTURE_CHANGES_POLICY =
  "EmpireAI Version 1.0 is LOCKED. All post-lock repository changes accumulate as unreleased work under Version 1.x Development until the Grand King approves a new version." as const;

export const PILLOW_VERSION_RECOMMENDATION_POLICY =
  "Pillow may surface pending version recommendations for Grand King review. Pillow must never auto-create, auto-lock, or auto-release a version." as const;

export const FUTURE_VERSION_EXAMPLES = ["1.1", "1.2", "2.0", "3.0"] as const;

export type VersionLockAuthorizationInput = {
  actorId: string;
  ownerId: string;
  grandKingAuthorizes: boolean;
  operation: "lock_version" | "recommend_version" | "query_status";
};

export type VersionLockAuthorizationResult = {
  allowed: boolean;
  reason: string;
  doctrineId: typeof VERSION_LOCK_DOCTRINE_ID;
  grandKingRequired: boolean;
  pillowMayRecommendOnly: boolean;
};

export function evaluateVersionLockAuthorization(
  input: VersionLockAuthorizationInput,
): VersionLockAuthorizationResult {
  const base = {
    doctrineId: VERSION_LOCK_DOCTRINE_ID,
    grandKingRequired: input.operation === "lock_version",
    pillowMayRecommendOnly: input.operation === "recommend_version",
  };

  if (input.operation === "recommend_version") {
    return {
      ...base,
      allowed: true,
      reason: "Pillow may recommend versions — auto-creation is forbidden by doctrine",
    };
  }

  if (input.operation === "query_status") {
    return {
      ...base,
      allowed: true,
      reason: "Version status queries are permitted under Pillow governance",
    };
  }

  if (input.ownerId !== GRAND_KING_VERSION_LOCK_AUTHORITY) {
    return {
      ...base,
      allowed: false,
      reason: "Only the Grand King may authorize Lock Version",
    };
  }

  if (!input.grandKingAuthorizes) {
    return {
      ...base,
      allowed: false,
      reason: "Grand King explicit authorization required to lock a version",
    };
  }

  return {
    ...base,
    allowed: true,
    reason: "Grand King authorized Version Lock under canonical doctrine",
  };
}
