import type { AffiliateComplianceWorkerConfiguration } from "./configuration.js";
import type { AffiliateComplianceWorkerDependencies } from "./integrations.js";
import { ComplianceManager } from "./compliance-manager.js";
import type { AcwInput, EngineStatus } from "./types.js";

export class AffiliateComplianceWorkerController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: ComplianceManager,
    private configuration: AffiliateComplianceWorkerConfiguration,
  ) {}

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return this.configuration;
  }

  getStatus() {
    return this.status;
  }

  getLatestReport() {
    return this.manager.getStore().getLatestReport();
  }

  initialize() {
    this.manager.initialize(this.configuration);
    this.status = "idle";
  }

  bindIntegrations(deps: AffiliateComplianceWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    const result = this.manager.connect(this.configuration);
    this.status = "active";
    void input;
    return result;
  }

  private run(
    status: EngineStatus,
    fn: () => ReturnType<ComplianceManager["validateAffiliateDisclosures"]>,
  ) {
    this.status = status;
    try {
      return fn();
    } finally {
      this.status = "active";
    }
  }

  consumeAffiliateOpportunityReport(input: AcwInput = {}) {
    return this.run("consuming_opportunity", () =>
      this.manager.consumeAffiliateOpportunityReport(input, this.configuration),
    );
  }

  consumeReviewContentReport(input: AcwInput = {}) {
    return this.run("consuming_review", () =>
      this.manager.consumeReviewContentReport(input, this.configuration),
    );
  }

  consumeSeoContentReport(input: AcwInput = {}) {
    return this.run("consuming_seo", () =>
      this.manager.consumeSeoContentReport(input, this.configuration),
    );
  }

  validateAffiliateDisclosures(input: AcwInput = {}) {
    return this.run("validating_disclosures", () =>
      this.manager.validateAffiliateDisclosures(input, this.configuration),
    );
  }

  validatePlatformPolicyCompliance(input: AcwInput = {}) {
    return this.run("validating_platform_rules", () =>
      this.manager.validatePlatformPolicyCompliance(input, this.configuration),
    );
  }

  validateRequiredDisclaimers(input: AcwInput = {}) {
    return this.run("validating_disclaimers", () =>
      this.manager.validateRequiredDisclaimers(input, this.configuration),
    );
  }

  detectComplianceViolations(input: AcwInput = {}) {
    return this.run("detecting_violations", () =>
      this.manager.detectComplianceViolations(input, this.configuration),
    );
  }

  recommendCorrectiveActions(input: AcwInput = {}) {
    return this.run("recommending_corrections", () =>
      this.manager.recommendCorrectiveActions(input, this.configuration),
    );
  }

  assessApprovalReadiness(input: AcwInput = {}) {
    return this.run("assessing_readiness", () =>
      this.manager.assessApprovalReadiness(input, this.configuration),
    );
  }

  produceAffiliateComplianceReport(input: AcwInput = {}) {
    return this.run("reporting", () =>
      this.manager.produceAffiliateComplianceReport(input, this.configuration),
    );
  }

  produceReport(input: AcwInput = {}) {
    return this.produceAffiliateComplianceReport(input);
  }

  submitReport(input: AcwInput = {}) {
    return this.run("reporting", () => this.manager.submitReport(input, this.configuration));
  }

  list() {
    return this.manager.list();
  }

  validate(input: AcwInput = {}) {
    this.status = "validating";
    try {
      return this.manager.validate(input, this.configuration);
    } finally {
      this.status = "active";
    }
  }

  diagnostics() {
    return this.manager.diagnostics();
  }

  runDiagnostics() {
    return this.manager.runDiagnostics();
  }
}
