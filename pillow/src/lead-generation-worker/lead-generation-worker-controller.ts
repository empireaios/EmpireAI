import type { LeadGenerationWorkerConfiguration } from "./configuration.js";
import type { LeadGenerationWorkerDependencies } from "./integrations.js";
import { LeadManager } from "./lead-manager.js";
import type {
  EngineStatus,
  LeadGenInput,
  LeadGenerationWorkerRunReport,
} from "./types.js";

export class LeadGenerationWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: LeadGenerationWorkerRunReport | null = null;

  constructor(
    private readonly manager: LeadManager,
    private readonly config: LeadGenerationWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: LeadGenerationWorkerDependencies = {}) {
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

  createLeadFunnel(input: LeadGenInput = {}) {
    this.status = "building_funnel";
    return this.finish(this.manager.createLeadFunnel(input, this.config));
  }

  generateEnquiryForm(input: LeadGenInput = {}) {
    this.status = "generating_form";
    return this.finish(this.manager.generateEnquiryForm(input, this.config));
  }

  captureLead(input: LeadGenInput = {}) {
    this.status = "capturing_lead";
    return this.finish(this.manager.captureLead(input, this.config));
  }

  qualifyLead(input: LeadGenInput = {}) {
    this.status = "qualifying";
    return this.finish(this.manager.qualifyLead(input, this.config));
  }

  scoreLead(input: LeadGenInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreLead(input, this.config));
  }

  routeLeadToCrm(input: LeadGenInput = {}) {
    this.status = "routing_crm";
    return this.finish(this.manager.routeLeadToCrm(input, this.config));
  }

  routeLeadToBooking(input: LeadGenInput = {}) {
    this.status = "routing_booking";
    return this.finish(this.manager.routeLeadToBooking(input, this.config));
  }

  trackConversionStage(input: LeadGenInput = {}) {
    this.status = "tracking_conversion";
    return this.finish(this.manager.trackConversionStage(input, this.config));
  }

  measureFunnelPerformance(input: LeadGenInput = {}) {
    this.status = "measuring";
    return this.finish(this.manager.measureFunnelPerformance(input, this.config));
  }

  produceReport(input: LeadGenInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceLeadGenerationReport(input: LeadGenInput = {}) {
    return this.produceReport(input);
  }

  submitReport(input: LeadGenInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: LeadGenInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  private finish(report: LeadGenerationWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
