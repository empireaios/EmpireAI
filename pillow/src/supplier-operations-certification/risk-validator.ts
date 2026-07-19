/** R2-20 — Risk validator (R2-16). */

import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class RiskValidator {
  async validate(
    ctx: SupplierOperationsCertificationContext,
    config: SupplierOperationsCertificationConfiguration,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R2-16",
      missionLabel: "Supplier Risk Monitor",
      engine: ctx.supplierRiskMonitor,
      expectedMissionId: "R2-16",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.supplierRiskMonitor?.monitorSupplierHealth({ includeFixtureSuppliers: true });
            }
          : undefined,
    });
  }
}
