/** R2-20 — Supplier connector validator (R2-02 through R2-04). */

import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class SupplierConnectorValidator {
  async validateAll(
    ctx: SupplierOperationsCertificationContext,
    config: SupplierOperationsCertificationConfiguration,
  ): Promise<MissionValidationResult[]> {
    const smoke = config.includeSmokeTests && config.safeTestMode;
    return Promise.all([
      validateEngineMission({
        missionId: "R2-02",
        missionLabel: "CJdropshipping Integration",
        engine: ctx.cjDropshipping,
        expectedMissionId: "R2-02",
        smokeTest: smoke ? () => { ctx.cjDropshipping?.connectCjDropshipping(); } : undefined,
      }),
      validateEngineMission({
        missionId: "R2-03",
        missionLabel: "AliExpress Integration",
        engine: ctx.aliExpress,
        expectedMissionId: "R2-03",
        smokeTest: smoke ? () => { ctx.aliExpress?.connectAliExpress(); } : undefined,
      }),
      validateEngineMission({
        missionId: "R2-04",
        missionLabel: "1688 Integration",
        engine: ctx.oss1688,
        expectedMissionId: "R2-04",
        smokeTest: smoke ? () => { ctx.oss1688?.connectOss1688(); } : undefined,
      }),
    ]);
  }
}
