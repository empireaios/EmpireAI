import type { PerformanceAuditConfiguration } from "./configuration.js";
import type { PerformanceAuditDependencies } from "./integrations.js";
import { PerformanceAuditManager } from "./performance-audit-manager.js";
import type { PerfartInput, PerformanceAuditReport, EngineStatus } from "./types.js";

export class PerformanceAuditController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: PerformanceAuditManager,
    private readonly config: PerformanceAuditConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: PerformanceAuditDependencies = {}) {
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

  getLatestReport(): PerformanceAuditReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  discoverPerformanceComponents() {
    this.status = "discovering_performance_components";
    const result = this.manager.discoverPerformanceComponents(this.config);
    this.status = "active";
    return result;
  }

  executeWorkloadBenchmarks() {
    this.status = "executing_workload_benchmarks";
    const result = this.manager.executeWorkloadBenchmarks(this.config);
    this.status = "active";
    return result;
  }

  measureResponseTimes() {
    this.status = "measuring_response_times";
    const result = this.manager.measureResponseTimes(this.config);
    this.status = "active";
    return result;
  }

  async measureThroughput() {
    this.status = "measuring_throughput";
    const result = await this.manager.measureThroughput(this.config);
    this.status = "active";
    return result;
  }

  async measureResourceUtilisation() {
    this.status = "measuring_resource_utilisation";
    const result = await this.manager.measureResourceUtilisation(this.config);
    this.status = "active";
    return result;
  }

  async measureScalability() {
    this.status = "measuring_scalability";
    const result = await this.manager.measureScalability(this.config);
    this.status = "active";
    return result;
  }

  verifySustainedStability() {
    this.status = "verifying_sustained_stability";
    const result = this.manager.verifySustainedStability(this.config);
    this.status = "active";
    return result;
  }

  verifyIntegrations() {
    return this.manager.verifyIntegrations();
  }

  async detectBottlenecks() {
    this.status = "detecting_bottlenecks";
    const result = await this.manager.detectBottlenecks(this.config);
    this.status = "active";
    return result;
  }

  async classifyPerformanceReadiness() {
    this.status = "classifying_performance_readiness";
    const result = await this.manager.buildAssessments(this.config);
    this.status = "active";
    return result;
  }

  async producePerformanceReadinessFindings(input: PerfartInput = {}) {
    this.status = "classifying_performance_readiness";
    const result = await this.manager.producePerformanceReadinessFindings(input, this.config);
    this.status = "active";
    return result;
  }

  async produceReport(input: PerfartInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  async submitReport(input: PerfartInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: PerfartInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1107ConsumableContract() {
    return this.manager.getQ1107ConsumableContract();
  }

  getPerformanceMatrix() {
    return this.manager.getPerformanceMatrix();
  }

  getBenchmarkHistory(limit = 100) {
    return this.manager.getBenchmarkHistory(limit);
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
