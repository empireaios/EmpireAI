import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import { EED_CAPABILITIES, EED_METADATA_VERSION, EXECUTIVE_EMPIRE_DASHBOARD_ID } from "./paths.js";
import type { ExecutiveEmpireDashboardConfiguration } from "./configuration.js";
import type { DashboardAnalysisInput, DashboardRecommendation, DashboardSnapshot, DashboardValidationReport, ExecutiveAlert, ExecutiveDashboardWidget, ExecutiveEmpireDashboardEngineRecord, ExecutiveEmpireDashboardRunReport } from "./types.js";

export type ExecutiveEmpireDashboardDependencies = {
  empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null;
  enterprisePortfolioFramework?: unknown; empireCapitalAllocation?: unknown; empireOpportunityEngine?: unknown;
  empireInnovationEngine?: unknown; empireResilienceEngine?: unknown; empireSelfImprovementEngine?: unknown;
};
export class ExecutiveEmpireDashboardManager {
  private engineRecord: ExecutiveEmpireDashboardEngineRecord | null = null;
  private records: DashboardSnapshot[] = []; private recommendations: DashboardRecommendation[] = [];
  constructor(private readonly dependencies: ExecutiveEmpireDashboardDependencies = {}) {}
  getEngineRecord() { return this.engineRecord ? { ...this.engineRecord, dependencyPresence: { ...this.engineRecord.dependencyPresence } } : null; }
  getDashboardRecords() { return this.records.map((record) => ({ ...record, executiveAlerts: [...record.executiveAlerts], activeWidgets: [...record.activeWidgets] })); }
  getRecommendations() { return this.recommendations.map((recommendation) => ({ ...recommendation })); }
  connect(_input: Record<string, unknown>, _configuration: ExecutiveEmpireDashboardConfiguration) {
    const framework = this.dependencies.empireIntelligenceFramework; let frameworkModuleId: string | null = null;
    if (framework) { const registration = framework.registerEmpireIntelligenceModule({ definition: { intelligenceModuleIdentifier: EXECUTIVE_EMPIRE_DASHBOARD_ID, moduleVersion: "PILLOW-EED-001", moduleType: "intelligence", supportedCapabilities: ["health_monitoring", "diagnostics"] }, forceRegister: true }); frameworkModuleId = registration.records[0]?.frameworkId ?? null; if (registration.validation.decision !== "fail") framework.manageEnterpriseIntelligenceLifecycle(EXECUTIVE_EMPIRE_DASHBOARD_ID, "start"); }
    const dependencyPresence = Object.fromEntries(Object.entries(this.dependencies).map(([key, value]) => [key, Boolean(value)]));
    this.engineRecord = { engineRecordId: `eed-eng-${Date.now()}`, timestamp: new Date().toISOString(), engineId: EXECUTIVE_EMPIRE_DASHBOARD_ID, engineVersion: "PILLOW-EED-001", currentOperationalState: "connected", healthStatus: framework ? "healthy" : "degraded", validationStatus: framework ? "passed" : "partial", supportedCapabilities: [...EED_CAPABILITIES], frameworkModuleId, dependencyPresence, metadataVersion: EED_METADATA_VERSION };
    return this.report("connect", [], this.validation({ validated: Boolean(framework), authorized: true }));
  }
  run(action: string, input: DashboardAnalysisInput, configuration: ExecutiveEmpireDashboardConfiguration) {
    if (!this.engineRecord) throw new Error("Executive Empire Dashboard not connected — call connectExecutiveEmpireDashboard first");
    const validation = this.validation(input); const widget = this.widgetFor(action);
    const alerts: ExecutiveAlert[] = input.alertHint ? [{ alertId: `eed-alert-${Date.now()}`, severity: "medium", widget, summary: "Structural executive attention signal detected.", timestamp: new Date().toISOString() }] : [];
    const record = this.snapshot(widget, validation, alerts);
    this.records.push(record); this.engineRecord.currentOperationalState = "active"; this.engineRecord.timestamp = record.timestamp;
    if (action === "display_strategic_recommendations") this.recommendations.push({ recommendationId: `eed-rec-${Date.now()}`, timestamp: record.timestamp, widget, summary: "Review structural signals through authorized executive governance.", structuralSignalOnly: true, neverExposeRestrictedEnterpriseInformationToUnauthorizedUsers: true });
    return this.report(action, [record], validation);
  }
  diagnostics(configuration: ExecutiveEmpireDashboardConfiguration) { return this.engineRecord ? this.report("diagnostics", this.getDashboardRecords(), this.validation({ validated: configuration.enabled, authorized: true })) : this.connect({}, configuration); }
  private validation(input: DashboardAnalysisInput): DashboardValidationReport { const allowed = input.authorized !== false; const validated = input.validated !== false; const errors = allowed ? [] : ["authorized access is required"]; const warnings = validated ? [] : ["Structural dashboard signal is not independently validated."]; return { validationReportId: `eed-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: errors.length ? "fail" : warnings.length ? "partial" : "pass", errors, warnings, durationMs: 0, metadataVersion: EED_METADATA_VERSION }; }
  private snapshot(widget: ExecutiveDashboardWidget, validation: DashboardValidationReport, executiveAlerts: ExecutiveAlert[]): DashboardSnapshot { const timestamp = new Date().toISOString(); const summary = (name: string) => `${name}: structural signal available; sensitive enterprise values masked.`; return { dashboardId: `eed-${Date.now()}-${this.records.length}`, timestamp, enterpriseKpiSummary: summary("Enterprise KPIs"), portfolioSummary: summary("Portfolio performance"), companySummary: summary("Company performance"), capitalAllocationSummary: summary("Capital allocation"), opportunitySummary: summary("Opportunity pipeline"), innovationSummary: summary("Innovation pipeline"), enterpriseResilienceSummary: summary("Enterprise resilience"), selfImprovementSummary: summary("Self-improvement progress"), executiveAlerts, recommendationSummary: summary("Strategic recommendations"), validationStatus: validation.decision === "pass" ? "passed" : validation.decision === "partial" ? "partial" : "failed", metadataVersion: EED_METADATA_VERSION, activeWidgets: [widget], structuralSignalOnly: true, neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverExposeRestrictedEnterpriseInformationToUnauthorizedUsers: true, preserveDashboardTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true, maskSensitiveValues: true, dashboardTraceId: `eed-trace-${Date.now()}-${this.records.length}` }; }
  private widgetFor(action: string): ExecutiveDashboardWidget { const map: Record<string, ExecutiveDashboardWidget> = { aggregate_enterprise_kpis: "enterprise_kpis", display_portfolio_performance: "portfolio_performance", display_company_performance: "company_performance", display_capital_allocation_status: "capital_allocation", display_opportunity_pipeline: "opportunity_pipeline", display_innovation_pipeline: "innovation_pipeline", display_enterprise_resilience: "enterprise_resilience", display_self_improvement_progress: "self_improvement_progress", display_executive_alerts: "executive_alerts", display_strategic_recommendations: "strategic_recommendations", refresh_dashboard_snapshot: "enterprise_kpis" }; return map[action] ?? "enterprise_kpis"; }
  private report(action: string, records: DashboardSnapshot[], validation: DashboardValidationReport): ExecutiveEmpireDashboardRunReport { return { dashboardRunReportId: `eed-run-${Date.now()}`, runTimestamp: new Date().toISOString(), action, engineRecord: this.engineRecord!, dashboardRecords: records, recommendations: this.getRecommendations(), validation, durationMs: 0, metadataVersion: EED_METADATA_VERSION }; }
}
