import type { AnalyticsWorkerConfiguration } from "./configuration.js";
import type { AnalyticsWorkerDependencies } from "./integrations.js";
import { AnalyticsManager } from "./analytics-manager.js";
import type { AnwInput, EngineStatus } from "./types.js";

export class AnalyticsWorkerController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: AnalyticsManager,
    private configuration: AnalyticsWorkerConfiguration,
  ) {}

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return this.configuration;
  }

  getStatus() {
    return this.status;
  }

  getLatestReport() {
    return this.manager.getStore().getLatestReport();
  }

  initialize() {
    this.manager.initialize(this.configuration);
    this.status = "idle";
  }

  bindIntegrations(deps: AnalyticsWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    const result = this.manager.connect(this.configuration);
    this.status = "active";
    void input;
    return result;
  }

  private run(
    status: EngineStatus,
    fn: () => ReturnType<AnalyticsManager["trackClicks"]>,
  ) {
    this.status = status;
    try {
      return fn();
    } finally {
      this.status = "active";
    }
  }

  collectPerformanceMetrics(input: AnwInput = {}) {
    return this.run("collecting_metrics", () =>
      this.manager.collectPerformanceMetrics(input, this.configuration),
    );
  }

  trackClicks(input: AnwInput = {}) {
    return this.run("tracking_clicks", () =>
      this.manager.trackClicks(input, this.configuration),
    );
  }

  trackConversions(input: AnwInput = {}) {
    return this.run("tracking_conversions", () =>
      this.manager.trackConversions(input, this.configuration),
    );
  }

  trackCommissions(input: AnwInput = {}) {
    return this.run("tracking_commissions", () =>
      this.manager.trackCommissions(input, this.configuration),
    );
  }

  measureSeoPerformance(input: AnwInput = {}) {
    return this.run("measuring_seo", () =>
      this.manager.measureSeoPerformance(input, this.configuration),
    );
  }

  analyseFunnelPerformance(input: AnwInput = {}) {
    return this.run("analysing_funnel", () =>
      this.manager.analyseFunnelPerformance(input, this.configuration),
    );
  }

  detectTrends(input: AnwInput = {}) {
    return this.run("detecting_trends", () =>
      this.manager.detectTrends(input, this.configuration),
    );
  }

  recommendOptimisations(input: AnwInput = {}) {
    return this.run("recommending_optimisations", () =>
      this.manager.recommendOptimisations(input, this.configuration),
    );
  }

  produceAnalyticsReport(input: AnwInput = {}) {
    return this.run("reporting", () =>
      this.manager.produceAnalyticsReport(input, this.configuration),
    );
  }

  produceReport(input: AnwInput = {}) {
    return this.produceAnalyticsReport(input);
  }

  submitReport(input: AnwInput = {}) {
    return this.run("reporting", () => this.manager.submitReport(input, this.configuration));
  }

  list() {
    return this.manager.list();
  }

  validate(input: AnwInput = {}) {
    this.status = "validating";
    try {
      return this.manager.validate(input, this.configuration);
    } finally {
      this.status = "active";
    }
  }

  diagnostics() {
    return this.manager.diagnostics();
  }

  runDiagnostics() {
    return this.manager.runDiagnostics();
  }
}
