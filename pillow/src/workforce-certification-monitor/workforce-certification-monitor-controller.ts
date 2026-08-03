import type { WorkforceCertificationMonitorConfiguration } from "./configuration.js";
import { WorkforceCertificationMonitorCore } from "./workforce-certification-monitor-core.js";
import type {
  EngineStatus,
  WorkforceCertificationMonitorInput,
  WorkforceCertificationMonitorRunReport,
} from "./types.js";

export class WorkforceCertificationMonitorController {
  private status: EngineStatus = "idle";
  private latestReport: WorkforceCertificationMonitorRunReport | null = null;

  constructor(
    private readonly manager: WorkforceCertificationMonitorCore,
    private readonly config: WorkforceCertificationMonitorConfiguration,
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
      certificationChecks: [...this.config.certificationChecks],
      certificationStatuses: [...this.config.certificationStatuses],
      seedCertifications: this.config.seedCertifications.map((r) => ({
        ...r,
        certificationIssues: [...r.certificationIssues],
        checksPerformed: [...r.checksPerformed],
        checksFailed: [...r.checksFailed],
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

  certifyWorker(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.certifyWorker(input, this.config));
  }

  monitorWorkforce(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorWorkforce(input, this.config));
  }

  verifyAvailability(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.verifyAvailability(input, this.config));
  }

  verifyReachability(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.verifyReachability(input, this.config));
  }

  verifyCapabilities(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.verifyCapabilities(input, this.config));
  }

  verifyToolAccess(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.verifyToolAccess(input, this.config));
  }

  verifyGovernance(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.verifyGovernance(input, this.config));
  }

  verifyQualityCompliance(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.verifyQualityCompliance(input, this.config));
  }

  verifySelfCritiqueCompliance(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.verifySelfCritiqueCompliance(input, this.config));
  }

  detectFailures(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.detectFailures(input, this.config));
  }

  decertifyWorker(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.decertifyWorker(input, this.config));
  }

  recertifyWorker(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "certifying";
    return this.finish(this.manager.recertifyWorker(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkforceCertificationMonitorInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkforceCertificationMonitorRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
