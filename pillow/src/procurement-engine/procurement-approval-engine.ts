/** R2-09 — Procurement Approval Engine. */

import type { ApprovalStatus, ProcurementRecord } from "./types.js";
import type { ProcurementEngineConfiguration } from "./configuration.js";

export class ProcurementApprovalEngine {
  determineApprovalStatus(input: {
    totalCost: number;
    config: ProcurementEngineConfiguration;
  }): ApprovalStatus {
    if (!input.config.procurementApprovalRulesEnabled) {
      return "auto_approved";
    }
    if (input.totalCost <= input.config.autoApproveBelowCost) {
      return "auto_approved";
    }
    if (input.totalCost >= input.config.requireApprovalAboveCost) {
      return "pending";
    }
    return "auto_approved";
  }

  processApproval(input: {
    record: ProcurementRecord;
    approved: boolean;
  }): ProcurementRecord {
    if (input.record.approvalStatus !== "pending") {
      return input.record;
    }
    return {
      ...input.record,
      approvalStatus: input.approved ? "approved" : "rejected",
      procurementStatus: input.approved ? "approved" : "failed",
    };
  }
}
