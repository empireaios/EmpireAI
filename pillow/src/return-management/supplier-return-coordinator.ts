/** R2-13 — Supplier Return Coordinator. */

import { appendRmLog } from "./rm-logging.js";
import type { ReturnManagementConfiguration } from "./configuration.js";
import type { ReturnRecord } from "./types.js";

export type SupplierReturnResult = {
  success: boolean;
  authorizationStatus: ReturnRecord["returnAuthorizationStatus"];
  error: string | null;
};

export class SupplierReturnCoordinator {
  coordinateSupplierReturn(
    record: ReturnRecord,
    config: ReturnManagementConfiguration,
  ): SupplierReturnResult {
    if (!config.supplierReturnRulesEnabled) {
      return {
        success: false,
        authorizationStatus: "denied",
        error: "Supplier return rules disabled",
      };
    }

    appendRmLog({
      event: "return_authorization",
      level: "info",
      details: `Supplier ${record.supplierReference} authorized return ${record.returnId}`,
    });

    return {
      success: true,
      authorizationStatus: "authorized",
      error: null,
    };
  }
}
