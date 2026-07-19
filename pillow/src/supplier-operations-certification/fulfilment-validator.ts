/** R2-20 — Fulfilment validator (R2-10 through R2-13). */

import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class FulfilmentValidator {
  async validateAll(
    ctx: SupplierOperationsCertificationContext,
    config: SupplierOperationsCertificationConfiguration,
  ): Promise<MissionValidationResult[]> {
    const smoke = config.includeSmokeTests && config.safeTestMode;
    return Promise.all([
      validateEngineMission({
        missionId: "R2-10",
        missionLabel: "Fulfilment Orchestrator",
        engine: ctx.fulfilmentOrchestrator,
        expectedMissionId: "R2-10",
        smokeTest: smoke
          ? async () => {
              const procurements = ctx.procurement?.getRecords() ?? [];
              if (procurements[0]) {
                await ctx.fulfilmentOrchestrator?.routeFulfilment({
                  orderReference: "ord-soc-e2e",
                  procurementReference: procurements[0].procurementId,
                });
              }
            }
          : undefined,
      }),
      validateEngineMission({
        missionId: "R2-11",
        missionLabel: "Shipping Carrier Integration",
        engine: ctx.shippingCarrier,
        expectedMissionId: "R2-11",
        smokeTest: smoke ? () => { ctx.shippingCarrier?.registerCarriers(); } : undefined,
      }),
      validateEngineMission({
        missionId: "R2-12",
        missionLabel: "Shipment Tracking Engine",
        engine: ctx.shipmentTracking,
        expectedMissionId: "R2-12",
        smokeTest: smoke
          ? async () => {
              await ctx.shipmentTracking?.syncShipmentTracking();
            }
          : undefined,
      }),
      validateEngineMission({
        missionId: "R2-13",
        missionLabel: "Return Management",
        engine: ctx.returnManagement,
        expectedMissionId: "R2-13",
        smokeTest: smoke
          ? () => {
              ctx.returnManagement?.createReturnRequest({ orderReference: "ord-soc-return" });
            }
          : undefined,
      }),
    ]);
  }
}
