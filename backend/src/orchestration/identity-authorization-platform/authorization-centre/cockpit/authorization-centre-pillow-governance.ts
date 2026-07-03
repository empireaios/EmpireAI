/**
 * G8-05 — Authorization Centre Pillow governance for Cockpit actions.
 */

import { validateAuthorizationFrameworkPillowGovernance } from "../../authorization-framework/governance/authorization-framework-pillow-governance.js";
import { validateConnectionHealthPillowGovernance } from "../../connection-health-monitoring/governance/connection-health-pillow-governance.js";
import { validateConnectionRegistryPillowGovernance } from "../../connection-registry/governance/connection-registry-pillow-governance.js";
import { validateCredentialVaultPillowGovernance } from "../../credential-vault-integration/governance/credential-vault-pillow-governance.js";
import { validateIdentityAuthorizationPillowGovernance } from "../../governance/identity-authorization-pillow-governance.js";
import type { AuthorizationCentreAction } from "../contracts/authorization-centre-types.js";

export type AuthorizationCentreActionContext = {
  action: AuthorizationCentreAction;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  providerId?: string;
};

export function validateAuthorizationCentreAction(context: AuthorizationCentreActionContext): {
  allowed: boolean;
  reason: string;
  pillowGoverned: true;
} {
  const base = validateIdentityAuthorizationPillowGovernance({
    actorId: context.actorId,
    workspaceId: context.workspaceId,
    ownerId: context.ownerId,
    operation: "overview",
    pillowGovernance: true,
  });
  if (!base.allowed) {
    return { allowed: false, reason: base.reason, pillowGoverned: true };
  }

  if (context.providerId) {
    const registry = validateConnectionRegistryPillowGovernance({
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      ownerId: context.ownerId,
      providerId: context.providerId,
      operation: "resolve",
      pillowGovernance: true,
    });
    if (!registry.allowed) {
      return { allowed: false, reason: registry.reason, pillowGoverned: true };
    }
  }

  switch (context.action) {
    case "start_authorization":
    case "reconnect":
    case "cancel_authorization":
    case "view_requirements": {
      const auth = validateAuthorizationFrameworkPillowGovernance({
        actorId: context.actorId,
        workspaceId: context.workspaceId,
        ownerId: context.ownerId,
        accountHolderId: context.accountHolderId,
        providerId: context.providerId,
        operation: context.action === "cancel_authorization" ? "cancel" : "start",
        pillowGovernance: true,
      });
      if (!auth.allowed) return { allowed: false, reason: auth.reason, pillowGoverned: true };
      break;
    }
    case "submit_credential":
    case "view_credential_references": {
      const vault = validateCredentialVaultPillowGovernance({
        actorId: context.actorId,
        workspaceId: context.workspaceId,
        ownerId: context.ownerId,
        accountHolderId: context.accountHolderId,
        providerId: context.providerId,
        operation: context.action === "submit_credential" ? "handoff" : "list",
        pillowGovernance: true,
      });
      if (!vault.allowed) return { allowed: false, reason: vault.reason, pillowGoverned: true };
      break;
    }
    case "run_health_check":
    case "refresh_status": {
      const health = validateConnectionHealthPillowGovernance({
        actorId: context.actorId,
        workspaceId: context.workspaceId,
        ownerId: context.ownerId,
        accountHolderId: context.accountHolderId,
        providerId: context.providerId,
        operation: "check",
        pillowGovernance: true,
      });
      if (!health.allowed) return { allowed: false, reason: health.reason, pillowGoverned: true };
      break;
    }
    case "view_ekls_events":
      break;
    default:
      return { allowed: false, reason: `Unknown authorization centre action: ${context.action}`, pillowGoverned: true };
  }

  return { allowed: true, reason: "Authorization Centre action permitted", pillowGoverned: true };
}
