import type { LocalBusinessLaunchPackConfiguration } from "./configuration.js";
import type { LocalBusinessLaunchPackDependencies } from "./integrations.js";
import { LaunchPackageManager } from "./launch-pack-manager.js";
import type { EngineStatus, LblpInput, LblpRunReport } from "./types.js";

export class LocalBusinessLaunchPackController {
  private status: EngineStatus = "idle";
  private latestReport: LblpRunReport | null = null;

  constructor(
    private readonly manager: LaunchPackageManager,
    private readonly config: LocalBusinessLaunchPackConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: LocalBusinessLaunchPackDependencies = {}) {
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

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  collectFactoryOutputs(input: LblpInput = {}) {
    this.status = "collecting_outputs";
    return this.finish(this.manager.collectFactoryOutputs(input, this.config));
  }

  verifyDeliverables(input: LblpInput = {}) {
    this.status = "verifying_deliverables";
    return this.finish(this.manager.verifyDeliverables(input, this.config));
  }

  generateExecutiveLaunchPackage(input: LblpInput = {}) {
    this.status = "assembling_package";
    return this.finish(this.manager.generateExecutiveLaunchPackage(input, this.config));
  }

  summarizeBusinessOpportunity(input: LblpInput = {}) {
    this.status = "summarizing";
    return this.manager.summarizeBusinessOpportunity(input, this.config);
  }

  summarizeServicesAndPricing(input: LblpInput = {}) {
    this.status = "summarizing";
    return this.manager.summarizeServicesAndPricing(input, this.config);
  }

  summarizeBookingCrmCommunicationReadiness(input: LblpInput = {}) {
    this.status = "summarizing";
    return this.manager.summarizeBookingCrmCommunicationReadiness(input, this.config);
  }

  summarizeSeoAndLeadGenerationReadiness(input: LblpInput = {}) {
    this.status = "summarizing";
    return this.manager.summarizeSeoAndLeadGenerationReadiness(input, this.config);
  }

  summarizeOperationalReadiness(input: LblpInput = {}) {
    this.status = "summarizing";
    return this.manager.summarizeOperationalReadiness(input, this.config);
  }

  identifyRisksAndOutstandingIssues(input: LblpInput = {}) {
    this.status = "identifying_risks";
    return this.manager.identifyRisksAndOutstandingIssues(input, this.config);
  }

  produceReport(input: LblpInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: LblpInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: LblpInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  private finish(report: LblpRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
