/** R2-03 — AliExpress connector validator. */

import { AEX_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type { AliExpressIntegrationConfiguration } from "./configuration.js";
import type { AliExpressConnectorRecord, AliExpressValidationReport } from "./types.js";

export class AliExpressValidator {
  validateConfiguration(config: AliExpressIntegrationConfiguration): AliExpressValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef?.startsWith("vault://")) {
      warnings.push("AliExpress credential reference should use vault:// prefix");
    }
    if (!config.authenticationRulesEnabled) {
      warnings.push("Authentication rules disabled");
    }
    if (!config.apiEndpointRulesEnabled) {
      warnings.push("API endpoint rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `aex-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AEX_CONNECTOR_METADATA_VERSION,
    };
  }

  validateRecord(record: AliExpressConnectorRecord): AliExpressValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.connectorId.startsWith("aex-")) errors.push("Invalid AliExpress connector ID prefix");
    if (record.supplierId !== "aliexpress") errors.push("Invalid supplier identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.credentialRefPresent && record.authenticationStatus !== "unauthenticated") {
      warnings.push("Authenticated without credential reference");
    }
    if (record.healthStatus === "failed") warnings.push("Connector health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `aex-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AEX_CONNECTOR_METADATA_VERSION,
    };
  }
}
