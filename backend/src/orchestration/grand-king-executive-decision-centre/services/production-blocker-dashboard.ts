/**
 * G7-04 — Production blocker dashboard.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { listAutomationOperations } from "../../grand-king-business-automation-operations/services/grand-king-business-automation-operations-service.js";
import { listCommerceOperations } from "../../grand-king-commerce-operations/services/grand-king-commerce-operations-service.js";
import type { ExecutiveBlockerSummary } from "../contracts/executive-decision-types.js";

export function buildProductionBlockerDashboard(context: RegistryLoaderContext = {}): ExecutiveBlockerSummary {
  const blockers: ExecutiveBlockerSummary["blockers"] = [];

  try {
    for (const op of listCommerceOperations()) {
      for (const blocker of op.blockers) {
        blockers.push({
          blockerId: blocker.blockerId,
          domain: "commerce",
          message: blocker.message,
          severity: blocker.severity,
        });
      }
      if (op.status === "blocked") {
        blockers.push({
          blockerId: `commerce-blocked-${op.operationId}`,
          domain: "commerce",
          message: `Commerce operation ${op.providerId} blocked`,
          severity: "critical",
        });
      }
    }
  } catch {
    /* not initialized */
  }

  try {
    for (const op of listAutomationOperations()) {
      for (const blocker of op.blockers) {
        blockers.push({
          blockerId: blocker.blockerId,
          domain: "automation",
          message: blocker.message,
          severity: blocker.severity,
        });
      }
    }
  } catch {
    /* not initialized */
  }

  if (process.env.EXECUTIVE_BLOCKER_SIGNAL === "true") {
    blockers.push({
      blockerId: "executive-governance-blocker",
      domain: "live_operations",
      message: "Executive governance blocker signal active",
      severity: "high",
    });
  }

  return { blockerCount: blockers.length, blockers };
}
