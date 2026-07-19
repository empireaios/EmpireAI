/** R1-15 — Product normalization validator (R1-12). */

import type { MarketplaceCertificationConfiguration } from "./configuration.js";
import type { MarketplaceCertificationContext } from "./marketplace-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class ProductNormalizationValidator {
  async validate(
    ctx: MarketplaceCertificationContext,
    config: MarketplaceCertificationConfiguration,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R1-12",
      missionLabel: "Marketplace Product Normalization",
      engine: ctx.productNormalization,
      expectedMissionId: "R1-12",
      smokeTest: config.includeSmokeTests
        ? async () => {
            await ctx.productNormalization?.normalizeProducts({ marketplaceIdentifier: "amazon" });
          }
        : undefined,
    });
  }
}
