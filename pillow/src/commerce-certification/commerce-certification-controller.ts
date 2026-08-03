import type { CommerceCertificationConfiguration } from "./configuration.js";
import { CommerceCertificationCore } from "./commerce-certification-core.js";
import type {
  EngineStatus,
  CommerceCertificationInput,
  CommerceCertificationRunReport,
} from "./types.js";

export class CommerceCertificationController {
  private status: EngineStatus = "idle";
  private latestReport: CommerceCertificationRunReport | null = null;

  constructor(
    private readonly manager: CommerceCertificationCore,
    private readonly config: CommerceCertificationConfiguration,
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
      commerceFactoryComponents: [...this.config.commerceFactoryComponents],
      certificationLevels: [...this.config.certificationLevels],
      integrationDomains: [...this.config.integrationDomains],
      governanceRules: [...this.config.governanceRules],
      seedReports: this.config.seedReports.map((r) => ({
        ...r,
        componentsTested: [...r.componentsTested],
        componentsPassed: [...r.componentsPassed],
        componentsFailed: [...r.componentsFailed],
        componentsWarned: [...r.componentsWarned],
        outstandingRisks: [...r.outstandingRisks],
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

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  certifyFactory(input: CommerceCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.certifyFactory(input, this.config));
  }

  verifyComponent(input: CommerceCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.verifyComponent(input, this.config));
  }

  verifyIntegration(input: CommerceCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyIntegration(input, this.config));
  }

  verifyGovernance(input: CommerceCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyGovernance(input, this.config));
  }

  verifyTraceability(input: CommerceCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyTraceability(input, this.config));
  }

  assessReadiness(input: CommerceCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.assessReadiness(input, this.config));
  }

  produceReport(input: CommerceCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: CommerceCertificationInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: CommerceCertificationRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
