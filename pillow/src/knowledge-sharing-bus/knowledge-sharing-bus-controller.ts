import type { KnowledgeSharingBusConfiguration } from "./configuration.js";
import { KnowledgeSharingBusCore } from "./knowledge-sharing-bus-core.js";
import type {
  EngineStatus,
  KnowledgeSharingBusInput,
  KnowledgeSharingBusRunReport,
} from "./types.js";

export class KnowledgeSharingBusController {
  private status: EngineStatus = "idle";
  private latestReport: KnowledgeSharingBusRunReport | null = null;

  constructor(
    private readonly manager: KnowledgeSharingBusCore,
    private readonly config: KnowledgeSharingBusConfiguration,
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
      knowledgeCategories: [...this.config.knowledgeCategories],
      seedKnowledge: this.config.seedKnowledge.map((r) => ({
        ...r,
        supportingEvidence: [...r.supportingEvidence],
        relatedPlaybooks: [...r.relatedPlaybooks],
        classificationLabels: [...r.classificationLabels],
        subscribers: [...r.subscribers],
        versionHistory: [...r.versionHistory],
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

  submit(input: KnowledgeSharingBusInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.submit(input, this.config));
  }

  classify(input: KnowledgeSharingBusInput = {}) {
    this.status = "classifying";
    return this.finish(this.manager.classify(input, this.config));
  }

  categorize(input: KnowledgeSharingBusInput = {}) {
    this.status = "classifying";
    return this.finish(this.manager.categorize(input, this.config));
  }

  version(input: KnowledgeSharingBusInput = {}) {
    this.status = "active";
    return this.finish(this.manager.version(input, this.config));
  }

  publish(input: KnowledgeSharingBusInput = {}) {
    this.status = "publishing";
    return this.finish(this.manager.publish(input, this.config));
  }

  subscribe(input: KnowledgeSharingBusInput = {}) {
    this.status = "sharing";
    return this.finish(this.manager.subscribe(input, this.config));
  }

  retrieve(input: KnowledgeSharingBusInput = {}) {
    this.status = "sharing";
    return this.finish(this.manager.retrieve(input, this.config));
  }

  trackUsage(input: KnowledgeSharingBusInput = {}) {
    this.status = "sharing";
    return this.finish(this.manager.trackUsage(input, this.config));
  }

  archive(input: KnowledgeSharingBusInput = {}) {
    this.status = "archiving";
    return this.finish(this.manager.archive(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: KnowledgeSharingBusInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: KnowledgeSharingBusRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
