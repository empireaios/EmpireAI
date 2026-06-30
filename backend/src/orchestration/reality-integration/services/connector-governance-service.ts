import { getGovernanceEngine } from "../../../foundation/empire-governance/services/governance-engine.js";

export type ConnectorGovernanceAction =
  | "connect"
  | "disconnect"
  | "validate"
  | "refresh"
  | "heartbeat";

export function assessConnectorGovernance(input: {
  workspaceId: string;
  providerId: string;
  action: ConnectorGovernanceAction;
  actor: string;
}): { approved: boolean; reason: string; policyId?: string } {
  const engine = getGovernanceEngine();
  const verdict = engine.evaluateDecision(
    {
      workspaceId: input.workspaceId,
      domain: "grandKings",
      module: "reality-integration",
      action: `connector.${input.action}`,
      actor: input.actor,
      correlationId: `gov-${input.providerId}-${Date.now()}`,
      payload: {
        providerId: input.providerId,
        irreversibleBlocked: true,
      },
    },
    { actor: input.actor, record: true },
  );

  if (!verdict.allowed) {
    return { approved: false, reason: verdict.reason, policyId: verdict.policyId };
  }

  return { approved: true, reason: verdict.reason, policyId: verdict.policyId };
}

/** C017 — Governance → Approval → Execution Runtime flow marker. */
export function connectorGovernanceFlow(): {
  stages: string[];
  irreversibleActionsBlocked: true;
} {
  return {
    stages: ["Governance", "Approval", "Execution Runtime"],
    irreversibleActionsBlocked: true,
  };
}
