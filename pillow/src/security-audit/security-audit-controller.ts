import type { SecurityAuditConfiguration } from "./configuration.js";
import type { SecurityAuditDependencies } from "./integrations.js";
import { SecurityAuditManager } from "./security-audit-manager.js";
import type { SecartInput, SecurityAuditReport, EngineStatus } from "./types.js";

export class SecurityAuditController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: SecurityAuditManager,
    private readonly config: SecurityAuditConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: SecurityAuditDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedReports: this.config.seedReports.map((report) => ({ ...report })),
    };
  }

  getLatestReport(): SecurityAuditReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  discoverSecurityComponents() {
    this.status = "discovering_security_components";
    const result = this.manager.discoverSecurityComponents(this.config);
    this.status = "active";
    return result;
  }

  verifyAuthentication() {
    this.status = "verifying_authentication";
    const result = this.manager.verifyAuthentication(this.config);
    this.status = "active";
    return result;
  }

  verifyAuthorization() {
    this.status = "verifying_authorization";
    const result = this.manager.verifyAuthorization(this.config);
    this.status = "active";
    return result;
  }

  verifyRolePermissionEnforcement() {
    this.status = "verifying_role_permission_enforcement";
    const result = this.manager.verifyRolePermissionEnforcement(this.config);
    this.status = "active";
    return result;
  }

  verifySecretManagement() {
    this.status = "verifying_secret_management";
    const result = this.manager.verifySecretManagement(this.config);
    this.status = "active";
    return result;
  }

  verifyApiSecurity() {
    this.status = "verifying_api_security";
    const result = this.manager.verifyApiSecurity(this.config);
    this.status = "active";
    return result;
  }

  verifyDataProtection() {
    this.status = "verifying_data_protection";
    const result = this.manager.verifyDataProtection(this.config);
    this.status = "active";
    return result;
  }

  verifyRuntimeSecurity() {
    this.status = "verifying_runtime_security";
    const result = this.manager.verifyRuntimeSecurity(this.config);
    this.status = "active";
    return result;
  }

  verifyOperationalSecurity() {
    this.status = "verifying_operational_security";
    const result = this.manager.verifyOperationalSecurity(this.config);
    this.status = "active";
    return result;
  }

  verifyIntegrations() {
    return this.manager.verifyIntegrations();
  }

  classifySecurityReadiness() {
    this.status = "classifying_security_readiness";
    const result = this.manager.buildAssessments(this.config);
    this.status = "active";
    return result;
  }

  produceSecurityReadinessFindings(input: SecartInput = {}) {
    this.status = "classifying_security_readiness";
    const result = this.manager.produceSecurityReadinessFindings(input, this.config);
    this.status = "active";
    return result;
  }

  produceReport(input: SecartInput = {}) {
    this.status = "reporting";
    const report = this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  submitReport(input: SecartInput = {}) {
    this.status = "reporting";
    const report = this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: SecartInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1106ConsumableContract() {
    return this.manager.getQ1106ConsumableContract();
  }

  getSecurityMatrix() {
    return this.manager.getSecurityMatrix();
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
