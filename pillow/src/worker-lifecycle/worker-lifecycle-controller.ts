import type { WorkerLifecycleConfiguration } from "./configuration.js";
import { WorkerLifecycleCore } from "./worker-lifecycle-core.js";
import type {
  EngineStatus,
  WorkerLifecycleInput,
  WorkerLifecycleRunReport,
} from "./types.js";

export class WorkerLifecycleController {
  private status: EngineStatus = "idle";
  private latestReport: WorkerLifecycleRunReport | null = null;

  constructor(
    private readonly manager: WorkerLifecycleCore,
    private readonly config: WorkerLifecycleConfiguration,
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
      lifecycleStates: [...this.config.lifecycleStates],
      lifecycleRules: [...this.config.lifecycleRules],
      seedProfiles: this.config.seedProfiles.map((p) => ({
        ...p,
        history: p.history.map((h) => ({
          ...h,
          supportingEvidence: [...h.supportingEvidence],
        })),
        neverPermanentlyDeleted: true as const,
      })),
      seedRecords: this.config.seedRecords.map((r) => ({
        ...r,
        supportingEvidence: [...r.supportingEvidence],
        permanentlyDeleted: false as const,
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

  create(input: WorkerLifecycleInput = {}) {
    this.status = "transitioning";
    return this.finish(this.manager.create(input, this.config));
  }

  onboard(input: WorkerLifecycleInput = {}) {
    this.status = "transitioning";
    return this.finish(this.manager.onboard(input, this.config));
  }

  configure(input: WorkerLifecycleInput = {}) {
    this.status = "transitioning";
    return this.finish(this.manager.configure(input, this.config));
  }

  activate(input: WorkerLifecycleInput = {}) {
    this.status = "transitioning";
    return this.finish(this.manager.activate(input, this.config));
  }

  suspend(input: WorkerLifecycleInput = {}) {
    this.status = "transitioning";
    return this.finish(this.manager.suspend(input, this.config));
  }

  resume(input: WorkerLifecycleInput = {}) {
    this.status = "transitioning";
    return this.finish(this.manager.resume(input, this.config));
  }

  replace(input: WorkerLifecycleInput = {}) {
    this.status = "transitioning";
    return this.finish(this.manager.replace(input, this.config));
  }

  retire(input: WorkerLifecycleInput = {}) {
    this.status = "transitioning";
    return this.finish(this.manager.retire(input, this.config));
  }

  archive(input: WorkerLifecycleInput = {}) {
    this.status = "transitioning";
    return this.finish(this.manager.archive(input, this.config));
  }

  audit(input: WorkerLifecycleInput = {}) {
    this.status = "auditing";
    return this.finish(this.manager.audit(input, this.config));
  }

  restore(input: WorkerLifecycleInput = {}) {
    this.status = "transitioning";
    return this.finish(this.manager.restore(input, this.config));
  }

  produce(input: WorkerLifecycleInput = {}) {
    this.status = "active";
    return this.finish(this.manager.produce(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkerLifecycleInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkerLifecycleRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
