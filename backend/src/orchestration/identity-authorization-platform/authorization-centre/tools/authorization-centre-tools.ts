/**
 * G8-05 — Authorization Centre Cockpit Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import {
  assertNoSecretsInHealthPayload,
  redactConnectionHealthSecrets,
} from "../../connection-health-monitoring/contracts/connection-health-types.js";
import {
  cancelAuthorization,
  startAuthorization,
} from "../../authorization-framework/services/authorization-flow-service.js";
import { runConnectionHealthCheck } from "../../connection-health-monitoring/services/connection-monitoring-service.js";
import { searchConnectionHealthEklsObservations } from "../../connection-health-monitoring/ekls/connection-health-ekls-integration.js";
import {
  listCredentialReferences,
  previewCredentialHandoff,
} from "../../credential-vault-integration/services/credential-handoff-service.js";
import { searchCredentialVaultEklsObservations } from "../../credential-vault-integration/ekls/credential-vault-ekls-integration.js";
import { searchAuthorizationFrameworkEklsObservations } from "../../authorization-framework/ekls/authorization-framework-ekls-integration.js";
import { validateAuthorizationCentreAction } from "../cockpit/authorization-centre-pillow-governance.js";
import {
  getAuthorizationCentreRequirements,
  loadAuthorizationCentreAttentionItems,
  loadAuthorizationCentreDetailView,
  loadAuthorizationCentreView,
} from "../cockpit/authorization-centre-view-loader.js";
import type { AuthorizationCentreAction } from "../contracts/authorization-centre-types.js";

function safePayload(value: unknown) {
  const redacted = redactConnectionHealthSecrets(value);
  assertNoSecretsInHealthPayload(redacted);
  return redacted;
}

export const authorizationCentreTools: RegisteredTool[] = [
  {
    name: "authorization_centre.load_view",
    description: "G8-05 — Load Authorization Centre dashboard — SCR-304 executive overview",
    module: "cockpit-authorization-centre",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(loadAuthorizationCentreView(args.workspaceId ? String(args.workspaceId) : context.workspaceId)),
  },
  {
    name: "authorization_centre.load_detail",
    description: "G8-05 — Load Authorization Centre provider detail view",
    module: "cockpit-authorization-centre",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        providerId: { type: "string" },
      },
      required: ["providerId"],
    },
    handler: async (args, context) => {
      const view = loadAuthorizationCentreDetailView(
        args.workspaceId ? String(args.workspaceId) : context.workspaceId,
        String(args.providerId),
      );
      if (!view) return safePayload({ found: false });
      return safePayload({ found: true, ...view });
    },
  },
  {
    name: "authorization_centre.attention_items",
    description: "G8-05 — Load Authorization Centre executive attention items",
    module: "cockpit-authorization-centre",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        loadAuthorizationCentreAttentionItems(args.workspaceId ? String(args.workspaceId) : context.workspaceId),
      ),
  },
  {
    name: "authorization_centre.execute_action",
    description: "G8-05 — Execute Pillow-governed Authorization Centre executive action",
    module: "cockpit-authorization-centre",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
        accountHolderId: { type: "string" },
        providerId: { type: "string" },
        authorizationId: { type: "string" },
        connectionId: { type: "string" },
        action: { type: "string" },
      },
      required: ["workspaceId", "actorId", "action"],
    },
    handler: async (args) => {
      const action = String(args.action) as AuthorizationCentreAction;
      const workspaceId = String(args.workspaceId);
      const actorId = String(args.actorId);
      const ownerId = String(args.ownerId ?? "grand-king");
      const accountHolderId = String(args.accountHolderId ?? "grand-king");
      const providerId = args.providerId ? String(args.providerId) : undefined;

      const governance = validateAuthorizationCentreAction({
        action,
        actorId,
        workspaceId,
        ownerId,
        accountHolderId,
        providerId,
      });
      if (!governance.allowed) {
        return safePayload({ success: false, reason: governance.reason, pillowGoverned: true });
      }

      switch (action) {
        case "start_authorization":
        case "reconnect": {
          if (!providerId) return safePayload({ success: false, reason: "providerId required" });
          const started = startAuthorization({
            actorId,
            ownerId,
            workspaceId,
            accountHolderId,
            providerId,
            pillowGovernance: true,
          });
          return safePayload({ success: true, result: started, pillowGoverned: true });
        }
        case "cancel_authorization": {
          if (!args.authorizationId) return safePayload({ success: false, reason: "authorizationId required" });
          const cancelled = cancelAuthorization({
            actorId,
            ownerId,
            workspaceId,
            accountHolderId,
            authorizationId: String(args.authorizationId),
            pillowGovernance: true,
          });
          return safePayload({ success: true, result: cancelled, pillowGoverned: true });
        }
        case "submit_credential": {
          if (!providerId || !args.authorizationId || !args.connectionId) {
            return safePayload({ success: false, reason: "providerId, authorizationId, connectionId required" });
          }
          const handoff = previewCredentialHandoff({
            actorId,
            ownerId,
            workspaceId,
            accountHolderId,
            providerId,
            authorizationId: String(args.authorizationId),
            connectionId: String(args.connectionId),
            pillowGovernance: true,
          });
          return safePayload({ success: handoff.accepted, result: handoff, pillowGoverned: true });
        }
        case "run_health_check":
        case "refresh_status": {
          if (!providerId) return safePayload({ success: false, reason: "providerId required" });
          const checks = runConnectionHealthCheck({
            actorId,
            ownerId,
            workspaceId,
            accountHolderId,
            providerId,
            pillowGovernance: true,
          });
          return safePayload({ success: true, result: checks, pillowGoverned: true });
        }
        case "view_requirements": {
          if (!providerId) return safePayload({ success: false, reason: "providerId required" });
          return safePayload({
            success: true,
            result: getAuthorizationCentreRequirements(providerId, workspaceId),
            pillowGoverned: true,
          });
        }
        case "view_credential_references": {
          const refs = listCredentialReferences({ workspaceId }).filter(
            (r) => !providerId || r.providerId === providerId,
          );
          return safePayload({ success: true, result: refs, pillowGoverned: true });
        }
        case "view_ekls_events": {
          const events = [
            ...searchAuthorizationFrameworkEklsObservations({ workspaceId, providerId, pillowGovernance: true }),
            ...searchCredentialVaultEklsObservations({ workspaceId, providerId, pillowGovernance: true }),
            ...searchConnectionHealthEklsObservations({ workspaceId, providerId, pillowGovernance: true }),
          ];
          return safePayload({ success: true, result: events, pillowGoverned: true });
        }
        default:
          return safePayload({ success: false, reason: `Unsupported action: ${action}` });
      }
    },
  },
];
