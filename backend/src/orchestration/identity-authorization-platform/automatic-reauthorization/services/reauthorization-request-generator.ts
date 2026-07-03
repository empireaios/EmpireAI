/**
 * G8-07 — Reauthorization request generator.
 */

import { randomUUID } from "node:crypto";
import type { ReauthorizationReason, ReauthorizationRequest, TokenLifecycleState } from "../contracts/token-lifecycle-types.js";
import type { ExpiryDetectionResult } from "../evaluators/expiry-detector.js";
import type { TokenLifecycleProfile } from "../registry/token-lifecycle-resolver.js";
import {
  resolveRefreshEligible,
  resolveRequiredActionFromProfile,
} from "../registry/token-lifecycle-resolver.js";

export function generateReauthorizationRequest(input: {
  providerId: string;
  connectionId: string;
  authorizationId: string;
  credentialRefId: string | null;
  workspaceId: string;
  accountHolderId: string;
  environment: "sandbox" | "production";
  profile: TokenLifecycleProfile;
  detection: ExpiryDetectionResult;
  lifecycleState: TokenLifecycleState;
  reason: ReauthorizationReason;
}): ReauthorizationRequest {
  const now = new Date().toISOString();
  const refreshEligible = resolveRefreshEligible(input.profile, input.lifecycleState);
  const requiredAction = resolveRequiredActionFromProfile(input.profile, input.lifecycleState);

  return {
    reauthorizationId: randomUUID(),
    connectionId: input.connectionId,
    providerId: input.providerId,
    authorizationId: input.authorizationId,
    credentialRefId: input.credentialRefId,
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId,
    environment: input.environment,
    reason: input.reason,
    lifecycleState: input.lifecycleState,
    requiredAction,
    expiry: input.detection.expiry,
    warningWindow: input.detection.warningWindow,
    refreshEligible,
    requiresUserAction: !refreshEligible || input.lifecycleState === "reconnect_required",
    requiresPillowApproval: refreshEligible || input.lifecycleState === "revoked",
    createdAt: now,
    updatedAt: now,
    correlationId: randomUUID(),
    governanceState: "pillow-governed",
  };
}
