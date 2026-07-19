/** R5-11 — Creative Validator. */

import { ASSET_TYPES, CRA_METADATA_VERSION } from "./paths.js";
import type { CreativeAssetManagerConfiguration } from "./configuration.js";
import type {
  CreateAssetInput,
  CreativeAssetRecord,
  CreativeEngineRecord,
  CreativeValidationReport,
  UpdateAssetInput,
} from "./types.js";

export class CreativeValidator {
  validateConfiguration(config: CreativeAssetManagerConfiguration): CreativeValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Creative Asset Manager disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.neverOverwriteApprovedWithoutValidation) {
      errors.push("Approved asset overwrite protection must remain enabled");
    }
    if (!config.maskSensitiveValues) {
      errors.push("Sensitive value masking must remain enabled");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: CreativeEngineRecord): CreativeValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("cra-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No creative asset dependencies connected");
    if (!record.dependencyPresence.campaignManager) {
      warnings.push("Campaign Manager dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateCreate(
    input: CreateAssetInput,
    config: CreativeAssetManagerConfiguration,
  ): CreativeValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!input.assetName?.trim()) errors.push("Asset name is required");
    if (!(ASSET_TYPES as readonly string[]).includes(input.assetType)) {
      errors.push(`Invalid asset type: ${input.assetType}`);
    }

    return this.build(errors, warnings, started);
  }

  validateUpdate(
    input: UpdateAssetInput,
    existing: CreativeAssetRecord | null,
    config: CreativeAssetManagerConfiguration,
  ): CreativeValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!input.assetId?.trim()) errors.push("Asset ID is required");
    if (!existing) {
      errors.push(`Asset not found: ${input.assetId}`);
      return this.build(errors, warnings, started);
    }
    if (
      existing.approvalStatus === "approved" &&
      config.neverOverwriteApprovedWithoutValidation &&
      !input.forceOverwriteApproved
    ) {
      errors.push("Cannot overwrite approved creative assets without validation");
    }

    return this.build(errors, warnings, started);
  }

  validateAssetRecord(record: CreativeAssetRecord): CreativeValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.assetId.startsWith("cra-asset-")) errors.push("Invalid asset ID prefix");
    if (!record.assetName) errors.push("Missing asset name");
    if (record.version < 1) errors.push("Invalid asset version");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.storageRef.startsWith("vault://")) {
      warnings.push("Storage ref should use vault:// scheme");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): CreativeValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `cra-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CRA_METADATA_VERSION,
    };
  }
}
