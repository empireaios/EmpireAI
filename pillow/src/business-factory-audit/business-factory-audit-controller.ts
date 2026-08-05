import type { BusinessFactoryAuditConfiguration } from "./configuration.js";
import type { BusinessFactoryAuditDependencies } from "./integrations.js";
import { BusinessFactoryAuditManager } from "./business-factory-audit-manager.js";
import type { BfartInput, BusinessFactoryAuditReport, EngineStatus } from "./types.js";

export class BusinessFactoryAuditController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: BusinessFactoryAuditManager,
    private readonly config: BusinessFactoryAuditConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: BusinessFactoryAuditDependencies = {}) {
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

  getLatestReport(): BusinessFactoryAuditReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  discoverFactories() {
    this.status = "discovering_factories";
    const result = this.manager.discoverFactories(this.config);
    this.status = "active";
    return result;
  }

  verifyRegistration() {
    this.status = "verifying_registration";
    const result = this.manager.verifyRegistration(this.config);
    this.status = "active";
    return result;
  }

  verifyWorkers() {
    this.status = "verifying_workers";
    const result = this.manager.verifyWorkers(this.config);
    this.status = "active";
    return result;
  }

  verifyWorkflows() {
    this.status = "verifying_workflows";
    const result = this.manager.verifyWorkflows(this.config);
    this.status = "active";
    return result;
  }

  verifyRuntimeIntegration() {
    this.status = "verifying_runtime_integration";
    const result = this.manager.verifyRuntimeIntegration(this.config);
    this.status = "active";
    return result;
  }

  verifyExternalIntegrations() {
    this.status = "verifying_external_integrations";
    const result = this.manager.verifyExternalIntegrations(this.config);
    this.status = "active";
    return result;
  }

  verifyGovernance() {
    this.status = "verifying_governance";
    const result = this.manager.verifyGovernance(this.config);
    this.status = "active";
    return result;
  }

  verifyOperationalReadiness() {
    this.status = "verifying_operational_readiness";
    const result = this.manager.verifyOperationalReadiness(this.config);
    this.status = "active";
    return result;
  }

  verifyIntegrations() {
    return this.manager.verifyIntegrations();
  }

  classifyBusinessFactoryReadiness() {
    this.status = "classifying_business_factory_readiness";
    const result = this.manager.buildAssessments(this.config);
    this.status = "active";
    return result;
  }

  produceBusinessFactoryReadinessFindings(input: BfartInput = {}) {
    this.status = "classifying_business_factory_readiness";
    const result = this.manager.produceBusinessFactoryReadinessFindings(input, this.config);
    this.status = "active";
    return result;
  }

  produceReport(input: BfartInput = {}) {
    this.status = "reporting";
    const report = this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  submitReport(input: BfartInput = {}) {
    this.status = "reporting";
    const report = this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: BfartInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1105ConsumableContract() {
    return this.manager.getQ1105ConsumableContract();
  }

  getBusinessFactoryMatrix() {
    return this.manager.getBusinessFactoryMatrix();
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
