import type { VoiceWorkerConfiguration } from "./configuration.js";
import type { VoiceWorkerDependencies } from "./integrations.js";
import type {
  EngineStatus,
  VoiceWorkerInput,
  VoiceWorkerRunReport,
} from "./types.js";
import { VoiceManager } from "./voice-manager.js";

export class VoiceWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: VoiceWorkerRunReport | null = null;

  constructor(
    private readonly manager: VoiceManager,
    private readonly config: VoiceWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: VoiceWorkerDependencies = {}) {
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
      supportedVoiceProfiles: [...this.config.supportedVoiceProfiles],
      supportedLanguages: [...this.config.supportedLanguages],
      reportingLine: [...this.config.reportingLine],
      seedVoiceReports: this.config.seedVoiceReports.map((report) => ({
        ...report,
        narrationSegments: report.narrationSegments.map((s) => ({
          ...s,
          pronunciationHints: [...s.pronunciationHints],
        })),
        voiceGenerationSettings: {
          ...report.voiceGenerationSettings,
          pronunciationControls: [...report.voiceGenerationSettings.pronunciationControls],
        },
        voiceAssetReferences: report.voiceAssetReferences.map((a) => ({ ...a })),
        variants: report.variants.map((v) => ({ ...v })),
        configurationHistory: report.configurationHistory.map((c) => ({ ...c })),
        traceabilityRefs: [...report.traceabilityRefs],
        preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
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

  receiveApprovedScripts(input: VoiceWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedScripts(input, this.config));
  }

  prepareNarrationSegments(input: VoiceWorkerInput = {}) {
    this.status = "preparing";
    return this.finish(this.manager.prepareNarrationSegments(input, this.config));
  }

  configureVoiceGenerationSettings(input: VoiceWorkerInput = {}) {
    this.status = "configuring";
    return this.finish(this.manager.configureVoiceGenerationSettings(input, this.config));
  }

  supportMultipleVoiceProfiles(input: VoiceWorkerInput = {}) {
    this.status = "configuring";
    return this.finish(this.manager.supportMultipleVoiceProfiles(input, this.config));
  }

  supportMultipleLanguages(input: VoiceWorkerInput = {}) {
    this.status = "configuring";
    return this.finish(this.manager.supportMultipleLanguages(input, this.config));
  }

  controlPacingAndPronunciation(input: VoiceWorkerInput = {}) {
    this.status = "configuring";
    return this.finish(this.manager.controlPacingAndPronunciation(input, this.config));
  }

  generateVoiceoverAssets(input: VoiceWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateVoiceoverAssets(input, this.config));
  }

  validateVoiceQuality(input: VoiceWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateVoiceQuality(input, this.config));
  }

  generateAlternateVoiceVersions(input: VoiceWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateAlternateVoiceVersions(input, this.config));
  }

  produceVoiceReport(input: VoiceWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceVoiceReport(input, this.config));
  }

  submitReport(input: VoiceWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: VoiceWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: VoiceWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
