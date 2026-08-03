import type { DigitalProductsCertificationConfiguration } from "./configuration.js";
import { DigitalProductsCertificationCore } from "./digital-products-certification-core.js";
import type {
  DigitalProductsCertificationDependencies,
} from "./integrations.js";
import type {
  EngineStatus,
  DigitalProductsCertificationInput,
  DigitalProductsCertificationRunReport,
} from "./types.js";

export class DigitalProductsCertificationController {
  private status: EngineStatus = "idle";
  private latestReport: DigitalProductsCertificationRunReport | null = null;

  constructor(
    private readonly manager: DigitalProductsCertificationCore,
    private readonly config: DigitalProductsCertificationConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
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
      digitalProductsFactoryComponents: [...this.config.digitalProductsFactoryComponents],
      certificationStatuses: [...this.config.certificationStatuses],
      integrationDomains: [...this.config.integrationDomains],
      governanceRules: [...this.config.governanceRules],
      seedReports: this.config.seedReports.map((r) => ({
        ...r,
        digitalProductsTested: [...r.digitalProductsTested],
        missionVerificationMatrix: r.missionVerificationMatrix.map((m) => ({ ...m })),
        workerVerificationMatrix: r.workerVerificationMatrix.map((w) => ({ ...w })),
        outstandingIssues: r.outstandingIssues.map((i) => ({ ...i })),
        recommendations: [...r.recommendations],
        componentVerifications: r.componentVerifications.map((v) => ({ ...v })),
        integrationVerifications: r.integrationVerifications.map((v) => ({ ...v })),
        governanceVerifications: r.governanceVerifications.map((v) => ({ ...v })),
        traceabilityChain: r.traceabilityChain.map((t) => ({ ...t })),
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  bindIntegrations(deps: DigitalProductsCertificationDependencies) {
    this.manager.bindIntegrations(deps);
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  certifyFactory(input: DigitalProductsCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.certifyFactory(input, this.config));
  }

  verifyWorkerRegistration(input: DigitalProductsCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.verifyWorkerRegistration(input, this.config));
  }

  verifyWorkerInvocation(input: DigitalProductsCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.verifyWorkerInvocation(input, this.config));
  }

  verifyWorkerDependencies(input: DigitalProductsCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyWorkerDependencies(input, this.config));
  }

  verifyEndToEndWorkflow(input: DigitalProductsCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyEndToEndWorkflow(input, this.config));
  }

  verifyReportGeneration(input: DigitalProductsCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.verifyReportGeneration(input, this.config));
  }

  verifyExecutiveReportingIntegration(input: DigitalProductsCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyExecutiveReportingIntegration(input, this.config));
  }

  verifyGovernanceCompliance(input: DigitalProductsCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyGovernanceCompliance(input, this.config));
  }

  verifyFailureHandlingAndRecovery(input: DigitalProductsCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyFailureHandlingAndRecovery(input, this.config));
  }

  verifyAuditTrailCompleteness(input: DigitalProductsCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyAuditTrailCompleteness(input, this.config));
  }

  assessReadiness(input: DigitalProductsCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.assessReadiness(input, this.config));
  }

  produceReport(input: DigitalProductsCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: DigitalProductsCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: DigitalProductsCertificationInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: DigitalProductsCertificationRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
