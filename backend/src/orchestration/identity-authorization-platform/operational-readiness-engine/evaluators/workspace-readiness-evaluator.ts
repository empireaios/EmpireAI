/**
 * G8-06 — Workspace / platform readiness evaluators.
 */

import type { ReadinessContext, ReadinessLevel } from "../contracts/readiness-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { resolveRequiredProvidersForContext, resolveReadinessPolicyProfile } from "../registry/readiness-policy-resolver.js";
import { evaluateAllProviderReadiness } from "./provider-readiness-evaluator.js";

export function evaluateWorkspaceReadiness(input: {
  workspaceId: string;
  context?: RegistryLoaderContext;
  readinessContext?: ReadinessContext;
}) {
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const readinessContext = input.readinessContext ?? "workspace";
  const required = resolveRequiredProvidersForContext(readinessContext, ctx);
  const states = evaluateAllProviderReadiness(input.workspaceId, required, ctx);
  const profile = resolveReadinessPolicyProfile(ctx);

  const connected = states.filter((s) => s.connected).map((s) => s.providerId);
  const missing = states.filter((s) => !s.connected).map((s) => s.providerId);
  const expired = states.filter((s) => s.expired).map((s) => s.providerId);
  const degraded = states.filter((s) => s.degraded).map((s) => s.providerId);

  let level: ReadinessLevel = "unknown";
  const score = required.length === 0 ? 0 : Math.round((connected.length / required.length) * 100);
  if (profile.blockerConditions.length > 0 && missing.length === required.length) level = "blocked";
  else if (score >= 85 && expired.length === 0) level = "ready";
  else if (score >= 50) level = "partially_ready";
  else if (missing.length > 0) level = "not_ready";
  else level = "requires_review";

  return { states, required, connected, missing, expired, degraded, level, score, profile };
}

export function evaluateEmpirePlatformReadiness(workspaceId: string, context?: RegistryLoaderContext) {
  return evaluateWorkspaceReadiness({ workspaceId, context, readinessContext: "empire_platform" });
}

export function evaluateAccountHolderReadiness(input: {
  workspaceId: string;
  accountHolderId: string;
  context?: RegistryLoaderContext;
}) {
  const result = evaluateWorkspaceReadiness({
    workspaceId: input.workspaceId,
    context: input.context,
    readinessContext: "account_holder",
  });
  return { ...result, accountHolderId: input.accountHolderId };
}

export function evaluateBrandReadiness(input: {
  workspaceId: string;
  brandId: string;
  context?: RegistryLoaderContext;
}) {
  const result = evaluateWorkspaceReadiness({
    workspaceId: input.workspaceId,
    context: input.context,
    readinessContext: "brand",
  });
  return { ...result, brandId: input.brandId };
}
