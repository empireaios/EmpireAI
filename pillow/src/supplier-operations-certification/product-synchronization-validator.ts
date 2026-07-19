/** R2-20 — Product synchronization validator (R2-05). */

import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class ProductSynchronizationValidator {
  async validate(
    ctx: SupplierOperationsCertificationContext,
    config: SupplierOperationsCertificationConfiguration,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R2-05",
      missionLabel: "Supplier Product Sync",
      engine: ctx.supplierProductSync,
      expectedMissionId: "R2-05",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? async () => {
              await ctx.supplierProductSync?.syncSupplierProducts({ includeFixtureCatalog: true });
            }
          : undefined,
    });
  }
}
