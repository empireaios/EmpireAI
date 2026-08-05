import type { MissionPlanningEngineConfiguration } from "./configuration.js";
import type { MissionPlanningEngineDependencies } from "./integrations.js";
import { MissionPlanningEngineManager } from "./mission-planning-engine-manager.js";
import type { MpengInput } from "./types.js";

export class MissionPlanningEngineController {
  private status: import("./types.js").EngineStatus = "idle";

  constructor(
    private readonly manager: MissionPlanningEngineManager,
    private readonly config: MissionPlanningEngineConfiguration,
  ) {}

  initialize() {
    this.status = "standby";
  }

  bindIntegrations(deps: MissionPlanningEngineDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getConfiguration() {
    return this.config;
  }

  getStatus() {
    return this.status;
  }

  getLatestReport() {
    return this.manager.getLatestReport();
  }

  getLatestPlan() {
    return this.manager.getLatestPlan();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "connected";
    return handshakes;
  }

  analyseApprovedMission(input: MpengInput = {}) {
    this.status = "planning";
    const result = this.manager.analyseApprovedMission(input);
    this.status = "active";
    return result;
  }

  consumeRepositoryIntelligence() {
    this.status = "planning";
    const result = this.manager.consumeRepositoryIntelligence();
    this.status = "active";
    return result;
  }

  identifyImplementationDependencies(input: MpengInput = {}) {
    return this.manager.identifyImplementationDependencies(input);
  }

  determineExecutionSequence() {
    return this.manager.determineExecutionSequence();
  }

  identifyIntegrationPoints() {
    return this.manager.identifyIntegrationPoints();
  }

  produceValidationStrategy(input: MpengInput = {}) {
    return this.manager.produceValidationStrategy(input);
  }

  produceAcceptanceCriteria(input: MpengInput = {}) {
    return this.manager.produceAcceptanceCriteria(input);
  }

  estimateImplementationRisks() {
    return this.manager.estimateImplementationRisks();
  }

  generateMissionPlan(input: MpengInput = {}) {
    this.status = "planning";
    const plan = this.manager.generateMissionPlan(input);
    this.status = "active";
    return plan;
  }

  produceMissionPlanningReport(input: MpengInput = {}) {
    this.status = "reporting";
    return this.manager.produceMissionPlanningReport(input, this.config).then((report) => {
      this.status = report.validation.decision === "failed" ? "failed" : "active";
      return report;
    });
  }

  submitReport(input: MpengInput = {}) {
    return this.manager.submitReport(input, this.config);
  }

  validate(input: MpengInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = result.decision === "failed" ? "failed" : "active";
    return result;
  }

  runDiagnostics() {
    return this.manager.diagnostics(this.config);
  }

  getQ1304ConsumableContract() {
    return this.manager.getQ1304ConsumableContract();
  }

  list() {
    return this.manager.getReports();
  }

  getPlanningHistory() {
    return this.manager.getPlanningHistory();
  }
}
