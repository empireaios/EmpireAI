/** R5-10 — Dashboard Validator. */

import { MAD_METADATA_VERSION } from "./paths.js";
import type { MarketingAnalyticsDashboardConfiguration } from "./configuration.js";
import type {
  ConnectDashboardInput,
  DashboardEngineRecord,
  DashboardSnapshot,
  DashboardValidationReport,
  RefreshDashboardInput,
} from "./types.js";

export class DashboardValidator {
  validateConfiguration(
    config: MarketingAnalyticsDashboardConfiguration,
  ): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Marketing Analytics Dashboard disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.requireAuthorizedAccess) {
      errors.push("Authorized access requirement must remain enabled");
    }
    if (!config.maskSensitiveValues) {
      errors.push("Sensitive value masking must remain enabled");
    }
    if (config.dashboardRefreshFrequencyMs < 1000) {
      errors.push("Dashboard refresh frequency must be at least 1000ms");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: DashboardEngineRecord): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("mad-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No marketing data dependencies connected");
    if (!record.dependencyPresence.campaignManager) {
      warnings.push("Campaign Manager dependency not connected");
    }
    if (!record.dependencyPresence.attributionEngine) {
      warnings.push("Attribution Engine dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateAccess(
    input: ConnectDashboardInput | RefreshDashboardInput,
    config: MarketingAnalyticsDashboardConfiguration,
  ): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (config.requireAuthorizedAccess && input.authorized === false) {
      errors.push("Unauthorized marketing data access denied");
    }

    return this.build(errors, warnings, started);
  }

  validateSnapshot(snapshot: DashboardSnapshot): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!snapshot.dashboardId.startsWith("mad-dash-")) {
      errors.push("Invalid dashboard ID prefix");
    }
    if (!snapshot.metadataVersion) errors.push("Missing metadata version");
    if (snapshot.advertisingSpendSummary.totalSpend < 0) {
      errors.push("Advertising spend cannot be negative");
    }
    if (snapshot.trafficSummary.impressions < 0 || snapshot.trafficSummary.clicks < 0) {
      errors.push("Traffic metrics cannot be negative");
    }
    if (snapshot.widgets.length === 0) warnings.push("No dashboard widgets generated");
    if (snapshot.campaignSummary.totalCampaigns === 0) {
      warnings.push("No campaign records available");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): DashboardValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `mad-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MAD_METADATA_VERSION,
    };
  }
}
