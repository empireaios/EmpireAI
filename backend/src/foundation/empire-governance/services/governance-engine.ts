import { randomUUID } from "node:crypto";

import type { OrchestratorDispatchRequest } from "../../../brain/types.js";
import type {
  GovernanceDecisionRecord,
  GovernanceDecisionRequest,
  GovernanceDomain,
  GovernancePolicyRule,
  GovernanceVerdict,
} from "../models/governance-policy.js";
import {
  createDefaultGovernancePolicies,
  resolveGovernanceDomain,
} from "./governance-default-policies.js";
import { evaluateGovernancePolicies } from "./governance-evaluator.js";
import {
  getExecutableDoctrinePolicies,
  recordDoctrineReferencesFromVerdict,
} from "../../doctrine-engine/services/doctrine-engine-service.js";
import {
  getExecutableBusinessPolicies,
  recordPolicyReferencesFromVerdict,
} from "../../policy-engine/services/policy-engine-service.js";
import {
  createGovernanceDecisionRecord,
  getGovernanceRepository,
} from "../repositories/sqlite-governance-repository.js";

export class GovernanceBlockedError extends Error {
  constructor(
    message: string,
    readonly verdict: GovernanceVerdict,
  ) {
    super(message);
    this.name = "GovernanceBlockedError";
  }
}

/** Empire Governance Engine — every decision passes through governance. */
export class GovernanceEngine {
  evaluateDecision(
    request: GovernanceDecisionRequest,
    options?: { actor?: string; record?: boolean },
  ): GovernanceVerdict {
    initializeGovernancePolicies(request.workspaceId);
    const policies = [
      ...getGovernanceRepository().listPolicies(request.workspaceId),
      ...getExecutableDoctrinePolicies(request.workspaceId),
      ...getExecutableBusinessPolicies(request.workspaceId),
    ];
    const verdict = evaluateGovernancePolicies(request, policies);

    recordDoctrineReferencesFromVerdict(request.workspaceId, verdict.policyId, {
      actor: options?.actor ?? request.actor,
      correlationId: request.correlationId,
      module: request.module,
      action: request.action,
    });

    recordPolicyReferencesFromVerdict(request.workspaceId, verdict.policyId, {
      actor: options?.actor ?? request.actor,
      correlationId: request.correlationId,
      module: request.module,
      action: request.action,
    });

    if (options?.record !== false) {
      this.recordDecision(request, verdict, options?.actor ?? "governance");
    }

    return verdict;
  }

  assessDispatch(
    request: OrchestratorDispatchRequest,
    options?: { actorRole?: string; actor?: string },
  ): GovernanceVerdict {
    const domain = resolveGovernanceDomain(request.module, request.action);
    const governanceRequest: GovernanceDecisionRequest = {
      workspaceId: request.workspaceId,
      domain,
      module: request.module,
      action: request.action,
      actorRole: options?.actorRole,
      actor: options?.actor,
      companyId: request.companyId,
      correlationId: request.correlationId,
      payload: request.payload,
      founderApproved:
        request.payload.founderApproved === true ||
        request.payload.approved === true,
    };

    return this.evaluateDecision(governanceRequest, { actor: options?.actor ?? "orchestrator" });
  }

  assertAllowed(verdict: GovernanceVerdict): void {
    if (!verdict.allowed) {
      throw new GovernanceBlockedError(verdict.reason, verdict);
    }
  }

  checkCapability(input: {
    workspaceId: string;
    domain: GovernanceDomain;
    module: string;
    action: string;
    actorRole?: string;
    founderApproved?: boolean;
  }): GovernanceVerdict {
    return this.evaluateDecision({
      workspaceId: input.workspaceId,
      domain: input.domain,
      module: input.module,
      action: input.action,
      actorRole: input.actorRole,
      founderApproved: input.founderApproved,
      payload: {},
    });
  }

  listPolicies(workspaceId: string, domain?: GovernanceDomain): GovernancePolicyRule[] {
    initializeGovernancePolicies(workspaceId);
    return getGovernanceRepository().listPolicies(workspaceId, domain);
  }

  updatePolicy(
    policyId: string,
    updates: Partial<Pick<GovernancePolicyRule, "enabled" | "priority" | "description">>,
  ): GovernancePolicyRule | null {
    const repository = getGovernanceRepository();
    const existing = repository.getPolicyById(policyId);
    if (!existing) return null;

    return repository.savePolicy({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  listDecisions(workspaceId: string, limit = 100): GovernanceDecisionRecord[] {
    return getGovernanceRepository().listDecisions(workspaceId, limit);
  }

  getCapabilities(workspaceId: string): Record<GovernanceDomain, GovernanceVerdict[]> {
    initializeGovernancePolicies(workspaceId);
    const checks: Array<{ domain: GovernanceDomain; module: string; action: string }> = [
      { domain: "deployment", module: "production-deploy", action: "execute_vercel" },
      { domain: "marketing", module: "meta-ads-connector", action: "launch_campaign" },
      { domain: "supplier", module: "live-cj-fulfillment", action: "submit_live" },
      { domain: "capital", module: "live-payments", action: "create_checkout" },
      { domain: "grandKings", module: "grand-kings-revenue-engine", action: "run_cycle" },
      { domain: "founder", module: "meta-ads-connector", action: "apply_approval" },
    ];

    const result = {} as Record<GovernanceDomain, GovernanceVerdict[]>;
    for (const check of checks) {
      const verdict = this.checkCapability({ workspaceId, ...check });
      if (!result[check.domain]) result[check.domain] = [];
      result[check.domain].push(verdict);
    }
    return result;
  }

  private recordDecision(
    request: GovernanceDecisionRequest,
    verdict: GovernanceVerdict,
    actor: string,
  ): GovernanceDecisionRecord {
    return getGovernanceRepository().appendDecision(
      createGovernanceDecisionRecord({
        workspaceId: request.workspaceId,
        domain: request.domain,
        module: request.module,
        action: request.action,
        verdict,
        actor,
        correlationId: request.correlationId ?? randomUUID(),
      }),
    );
  }
}

let engineInstance: GovernanceEngine | null = null;

export function getGovernanceEngine(): GovernanceEngine {
  if (!engineInstance) {
    engineInstance = new GovernanceEngine();
  }
  return engineInstance;
}

export function resetGovernanceEngine(): void {
  engineInstance = null;
}

/** Idempotent seed of default governance policies for a workspace. */
export function initializeGovernancePolicies(workspaceId: string): GovernancePolicyRule[] {
  const repository = getGovernanceRepository();
  const existing = repository.listPolicies(workspaceId);
  if (existing.length > 0) {
    return existing;
  }

  const defaults = createDefaultGovernancePolicies(workspaceId);
  for (const policy of defaults) {
    repository.savePolicy(policy);
  }
  return defaults;
}

export function evaluateGovernanceDecision(
  request: GovernanceDecisionRequest,
): GovernanceVerdict {
  return getGovernanceEngine().evaluateDecision(request);
}

export function assessGovernanceDispatch(
  request: OrchestratorDispatchRequest,
  options?: { actorRole?: string },
): GovernanceVerdict {
  return getGovernanceEngine().assessDispatch(request, options);
}
