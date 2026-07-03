/**
 * G8-06 — Missing requirement detector.
 */

import type { ReadinessBlocker } from "../contracts/readiness-types.js";
import type { ProviderReadinessState } from "../evaluators/provider-readiness-evaluator.js";
import { resolveReadinessPolicyProfile } from "../registry/readiness-policy-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { listReadinessPluginsByKind } from "../plugins/readiness-plugin-host.js";

export function detectMissingRequirements(input: {
  states: ProviderReadinessState[];
  missingProviders: string[];
  context?: RegistryLoaderContext;
}): {
  missingCredentials: string[];
  missingPermissions: string[];
  missingScopes: string[];
  blockers: ReadinessBlocker[];
} {
  const profile = resolveReadinessPolicyProfile(input.context ?? {});
  const plugins = listReadinessPluginsByKind("blocker_detector");
  void plugins;

  const missingCredentials = input.states.filter((s) => s.missingCredential).map((s) => s.providerId);
  const missingPermissions = input.states.filter((s) => s.missingPermissions).map((s) => s.providerId);
  const missingScopes = input.states.filter((s) => s.missingScopes).map((s) => s.providerId);

  const blockers: ReadinessBlocker[] = [];

  for (const providerId of input.missingProviders) {
    blockers.push({
      blockerId: `blocker:missing-provider:${providerId}`,
      severity: "high",
      message: `Provider ${providerId} is not connected`,
      providerId,
      evidence: [`provider:missing:${providerId}`],
    });
  }

  for (const providerId of input.states.filter((s) => s.expired).map((s) => s.providerId)) {
    blockers.push({
      blockerId: `blocker:expired:${providerId}`,
      severity: "critical",
      message: `Connection expired for ${providerId}`,
      providerId,
      evidence: [`provider:expired:${providerId}`],
    });
  }

  for (const condition of profile.blockerConditions) {
    if (input.missingProviders.length > 0 && input.missingProviders.length === input.states.length) {
      blockers.push({
        blockerId: `blocker:policy:${condition}`,
        severity: "medium",
        message: `Readiness policy blocker: ${condition}`,
        evidence: [`readiness-policy:${condition}`],
      });
    }
  }

  return { missingCredentials, missingPermissions, missingScopes, blockers };
}
