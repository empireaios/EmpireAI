/**
 * G7-00 — Live operations registry validator.
 */

import type { LiveOperationsRegistryRowBase } from "../types/live-operations-registry-types.js";
import {
  finalLiveCertificationRuleConfigurationSchema,
  grandKingOperatingProfileConfigurationSchema,
  liveEnvironmentProfileConfigurationSchema,
  liveOperationDomainConfigurationSchema,
} from "../types/live-operations-registry-types.js";
import type { LiveOperationsRegistryId } from "../types/registry-ids.js";

export class LiveOperationsRegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveOperationsRegistryValidationError";
  }
}

export function validateLiveOperationsRegistryRows(
  registryId: LiveOperationsRegistryId,
  rows: LiveOperationsRegistryRowBase[],
): void {
  for (const row of rows) {
    const config = row.configuration;
    switch (registryId) {
      case "REG-LIVE-OPERATIONS-DOMAIN":
        liveOperationDomainConfigurationSchema.parse(config.liveOperationDomain);
        break;
      case "REG-LIVE-OPERATIONS-PROFILE":
        if (config.grandKingOperatingProfile) {
          grandKingOperatingProfileConfigurationSchema.parse(config.grandKingOperatingProfile);
        } else if (config.liveEnvironmentProfile) {
          liveEnvironmentProfileConfigurationSchema.parse(config.liveEnvironmentProfile);
        } else {
          throw new LiveOperationsRegistryValidationError(
            `REG-LIVE-OPERATIONS-PROFILE row ${row.id} missing profile configuration`,
          );
        }
        break;
      case "REG-LIVE-OPERATIONS-FINAL-CERTIFICATION":
        finalLiveCertificationRuleConfigurationSchema.parse(config.finalLiveCertificationRule);
        break;
      default:
        throw new LiveOperationsRegistryValidationError(`Unknown live operations registry: ${registryId}`);
    }
  }
}

export function validateLiveOperationsRegistryBatch(
  batch: Record<LiveOperationsRegistryId, LiveOperationsRegistryRowBase[]>,
): void {
  for (const [registryId, rows] of Object.entries(batch) as Array<
    [LiveOperationsRegistryId, LiveOperationsRegistryRowBase[]]
  >) {
    validateLiveOperationsRegistryRows(registryId, rows);
  }
}
