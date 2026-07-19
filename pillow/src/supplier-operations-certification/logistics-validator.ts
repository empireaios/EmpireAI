/** R2-20 — Logistics validator (R2-17, R2-18). */

import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class LogisticsValidator {
  async validateAll(
    ctx: SupplierOperationsCertificationContext,
    config: SupplierOperationsCertificationConfiguration,
  ): Promise<MissionValidationResult[]> {
    const smoke = config.includeSmokeTests && config.safeTestMode;
    return Promise.all([
      validateEngineMission({
        missionId: "R2-17",
        missionLabel: "Logistics Optimization",
        engine: ctx.logisticsOptimization,
        expectedMissionId: "R2-17",
        smokeTest: smoke
          ? () => {
              ctx.logisticsOptimization?.optimizeShipping({ includeFixtureOrders: true });
            }
          : undefined,
      }),
      validateEngineMission({
        missionId: "R2-18",
        missionLabel: "Fulfilment SLA Monitor",
        engine: ctx.fulfilmentSlaMonitor,
        expectedMissionId: "R2-18",
        smokeTest: smoke
          ? () => {
              ctx.fulfilmentSlaMonitor?.monitorFulfilmentSla({ includeFixtureOrders: true });
            }
          : undefined,
      }),
    ]);
  }
}
