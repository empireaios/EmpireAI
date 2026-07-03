/**
 * G7-01 — Workspace lifecycle manager.
 */

import type { GrandKingProductionWorkspace, WorkspaceStatus } from "../contracts/production-workspace-types.js";
import { isValidWorkspaceTransition } from "../contracts/production-workspace-types.js";

export function transitionWorkspaceStatus(
  workspace: GrandKingProductionWorkspace,
  targetStatus: WorkspaceStatus,
  governanceState: string,
): { ok: true; workspace: GrandKingProductionWorkspace } | { ok: false; reason: string } {
  if (!isValidWorkspaceTransition(workspace.status, targetStatus)) {
    return {
      ok: false,
      reason: `Invalid workspace transition from ${workspace.status} to ${targetStatus}`,
    };
  }
  return {
    ok: true,
    workspace: {
      ...workspace,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
      governanceState,
    },
  };
}
