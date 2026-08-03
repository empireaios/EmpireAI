import type { UnifiedWorkforceCertificationConfiguration } from "./configuration.js";
import { UnifiedWorkforceCertificationCore } from "./unified-workforce-certification-core.js";
import type {
  EngineStatus,
  UnifiedWorkforceCertificationInput,
  UnifiedWorkforceCertificationRunReport,
} from "./types.js";

export class UnifiedWorkforceCertificationController {
  private status: EngineStatus = "idle";
  private latestReport: UnifiedWorkforceCertificationRunReport | null = null;

  constructor(
    private readonly manager: UnifiedWorkforceCertificationCore,
    private readonly config: UnifiedWorkforceCertificationConfiguration,
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
      executiveComponents: [...this.config.executiveComponents],
      certificationLevels: [...this.config.certificationLevels],
      integrationDomains: [...this.config.integrationDomains],
      seedReports: this.config.seedReports.map((r) => ({
        ...r,
        executiveComponentsTested: [...r.executiveComponentsTested],
        componentsPassed: [...r.componentsPassed],
        componentsFailed: [...r.componentsFailed],
        componentsWarned: [...r.componentsWarned],
        remainingRisks: [...r.remainingRisks],
        recommendations: [...r.recommendations],
        componentVerifications: r.componentVerifications.map((v) => ({ ...v })),
        integrationVerifications: r.integrationVerifications.map((v) => ({ ...v })),
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

  certifyFactory(input: UnifiedWorkforceCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.certifyFactory(input, this.config));
  }

  verifyComponent(input: UnifiedWorkforceCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.verifyComponent(input, this.config));
  }

  verifyIntegration(input: UnifiedWorkforceCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyIntegration(input, this.config));
  }

  assessReadiness(input: UnifiedWorkforceCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.assessReadiness(input, this.config));
  }

  produceReport(input: UnifiedWorkforceCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: UnifiedWorkforceCertificationInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: UnifiedWorkforceCertificationRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
