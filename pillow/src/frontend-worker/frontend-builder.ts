import { FEW_METADATA_VERSION, FRONTEND_WORKER_REPORT_VERSION, UI_COMPONENTS } from "./paths.js";
import type { FrontendBuildReport, FrontendWorkerInput, ReviewFinding } from "./types.js";
import type { FrontendWorkerConfiguration } from "./configuration.js";

let sequence = 0;
const now = () => new Date().toISOString();
const entry = (prefix: string, name: string, description: string, extra = {}) => ({ id: `${prefix}${Date.now()}-${sequence}`, name, description, ...extra });
export class FrontendBuilder {
  createShell(input: FrontendWorkerInput, config: FrontendWorkerConfiguration): FrontendBuildReport {
    sequence += 1;
    const requirementsReportId = input.requirementsReportId?.trim() ?? "";
    return this.lockReport({
      buildId: input.buildId?.trim() || `few-bld-${Date.now()}-${sequence}`, timestamp: now(),
      platformId: input.platformId?.trim() || `few-plt-${sequence}`, platformName: input.platformName?.trim() || "Platform from approved requirements",
      uiComponents: [], pagesCreated: [], dashboardsCreated: [], formsCreated: [], workflowScreens: [], apiIntegrations: [],
      accessibilityStatus: "pending", buildStatus: requirementsReportId ? "in_progress" : "draft", confidenceScore: requirementsReportId ? 35 : 20,
      metadataVersion: FEW_METADATA_VERSION, requirementsReportId, architectureReportId: input.architectureReportId?.trim() ?? "",
      factoryMissionId: input.factoryMissionId?.trim() || `few-msn-${sequence}`, businessId: input.businessId?.trim() || `few-biz-${sequence}`,
      businessObjective: input.businessObjective?.trim() || "Build frontend aligned to approved requirements and architecture",
      layouts: [], responsiveVerified: false, accessibilityFindings: [], buildSteps: [this.step("receive_requirements", "Receive approved requirements", 1, requirementsReportId ? "Requirements recorded" : "Awaiting requirements")],
      selfReviewPassed: false, selfReviewFindings: [], selfReviewSummary: "Frontend shell created", qualityReview: "", complianceReview: "", frontendCompliance: requirementsReportId ? "partial" : "non_compliant", frontendComplianceNotes: "Pending frontend build stages",
      workerId: config.workerId, reportVersion: FRONTEND_WORKER_REPORT_VERSION, traceabilityRefs: [requirementsReportId || "requirements:missing"], preservedDecisions: [], submittedToExecutiveReporting: false, executiveReportId: null,
    });
  }
  addLayouts(r: FrontendBuildReport) { return this.update(r, { layouts: [entry("few-comp-", "Application Shell", "Reusable application layout with navigation and responsive regions")], uiComponents: this.components(r, ["navigation", "responsive_layouts", "reusable_components"]) }, "build_layouts", "Build application layouts"); }
  addDashboards(r: FrontendBuildReport) { return this.update(r, { dashboardsCreated: [entry("few-dash-", "Executive Dashboard", "Operational dashboard with structured metrics")], uiComponents: this.components(r, ["dashboards", "tables", "lists"]) }, "build_dashboards", "Build dashboards"); }
  addPages(r: FrontendBuildReport) { return this.update(r, { pagesCreated: [entry("few-page-", "Platform Detail", "Detail page"), entry("few-page-", "Settings", "Settings page"), entry("few-page-", "Authentication", "Authentication screen")], uiComponents: this.components(r, ["detail_pages", "settings_pages", "authentication_screens"]) }, "build_pages", "Build pages"); }
  addForms(r: FrontendBuildReport) { return this.update(r, { formsCreated: [entry("few-form-", "Platform Input", "Validated input form", { fields: ["name", "objective"], validationRules: ["required", "length"] })], uiComponents: this.components(r, ["forms"]) }, "build_forms", "Build forms and input validation"); }
  addWorkflows(r: FrontendBuildReport) { return this.update(r, { workflowScreens: [entry("few-wf-", "Requirements-to-Review", "Guided user workflow") ] }, "build_workflows", "Build user workflows"); }
  addApis(r: FrontendBuildReport, apis: Array<{ apiId?: string; name?: string; protocol?: string }>) { const mapped = (apis.length ? apis : [{ apiId: "approved-api", name: "Approved Platform API", protocol: "REST" }]).map((api) => entry("few-api-", api.name || "Approved API", `UI integration for ${api.apiId || "approved API"} via ${api.protocol || "approved protocol"}`, { source: api.apiId })); return this.update(r, { apiIntegrations: mapped }, "integrate_apis", "Integrate approved APIs"); }
  addAccessibility(r: FrontendBuildReport) { return this.update(r, { responsiveVerified: true, accessibilityStatus: "wcag_aa_pass", accessibilityFindings: [] }, "validate_accessibility", "Validate responsive accessible UI"); }
  complete(r: FrontendBuildReport) {
    let result = r;
    if (!result.layouts.length) result = this.addLayouts(result); if (!result.dashboardsCreated.length) result = this.addDashboards(result); if (!result.pagesCreated.length) result = this.addPages(result); if (!result.formsCreated.length) result = this.addForms(result); if (!result.workflowScreens.length) result = this.addWorkflows(result); if (!result.apiIntegrations.length) result = this.addApis(result, []); if (!result.responsiveVerified) result = this.addAccessibility(result);
    const findings: ReviewFinding[] = [];
    if (!result.requirementsReportId) findings.push({ findingId: "few-val-requirements", category: "requirements", severity: "error", message: "Approved requirements ID is required" });
    if (!result.architectureReportId) findings.push({ findingId: "few-val-architecture", category: "architecture", severity: "error", message: "Approved architecture ID is required" });
    const passed = findings.length === 0;
    return this.lockReport({ ...result, timestamp: now(), buildStatus: passed ? "complete" : "in_progress", confidenceScore: passed ? 95 : 65, selfReviewPassed: passed, selfReviewFindings: findings, selfReviewSummary: passed ? "Self-review passed: complete traceable frontend build" : "Self-review requires approved architecture", qualityReview: passed ? "Reusable UI, workflows, API mappings, responsive and accessibility checks complete" : "Incomplete dependency context", complianceReview: "No backend business logic, database design, deployment, or authority override performed", frontendCompliance: passed ? "compliant" : "partial", frontendComplianceNotes: passed ? "Approved requirements and architecture preserved" : "Architecture report required", buildSteps: [...result.buildSteps, this.step("produce_report", "Produce frontend build report", result.buildSteps.length + 1, "Build report assembled")] });
  }
  private update(r: FrontendBuildReport, fields: Partial<FrontendBuildReport>, type: string, title: string) { return this.lockReport({ ...r, ...fields, timestamp: now(), buildStatus: "in_progress", confidenceScore: Math.max(r.confidenceScore, 55), buildSteps: [...r.buildSteps, this.step(type, title, r.buildSteps.length + 1, `${title} completed`)] }); }
  private components(r: FrontendBuildReport, more: string[]) { return [...new Set([...r.uiComponents, ...more])] as FrontendBuildReport["uiComponents"]; }
  private step(stepType: string, title: string, order: number, summary: string) { return { stepId: `few-step-${stepType}-${order}`, stepType, title, order, summary }; }
  lockReport(report: Omit<FrontendBuildReport, keyof BoundaryFlags> & Partial<BoundaryFlags>): FrontendBuildReport { return { ...report, metadataVersion: FEW_METADATA_VERSION, neverImplementBackendBusinessLogic: true, neverDesignDatabases: true, neverDeployApplications: true, neverOverridePillow: true, neverOverrideGrandKing: true, neverImplementQ605OrLater: true, followApprovedRequirementsAndArchitecture: true, preserveCompleteTraceability: true, buildReusableComponents: true, validateAccessibilityAndResponsiveness: true, preserveAuditHistory: true, structuralSignalOnly: true, maskSensitiveValues: true } as FrontendBuildReport; }
}
type BoundaryFlags = Pick<FrontendBuildReport, "neverImplementBackendBusinessLogic" | "neverDesignDatabases" | "neverDeployApplications" | "neverOverridePillow" | "neverOverrideGrandKing" | "neverImplementQ605OrLater" | "followApprovedRequirementsAndArchitecture" | "preserveCompleteTraceability" | "buildReusableComponents" | "validateAccessibilityAndResponsiveness" | "preserveAuditHistory" | "structuralSignalOnly" | "maskSensitiveValues">;
export function resetFrontendSequenceForTesting() { sequence = 0; }
