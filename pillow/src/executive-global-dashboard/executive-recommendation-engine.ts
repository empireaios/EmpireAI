/** X4-10 — Executive Recommendation Engine. */

import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";
import type { DashboardRecommendation, DashboardSnapshot } from "./types.js";

export class ExecutiveRecommendationEngine {
  generate(
    snapshots: DashboardSnapshot[],
    _config: ExecutiveGlobalDashboardConfiguration,
  ): DashboardRecommendation[] {
    return snapshots
      .filter(
        (s) =>
          (s.validationStatus === "passed" || s.validationStatus === "partial") &&
          s.neverExposeRestrictedEnterpriseInformation === true &&
          s.restrictedInformationExposureClaim === "none" &&
          s.authorizedAccess === true &&
          (s.executiveAlerts.length > 0 ||
            s.activeWidgets.includes("global_recommendations")),
      )
      .flatMap((s) => {
        if (s.executiveAlerts.length === 0) {
          return [
            {
              recommendationId: `egd-rec-${Date.now()}-${s.companyReference}`,
              timestamp: new Date().toISOString(),
              companyReference: s.companyReference,
              widget: "global_recommendations" as const,
              severity: "informational" as const,
              recommendationSummary: s.recommendationSummary,
              structuralSignalOnly: true as const,
              neverExposeRestrictedEnterpriseInformation: true as const,
              restrictedInformationExposureClaim: "none" as const,
            },
          ];
        }
        return s.executiveAlerts.map((alert) => ({
          recommendationId: `egd-rec-${Date.now()}-${alert.alertId}`,
          timestamp: new Date().toISOString(),
          companyReference: s.companyReference,
          widget: alert.widget,
          severity: alert.severity,
          recommendationSummary: `Act on ${alert.severity} alert: ${alert.summary}`,
          structuralSignalOnly: true as const,
          neverExposeRestrictedEnterpriseInformation: true as const,
          restrictedInformationExposureClaim: "none" as const,
        }));
      });
  }
}
