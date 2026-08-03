/** X2-06 — Dashboard validator. */

import { EPD_METADATA_VERSION } from "./paths.js";
import type { ExecutivePortfolioDashboardConfiguration } from "./configuration.js";
import type {
  DashboardValidationReport,
  DrillDownInput,
  PortfolioDashboardSnapshot,
  RefreshDashboardInput,
} from "./types.js";

export class DashboardValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): DashboardValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `epd-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EPD_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: ExecutivePortfolioDashboardConfiguration,
  ): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Executive Portfolio Dashboard disabled");
    if (!config.neverPermitUnauthorizedAccess) {
      errors.push("Unauthorized access to enterprise information is forbidden");
    }
    if (!config.preserveDashboardTraceability) {
      errors.push("Dashboard traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (config.dashboardRefreshFrequencySeconds < 5) {
      warnings.push("Refresh frequency unusually low");
    }
    return this.report(started, errors, warnings);
  }

  validateRefresh(
    input: RefreshDashboardInput,
    config: ExecutivePortfolioDashboardConfiguration,
  ): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) errors.push("Dashboard refresh requires validated=true");
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateDrillDown(
    input: DrillDownInput,
    config: ExecutivePortfolioDashboardConfiguration,
  ): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.focus) errors.push("Missing drill-down focus");
    if (!input.focusReference?.trim()) errors.push("Missing drill-down focus reference");
    if (input.validated !== true) errors.push("Drill-down requires validated=true");
    if (/(token|secret|password|credential)/i.test(input.focusReference ?? "")) {
      errors.push("Focus reference must not contain credentials");
    }
    if (!config.neverPermitUnauthorizedAccess) {
      errors.push("Unauthorized drill-down blocked");
    }
    return this.report(started, errors, warnings);
  }

  validateSnapshot(snapshot: PortfolioDashboardSnapshot): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!snapshot.dashboardId.startsWith("epd-")) errors.push("Invalid dashboard ID prefix");
    if (!snapshot.metadataVersion) errors.push("Missing metadata version");
    if (snapshot.unauthorizedAccess) errors.push("Unauthorized access flag must remain false");
    if (snapshot.widgets.length === 0) warnings.push("No dashboard widgets populated");
    return this.report(started, errors, warnings);
  }
}
