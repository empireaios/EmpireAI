/**
 * G7-05 — Financial operations Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type FinancialOperationsPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "overview" | "record" | "reconcile" | "aggregate" | "execute";
  pillowGovernance: true;
};

export type FinancialOperationsPillowResult = {
  allowed: boolean;
  reason: string;
  financialAuthority: boolean;
  workspaceAuthority: boolean;
  transactionVisibility: boolean;
  financialIntegrity: boolean;
  executiveAuthority: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): FinancialOperationsPillowResult {
  return {
    allowed: false,
    reason,
    financialAuthority: false,
    workspaceAuthority: false,
    transactionVisibility: false,
    financialIntegrity: false,
    executiveAuthority: false,
    eklsGoverned: false,
  };
}

export function validateFinancialOperationsPillowGovernance(
  context: FinancialOperationsPillowContext,
): FinancialOperationsPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no financial operation bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king") {
    return deny("Grand King financial authority required");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "grand-king-revenue-financial-operations",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      financialAuthority: true,
      workspaceAuthority: true,
      transactionVisibility: false,
      financialIntegrity: true,
      executiveAuthority: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Grand King financial operations Pillow governance passed",
    financialAuthority: true,
    workspaceAuthority: true,
    transactionVisibility: true,
    financialIntegrity: true,
    executiveAuthority: true,
    eklsGoverned: true,
  };
}
