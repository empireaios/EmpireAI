/** X4-10 — Shared structural dashboard helpers (no live UI rendering APIs). */

import { DASHBOARD_WIDGETS, EGD_METADATA_VERSION } from "./paths.js";
import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";
import type {
  AlertSeverity,
  DashboardAnalysisInput,
  DashboardSnapshot,
  DashboardWidget,
  ExecutiveAlert,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: DashboardAnalysisInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function severityFromScore(score: number): AlertSeverity {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "informational";
}

export function computeStructuralDashboardSignals(
  input: DashboardAnalysisInput,
  config: ExecutiveGlobalDashboardConfiguration,
  dependencyReadyCount: number,
): {
  companyReference: string;
  globalOperationsSummary: string;
  countryExpansionSummary: string;
  regionalPerformanceSummary: string;
  marketOpportunitySummary: string;
  logisticsSummary: string;
  complianceSummary: string;
  taxationSummary: string;
  localizationReadinessSummary: string;
  executiveAlerts: ExecutiveAlert[];
  activeWidgets: DashboardWidget[];
  recommendationSummary: string;
  dashboardTraceId: string;
  readinessScore: number;
} {
  const companyReference = defaultCompany(input);
  const validated = input.validated === true;
  const authorized = input.authorized === true || validated;
  const seed = `${companyReference}::dashboard`;
  const readinessScore = Math.round(
    Math.min(100, dependencyReadyCount * 11 + hashScore(`${seed}:ready`, 0, 10)),
  );
  const alertScore = Math.round(hashScore(`${seed}:alert`, 20, 90));
  const dashboardTraceId = `egd-trace-${hashScore(seed, 100000, 999999)}`;

  const focus = input.widgetFocus;
  const activeWidgets: DashboardWidget[] = config.dashboardWidgetConfigurationEnabled
    ? focus
      ? [focus]
      : [...DASHBOARD_WIDGETS]
    : ["worldwide_operations"];

  const globalOperationsSummary = validated
    ? `Worldwide ops readiness ${readinessScore}% · deps=${dependencyReadyCount}/9`
    : "Worldwide ops unavailable — unvalidated";
  const countryExpansionSummary = validated
    ? `Country expansion posture monitored for ${companyReference}`
    : "Country expansion unavailable — unvalidated";
  const regionalPerformanceSummary = validated
    ? `Regional performance structural score ${hashScore(`${seed}:region`, 40, 95)}`
    : "Regional performance unavailable — unvalidated";
  const marketOpportunitySummary = validated
    ? `Market opportunity signal score ${hashScore(`${seed}:market`, 35, 92)}`
    : "Market opportunities unavailable — unvalidated";
  const logisticsSummary = validated
    ? `Logistics fulfillment structural score ${hashScore(`${seed}:log`, 40, 90)}`
    : "Logistics unavailable — unvalidated";
  const complianceSummary = validated
    ? `Compliance posture monitored — no false certification`
    : "Compliance unavailable — unvalidated";
  const taxationSummary = validated
    ? `Taxation intelligence structural posture monitored — not legal advice`
    : "Taxation unavailable — unvalidated";
  const localizationReadinessSummary = validated
    ? `Localization readiness structural score ${hashScore(`${seed}:loc`, 45, 95)}`
    : "Localization readiness unavailable — unvalidated";

  const executiveAlerts: ExecutiveAlert[] = [];
  if (validated && config.executiveAlertRulesEnabled && (input.alertHint || alertScore >= 70)) {
    executiveAlerts.push({
      alertId: `egd-alert-${Date.now()}`,
      severity: severityFromScore(alertScore),
      widget: focus ?? "executive_alerts",
      summary: `Executive attention: ${focus ?? "cross-domain"} signal severity=${severityFromScore(alertScore)}`,
      timestamp: new Date().toISOString(),
    });
  }

  const recommendationSummary =
    !validated || !authorized
      ? "Dashboard recommendations blocked — require validated authorized access"
      : executiveAlerts.length > 0
        ? `Review ${executiveAlerts.length} executive alert(s) and prioritize global actions`
        : `Maintain worldwide visibility for ${companyReference}`;

  return {
    companyReference,
    globalOperationsSummary,
    countryExpansionSummary,
    regionalPerformanceSummary,
    marketOpportunitySummary,
    logisticsSummary,
    complianceSummary,
    taxationSummary,
    localizationReadinessSummary,
    executiveAlerts,
    activeWidgets,
    recommendationSummary,
    dashboardTraceId,
    readinessScore,
  };
}

export function buildDashboardSnapshot(
  signals: ReturnType<typeof computeStructuralDashboardSignals>,
  validationStatus: DashboardSnapshot["validationStatus"] = "passed",
): DashboardSnapshot {
  return {
    dashboardId: `egd-${Date.now()}-${signals.companyReference}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    globalOperationsSummary: signals.globalOperationsSummary,
    countryExpansionSummary: signals.countryExpansionSummary,
    regionalPerformanceSummary: signals.regionalPerformanceSummary,
    marketOpportunitySummary: signals.marketOpportunitySummary,
    logisticsSummary: signals.logisticsSummary,
    complianceSummary: signals.complianceSummary,
    taxationSummary: signals.taxationSummary,
    localizationReadinessSummary: signals.localizationReadinessSummary,
    executiveAlerts: signals.executiveAlerts.map((a) => ({ ...a })),
    validationStatus,
    metadataVersion: EGD_METADATA_VERSION,
    activeWidgets: [...signals.activeWidgets],
    recommendationSummary: signals.recommendationSummary,
    dashboardTraceId: signals.dashboardTraceId,
    structuralSignalOnly: true,
    neverExposeRestrictedEnterpriseInformation: true,
    restrictedInformationExposureClaim: "none",
    authorizedAccess: true,
  };
}
