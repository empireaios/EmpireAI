import type { MissionCoordinationEngineConfiguration } from "./configuration.js";
import { MissionCoordinationEngineCore } from "./mission-coordination-engine-core.js";
import type {
  EngineStatus,
  MissionCoordinationEngineInput,
  MissionCoordinationEngineRunReport,
} from "./types.js";

export class MissionCoordinationEngineController {
  private status: EngineStatus = "idle";
  private latestReport: MissionCoordinationEngineRunReport | null = null;

  constructor(
    private readonly manager: MissionCoordinationEngineCore,
    private readonly config: MissionCoordinationEngineConfiguration,
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
      missionStates: [...this.config.missionStates],
      missionPhases: [...this.config.missionPhases],
      seedMissions: this.config.seedMissions.map((r) => ({
        ...r,
        assignedWorkers: [...r.assignedWorkers],
        blockers: [...r.blockers],
        phaseHistory: [...r.phaseHistory],
        dependencies: r.dependencies.map((d) => ({
          ...d,
          dependsOn: [...d.dependsOn],
        })),
        approvalCheckpoints: r.approvalCheckpoints.map((c) => ({ ...c })),
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

  receivePlan(input: MissionCoordinationEngineInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.receivePlan(input, this.config));
  }

  create(input: MissionCoordinationEngineInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.create(input, this.config));
  }

  advancePhase(input: MissionCoordinationEngineInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.advancePhase(input, this.config));
  }

  trackDependencies(input: MissionCoordinationEngineInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.trackDependencies(input, this.config));
  }

  handleApproval(input: MissionCoordinationEngineInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.handleApproval(input, this.config));
  }

  detectBlocked(input: MissionCoordinationEngineInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.detectBlocked(input, this.config));
  }

  detectStalled(input: MissionCoordinationEngineInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.detectStalled(input, this.config));
  }

  complete(input: MissionCoordinationEngineInput = {}) {
    this.status = "coordinating";
    return this.finish(this.manager.complete(input, this.config));
  }

  close(input: MissionCoordinationEngineInput = {}) {
    this.status = "closing";
    return this.finish(this.manager.close(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: MissionCoordinationEngineInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: MissionCoordinationEngineRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
