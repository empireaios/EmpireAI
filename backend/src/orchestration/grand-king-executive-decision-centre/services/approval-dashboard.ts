/**
 * G7-04 — Approval dashboard.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { getExecutiveAutomationDashboard } from "../../grand-king-business-automation-operations/services/grand-king-business-automation-operations-service.js";
import type { ExecutiveApprovalSummary } from "../contracts/executive-decision-types.js";

export function buildApprovalDashboard(context: RegistryLoaderContext = {}): ExecutiveApprovalSummary {
  const approvals: ExecutiveApprovalSummary["approvals"] = [];

  try {
    const dashboard = getExecutiveAutomationDashboard(context);
    for (const op of dashboard.approvals.operations) {
      approvals.push({
        approvalId: op.approvalId,
        domain: "automation",
        status: op.executionStatus,
      });
    }
  } catch {
    /* not initialized */
  }

  return { pendingCount: approvals.length, approvals };
}
