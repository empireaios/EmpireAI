import type { MediaCertificationConfiguration } from "./configuration.js";
import { MediaCertificationCore } from "./media-certification-core.js";
import type {
  EngineStatus,
  MediaCertificationInput,
  MediaCertificationRunReport,
} from "./types.js";

export class MediaCertificationController {
  private status: EngineStatus = "idle";
  private latestReport: MediaCertificationRunReport | null = null;

  constructor(
    private readonly manager: MediaCertificationCore,
    private readonly config: MediaCertificationConfiguration,
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
      mediaFactoryComponents: [...this.config.mediaFactoryComponents],
      certificationLevels: [...this.config.certificationLevels],
      integrationDomains: [...this.config.integrationDomains],
      governanceRules: [...this.config.governanceRules],
      seedReports: this.config.seedReports.map((r) => ({
        ...r,
        mediaBusinessesTested: [...r.mediaBusinessesTested],
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

  certifyFactory(input: MediaCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.certifyFactory(input, this.config));
  }

  verifyComponent(input: MediaCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.verifyComponent(input, this.config));
  }

  verifyIntegration(input: MediaCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyIntegration(input, this.config));
  }

  verifyGovernance(input: MediaCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyGovernance(input, this.config));
  }

  verifyTraceability(input: MediaCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyTraceability(input, this.config));
  }

  verifyAutonomousOperation(input: MediaCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyAutonomousOperation(input, this.config));
  }

  assessReadiness(input: MediaCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.assessReadiness(input, this.config));
  }

  produceReport(input: MediaCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: MediaCertificationInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: MediaCertificationRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
