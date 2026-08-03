import type { CrmWorkerConfiguration } from "./configuration.js";
import type { CrmWorkerDependencies } from "./integrations.js";
import { CrmManager } from "./crm-manager.js";
import type {
  EngineStatus,
  CrmInput,
  CrmWorkerRunReport,
} from "./types.js";

export class CrmWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: CrmWorkerRunReport | null = null;

  constructor(
    private readonly manager: CrmManager,
    private readonly config: CrmWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: CrmWorkerDependencies = {}) {
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
      leadStatuses: [...this.config.leadStatuses],
      lifecycleStages: [...this.config.lifecycleStages],
      customerStatuses: [...this.config.customerStatuses],
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

  createCustomerProfile(input: CrmInput = {}) {
    this.status = "creating_profile";
    return this.finish(this.manager.createCustomerProfile(input, this.config));
  }

  updateCustomerProfile(input: CrmInput = {}) {
    this.status = "creating_profile";
    return this.finish(this.manager.updateCustomerProfile(input, this.config));
  }

  captureLead(input: CrmInput = {}) {
    this.status = "capturing_lead";
    return this.finish(this.manager.captureLead(input, this.config));
  }

  updateLeadStatus(input: CrmInput = {}) {
    this.status = "capturing_lead";
    return this.finish(this.manager.updateLeadStatus(input, this.config));
  }

  recordContact(input: CrmInput = {}) {
    this.status = "recording_contact";
    return this.finish(this.manager.recordContact(input, this.config));
  }

  recordInteraction(input: CrmInput = {}) {
    this.status = "recording_contact";
    return this.finish(this.manager.recordInteraction(input, this.config));
  }

  linkBookingHistory(input: CrmInput = {}) {
    this.status = "linking_booking";
    return this.finish(this.manager.linkBookingHistory(input, this.config));
  }

  scheduleFollowUp(input: CrmInput = {}) {
    this.status = "scheduling_follow_up";
    return this.finish(this.manager.scheduleFollowUp(input, this.config));
  }

  completeFollowUp(input: CrmInput = {}) {
    this.status = "scheduling_follow_up";
    return this.finish(this.manager.completeFollowUp(input, this.config));
  }

  trackOpportunity(input: CrmInput = {}) {
    this.status = "active";
    return this.finish(this.manager.trackOpportunity(input, this.config));
  }

  updateLifecycleStage(input: CrmInput = {}) {
    this.status = "updating_lifecycle";
    return this.finish(this.manager.updateLifecycleStage(input, this.config));
  }

  generateCrmAnalytics(input: CrmInput = {}) {
    this.status = "analytics";
    return this.finish(this.manager.generateCrmAnalytics(input, this.config));
  }

  produceReport(input: CrmInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceCrmReport(input: CrmInput = {}) {
    return this.produceReport(input);
  }

  submitReport(input: CrmInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: CrmInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  private finish(report: CrmWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
