/**
 * G5-02 / G5-05 — Approval tier routing — delegates to canonical Pillow Approval Router.
 */

import type { ApprovalRoutingResult } from "../contracts/trigger-types.js";
import { getPillowApprovalRouter } from "../approval/pillow-approval-router.js";

export function routeApprovalRequirement(input: {
  approvalRef?: string;
  policyRegistryId?: string;
  payload?: Record<string, unknown>;
}): ApprovalRoutingResult {
  const { routing } = getPillowApprovalRouter().evaluateRequirement({
    approvalRegistryId: input.approvalRef,
    policyRegistryId: input.policyRegistryId,
    payload: input.payload,
  });
  return routing;
}
