/**
 * G6-03 — Infrastructure deployment plugin host.
 */

import type {
  InfrastructureDeploymentPluginManifest,
  InfrastructureDeploymentViolation,
} from "../contracts/infrastructure-deployment-types.js";
import { infrastructureDeploymentPluginManifestSchema } from "../contracts/infrastructure-deployment-types.js";
import { validateInfrastructureDeploymentPillowGovernance } from "../governance/infrastructure-deployment-pillow-governance.js";

export type InfrastructureDeploymentPluginHook = {
  pluginId: string;
  validatorKind: InfrastructureDeploymentPluginManifest["validatorKind"];
  validate: (input: { workspaceId: string }) => InfrastructureDeploymentViolation[];
};

const pluginRecords = new Map<string, { manifest: InfrastructureDeploymentPluginManifest; hooks: InfrastructureDeploymentPluginHook; lifecycleState: "enabled" }>();

export function registerInfrastructureDeploymentPlugin(input: {
  manifest: InfrastructureDeploymentPluginManifest;
  hooks: InfrastructureDeploymentPluginHook;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId?: string; reason: string } {
  const governance = validateInfrastructureDeploymentPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "deployment_scan",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason };
  }

  const manifest = infrastructureDeploymentPluginManifestSchema.parse(input.manifest);
  if (input.hooks.pluginId !== manifest.pluginId) {
    return { accepted: false, reason: "Plugin hook pluginId must match manifest pluginId" };
  }

  pluginRecords.set(manifest.pluginId, {
    manifest,
    hooks: input.hooks,
    lifecycleState: "enabled",
  });

  return { accepted: true, pluginId: manifest.pluginId, reason: "Infrastructure deployment plugin registered" };
}

export function runInfrastructureDeploymentPluginValidators(input: {
  workspaceId: string;
  validatorKind?: InfrastructureDeploymentPluginManifest["validatorKind"];
}): InfrastructureDeploymentViolation[] {
  const violations: InfrastructureDeploymentViolation[] = [];
  for (const record of pluginRecords.values()) {
    if (input.validatorKind && record.manifest.validatorKind !== input.validatorKind) continue;
    violations.push(...record.hooks.validate({ workspaceId: input.workspaceId }));
  }
  return violations;
}

export function resetInfrastructureDeploymentPluginHostForTests(): void {
  pluginRecords.clear();
}
