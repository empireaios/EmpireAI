import type { EmailFunnelWorkerConfiguration } from "./configuration.js";
import type { EmailFunnelWorkerDependencies } from "./integrations.js";
import { FunnelManager } from "./funnel-manager.js";
import type { EfwInput, EngineStatus } from "./types.js";

export class EmailFunnelWorkerController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: FunnelManager,
    private configuration: EmailFunnelWorkerConfiguration,
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

  bindIntegrations(deps: EmailFunnelWorkerDependencies = {}) {
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
    fn: () => ReturnType<FunnelManager["generateLeadMagnet"]>,
  ) {
    this.status = status;
    try {
      return fn();
    } finally {
      this.status = "active";
    }
  }

  consumeAffiliateOpportunityReport(input: EfwInput = {}) {
    return this.run("consuming_opportunity", () =>
      this.manager.consumeAffiliateOpportunityReport(input, this.configuration),
    );
  }

  consumeSeoContentReport(input: EfwInput = {}) {
    return this.run("consuming_seo", () =>
      this.manager.consumeSeoContentReport(input, this.configuration),
    );
  }

  generateLeadMagnet(input: EfwInput = {}) {
    return this.run("generating_lead_magnet", () =>
      this.manager.generateLeadMagnet(input, this.configuration),
    );
  }

  generateEmailCaptureStrategy(input: EfwInput = {}) {
    return this.run("generating_capture_strategy", () =>
      this.manager.generateEmailCaptureStrategy(input, this.configuration),
    );
  }

  defineFunnelStages(input: EfwInput = {}) {
    return this.run("defining_stages", () =>
      this.manager.defineFunnelStages(input, this.configuration),
    );
  }

  generateWelcomeSequence(input: EfwInput = {}) {
    return this.run("generating_welcome_sequence", () =>
      this.manager.generateWelcomeSequence(input, this.configuration),
    );
  }

  generateNurtureSequence(input: EfwInput = {}) {
    return this.run("generating_nurture_sequence", () =>
      this.manager.generateNurtureSequence(input, this.configuration),
    );
  }

  generateCallToActionStrategy(input: EfwInput = {}) {
    return this.run("generating_cta_strategy", () =>
      this.manager.generateCallToActionStrategy(input, this.configuration),
    );
  }

  produceEmailFunnelReport(input: EfwInput = {}) {
    return this.run("reporting", () =>
      this.manager.produceEmailFunnelReport(input, this.configuration),
    );
  }

  produceReport(input: EfwInput = {}) {
    return this.produceEmailFunnelReport(input);
  }

  submitReport(input: EfwInput = {}) {
    return this.run("reporting", () => this.manager.submitReport(input, this.configuration));
  }

  list() {
    return this.manager.list();
  }

  validate(input: EfwInput = {}) {
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
