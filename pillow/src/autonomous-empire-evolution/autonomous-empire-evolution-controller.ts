import type { AutonomousEmpireEvolutionConfiguration } from "./configuration.js";
import { AutonomousEmpireEvolutionManager } from "./autonomous-empire-evolution-manager.js";
import type { AutonomousEmpireEvolutionInput, AutonomousEmpireEvolutionRunReport, EngineStatus } from "./types.js";

export class AutonomousEmpireEvolutionController {
  private status: EngineStatus = "idle";
  private latestReport: AutonomousEmpireEvolutionRunReport | null = null;

  constructor(
    private readonly manager: AutonomousEmpireEvolutionManager,
    private readonly config: AutonomousEmpireEvolutionConfiguration,
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
    return { ...this.config };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  run(action: string, input: AutonomousEmpireEvolutionInput = {}) {
    this.status = action.includes("evaluat")
      ? "evaluating"
      : action.includes("detect")
        ? "detecting"
        : action.includes("simulat")
          ? "simulating"
          : action.includes("rank")
            ? "ranking"
            : action.includes("recommend")
              ? "recommending"
              : action.includes("track")
                ? "tracking"
                : "active";
    return this.finish(this.manager.run(action, input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: AutonomousEmpireEvolutionRunReport) {
    this.latestReport = report;
    this.status = "active";
    return report;
  }
}
