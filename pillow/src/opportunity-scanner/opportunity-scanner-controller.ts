import type { OpportunityScannerConfiguration } from "./configuration.js";
import { OpportunityScannerManager } from "./opportunity-scanner-manager.js";
import type { EngineStatus, OpportunityScannerInput, OpportunityScannerRunReport } from "./types.js";

export class OpportunityScannerController {
  private status: EngineStatus = "idle";
  private latestReport: OpportunityScannerRunReport | null = null;

  constructor(
    private readonly manager: OpportunityScannerManager,
    private readonly config: OpportunityScannerConfiguration,
  ) {}

  initialize() {
    this.status = "active";
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return { ...this.config, opportunityDomains: [...this.config.opportunityDomains] };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  configureDomains(input: OpportunityScannerInput = {}) {
    this.status = "active";
    return this.finish(this.manager.configureDomains(input, this.config));
  }

  scanBusiness(input: OpportunityScannerInput = {}) {
    this.status = "scanning";
    return this.finish(this.manager.scanBusiness(input, this.config));
  }

  scanOperational(input: OpportunityScannerInput = {}) {
    this.status = "scanning";
    return this.finish(this.manager.scanOperational(input, this.config));
  }

  scanAll(input: OpportunityScannerInput = {}) {
    this.status = "scanning";
    return this.finish(this.manager.scanAll(input, this.config));
  }

  scoreOpportunities(input: OpportunityScannerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreOpportunities(input, this.config));
  }

  markForReview(input: OpportunityScannerInput = {}) {
    this.status = "active";
    return this.finish(this.manager.markForReview(input, this.config));
  }

  validateOpportunities(input: OpportunityScannerInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validateOpportunities(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: OpportunityScannerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
