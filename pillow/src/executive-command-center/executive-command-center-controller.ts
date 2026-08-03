import type { ExecutiveCommandCenterConfiguration } from "./configuration.js";
import { ExecutiveCommandCenterCore } from "./executive-command-center-core.js";
import type {
  EngineStatus,
  ExecutiveCommandCenterInput,
  ExecutiveCommandCenterRunReport,
} from "./types.js";

export class ExecutiveCommandCenterController {
  private status: EngineStatus = "idle";
  private latestReport: ExecutiveCommandCenterRunReport | null = null;

  constructor(
    private readonly manager: ExecutiveCommandCenterCore,
    private readonly config: ExecutiveCommandCenterConfiguration,
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
      commandTypes: [...this.config.commandTypes],
      routedServices: [...this.config.routedServices],
      seedWorkers: this.config.seedWorkers.map((w) => ({ ...w })),
      seedTools: this.config.seedTools.map((t) => ({ ...t })),
      seedMissions: this.config.seedMissions.map((m) => ({ ...m })),
      seedBusinessStates: this.config.seedBusinessStates.map((b) => ({ ...b })),
      seedApprovals: this.config.seedApprovals.map((a) => ({ ...a })),
      seedExecutionMemory: this.config.seedExecutionMemory.map((m) => ({ ...m })),
      seedDecisionMemory: this.config.seedDecisionMemory.map((m) => ({ ...m })),
      seedExecutiveReports: this.config.seedExecutiveReports.map((r) => ({ ...r })),
      seedCommands: this.config.seedCommands.map((c) => ({
        ...c,
        relatedWorkers: [...c.relatedWorkers],
        relatedTools: [...c.relatedTools],
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

  submitCommand(input: ExecutiveCommandCenterInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.submitCommand(input, this.config));
  }

  queryBusinessState(input: ExecutiveCommandCenterInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.queryBusinessState(input, this.config));
  }

  accessWorkers(input: ExecutiveCommandCenterInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.accessWorkers(input, this.config));
  }

  accessTools(input: ExecutiveCommandCenterInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.accessTools(input, this.config));
  }

  accessMissions(input: ExecutiveCommandCenterInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.accessMissions(input, this.config));
  }

  accessApprovals(input: ExecutiveCommandCenterInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.accessApprovals(input, this.config));
  }

  accessExecutionMemory(input: ExecutiveCommandCenterInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.accessExecutionMemory(input, this.config));
  }

  accessDecisionMemory(input: ExecutiveCommandCenterInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.accessDecisionMemory(input, this.config));
  }

  accessExecutiveReports(input: ExecutiveCommandCenterInput = {}) {
    this.status = "aggregating";
    return this.finish(this.manager.accessExecutiveReports(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ExecutiveCommandCenterInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ExecutiveCommandCenterRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
