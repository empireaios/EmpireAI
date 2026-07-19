/** R1-15 — Amazon programme validator (R1-02 through R1-05). */

import type { MarketplaceCertificationConfiguration } from "./configuration.js";
import type { MarketplaceCertificationContext } from "./marketplace-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class AmazonValidator {
  async validateAll(
    ctx: MarketplaceCertificationContext,
    config: MarketplaceCertificationConfiguration,
  ): Promise<MissionValidationResult[]> {
    const results: MissionValidationResult[] = [];

    results.push(
      await validateEngineMission({
        missionId: "R1-02",
        missionLabel: "Amazon Integration Foundation",
        engine: ctx.amazonIntegration,
        expectedMissionId: "R1-02",
        smokeTest: config.includeSmokeTests
          ? async () => {
              ctx.amazonIntegration?.connectAmazon();
            }
          : undefined,
      }),
    );

    results.push(
      await validateEngineMission({
        missionId: "R1-03",
        missionLabel: "Amazon Product Intelligence",
        engine: ctx.amazonProductIntelligence,
        expectedMissionId: "R1-03",
        smokeTest: config.includeSmokeTests
          ? async () => {
              await ctx.amazonProductIntelligence?.syncAmazonProducts();
            }
          : undefined,
      }),
    );

    results.push(
      await validateEngineMission({
        missionId: "R1-04",
        missionLabel: "Amazon Order Management",
        engine: ctx.amazonOrderManagement,
        expectedMissionId: "R1-04",
        smokeTest: config.includeSmokeTests
          ? async () => {
              await ctx.amazonOrderManagement?.syncAmazonOrders();
            }
          : undefined,
      }),
    );

    results.push(
      await validateEngineMission({
        missionId: "R1-05",
        missionLabel: "Amazon Inventory Sync",
        engine: ctx.amazonInventorySync,
        expectedMissionId: "R1-05",
        smokeTest: config.includeSmokeTests
          ? async () => {
              await ctx.amazonInventorySync?.syncAmazonInventory();
            }
          : undefined,
      }),
    );

    return results;
  }
}
