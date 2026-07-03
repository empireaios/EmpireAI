/**
 * Version governance Pillow gateway — version awareness under Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import { GRAND_KING_VERSION_LOCK_AUTHORITY } from "../doctrine/version-lock-doctrine.js";

export type VersionGovernancePillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "lock_version" | "recommend_version" | "query_status" | "record_ekls";
  pillowGovernance: true;
};

export type VersionGovernancePillowResult = {
  allowed: boolean;
  reason: string;
  workspaceValidated: boolean;
  ownershipValidated: boolean;
  eklsGoverned: boolean;
  grandKingOwnership: boolean;
};

function deny(reason: string): VersionGovernancePillowResult {
  return {
    allowed: false,
    reason,
    workspaceValidated: false,
    ownershipValidated: false,
    eklsGoverned: false,
    grandKingOwnership: false,
  };
}

export function validateVersionGovernancePillowGovernance(
  context: VersionGovernancePillowContext,
): VersionGovernancePillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no version lock bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }

  const grandKingOwnership = context.ownerId === GRAND_KING_VERSION_LOCK_AUTHORITY;
  if (context.operation === "lock_version" && !grandKingOwnership) {
    return deny("Grand King ownership required to lock a version");
  }

  const ekls =
    context.operation === "record_ekls"
      ? enforceEklsAccess(
          {
            pillowGovernance: true,
            actorId: context.actorId,
            workspaceId: context.workspaceId,
            consumerChannel: "empire-version-governance",
            operation: "store",
          },
          context.workspaceId,
        )
      : { allowed: true, reason: "Version governance query — EKLS store not required" };

  return {
    allowed: ekls.allowed,
    reason: ekls.allowed
      ? "Version governance operation permitted under Pillow"
      : ekls.reason ?? "EKLS access denied",
    workspaceValidated: true,
    ownershipValidated: grandKingOwnership || context.operation !== "lock_version",
    eklsGoverned: context.operation === "record_ekls" ? ekls.allowed : true,
    grandKingOwnership,
  };
}

export function buildVersionGovernancePillowContext(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
}): {
  currentReleasedVersion: string;
  currentWorkingVersion: string;
  versionStatus: "LOCKED";
  productionStatus: string;
  doctrineSummary: string;
} {
  return {
    currentReleasedVersion: "EmpireAI Version 1.0",
    currentWorkingVersion: "Version 1.x Development",
    versionStatus: "LOCKED",
    productionStatus: "ACTIVE",
    doctrineSummary:
      "Only the Grand King may authorize Lock Version. Pillow may recommend versions but must never create versions automatically.",
  };
}
