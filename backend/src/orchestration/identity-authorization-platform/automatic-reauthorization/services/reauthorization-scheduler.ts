/**
 * G8-07 — Reauthorization scheduler (registry-driven lifecycle scan).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { listAuthorizationRequests } from "../../authorization-framework/services/authorization-flow-service.js";
import { listCredentialReferences } from "../../credential-vault-integration/services/credential-handoff-service.js";
import { resolveAllTokenLifecycleProfiles } from "../registry/token-lifecycle-resolver.js";
import { detectTokenExpiry } from "../evaluators/expiry-detector.js";
import type { TokenLifecycleState } from "../contracts/token-lifecycle-types.js";

export type ScheduledLifecycleScanResult = {
  providerId: string;
  connectionId: string;
  authorizationId: string;
  lifecycleState: TokenLifecycleState;
  expiry: string | null;
  scheduledAction: string;
};

export function scanTokenLifecycleSchedule(input: {
  workspaceId: string;
  context?: RegistryLoaderContext;
}): ScheduledLifecycleScanResult[] {
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const profiles = resolveAllTokenLifecycleProfiles(ctx);
  const results: ScheduledLifecycleScanResult[] = [];

  for (const profile of profiles) {
    const authRequests = listAuthorizationRequests().filter(
      (r) => r.providerId === profile.providerId && r.workspaceId === input.workspaceId,
    );
    const latestAuth = authRequests[authRequests.length - 1];
    const credRefs = listCredentialReferences(ctx).filter((r) => r.providerId === profile.providerId);
    const credRef = credRefs[credRefs.length - 1];

    const detection = detectTokenExpiry({
      providerId: profile.providerId,
      workspaceId: input.workspaceId,
      authorization: latestAuth,
      credentialRef: credRef,
      context: ctx,
    });

    if (detection.lifecycleState === "active") continue;

    results.push({
      providerId: profile.providerId,
      connectionId: latestAuth?.connectionId ?? `connection:${profile.providerId}:${input.workspaceId}`,
      authorizationId: latestAuth?.authorizationId ?? "",
      lifecycleState: detection.lifecycleState,
      expiry: detection.expiry,
      scheduledAction:
        detection.lifecycleState === "expiring_soon"
          ? "warn"
          : detection.lifecycleState === "expired"
            ? "reconnect"
            : detection.lifecycleState === "refresh_required"
              ? "refresh"
              : "review",
    });
  }

  return results;
}
