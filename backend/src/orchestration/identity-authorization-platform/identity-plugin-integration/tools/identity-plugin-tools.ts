/**
 * G8-09 — Identity plugin Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import {
  assertNoSecretsInIdentityPluginPayload,
  redactIdentityPluginSecrets,
  type IdentityPluginManifest,
} from "../contracts/identity-plugin-types.js";
import { validateIdentityPlugin } from "../services/identity-plugin-compatibility-service.js";
import {
  checkIdentityPluginHealth,
  disableIdentityPlugin,
  enableIdentityPlugin,
  getIdentityPluginDetail,
  listIdentityPluginCapabilities,
  listIdentityPlugins,
} from "../services/identity-plugin-lifecycle-manager.js";

function safePayload(value: unknown) {
  const redacted = redactIdentityPluginSecrets(value);
  assertNoSecretsInIdentityPluginPayload(redacted);
  return redacted;
}

const DEFAULT_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  accountHolderId: "grand-king",
  pillowGovernance: true as const,
};

export const identityPluginTools: RegisteredTool[] = [
  {
    name: "identity_plugin_list",
    description: "G8-09 — List installed identity plugins for workspace (secrets redacted)",
    module: "identity-plugin-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        listIdentityPlugins({
          actorId: String(args.actorId ?? DEFAULT_ACTOR.actorId),
          ownerId: String(args.ownerId ?? DEFAULT_ACTOR.ownerId),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }).map((record) => ({
          pluginId: record.pluginId,
          pluginName: record.pluginName,
          pluginCategory: record.pluginCategory,
          pluginVersion: record.pluginVersion,
          status: record.status,
          healthStatus: record.healthStatus,
          capabilities: record.capabilities,
          supportedProviders: record.supportedProviders,
          registryBindingIds: record.registryBindingIds,
          warnings: record.warnings,
          errors: record.errors,
        })),
      ),
  },
  {
    name: "identity_plugin_detail",
    description: "G8-09 — Identity plugin detail (no secrets)",
    module: "identity-plugin-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        pluginId: { type: "string" },
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["pluginId"],
    },
    handler: async (args, context) => {
      const detail = getIdentityPluginDetail({
        pluginId: String(args.pluginId),
        actorId: String(args.actorId ?? DEFAULT_ACTOR.actorId),
        ownerId: String(args.ownerId ?? DEFAULT_ACTOR.ownerId),
        workspaceId: String(args.workspaceId ?? context.workspaceId),
        pillowGovernance: true,
      });
      if (!detail) return safePayload({ found: false, pluginId: args.pluginId });
      return safePayload({
        found: true,
        pluginId: detail.pluginId,
        pluginName: detail.pluginName,
        pluginCategory: detail.pluginCategory,
        pluginVersion: detail.pluginVersion,
        status: detail.status,
        healthStatus: detail.healthStatus,
        capabilities: detail.capabilities,
        supportedProviders: detail.supportedProviders,
        supportedConnectionTypes: detail.supportedConnectionTypes,
        supportedCredentialTypes: detail.supportedCredentialTypes,
        registryBindingIds: detail.registryBindingIds,
        requiredPermissions: detail.requiredPermissions,
        governanceState: detail.governanceState,
        warnings: detail.warnings,
        errors: detail.errors,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
      });
    },
  },
  {
    name: "identity_plugin_validate",
    description: "G8-09 — Validate identity plugin manifest against registry policy and compatibility",
    module: "identity-plugin-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        manifest: { type: "object" },
        workspaceId: { type: "string" },
      },
      required: ["manifest"],
    },
    handler: async (args, context) =>
      safePayload(
        validateIdentityPlugin({
          manifest: args.manifest as IdentityPluginManifest,
          workspaceId: String(args.workspaceId ?? context.workspaceId),
        }),
      ),
  },
  {
    name: "identity_plugin_enable",
    description: "G8-09 — Enable identity plugin under Pillow governance",
    module: "identity-plugin-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        pluginId: { type: "string" },
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["pluginId"],
    },
    handler: async (args, context) =>
      safePayload(
        enableIdentityPlugin({
          pluginId: String(args.pluginId),
          actorId: String(args.actorId ?? DEFAULT_ACTOR.actorId),
          ownerId: String(args.ownerId ?? DEFAULT_ACTOR.ownerId),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "identity_plugin_disable",
    description: "G8-09 — Disable identity plugin under Pillow governance",
    module: "identity-plugin-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        pluginId: { type: "string" },
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["pluginId"],
    },
    handler: async (args, context) =>
      safePayload(
        disableIdentityPlugin({
          pluginId: String(args.pluginId),
          actorId: String(args.actorId ?? DEFAULT_ACTOR.actorId),
          ownerId: String(args.ownerId ?? DEFAULT_ACTOR.ownerId),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "identity_plugin_health",
    description: "G8-09 — Identity plugin health check (metadata only)",
    module: "identity-plugin-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        pluginId: { type: "string" },
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["pluginId"],
    },
    handler: async (args, context) =>
      safePayload(
        checkIdentityPluginHealth({
          pluginId: String(args.pluginId),
          actorId: String(args.actorId ?? DEFAULT_ACTOR.actorId),
          ownerId: String(args.ownerId ?? DEFAULT_ACTOR.ownerId),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "identity_plugin_capabilities",
    description: "G8-09 — List enabled identity plugin capabilities for workspace",
    module: "identity-plugin-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        listIdentityPluginCapabilities({
          actorId: String(args.actorId ?? DEFAULT_ACTOR.actorId),
          ownerId: String(args.ownerId ?? DEFAULT_ACTOR.ownerId),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }),
      ),
  },
];
