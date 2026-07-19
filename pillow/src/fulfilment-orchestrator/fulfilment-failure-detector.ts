/** R2-10 — Fulfilment Failure Detector. */

import type { ProcurementRecord } from "../procurement-engine/types.js";
import type { FulfilmentFailureFinding, FulfilmentRoute } from "./types.js";
import type { FulfilmentOrchestratorConfiguration } from "./configuration.js";

export class FulfilmentFailureDetector {
  detectProcurementIssues(input: {
    procurement: ProcurementRecord | null;
    config: FulfilmentOrchestratorConfiguration;
  }): FulfilmentFailureFinding | null {
    if (!input.procurement) {
      return {
        fulfilmentId: `fo-fail-${Date.now()}`,
        failureType: "routing_failed",
        details: "Procurement record not found",
      };
    }

    if (input.config.requireApprovedProcurement) {
      const approved =
        input.procurement.approvalStatus === "approved" ||
        input.procurement.approvalStatus === "auto_approved";
      if (!approved) {
        return {
          fulfilmentId: `fo-fail-${Date.now()}`,
          failureType: "workflow_blocked",
          details: `Procurement ${input.procurement.procurementId} not approved — routing blocked`,
        };
      }
      if (input.procurement.procurementStatus !== "purchase_order_created") {
        return {
          fulfilmentId: `fo-fail-${Date.now()}`,
          failureType: "workflow_blocked",
          details: `Procurement ${input.procurement.procurementId} has no purchase order — routing blocked`,
        };
      }
    }

    return null;
  }

  detectInvalidRoute(route: FulfilmentRoute | null): FulfilmentFailureFinding | null {
    if (!route) {
      return {
        fulfilmentId: `fo-fail-${Date.now()}`,
        failureType: "invalid_route",
        details: "No valid fulfilment route selected",
      };
    }
    return null;
  }

  detectDuplicate(input: {
    existingProcurementRef: string | undefined;
    procurementReference: string;
  }): FulfilmentFailureFinding | null {
    if (input.existingProcurementRef) {
      return {
        fulfilmentId: `fo-fail-${Date.now()}`,
        failureType: "routing_failed",
        details: `Duplicate fulfilment for procurement ${input.procurementReference}`,
      };
    }
    return null;
  }
}
