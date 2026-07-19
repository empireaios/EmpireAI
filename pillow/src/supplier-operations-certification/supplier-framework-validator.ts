/** R2-20 — Supplier framework validator (R2-01). */

import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class SupplierFrameworkValidator {
  async validate(
    ctx: SupplierOperationsCertificationContext,
    config: SupplierOperationsCertificationConfiguration,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R2-01",
      missionLabel: "Supplier Framework",
      engine: ctx.supplierFramework,
      expectedMissionId: "R2-01",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.supplierFramework?.runDiagnostics();
            }
          : undefined,
    });
  }
}
