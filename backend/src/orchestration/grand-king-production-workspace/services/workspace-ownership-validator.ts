/**
 * G7-01 — Workspace ownership validation.
 */

import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";

export type WorkspaceOwnershipResult = {
  valid: boolean;
  reason: string;
  singleWorkspaceEnforced: boolean;
};

export function validateWorkspaceOwnership(input: {
  workspaceId: string;
  ownerId: string;
}): WorkspaceOwnershipResult {
  if (input.workspaceId !== GRAND_KING_WORKSPACE_ID) {
    return {
      valid: false,
      reason: "Version 1 supports only the Grand King production workspace — customer workspaces excluded",
      singleWorkspaceEnforced: true,
    };
  }
  if (input.ownerId !== GRAND_KING_ACCOUNT_HOLDER_ID) {
    return {
      valid: false,
      reason: "Workspace owner must be Grand King",
      singleWorkspaceEnforced: true,
    };
  }
  return {
    valid: true,
    reason: "Grand King workspace ownership validated",
    singleWorkspaceEnforced: true,
  };
}
