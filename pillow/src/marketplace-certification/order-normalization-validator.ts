/** R1-15 — Order normalization validator (R1-13). */

import type { MarketplaceCertificationConfiguration } from "./configuration.js";
import type { MarketplaceCertificationContext } from "./marketplace-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class OrderNormalizationValidator {
  async validate(
    ctx: MarketplaceCertificationContext,
    config: MarketplaceCertificationConfiguration,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R1-13",
      missionLabel: "Marketplace Order Normalization",
      engine: ctx.orderNormalization,
      expectedMissionId: "R1-13",
      smokeTest: config.includeSmokeTests
        ? async () => {
            await ctx.orderNormalization?.normalizeOrders({ marketplaceIdentifier: "amazon" });
          }
        : undefined,
    });
  }
}
