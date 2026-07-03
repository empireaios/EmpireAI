/**
 * G8-08 — Isolation enforcement service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  MULTI_WORKSPACE_ISOLATION_VERSION,
  type AccessDecision,
  type IdentityIsolationObject,
  type IsolationActorContext,
  type IsolationCheckResult,
  type VisibilityScope,
} from "../contracts/isolation-types.js";
import { recordIsolationEklsObservation } from "../ekls/isolation-ekls-integration.js";
import { validateIsolationPillowGovernance } from "../governance/isolation-pillow-governance.js";
import {
  resolveAccessPolicyForHolder,
  resolveAccountHolderProfile,
  resolveIsolationPolicyProfile,
  resolveVisibilityScopeForRelationship,
} from "../registry/isolation-policy-resolver.js";
import {
  filterAuthorizationRecords,
  filterCredentialReferences,
  filterHealthRecords,
  filterIsolationPayload,
  filterReadinessResults,
} from "./isolation-filter-service.js";
import { listAuthorizationRequests } from "../../authorization-framework/services/authorization-flow-service.js";
import { listCredentialReferences } from "../../credential-vault-integration/services/credential-handoff-service.js";
import { listConnectionHealthChecks } from "../../connection-health-monitoring/services/connection-monitoring-service.js";
import { resolveAllConnectionProviders } from "../../connection-registry/registry/connection-registry-resolver.js";

const delegations = new Map<string, { delegationId: string; fromHolderId: string; toHolderId: string; workspaceId: string; revoked: boolean }>();

export function resetIsolationDelegationStateForTests(): void {
  delegations.clear();
}

function buildIsolationObject(input: {
  workspaceId: string;
  accountHolderId: string;
  accountHolderTypeId: string;
  environment?: "sandbox" | "production";
  providerId?: string;
  connectionId?: string;
  companyId?: string;
  brandId?: string;
  context?: RegistryLoaderContext;
}): IdentityIsolationObject {
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const profile = resolveAccountHolderProfile(input.accountHolderTypeId, ctx);
  const now = new Date().toISOString();
  return {
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    brandId: input.brandId,
    accountHolderId: input.accountHolderId,
    environment: input.environment ?? "production",
    providerId: input.providerId,
    connectionId: input.connectionId,
    visibilityScope: profile?.defaultVisibilityScope ?? "pillow_governed",
    accessPolicy: resolveAccessPolicyForHolder(input.accountHolderTypeId, ctx),
    ownerReference: input.accountHolderId,
    delegationState: "none",
    governanceState: "pillow-governed",
    createdAt: now,
    updatedAt: now,
    correlationId: randomUUID(),
  };
}

function recordCheck(input: {
  actor: IsolationActorContext;
  kind: "isolation_check_passed" | "isolation_check_failed" | "unauthorized_access_blocked";
  summary: string;
  providerId?: string;
}) {
  recordIsolationEklsObservation({
    actorId: input.actor.actorId,
    workspaceId: input.actor.workspaceId,
    ownerId: input.actor.ownerId,
    accountHolderId: input.actor.accountHolderId,
    providerId: input.providerId,
    kind: input.kind,
    summary: input.summary,
    pillowGovernance: true,
  });
}

export function enforceIsolationBoundary(input: {
  actor: IsolationActorContext;
  targetWorkspaceId: string;
  targetAccountHolderId?: string;
  targetProviderId?: string;
  operation: "read" | "write" | "brain_tool" | "cockpit";
  context?: RegistryLoaderContext;
}): IsolationCheckResult {
  const correlationId = randomUUID();
  const ctx = input.context ?? { workspaceId: input.actor.workspaceId };
  const holderTypeId = input.actor.accountHolderTypeId ?? input.actor.accountHolderId;
  const profile = resolveAccountHolderProfile(holderTypeId, ctx);
  const visibilityScope = input.actor.visibilityScope ?? profile?.defaultVisibilityScope ?? "pillow_governed";

  const pillow = validateIsolationPillowGovernance({
    ...input.actor,
    operation: input.operation === "brain_tool" ? "brain_tool" : input.operation === "cockpit" ? "cockpit" : "enforce",
    providerId: input.targetProviderId,
  });
  if (!pillow.allowed) {
    recordCheck({ actor: input.actor, kind: "unauthorized_access_blocked", summary: pillow.reason, providerId: input.targetProviderId });
    return {
      accessDecision: "deny",
      visibilityScope,
      allowed: false,
      reason: pillow.reason,
      workspaceBoundary: false,
      accountHolderBoundary: false,
      providerVisibility: false,
      credentialVisibility: false,
      governanceState: "pillow-governed",
      correlationId,
    };
  }

  const workspaceBoundary = input.targetWorkspaceId === input.actor.workspaceId;
  if (!workspaceBoundary && profile?.workspaceScoped !== false) {
    recordCheck({
      actor: input.actor,
      kind: "isolation_check_failed",
      summary: `Workspace boundary violation: ${input.targetWorkspaceId}`,
    });
    return {
      accessDecision: "deny",
      visibilityScope,
      allowed: false,
      reason: "Cross-workspace access denied",
      workspaceBoundary: false,
      accountHolderBoundary: true,
      providerVisibility: true,
      credentialVisibility: false,
      governanceState: "pillow-governed",
      correlationId,
    };
  }

  let accountHolderBoundary = true;
  if (
    input.targetAccountHolderId &&
    input.targetAccountHolderId !== input.actor.accountHolderId &&
    visibilityScope !== "grand_king_visible" &&
    visibilityScope !== "operator_visible"
  ) {
    accountHolderBoundary = false;
  }

  let providerVisibility = true;
  if (input.targetProviderId) {
    const providers = resolveAllConnectionProviders(ctx);
    providerVisibility = providers.some((p) => p.providerId === input.targetProviderId);
  }

  let accessDecision: AccessDecision = "allow";
  if (!accountHolderBoundary || !providerVisibility) accessDecision = "deny";
  else if (visibilityScope === "private_to_account_holder" && input.operation === "write") accessDecision = "requires_pillow_review";
  else if (delegations.has(`${input.actor.workspaceId}:${input.actor.accountHolderId}`)) accessDecision = "requires_delegation";

  const allowed = accessDecision === "allow";
  recordCheck({
    actor: input.actor,
    kind: allowed ? "isolation_check_passed" : "isolation_check_failed",
    summary: allowed ? "Isolation check passed" : `Isolation check failed: ${accessDecision}`,
    providerId: input.targetProviderId,
  });

  if (!allowed && accessDecision === "deny") {
    recordCheck({
      actor: input.actor,
      kind: "unauthorized_access_blocked",
      summary: "Unauthorized access blocked by isolation enforcement",
      providerId: input.targetProviderId,
    });
  }

  return {
    accessDecision,
    visibilityScope,
    allowed,
    reason: allowed ? "Isolation boundary enforced" : "Access denied by isolation policy",
    workspaceBoundary,
    accountHolderBoundary,
    providerVisibility,
    credentialVisibility: allowed,
    governanceState: "pillow-governed",
    correlationId,
  };
}

export function checkIdentityIsolation(input: {
  actor: IsolationActorContext;
  targetWorkspaceId: string;
  targetAccountHolderId?: string;
  targetProviderId?: string;
  context?: RegistryLoaderContext;
}) {
  return enforceIsolationBoundary({ ...input, operation: "read" });
}

export function buildIdentityVisibilityMatrix(input: {
  actor: IsolationActorContext;
  context?: RegistryLoaderContext;
}) {
  const ctx = input.context ?? { workspaceId: input.actor.workspaceId };
  const policy = resolveIsolationPolicyProfile(ctx);
  const providers = resolveAllConnectionProviders(ctx);
  const holderTypeId = input.actor.accountHolderTypeId ?? input.actor.accountHolderId;
  const actorProfile = resolveAccountHolderProfile(holderTypeId, ctx);
  const viewerScope = input.actor.visibilityScope ?? actorProfile?.defaultVisibilityScope ?? "pillow_governed";

  return {
    frameworkVersion: MULTI_WORKSPACE_ISOLATION_VERSION,
    workspaceId: input.actor.workspaceId,
    viewerScope,
    accountHolders: policy.accountHolders.map((holder) => ({
      accountHolderTypeId: holder.accountHolderTypeId,
      visibilityScope: holder.defaultVisibilityScope,
      accessPolicy: holder.eligibilityRuleRef,
      visible: viewerScope === "grand_king_visible" || holder.defaultVisibilityScope === viewerScope,
    })),
    providers: providers.map((provider) => {
      const check = enforceIsolationBoundary({
        actor: input.actor,
        targetWorkspaceId: input.actor.workspaceId,
        targetProviderId: provider.providerId,
        operation: "read",
        context: ctx,
      });
      return {
        providerId: provider.providerId,
        visible: check.allowed,
        accessDecision: check.accessDecision,
      };
    }),
    registryRefs: policy.registryRefs,
    governanceState: "pillow-governed" as const,
  };
}

export function getAccountHolderConnectionScope(input: {
  actor: IsolationActorContext;
  accountHolderTypeId?: string;
  context?: RegistryLoaderContext;
}) {
  const ctx = input.context ?? { workspaceId: input.actor.workspaceId };
  const typeId = input.accountHolderTypeId ?? input.actor.accountHolderTypeId ?? input.actor.accountHolderId;
  const profile = resolveAccountHolderProfile(typeId, ctx);
  const auths = filterAuthorizationRecords(listAuthorizationRequests(), input.actor);
  const creds = filterCredentialReferences(listCredentialReferences(ctx), input.actor);
  return {
    frameworkVersion: MULTI_WORKSPACE_ISOLATION_VERSION,
    accountHolderTypeId: typeId,
    visibilityScope: profile?.defaultVisibilityScope ?? "pillow_governed",
    accessPolicy: profile?.eligibilityRuleRef ?? "policy:isolation:pillow-governed",
    authorizationCount: auths.length,
    credentialRefCount: creds.length,
    providerIds: [...new Set([...auths.map((a) => a.providerId), ...creds.map((c) => c.providerId)])],
    governanceState: "pillow-governed" as const,
  };
}

export function getWorkspaceAuthorizationScope(input: {
  actor: IsolationActorContext;
  context?: RegistryLoaderContext;
}) {
  const ctx = input.context ?? { workspaceId: input.actor.workspaceId };
  const check = enforceIsolationBoundary({
    actor: input.actor,
    targetWorkspaceId: input.actor.workspaceId,
    operation: "read",
    context: ctx,
  });
  const auths = filterAuthorizationRecords(
    listAuthorizationRequests().filter((r) => r.workspaceId === input.actor.workspaceId),
    input.actor,
  );
  return {
    frameworkVersion: MULTI_WORKSPACE_ISOLATION_VERSION,
    workspaceId: input.actor.workspaceId,
    accessDecision: check.accessDecision,
    authorizationRecords: auths.map((a) => ({
      authorizationId: a.authorizationId,
      providerId: a.providerId,
      accountHolderId: a.accountHolderId,
      flowState: a.flowState,
      visibilityScope: resolveAccountHolderProfile(a.accountHolderId, ctx)?.defaultVisibilityScope ?? "pillow_governed",
    })),
    governanceState: "pillow-governed" as const,
  };
}

export function getCredentialReferenceVisibility(input: {
  actor: IsolationActorContext;
  providerId?: string;
  context?: RegistryLoaderContext;
}) {
  const ctx = input.context ?? { workspaceId: input.actor.workspaceId };
  const creds = filterCredentialReferences(listCredentialReferences(ctx), input.actor).filter(
    (c) => !input.providerId || c.providerId === input.providerId,
  );
  return {
    frameworkVersion: MULTI_WORKSPACE_ISOLATION_VERSION,
    visibleReferences: creds.map((c) => ({
      credentialRefId: c.credentialRefId,
      providerId: c.providerId,
      workspaceId: c.workspaceId,
      accountHolderId: c.accountHolderId,
      status: c.status,
      vaultBackend: c.vaultBackend,
      visibilityScope: "pillow_governed" as VisibilityScope,
    })),
    count: creds.length,
    governanceState: "pillow-governed" as const,
  };
}

export function filterIsolatedHealthRecords(input: {
  actor: IsolationActorContext;
  context?: RegistryLoaderContext;
}) {
  const ctx = input.context ?? { workspaceId: input.actor.workspaceId };
  return filterHealthRecords(listConnectionHealthChecks(ctx), input.actor);
}

export function filterIsolatedReadinessResults<T extends { workspaceId: string; accountHolderId?: string }>(
  results: T[],
  actor: IsolationActorContext,
): T[] {
  return filterReadinessResults(results, actor);
}

export function createDelegation(input: {
  actor: IsolationActorContext;
  toAccountHolderId: string;
  context?: RegistryLoaderContext;
}) {
  const check = enforceIsolationBoundary({
    actor: input.actor,
    targetWorkspaceId: input.actor.workspaceId,
    targetAccountHolderId: input.toAccountHolderId,
    operation: "write",
    context: input.context,
  });
  if (!check.allowed && check.accessDecision !== "requires_delegation") {
    throw new Error(check.reason);
  }
  const delegationId = randomUUID();
  delegations.set(`${input.actor.workspaceId}:${input.actor.accountHolderId}`, {
    delegationId,
    fromHolderId: input.actor.accountHolderId,
    toHolderId: input.toAccountHolderId,
    workspaceId: input.actor.workspaceId,
    revoked: false,
  });
  recordIsolationEklsObservation({
    actorId: input.actor.actorId,
    workspaceId: input.actor.workspaceId,
    ownerId: input.actor.ownerId,
    accountHolderId: input.actor.accountHolderId,
    kind: "delegation_created",
    summary: `Delegation created to ${input.toAccountHolderId}`,
    pillowGovernance: true,
  });
  return { delegationId, governanceState: "pillow-governed" as const };
}

export function revokeDelegation(input: {
  actor: IsolationActorContext;
}) {
  const key = `${input.actor.workspaceId}:${input.actor.accountHolderId}`;
  const delegation = delegations.get(key);
  if (delegation) {
    delegation.revoked = true;
    delegations.set(key, delegation);
  }
  recordIsolationEklsObservation({
    actorId: input.actor.actorId,
    workspaceId: input.actor.workspaceId,
    ownerId: input.actor.ownerId,
    accountHolderId: input.actor.accountHolderId,
    kind: "delegation_revoked",
    summary: "Delegation revoked",
    pillowGovernance: true,
  });
  return { revoked: true, governanceState: "pillow-governed" as const };
}

export function enforceBrainToolIsolation(input: {
  toolName: string;
  actor: IsolationActorContext;
  targetWorkspaceId: string;
  targetAccountHolderId?: string;
  targetProviderId?: string;
}) {
  return enforceIsolationBoundary({
    actor: input.actor,
    targetWorkspaceId: input.targetWorkspaceId,
    targetAccountHolderId: input.targetAccountHolderId,
    targetProviderId: input.targetProviderId,
    operation: "brain_tool",
  });
}

export function wrapBrainToolResult(result: unknown, visibilityScope: VisibilityScope): unknown {
  return filterIsolationPayload(result, visibilityScope);
}

export function buildIdentityIsolationObject(input: {
  workspaceId: string;
  accountHolderId: string;
  accountHolderTypeId: string;
  providerId?: string;
  connectionId?: string;
  context?: RegistryLoaderContext;
}) {
  return buildIsolationObject(input);
}

export function getMultiWorkspaceIsolationVersion(): string {
  return MULTI_WORKSPACE_ISOLATION_VERSION;
}

export { filterIsolationPayload };
