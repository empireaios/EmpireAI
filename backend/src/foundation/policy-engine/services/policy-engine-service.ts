import type { GovernancePolicyRule } from "../../empire-governance/models/governance-policy.js";
import type {
  BusinessPolicy,
  PolicyLifecycleRecord,
  PolicyResolution,
  PolicyResolveInput,
  PolicyUpdateInput,
  PolicyUpsertInput,
} from "../models/business-policy.js";
import { createDefaultBusinessPolicies } from "./policy-default-policies.js";
import { compileExecutableBusinessPolicies } from "./policy-compiler.js";
import {
  createPolicyLifecycleRecord,
  getPolicyRepository,
} from "../repositories/sqlite-policy-repository.js";

export class PolicyNotFoundError extends Error {
  constructor(policyId: string) {
    super(`Business policy not found: ${policyId}`);
    this.name = "PolicyNotFoundError";
  }
}

export class PolicyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyConflictError";
  }
}

function recordLifecycle(
  input: Omit<PolicyLifecycleRecord, "lifecycleId" | "createdAt">,
): PolicyLifecycleRecord {
  return getPolicyRepository().appendLifecycle(createPolicyLifecycleRecord(input));
}

function buildResolution(policy: BusinessPolicy, reason: string): PolicyResolution {
  return {
    policyId: policy.policyId,
    category: policy.category,
    name: policy.name,
    decisionMode: policy.decisionMode,
    config: policy.config,
    allowed: policy.decisionMode !== "deny" && policy.status === "ACTIVE",
    requiresApproval:
      policy.decisionMode === "approval_required" ||
      policy.decisionMode === "approval_optional",
    sandboxOnly: policy.decisionMode === "sandbox_only",
    automatic: policy.decisionMode === "automatic",
    reason,
  };
}

function evaluateContextThreshold(
  policy: BusinessPolicy,
  context?: Record<string, unknown>,
): PolicyResolution {
  if (policy.category === "capitalApproval" && context?.amountCents !== undefined) {
    const threshold = Number(policy.config.approvalThresholdCents ?? 0);
    const amount = Number(context.amountCents);
    if (amount > threshold) {
      return buildResolution(
        policy,
        `Capital amount ${amount} exceeds approval threshold ${threshold}`,
      );
    }
    return {
      ...buildResolution(policy, "Capital amount within auto-approval threshold"),
      requiresApproval: false,
    };
  }

  if (policy.category === "productSelection" && context?.score !== undefined) {
    const threshold = Number(policy.config.autoScoreThreshold ?? 1);
    const score = Number(context.score);
    if (policy.decisionMode === "automatic" && score >= threshold) {
      return {
        ...buildResolution(policy, `Product score ${score} meets automatic threshold`),
        automatic: true,
        requiresApproval: false,
      };
    }
    if (policy.decisionMode === "manual") {
      return buildResolution(policy, "Product selection requires manual founder review");
    }
  }

  return buildResolution(policy, `Policy resolved: ${policy.name}`);
}

/** Idempotent seed of default business policies. */
export function initializePolicies(workspaceId: string): BusinessPolicy[] {
  const repository = getPolicyRepository();
  const existing = repository.listPolicies(workspaceId);
  if (existing.length > 0) {
    return existing;
  }

  const policies = createDefaultBusinessPolicies(workspaceId);
  for (const policy of policies) {
    repository.savePolicy(policy);
    recordLifecycle({
      policyId: policy.policyId,
      workspaceId,
      event: "CREATED",
      summary: `Business policy created: ${policy.name}`,
      actor: "policy-engine",
      metadata: { version: String(policy.version), category: policy.category },
    });
  }

  return policies;
}

export function upsertPolicy(input: PolicyUpsertInput): BusinessPolicy {
  const repository = getPolicyRepository();
  const existing = repository.getPolicyById(input.policyId);
  const timestamp = new Date().toISOString();

  if (existing) {
    throw new PolicyConflictError(`Business policy already exists: ${input.policyId}`);
  }

  const policy: BusinessPolicy = {
    policyId: input.policyId,
    workspaceId: input.workspaceId,
    category: input.category,
    name: input.name,
    description: input.description,
    decisionMode: input.decisionMode,
    config: input.config ?? {},
    executableEnforcement: input.executableEnforcement,
    status: "ACTIVE",
    version: 1,
    resolveCount: 0,
    metadata: input.metadata ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  repository.savePolicy(policy);
  recordLifecycle({
    policyId: policy.policyId,
    workspaceId: input.workspaceId,
    event: "CREATED",
    summary: `Business policy published: ${policy.name}`,
    actor: input.actor ?? "system",
    metadata: { version: "1", category: policy.category },
  });

  return policy;
}

export function updatePolicy(input: PolicyUpdateInput): BusinessPolicy {
  const repository = getPolicyRepository();
  const existing = repository.getPolicyById(input.policyId);
  if (!existing) {
    throw new PolicyNotFoundError(input.policyId);
  }

  const updated: BusinessPolicy = {
    ...existing,
    name: input.name ?? existing.name,
    description: input.description ?? existing.description,
    decisionMode: input.decisionMode ?? existing.decisionMode,
    config: input.config ?? existing.config,
    executableEnforcement: input.executableEnforcement ?? existing.executableEnforcement,
    metadata: { ...existing.metadata, ...input.metadata },
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.savePolicy(updated);
  recordLifecycle({
    policyId: updated.policyId,
    workspaceId: updated.workspaceId,
    event: "MODIFIED",
    summary: `Business policy modified: ${updated.name} → v${updated.version}`,
    actor: input.actor ?? "system",
    metadata: { version: String(updated.version), category: updated.category },
  });

  return updated;
}

export function disablePolicy(policyId: string, actor = "system", reason?: string): BusinessPolicy {
  const repository = getPolicyRepository();
  const existing = repository.getPolicyById(policyId);
  if (!existing) {
    throw new PolicyNotFoundError(policyId);
  }

  const updated: BusinessPolicy = {
    ...existing,
    status: "DISABLED",
    updatedAt: new Date().toISOString(),
  };

  repository.savePolicy(updated);
  recordLifecycle({
    policyId,
    workspaceId: updated.workspaceId,
    event: "DISABLED",
    summary: reason ?? `Business policy disabled: ${updated.name}`,
    actor,
    metadata: { version: String(updated.version) },
  });

  return updated;
}

export function enablePolicy(policyId: string, actor = "system"): BusinessPolicy {
  const repository = getPolicyRepository();
  const existing = repository.getPolicyById(policyId);
  if (!existing) {
    throw new PolicyNotFoundError(policyId);
  }

  const updated: BusinessPolicy = {
    ...existing,
    status: "ACTIVE",
    updatedAt: new Date().toISOString(),
  };

  repository.savePolicy(updated);
  recordLifecycle({
    policyId,
    workspaceId: updated.workspaceId,
    event: "ENABLED",
    summary: `Business policy enabled: ${updated.name}`,
    actor,
    metadata: { version: String(updated.version) },
  });

  return updated;
}

export function resolvePolicy(input: PolicyResolveInput): PolicyResolution {
  initializePolicies(input.workspaceId);
  const repository = getPolicyRepository();

  let policy: BusinessPolicy | null = null;
  if (input.policyId) {
    policy = repository.getPolicyById(input.policyId);
  } else if (input.category) {
    policy = repository.getPolicyByCategory(input.workspaceId, input.category);
  }

  if (!policy) {
    throw new PolicyNotFoundError(input.policyId ?? input.category ?? "unknown");
  }

  if (policy.status !== "ACTIVE") {
    return {
      ...buildResolution(policy, `Policy ${policy.name} is disabled`),
      allowed: false,
    };
  }

  const resolution = evaluateContextThreshold(policy, input.context);

  const updated: BusinessPolicy = {
    ...policy,
    resolveCount: policy.resolveCount + 1,
    updatedAt: new Date().toISOString(),
  };
  repository.savePolicy(updated);

  recordLifecycle({
    policyId: policy.policyId,
    workspaceId: input.workspaceId,
    event: "RESOLVED",
    summary: `Policy resolved for ${input.module ?? policy.category}:${input.action ?? "evaluate"}`,
    actor: input.actor ?? "system",
    correlationId: input.correlationId,
    metadata: {
      decisionMode: resolution.decisionMode,
      requiresApproval: String(resolution.requiresApproval),
      module: input.module ?? "",
      action: input.action ?? "",
    },
  });

  return resolution;
}

export function getPolicy(policyId: string): BusinessPolicy | null {
  return getPolicyRepository().getPolicyById(policyId);
}

export function getPolicyForCategory(workspaceId: string, category: string): BusinessPolicy | null {
  initializePolicies(workspaceId);
  return getPolicyRepository().getPolicyByCategory(workspaceId, category);
}

export function listPolicies(workspaceId: string, status?: BusinessPolicy["status"]): BusinessPolicy[] {
  initializePolicies(workspaceId);
  return getPolicyRepository().listPolicies(workspaceId, status);
}

export function listPolicyLifecycle(policyId: string, limit = 100): PolicyLifecycleRecord[] {
  return getPolicyRepository().listLifecycle(policyId, limit);
}

export function listWorkspacePolicyLifecycle(
  workspaceId: string,
  limit = 100,
): PolicyLifecycleRecord[] {
  return getPolicyRepository().listWorkspaceLifecycle(workspaceId, limit);
}

/** Returns active business policies compiled into governance enforcement rules. */
export function getExecutableBusinessPolicies(workspaceId: string): GovernancePolicyRule[] {
  initializePolicies(workspaceId);
  const active = getPolicyRepository()
    .listPolicies(workspaceId)
    .filter((policy) => policy.status === "ACTIVE");
  return compileExecutableBusinessPolicies(active);
}

export function recordPolicyEnforcement(
  policyId: string,
  context: { actor?: string; correlationId?: string; module?: string; action?: string },
): void {
  const repository = getPolicyRepository();
  const existing = repository.getPolicyById(policyId);
  if (!existing) {
    return;
  }

  recordLifecycle({
    policyId,
    workspaceId: existing.workspaceId,
    event: "RESOLVED",
    summary: `Policy enforced via governance during ${context.module ?? "system"}:${context.action ?? "evaluate"}`,
    actor: context.actor ?? "system",
    correlationId: context.correlationId,
    metadata: {
      source: "governance",
      module: context.module ?? "",
      action: context.action ?? "",
    },
  });
}

export function recordPolicyReferencesFromVerdict(
  workspaceId: string,
  policyId?: string,
  context?: { actor?: string; correlationId?: string; module?: string; action?: string },
): void {
  if (!policyId?.startsWith("governance:policy:")) {
    return;
  }

  const match = policyId.match(/^governance:(policy:[^:]+):v\d+$/);
  const businessPolicyId = match?.[1];
  if (!businessPolicyId) {
    return;
  }

  recordPolicyEnforcement(businessPolicyId, {
    actor: context?.actor,
    correlationId: context?.correlationId,
    module: context?.module,
    action: context?.action,
  });
}

export function setProductSelectionMode(
  workspaceId: string,
  mode: "manual" | "automatic",
  actor = "system",
): BusinessPolicy {
  initializePolicies(workspaceId);
  const policy = getPolicyRepository().getPolicyByCategory(workspaceId, "productSelection");
  if (!policy) {
    throw new PolicyNotFoundError("productSelection");
  }

  return updatePolicy({
    policyId: policy.policyId,
    decisionMode: mode,
    config: {
      ...policy.config,
      mode,
      requireFounderReview: mode === "manual",
    },
    actor,
  });
}
