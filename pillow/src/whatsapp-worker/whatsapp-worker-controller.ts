import type { WhatsAppWorkerConfiguration } from "./configuration.js";
import type { WhatsAppWorkerDependencies } from "./integrations.js";
import { WhatsAppManager } from "./whatsapp-manager.js";
import type {
  EngineStatus,
  WhatsAppInput,
  WhatsAppWorkerRunReport,
} from "./types.js";

export class WhatsAppWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: WhatsAppWorkerRunReport | null = null;

  constructor(
    private readonly manager: WhatsAppManager,
    private readonly config: WhatsAppWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: WhatsAppWorkerDependencies = {}) {
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
      conversationStatuses: [...this.config.conversationStatuses],
      messageDirections: [...this.config.messageDirections],
      automationStepTypes: [...this.config.automationStepTypes],
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

  receiveInboundEnquiry(input: WhatsAppInput = {}) {
    this.status = "receiving_inbound";
    return this.finish(this.manager.receiveInboundEnquiry(input, this.config));
  }

  sendOutboundMessage(input: WhatsAppInput = {}) {
    this.status = "sending_outbound";
    return this.finish(this.manager.sendOutboundMessage(input, this.config));
  }

  applyTemplate(input: WhatsAppInput = {}) {
    this.status = "applying_template";
    return this.finish(this.manager.applyTemplate(input, this.config));
  }

  runAutomatedWorkflow(input: WhatsAppInput = {}) {
    this.status = "running_workflow";
    return this.finish(this.manager.runAutomatedWorkflow(input, this.config));
  }

  triggerCrmWorkflow(input: WhatsAppInput = {}) {
    this.status = "triggering_crm";
    return this.finish(this.manager.triggerCrmWorkflow(input, this.config));
  }

  triggerBookingWorkflow(input: WhatsAppInput = {}) {
    this.status = "triggering_booking";
    return this.finish(this.manager.triggerBookingWorkflow(input, this.config));
  }

  scheduleReminder(input: WhatsAppInput = {}) {
    this.status = "scheduling_reminder";
    return this.finish(this.manager.scheduleReminder(input, this.config));
  }

  scheduleFollowUpMessage(input: WhatsAppInput = {}) {
    this.status = "scheduling_reminder";
    return this.finish(this.manager.scheduleFollowUpMessage(input, this.config));
  }

  escalateToHuman(input: WhatsAppInput = {}) {
    this.status = "escalating";
    return this.finish(this.manager.escalateToHuman(input, this.config));
  }

  assignConversation(input: WhatsAppInput = {}) {
    this.status = "active";
    return this.finish(this.manager.assignConversation(input, this.config));
  }

  labelConversation(input: WhatsAppInput = {}) {
    this.status = "active";
    return this.finish(this.manager.labelConversation(input, this.config));
  }

  getConversationHistory(input: WhatsAppInput = {}) {
    this.status = "active";
    return this.finish(this.manager.getConversationHistory(input, this.config));
  }

  produceReport(input: WhatsAppInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceWhatsAppReport(input: WhatsAppInput = {}) {
    return this.produceReport(input);
  }

  submitReport(input: WhatsAppInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WhatsAppInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  private finish(report: WhatsAppWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
