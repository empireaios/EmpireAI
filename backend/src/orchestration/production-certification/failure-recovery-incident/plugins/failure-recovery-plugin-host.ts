/**
 * G6-08 — Failure recovery certification plugin host.
 */

import type { FailureCertificationFinding, FailureRecoveryPluginManifest } from "../contracts/failure-recovery-incident-types.js";
import { failureRecoveryPluginManifestSchema } from "../contracts/failure-recovery-incident-types.js";
import { validateFailureRecoveryPillowGovernance } from "../governance/failure-recovery-pillow-governance.js";

export type FailureRecoveryPluginHook = {
  pluginId: string;
  validatorKind: FailureRecoveryPluginManifest["validatorKind"];
  validate: (input: { workspaceId: string }) => FailureCertificationFinding[];
};

const pluginRecords = new Map<string, { manifest: FailureRecoveryPluginManifest; hooks: FailureRecoveryPluginHook }>();

export function registerFailureRecoveryPlugin(input: {
  manifest: FailureRecoveryPluginManifest;
  hooks: FailureRecoveryPluginHook;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId?: string; reason: string } {
  const governance = validateFailureRecoveryPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "failure_recovery_scan",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason };
  }

  const manifest = failureRecoveryPluginManifestSchema.parse(input.manifest);
  if (input.hooks.pluginId !== manifest.pluginId) {
    return { accepted: false, reason: "Plugin hook pluginId must match manifest pluginId" };
  }

  pluginRecords.set(manifest.pluginId, { manifest, hooks: input.hooks });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Failure recovery plugin registered" };
}

export function runFailureRecoveryPluginValidators(input: {
  workspaceId: string;
  validatorKind?: FailureRecoveryPluginManifest["validatorKind"];
}): FailureCertificationFinding[] {
  const findings: FailureCertificationFinding[] = [];
  for (const record of pluginRecords.values()) {
    if (input.validatorKind && record.manifest.validatorKind !== input.validatorKind) continue;
    findings.push(...record.hooks.validate({ workspaceId: input.workspaceId }));
  }
  return findings;
}

export function resetFailureRecoveryPluginHostForTests(): void {
  pluginRecords.clear();
}
