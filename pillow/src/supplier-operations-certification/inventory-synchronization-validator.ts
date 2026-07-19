/** R2-20 — Inventory synchronization validator (R2-06). */

import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class InventorySynchronizationValidator {
  async validate(
    ctx: SupplierOperationsCertificationContext,
    config: SupplierOperationsCertificationConfiguration,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R2-06",
      missionLabel: "Supplier Inventory Sync",
      engine: ctx.supplierInventorySync,
      expectedMissionId: "R2-06",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? async () => {
              await ctx.supplierInventorySync?.syncSupplierInventory({ includeFixtureInventory: true });
            }
          : undefined,
    });
  }
}
