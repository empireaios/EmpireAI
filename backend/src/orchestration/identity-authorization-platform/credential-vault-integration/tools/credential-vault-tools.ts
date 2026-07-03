/**
 * G8-03 — Credential Vault Integration Brain tools (never return raw secrets).
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import {
  assertNoRawSecretsInPayload,
  redactCredentialVaultSecrets,
} from "../contracts/credential-vault-types.js";
import { buildCockpitCredentialDetailView } from "../contracts/credential-vault-cockpit-contracts.js";
import {
  getCredentialHealth,
  getCredentialReferenceDetail,
  getCredentialRotationStatus,
  listCredentialReferences,
  previewCredentialHandoff,
  runCredentialRedactionTest,
} from "../services/credential-handoff-service.js";

function safePayload(value: unknown) {
  const redacted = redactCredentialVaultSecrets(value);
  assertNoRawSecretsInPayload(redacted);
  return redacted;
}

export const credentialVaultTools: RegisteredTool[] = [
  {
    name: "credential_reference_list",
    description: "G8-03 — List credential references (metadata only, secrets redacted)",
    module: "credential-vault-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    handler: async (args) =>
      safePayload(
        listCredentialReferences({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
      ),
  },
  {
    name: "credential_reference_detail",
    description: "G8-03 — Credential reference detail with rotation, expiry, health metadata",
    module: "credential-vault-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        credentialRefId: { type: "string" },
      },
      required: ["credentialRefId"],
    },
    handler: async (args) => {
      const detail = getCredentialReferenceDetail(String(args.credentialRefId));
      if (!detail) return { found: false };
      return safePayload({ found: true, ...detail, cockpit: buildCockpitCredentialDetailView(detail.reference) });
    },
  },
  {
    name: "credential_handoff_preview",
    description: "G8-03 — Preview credential handoff to vault (transient material discarded)",
    module: "credential-vault-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        providerId: { type: "string" },
        authorizationId: { type: "string" },
        connectionId: { type: "string" },
        transientMaterial: { type: "string" },
      },
      required: ["actorId", "providerId", "authorizationId", "connectionId"],
    },
    handler: async (args) =>
      safePayload(
        previewCredentialHandoff({
          actorId: String(args.actorId),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? "ws_empire_1"),
          accountHolderId: String(args.accountHolderId ?? "grand-king"),
          providerId: String(args.providerId),
          authorizationId: String(args.authorizationId),
          connectionId: String(args.connectionId),
          transientMaterial: args.transientMaterial ? String(args.transientMaterial) : undefined,
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "credential_health",
    description: "G8-03 — Credential health metadata for a reference",
    module: "credential-vault-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        credentialRefId: { type: "string" },
      },
      required: ["credentialRefId"],
    },
    handler: async (args) => safePayload(getCredentialHealth(String(args.credentialRefId)) ?? { found: false }),
  },
  {
    name: "credential_rotation_status",
    description: "G8-03 — Credential rotation metadata for a reference",
    module: "credential-vault-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        credentialRefId: { type: "string" },
      },
      required: ["credentialRefId"],
    },
    handler: async (args) =>
      safePayload(getCredentialRotationStatus(String(args.credentialRefId)) ?? { found: false }),
  },
  {
    name: "credential_redaction_test",
    description: "G8-03 — Test secret redaction safeguards (no secrets returned)",
    module: "credential-vault-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        samplePayload: { type: "object" },
      },
    },
    handler: async (args) => safePayload(runCredentialRedactionTest(args.samplePayload ?? {})),
  },
];
