/** R1-15 — Health monitor validator (R1-14). */

import type { MarketplaceCertificationConfiguration } from "./configuration.js";
import type { MarketplaceCertificationContext } from "./marketplace-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

export class HealthMonitorValidator {
  async validate(
    ctx: MarketplaceCertificationContext,
    config: MarketplaceCertificationConfiguration,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R1-14",
      missionLabel: "Marketplace Health Monitor",
      engine: ctx.healthMonitor,
      expectedMissionId: "R1-14",
      smokeTest: config.includeSmokeTests
        ? async () => {
            await ctx.healthMonitor?.runHealthCheck({ marketplaceIdentifier: "amazon" });
          }
        : undefined,
    });
  }
}
