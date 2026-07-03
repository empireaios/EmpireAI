/**
 * G8-09 — Routes identity plugins to existing G8 subsystem plugin hosts.
 */

import { authorizationCentrePluginRegistry } from "../../authorization-centre/cockpit/authorization-centre-plugin-registry.js";
import { registerAuthorizationFrameworkPlugin } from "../../authorization-framework/plugins/authorization-framework-plugin-host.js";
import { registerConnectionHealthPlugin } from "../../connection-health-monitoring/plugins/connection-health-plugin-host.js";
import { registerConnectionRegistryPlugin } from "../../connection-registry/plugins/connection-registry-plugin-host.js";
import { registerCredentialVaultPlugin } from "../../credential-vault-integration/plugins/credential-vault-plugin-host.js";
import { registerIdentityAuthorizationPlugin } from "../../plugins/identity-authorization-plugin-host.js";
import { registerIsolationPlugin } from "../../multi-workspace-isolation/plugins/isolation-plugin-host.js";
import { registerReadinessPlugin } from "../../operational-readiness-engine/plugins/readiness-plugin-host.js";
import { registerTokenLifecyclePlugin } from "../../automatic-reauthorization/plugins/token-lifecycle-plugin-host.js";
import type { IdentityPluginCategory, IdentityPluginManifest } from "../contracts/identity-plugin-types.js";

export type IdentityPluginRegistrationContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  pillowGovernance: true;
};

const CATEGORY_SUBSYSTEM_PLUGIN_KIND: Partial<
  Record<IdentityPluginCategory, { identityKind?: string; subsystemKind: string }>
> = {
  identity_provider_plugin: { identityKind: "identity_provider", subsystemKind: "identity" },
  authorization_provider_plugin: { subsystemKind: "authorization_provider" },
  oauth_strategy_plugin: { subsystemKind: "oauth_strategy" },
  credential_handler_plugin: { subsystemKind: "credential_validator" },
  vault_backend_plugin: { subsystemKind: "vault_backend" },
  health_check_plugin: { subsystemKind: "health_check_provider" },
  readiness_rule_plugin: { subsystemKind: "readiness_rule" },
  reauthorization_plugin: { subsystemKind: "reauthorization_provider" },
  isolation_policy_plugin: { subsystemKind: "isolation_policy" },
  notification_plugin: { identityKind: "notification_provider", subsystemKind: "notification_provider" },
  provider_card_plugin: { subsystemKind: "connection_provider" },
  future_identity_plugin: { identityKind: "identity_provider", subsystemKind: "identity" },
};

function registerIdentitySubsystem(
  manifest: IdentityPluginManifest,
  context: IdentityPluginRegistrationContext,
  pluginKind: string,
) {
  return registerIdentityAuthorizationPlugin({
    manifest: {
      pluginId: manifest.pluginId,
      pluginName: manifest.pluginName,
      pluginKind: pluginKind as "identity_provider",
      pillowGovernance: true,
    },
    actorId: context.actorId,
    workspaceId: context.workspaceId,
    ownerId: context.ownerId,
    pillowGovernance: true,
  });
}

function registerAuthFrameworkSubsystem(
  manifest: IdentityPluginManifest,
  context: IdentityPluginRegistrationContext,
  pluginKind: string,
) {
  return registerAuthorizationFrameworkPlugin({
    manifest: {
      pluginId: manifest.pluginId,
      pluginName: manifest.pluginName,
      pluginKind: pluginKind as "oauth_strategy",
      pillowGovernance: true,
    },
    actorId: context.actorId,
    workspaceId: context.workspaceId,
    ownerId: context.ownerId,
    accountHolderId: context.accountHolderId,
    pillowGovernance: true,
  });
}

function registerCredentialVaultSubsystem(
  manifest: IdentityPluginManifest,
  context: IdentityPluginRegistrationContext,
  pluginKind: string,
) {
  return registerCredentialVaultPlugin({
    manifest: {
      pluginId: manifest.pluginId,
      pluginName: manifest.pluginName,
      pluginKind: pluginKind as "vault_backend",
      pillowGovernance: true,
    },
    actorId: context.actorId,
    workspaceId: context.workspaceId,
    ownerId: context.ownerId,
    accountHolderId: context.accountHolderId,
    pillowGovernance: true,
  });
}

function registerConnectionHealthSubsystem(
  manifest: IdentityPluginManifest,
  context: IdentityPluginRegistrationContext,
  pluginKind: string,
) {
  return registerConnectionHealthPlugin({
    manifest: {
      pluginId: manifest.pluginId,
      pluginName: manifest.pluginName,
      pluginKind: pluginKind as "health_check_provider",
      pillowGovernance: true,
    },
    actorId: context.actorId,
    workspaceId: context.workspaceId,
    ownerId: context.ownerId,
    accountHolderId: context.accountHolderId,
    pillowGovernance: true,
  });
}

function registerReadinessSubsystem(
  manifest: IdentityPluginManifest,
  context: IdentityPluginRegistrationContext,
  pluginKind: string,
) {
  return registerReadinessPlugin({
    manifest: {
      pluginId: manifest.pluginId,
      pluginName: manifest.pluginName,
      pluginKind: pluginKind as "readiness_rule",
      pillowGovernance: true,
    },
    actorId: context.actorId,
    workspaceId: context.workspaceId,
    ownerId: context.ownerId,
    pillowGovernance: true,
  });
}

function registerTokenLifecycleSubsystem(
  manifest: IdentityPluginManifest,
  context: IdentityPluginRegistrationContext,
  pluginKind: string,
) {
  return registerTokenLifecyclePlugin({
    manifest: {
      pluginId: manifest.pluginId,
      pluginName: manifest.pluginName,
      pluginKind: pluginKind as "reauthorization_provider",
      pillowGovernance: true,
    },
    actorId: context.actorId,
    workspaceId: context.workspaceId,
    ownerId: context.ownerId,
    pillowGovernance: true,
  });
}

function registerIsolationSubsystem(
  manifest: IdentityPluginManifest,
  context: IdentityPluginRegistrationContext,
  pluginKind: string,
) {
  return registerIsolationPlugin({
    manifest: {
      pluginId: manifest.pluginId,
      pluginName: manifest.pluginName,
      pluginKind: pluginKind as "isolation_policy",
      pillowGovernance: true,
    },
    actorId: context.actorId,
    workspaceId: context.workspaceId,
    ownerId: context.ownerId,
    pillowGovernance: true,
  });
}

function registerConnectionRegistrySubsystem(
  manifest: IdentityPluginManifest,
  context: IdentityPluginRegistrationContext,
  pluginKind: string,
) {
  return registerConnectionRegistryPlugin({
    manifest: {
      pluginId: manifest.pluginId,
      pluginName: manifest.pluginName,
      pluginKind: pluginKind as "connection_provider",
      pillowGovernance: true,
    },
    actorId: context.actorId,
    workspaceId: context.workspaceId,
    ownerId: context.ownerId,
    pillowGovernance: true,
  });
}

export class IdentityPluginDomainRouter {
  private readonly wiredPlugins = new Set<string>();

  routeRegistration(
    manifest: IdentityPluginManifest,
    context: IdentityPluginRegistrationContext,
  ): { accepted: boolean; pluginId: string; reason: string; subsystem: string } {
    const mapping = CATEGORY_SUBSYSTEM_PLUGIN_KIND[manifest.pluginCategory];
    if (!mapping) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        reason: `Unknown plugin category: ${manifest.pluginCategory}`,
        subsystem: "unknown",
      };
    }

    let result: { accepted: boolean; pluginId: string; reason: string };
    let subsystem = "unknown";

    switch (manifest.pluginCategory) {
      case "identity_provider_plugin":
      case "future_identity_plugin":
      case "notification_plugin":
        result = registerIdentitySubsystem(manifest, context, mapping.identityKind ?? mapping.subsystemKind);
        subsystem = "identity-authorization";
        break;
      case "authorization_provider_plugin":
      case "oauth_strategy_plugin":
        result = registerAuthFrameworkSubsystem(manifest, context, mapping.subsystemKind);
        subsystem = "authorization-framework";
        break;
      case "credential_handler_plugin":
      case "vault_backend_plugin":
        result = registerCredentialVaultSubsystem(manifest, context, mapping.subsystemKind);
        subsystem = "credential-vault-integration";
        break;
      case "health_check_plugin":
        result = registerConnectionHealthSubsystem(manifest, context, mapping.subsystemKind);
        subsystem = "connection-health-monitoring";
        break;
      case "readiness_rule_plugin":
        result = registerReadinessSubsystem(manifest, context, mapping.subsystemKind);
        subsystem = "operational-readiness-engine";
        break;
      case "reauthorization_plugin":
        result = registerTokenLifecycleSubsystem(manifest, context, mapping.subsystemKind);
        subsystem = "automatic-reauthorization";
        break;
      case "isolation_policy_plugin":
        result = registerIsolationSubsystem(manifest, context, mapping.subsystemKind);
        subsystem = "multi-workspace-isolation";
        break;
      case "provider_card_plugin":
        result = registerConnectionRegistrySubsystem(manifest, context, mapping.subsystemKind);
        authorizationCentrePluginRegistry.registerWidget({
          pluginId: manifest.pluginId,
          title: manifest.pluginName,
          buildSummary: () => ({ summary: `Provider card plugin ${manifest.pluginId}` }),
        });
        subsystem = "connection-registry";
        break;
      default:
        return {
          accepted: false,
          pluginId: manifest.pluginId,
          reason: `Unsupported plugin category routing: ${manifest.pluginCategory}`,
          subsystem: "unknown",
        };
    }

    if (result.accepted) {
      this.wiredPlugins.add(manifest.pluginId);
    }

    return { ...result, subsystem };
  }

  isWired(pluginId: string): boolean {
    return this.wiredPlugins.has(pluginId);
  }

  resetForTests(): void {
    this.wiredPlugins.clear();
  }
}

let sharedRouter: IdentityPluginDomainRouter | undefined;

export function getIdentityPluginDomainRouter(): IdentityPluginDomainRouter {
  if (!sharedRouter) {
    sharedRouter = new IdentityPluginDomainRouter();
  }
  return sharedRouter;
}

export function resetIdentityPluginDomainRouterForTests(): void {
  sharedRouter = undefined;
}
