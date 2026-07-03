/**
 * G8-00 — Identity authorization registry validator.
 */

import type { IdentityAuthorizationRegistryRowBase } from "../types/identity-authorization-registry-types.js";
import {
  authorizationProviderConfigurationSchema,
  connectionPolicyConfigurationSchema,
  credentialTypeConfigurationSchema,
  identityNotificationConfigurationSchema,
  identityReportConfigurationSchema,
} from "../types/identity-authorization-registry-types.js";
import { connectionRegistryTypeConfigurationSchema } from "../types/connection-registry-types.js";
import type { IdentityAuthorizationRegistryId } from "../types/registry-ids.js";

export class IdentityAuthorizationRegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityAuthorizationRegistryValidationError";
  }
}

export function validateIdentityAuthorizationRegistryRows(
  registryId: IdentityAuthorizationRegistryId,
  rows: IdentityAuthorizationRegistryRowBase[],
): void {
  for (const row of rows) {
    const config = row.configuration;
    switch (registryId) {
      case "REG-AUTHORIZATION-PROVIDER":
        authorizationProviderConfigurationSchema.parse(config.authorizationProvider);
        break;
      case "REG-CREDENTIAL-TYPE":
        credentialTypeConfigurationSchema.parse(config.credentialType);
        break;
      case "REG-CONNECTION-TYPE":
        connectionRegistryTypeConfigurationSchema.parse(config.connectionType);
        break;
      case "REG-CONNECTION-POLICY":
        connectionPolicyConfigurationSchema.parse(config.connectionPolicy);
        break;
      case "REG-IDENTITY-REPORT":
        identityReportConfigurationSchema.parse(config.identityReport);
        break;
      case "REG-IDENTITY-NOTIFICATION":
        identityNotificationConfigurationSchema.parse(config.identityNotification);
        break;
      default:
        throw new IdentityAuthorizationRegistryValidationError(
          `Unknown identity authorization registry: ${registryId}`,
        );
    }
  }
}

export function validateIdentityAuthorizationRegistryBatch(
  batch: Record<IdentityAuthorizationRegistryId, IdentityAuthorizationRegistryRowBase[]>,
): void {
  for (const [registryId, rows] of Object.entries(batch) as Array<
    [IdentityAuthorizationRegistryId, IdentityAuthorizationRegistryRowBase[]]
  >) {
    validateIdentityAuthorizationRegistryRows(registryId, rows);
  }
}
