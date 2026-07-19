/** R5-01 — Marketing module validator. */

import { MARKETING_METADATA_VERSION } from "./paths.js";
import type { MarketingFrameworkConfiguration } from "./configuration.js";
import type {
  MarketingFrameworkRecord,
  MarketingModuleDefinition,
  MarketingValidationReport,
} from "./types.js";

const RESERVED_MARKETING_MODULES = [
  { id: "meta-ads-integration", mission: "R5-02" },
  { id: "google-ads-integration", mission: "R5-03" },
  { id: "tiktok-ads-integration", mission: "R5-04" },
  { id: "youtube-ads-integration", mission: "R5-05" },
  { id: "seo-intelligence-engine", mission: "R5-06" },
  { id: "campaign-manager", mission: "R5-07" },
  { id: "audience-intelligence", mission: "R5-08" },
  { id: "attribution-engine", mission: "R5-09" },
  { id: "marketing-analytics-dashboard", mission: "R5-10" },
  { id: "creative-asset-manager", mission: "R5-11" },
  { id: "ai-campaign-generator", mission: "R5-12" },
  { id: "budget-optimization-engine", mission: "R5-13" },
  { id: "conversion-intelligence", mission: "R5-14" },
  { id: "competitor-marketing-monitor", mission: "R5-15" },
  { id: "viral-trend-intelligence", mission: "R5-16" },
  { id: "marketing-experiment-engine", mission: "R5-17" },
  { id: "cross-channel-orchestrator", mission: "R5-18" },
  { id: "autonomous-marketing-engine", mission: "R5-19" },
  { id: "real-world-operations-certified", mission: "R5-20" },
];

export class MarketingValidator {
  validateDefinition(
    definition: MarketingModuleDefinition,
    config: MarketingFrameworkConfiguration,
  ): MarketingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (
      !definition.marketingModuleIdentifier ||
      definition.marketingModuleIdentifier.trim().length === 0
    ) {
      errors.push("Missing marketing module identifier");
    }

    for (const reserved of RESERVED_MARKETING_MODULES) {
      if (definition.marketingModuleIdentifier === reserved.id) {
        const approved = definition.integrationMissionId === reserved.mission;
        if (!approved) {
          errors.push(
            "Specific marketing integrations are out of scope for R5-01 — use template modules or approved integration missions",
          );
        }
      }
    }

    if (!definition.moduleVersion) errors.push("Missing module version");
    if (!definition.apiEndpointConfig?.baseUrl) errors.push("Missing API base URL");
    if (definition.authenticationMethod !== "none" && !definition.credentialRef) {
      warnings.push("Credential reference recommended for authenticated marketing modules");
    }
    if (definition.supportedCapabilities.length === 0) {
      warnings.push("No supported capabilities declared");
    }
    if (!config.moduleRegistrationRulesEnabled) {
      warnings.push("Registration rules disabled by configuration");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `mfw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      frameworkId: null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MARKETING_METADATA_VERSION,
    };
  }

  validateRecord(record: MarketingFrameworkRecord): MarketingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.frameworkId.startsWith("mfw-")) errors.push("Invalid framework ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.healthStatus === "failed") warnings.push("Module health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `mfw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      frameworkId: record.frameworkId,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MARKETING_METADATA_VERSION,
    };
  }
}
