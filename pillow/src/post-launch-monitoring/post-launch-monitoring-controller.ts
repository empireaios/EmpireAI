import type { PostLaunchMonitoringConfiguration } from "./configuration.js";
import type { PostLaunchMonitoringDependencies } from "./integrations.js";
import { PostLaunchMonitoringManager } from "./post-launch-monitoring-manager.js";
import type { EngineStatus, PlmrtInput, PostLaunchMonitoringReport } from "./types.js";

export class PostLaunchMonitoringController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: PostLaunchMonitoringManager,
    private readonly config: PostLaunchMonitoringConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: PostLaunchMonitoringDependencies = {}) {
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

  getLatestReport(): PostLaunchMonitoringReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  verifyGrandKingAcceptanceGranted() {
    return this.manager.verifyGrandKingAcceptanceGranted();
  }

  startMonitoringSession() {
    this.status = "monitoring";
    const session = this.manager.startMonitoringSession(this.config);
    this.status = session.productionActiveMonitoring ? "active" : "standby";
    return session;
  }

  monitorWorkers() {
    this.status = "monitoring";
    const result = this.manager.monitorWorkers(this.config);
    this.status = "active";
    return result;
  }

  monitorFactories() {
    this.status = "monitoring";
    const result = this.manager.monitorFactories(this.config);
    this.status = "active";
    return result;
  }

  monitorWorkflows() {
    this.status = "monitoring";
    const result = this.manager.monitorWorkflows(this.config);
    this.status = "active";
    return result;
  }

  monitorRuntimeServices() {
    this.status = "monitoring";
    const result = this.manager.monitorRuntimeServices(this.config);
    this.status = "active";
    return result;
  }

  monitorApiIntegrations() {
    this.status = "monitoring";
    const result = this.manager.monitorApiIntegrations(this.config);
    this.status = "active";
    return result;
  }

  detectIncidents() {
    this.status = "detecting_incidents";
    const result = this.manager.detectIncidents();
    this.status = "active";
    return result;
  }

  detectAbnormalWorkerBehaviour() {
    this.status = "detecting_incidents";
    const result = this.manager.detectAbnormalWorkerBehaviour(this.config);
    this.status = "active";
    return result;
  }

  generateAlerts() {
    this.status = "generating_alerts";
    const result = this.manager.generateAlerts(this.config);
    this.status = "active";
    return result;
  }

  produceProductionHealthSummary() {
    return this.manager.produceProductionHealthSummary(this.config);
  }

  async producePostLaunchMonitoringReport(input: PlmrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.producePostLaunchMonitoringReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : report.productionActiveMonitoring ? "active" : "standby";
    return report;
  }

  async auditPostLaunch(input: PlmrtInput = {}) {
    return this.producePostLaunchMonitoringReport(input);
  }

  async submitReport(input: PlmrtInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: PlmrtInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1112ConsumableContract() {
    return this.manager.getQ1112ConsumableContract();
  }

  getMonitoringHistory(limit = 100) {
    return this.manager.getMonitoringHistory(limit);
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
