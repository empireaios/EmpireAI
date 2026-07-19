/** R2-04 — 1688 connector validator. */

import { OSS1688_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type { Oss1688IntegrationConfiguration } from "./configuration.js";
import type { Oss1688ConnectorRecord, Oss1688ValidationReport } from "./types.js";

export class Oss1688Validator {
  validateConfiguration(config: Oss1688IntegrationConfiguration): Oss1688ValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef?.startsWith("vault://")) {
      warnings.push("1688 credential reference should use vault:// prefix");
    }
    if (!config.authenticationRulesEnabled) {
      warnings.push("Authentication rules disabled");
    }
    if (!config.apiEndpointRulesEnabled) {
      warnings.push("API endpoint rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `oss-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: OSS1688_CONNECTOR_METADATA_VERSION,
    };
  }

  validateRecord(record: Oss1688ConnectorRecord): Oss1688ValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.connectorId.startsWith("oss-")) errors.push("Invalid 1688 connector ID prefix");
    if (record.supplierId !== "1688") errors.push("Invalid supplier identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.credentialRefPresent && record.authenticationStatus !== "unauthenticated") {
      warnings.push("Authenticated without credential reference");
    }
    if (record.healthStatus === "failed") warnings.push("Connector health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `oss-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: OSS1688_CONNECTOR_METADATA_VERSION,
    };
  }
}
