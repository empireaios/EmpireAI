/** R1-15 — Connector framework validator (R1-01). */

import type { MarketplaceCertificationConfiguration } from "./configuration.js";
import type { MarketplaceCertificationContext } from "./marketplace-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { buildMissionResult } from "./mission-validator-utils.js";

export class ConnectorFrameworkValidator {
  async validate(
    ctx: MarketplaceCertificationContext,
    config: MarketplaceCertificationConfiguration,
  ): Promise<MissionValidationResult> {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!ctx.mcf) {
      errors.push("Marketplace Connector Framework engine not available");
      return buildMissionResult({
        missionId: "R1-01",
        missionLabel: "Marketplace Connector Framework",
        started,
        errors,
        warnings,
      });
    }

    try {
      const state = ctx.mcf.getState();
      if (state.missionId !== "R1-01") errors.push("Invalid R1-01 mission ID");
      if (!state.engineVersion.startsWith("PILLOW-MCF")) errors.push("Invalid MCF engine version");

      if (config.includeSmokeTests) {
        const connectors = ctx.mcf.getRegisteredConnectors();
        if (connectors.length === 0) warnings.push("No connectors registered yet — structural pass");
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "MCF validation failed");
    }

    return buildMissionResult({
      missionId: "R1-01",
      missionLabel: "Marketplace Connector Framework",
      started,
      errors,
      warnings,
    });
  }
}
