/** R2-20 — Warehouse validator (R2-14, R2-15). */

import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class WarehouseValidator {
  async validateAll(
    ctx: SupplierOperationsCertificationContext,
    config: SupplierOperationsCertificationConfiguration,
  ): Promise<MissionValidationResult[]> {
    const smoke = config.includeSmokeTests && config.safeTestMode;
    return Promise.all([
      validateEngineMission({
        missionId: "R2-14",
        missionLabel: "Warehouse Intelligence",
        engine: ctx.warehouseIntelligence,
        expectedMissionId: "R2-14",
        smokeTest: smoke
          ? () => {
              ctx.warehouseIntelligence?.coordinateWarehouses({ includeFixtureWarehouses: true });
            }
          : undefined,
      }),
      validateEngineMission({
        missionId: "R2-15",
        missionLabel: "Multi-Warehouse Support",
        engine: ctx.multiWarehouseSupport,
        expectedMissionId: "R2-15",
        smokeTest: smoke
          ? () => {
              ctx.multiWarehouseSupport?.registerWarehouses({ includeFixtureWarehouses: true });
            }
          : undefined,
      }),
    ]);
  }
}
