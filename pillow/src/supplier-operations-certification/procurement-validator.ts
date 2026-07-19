/** R2-20 — Procurement validator (R2-07, R2-08, R2-09, R2-19). */

import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class ProcurementValidator {
  async validateAll(
    ctx: SupplierOperationsCertificationContext,
    config: SupplierOperationsCertificationConfiguration,
  ): Promise<MissionValidationResult[]> {
    const smoke = config.includeSmokeTests && config.safeTestMode;
    return Promise.all([
      validateEngineMission({
        missionId: "R2-07",
        missionLabel: "Supplier Pricing Engine",
        engine: ctx.supplierPricing,
        expectedMissionId: "R2-07",
        smokeTest: smoke
          ? async () => {
              await ctx.supplierPricing?.syncSupplierPricing({ includeFixturePricing: true });
            }
          : undefined,
      }),
      validateEngineMission({
        missionId: "R2-08",
        missionLabel: "Supplier Ranking Engine",
        engine: ctx.supplierRanking,
        expectedMissionId: "R2-08",
        smokeTest: smoke
          ? async () => {
              await ctx.supplierRanking?.rankSuppliers({ includeFixtureMetrics: false });
            }
          : undefined,
      }),
      validateEngineMission({
        missionId: "R2-09",
        missionLabel: "Procurement Engine",
        engine: ctx.procurement,
        expectedMissionId: "R2-09",
        smokeTest: smoke
          ? () => {
              ctx.procurement?.createProcurementRequest({
                productReference: "cj-prod-1001",
                requestedQuantity: 1,
              });
            }
          : undefined,
      }),
      validateEngineMission({
        missionId: "R2-19",
        missionLabel: "Procurement Intelligence",
        engine: ctx.procurementIntelligence,
        expectedMissionId: "R2-19",
        smokeTest: smoke
          ? () => {
              ctx.procurementIntelligence?.analyzeProcurement({ includeFixtureProcurements: true });
            }
          : undefined,
      }),
    ]);
  }
}
