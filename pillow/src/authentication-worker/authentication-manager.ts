import { AuthRuntime } from "./auth-runtime.js";
import { AuthenticationBuilder } from "./authentication-builder.js";
import type { AuthenticationWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type AuthenticationWorkerDependencies } from "./integrations.js";
import { AuthenticationStore } from "./authentication-store.js";
import { AuthenticationValidator } from "./authentication-validator.js";
import type { AuthenticationBuildReport, AuthenticationWorkerInput } from "./types.js";
const stageFields: Record<string, Array<keyof AuthenticationBuildReport>> = {
  createAndManageUserAccounts: ["userAccountCapabilityStatus"], implementAccountRegistration: ["registrationStatus"], implementSecureLoginAndLogout: ["loginStatus", "logoutStatus"], implementSessionLifecycle: ["sessionManagementStatus"], implementSecurePasswordStorageAndCredentialValidation: ["passwordSecurityStatus"], implementForgottenPasswordAndPasswordReset: ["recoveryFlowStatus"], implementAccountVerification: ["accountVerificationStatus"], implementAuthenticationFailureHandlingAndSecurityProtections: ["authenticationProtectionStatus", "auditIntegrationStatus"],
};
export class AuthenticationManager {
  readonly runtime: AuthRuntime; private readonly store = new AuthenticationStore(); private readonly builder = new AuthenticationBuilder(); private readonly validator = new AuthenticationValidator(); private readonly integrations = new IntegrationCoordinator();
  constructor(private readonly configuration: AuthenticationWorkerConfiguration) { this.runtime = new AuthRuntime(configuration); }
  bindIntegrations(dependencies: AuthenticationWorkerDependencies = {}) {
    this.integrations.bind(dependencies);
    this.runtime.setNotificationCapability(dependencies.notificationCapability?.notify ?? null);
  }
  connect() { this.integrations.connect(); return this.run("connect", this.store.latest(), this.validator.validate(this.store.list(), { validated: true })); }
  private pipeline(action: string, input: AuthenticationWorkerInput = {}, complete = false) {
    const enriched = this.integrations.enrich(input); const check = this.validator.validate(null, enriched); if (check.decision === "fail") return this.run(action, null, check);
    let report = this.store.latest() ?? this.builder.create(enriched); if (action === "receiveApprovedRequirementsReports" || action === "receiveApprovedArchitectureReports") report = this.builder.create(enriched);
    if (action === "receiveApprovedRequirementsReports") report.buildSteps.push("approved requirements received");
    else if (action === "receiveApprovedArchitectureReports") report.buildSteps.push("approved architecture received");
    else if (action === "produceAuthenticationBuildReport") { for (const [step, fields] of Object.entries(stageFields)) this.builder.stage(report, step, fields); this.builder.complete(report); }
    else this.builder.stage(report, action, stageFields[action] ?? []);
    const validation = this.validator.validate([report], enriched, complete || action === "produceAuthenticationBuildReport"); this.store.save(report, action); return this.run(action, report, validation);
  }
  receiveApprovedRequirementsReports(input?: AuthenticationWorkerInput) { return this.pipeline("receiveApprovedRequirementsReports", input); } receiveApprovedArchitectureReports(input?: AuthenticationWorkerInput) { return this.pipeline("receiveApprovedArchitectureReports", input); }
  stage(action: string, input?: AuthenticationWorkerInput) { return this.pipeline(action, input); } produceAuthenticationBuildReport(input?: AuthenticationWorkerInput) { return this.pipeline("produceAuthenticationBuildReport", input, true); }
  submitReport(input: AuthenticationWorkerInput = {}) { const result = this.produceAuthenticationBuildReport(input); const report = result.latestAuthenticationBuildReport; if (report && result.validation.decision !== "fail") { report.executiveReportId = this.integrations.submit(report); report.submittedToExecutiveReporting = Boolean(report.executiveReportId); this.store.save(report, "submitReport"); } return this.run("submitReport", report, result.validation); }
  list() { return this.run("list", this.store.latest(), this.validator.validate(this.store.list(), { validated: true })); } validate(input?: AuthenticationWorkerInput) { return this.run("validate", this.store.latest(), this.validator.validate(this.store.list(), input)); } diagnostics() { return this.list(); }
  getReports() { return this.store.list(); } getAuditTrail() { return this.store.trail(); } getIntegrations() { return this.integrations.connect(); }
  private run(action: string, report: AuthenticationBuildReport | null, validation: ReturnType<AuthenticationValidator["validate"]>) { return { authenticationRunReportId: `atw-run-${Date.now()}`, action, timestamp: new Date().toISOString(), latestAuthenticationBuildReport: report ? structuredClone(report) : null, authenticationBuildReports: report ? [structuredClone(report)] : [], validation, durationMs: 0 }; }
}
