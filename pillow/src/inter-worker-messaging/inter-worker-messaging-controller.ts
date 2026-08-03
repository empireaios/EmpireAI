import type { InterWorkerMessagingConfiguration } from "./configuration.js";
import { InterWorkerMessagingCore } from "./inter-worker-messaging-core.js";
import type {
  EngineStatus,
  InterWorkerMessagingInput,
  InterWorkerMessagingRunReport,
} from "./types.js";

export class InterWorkerMessagingController {
  private status: EngineStatus = "idle";
  private latestReport: InterWorkerMessagingRunReport | null = null;

  constructor(
    private readonly manager: InterWorkerMessagingCore,
    private readonly config: InterWorkerMessagingConfiguration,
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
      messageTypes: [...this.config.messageTypes],
      messagePriorities: [...this.config.messagePriorities],
      seedMessages: this.config.seedMessages.map((r) => ({
        ...r,
        deliveryHistory: [...r.deliveryHistory],
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

  send(input: InterWorkerMessagingInput = {}) {
    this.status = "sending";
    return this.finish(this.manager.send(input, this.config));
  }

  receive(input: InterWorkerMessagingInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receive(input, this.config));
  }

  route(input: InterWorkerMessagingInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.route(input, this.config));
  }

  reply(input: InterWorkerMessagingInput = {}) {
    this.status = "sending";
    return this.finish(this.manager.reply(input, this.config));
  }

  broadcast(input: InterWorkerMessagingInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.broadcast(input, this.config));
  }

  trackDelivery(input: InterWorkerMessagingInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.trackDelivery(input, this.config));
  }

  searchHistory(input: InterWorkerMessagingInput = {}) {
    this.status = "tracking";
    return this.finish(this.manager.searchHistory(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: InterWorkerMessagingInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: InterWorkerMessagingRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
