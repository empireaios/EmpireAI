/**
 * EKLS — Workspace isolation policy.
 * @see CANONICAL_EKLS_SPECIFICATION.md
 */

export type EklsWorkspaceScope = {
  workspaceId: string;
  companyId?: string | null;
  crossWorkspaceApproved?: boolean;
};

export function assertWorkspaceIsolation(
  requestWorkspaceId: string,
  objectWorkspaceId: string,
  crossWorkspaceApproved = false,
): { allowed: boolean; reason: string } {
  if (requestWorkspaceId === objectWorkspaceId) {
    return { allowed: true, reason: "same_workspace" };
  }
  if (crossWorkspaceApproved) {
    return { allowed: true, reason: "pillow_cross_workspace_approval" };
  }
  return {
    allowed: false,
    reason: "workspace_isolation_violation — cross-workspace access requires explicit Pillow approval",
  };
}

export function requireWorkspaceMatch(
  requestWorkspaceId: string,
  objectWorkspaceId: string,
  crossWorkspaceApproved = false,
): void {
  const result = assertWorkspaceIsolation(requestWorkspaceId, objectWorkspaceId, crossWorkspaceApproved);
  if (!result.allowed) {
    throw new Error(result.reason);
  }
}
