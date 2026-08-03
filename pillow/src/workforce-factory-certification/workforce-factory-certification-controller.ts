import type { WorkforceFactoryCertificationConfiguration } from "./configuration.js";
import { WorkforceFactoryCertificationCore } from "./workforce-factory-certification-core.js";
import type {
  EngineStatus,
  WorkforceFactoryCertificationInput,
  WorkforceFactoryCertificationRunReport,
} from "./types.js";

export class WorkforceFactoryCertificationController {
  private status: EngineStatus = "idle";
  private latestReport: WorkforceFactoryCertificationRunReport | null = null;

  constructor(
    private readonly manager: WorkforceFactoryCertificationCore,
    private readonly config: WorkforceFactoryCertificationConfiguration,
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
      workforceFactoryComponents: [...this.config.workforceFactoryComponents],
      certificationLevels: [...this.config.certificationLevels],
      integrationDomains: [...this.config.integrationDomains],
      governanceRules: [...this.config.governanceRules],
      seedReports: this.config.seedReports.map((r) => ({
        ...r,
        componentsTested: [...r.componentsTested],
        componentsPassed: [...r.componentsPassed],
        componentsFailed: [...r.componentsFailed],
        componentsWarned: [...r.componentsWarned],
        remainingRisks: [...r.remainingRisks],
        recommendations: [...r.recommendations],
        componentVerifications: r.componentVerifications.map((v) => ({ ...v })),
        integrationVerifications: r.integrationVerifications.map((v) => ({ ...v })),
        governanceVerifications: r.governanceVerifications.map((v) => ({ ...v })),
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

  certifyFactory(input: WorkforceFactoryCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.certifyFactory(input, this.config));
  }

  verifyComponent(input: WorkforceFactoryCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.verifyComponent(input, this.config));
  }

  verifyIntegration(input: WorkforceFactoryCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyIntegration(input, this.config));
  }

  verifyGovernance(input: WorkforceFactoryCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.verifyGovernance(input, this.config));
  }

  assessReadiness(input: WorkforceFactoryCertificationInput = {}) {
    this.status = "assessing";
    return this.finish(this.manager.assessReadiness(input, this.config));
  }

  produceReport(input: WorkforceFactoryCertificationInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkforceFactoryCertificationInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkforceFactoryCertificationRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
