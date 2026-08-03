import type { VideoAssemblyWorkerConfiguration } from "./configuration.js";
import type { VideoAssemblyWorkerDependencies } from "./integrations.js";
import { AssemblyManager } from "./assembly-manager.js";
import type {
  EngineStatus,
  VideoAssemblyWorkerInput,
  VideoAssemblyWorkerRunReport,
} from "./types.js";

export class VideoAssemblyWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: VideoAssemblyWorkerRunReport | null = null;

  constructor(
    private readonly manager: AssemblyManager,
    private readonly config: VideoAssemblyWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: VideoAssemblyWorkerDependencies = {}) {
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
      defaultAspects: [...this.config.defaultAspects],
      defaultResolutions: [...this.config.defaultResolutions],
      reportingLine: [...this.config.reportingLine],
      seedAssemblyReports: this.config.seedAssemblyReports.map((report) => ({
        ...report,
        visualAssetIds: [...report.visualAssetIds],
        creativeAssetIds: [...report.creativeAssetIds],
        sceneTimeline: report.sceneTimeline.map((s) => ({
          ...s,
          visualAssetIds: [...s.visualAssetIds],
          creativeAssetIds: [...s.creativeAssetIds],
        })),
        renderSettings: {
          ...report.renderSettings,
          aspects: [...report.renderSettings.aspects],
          resolutions: [...report.renderSettings.resolutions],
        },
        outputFormats: report.outputFormats.map((f) => ({ ...f })),
        qualityValidation: { ...report.qualityValidation },
        finalVideoReference: {
          ...report.finalVideoReference,
          formats: report.finalVideoReference.formats.map((f) => ({ ...f })),
        },
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

  receiveApprovedScripts(input: VideoAssemblyWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedScripts(input, this.config));
  }

  receiveApprovedVoiceAssets(input: VideoAssemblyWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedVoiceAssets(input, this.config));
  }

  receiveApprovedVisualAssets(input: VideoAssemblyWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedVisualAssets(input, this.config));
  }

  receiveApprovedCreativeAssets(input: VideoAssemblyWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedCreativeAssets(input, this.config));
  }

  receiveApprovedMusicAssets(input: VideoAssemblyWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedMusicAssets(input, this.config));
  }

  synchronizeNarrationAndVisuals(input: VideoAssemblyWorkerInput = {}) {
    this.status = "synchronizing";
    return this.finish(this.manager.synchronizeNarrationAndVisuals(input, this.config));
  }

  applySceneTransitions(input: VideoAssemblyWorkerInput = {}) {
    this.status = "assembling";
    return this.finish(this.manager.applySceneTransitions(input, this.config));
  }

  applyMotionEffects(input: VideoAssemblyWorkerInput = {}) {
    this.status = "assembling";
    return this.finish(this.manager.applyMotionEffects(input, this.config));
  }

  produceMultipleOutputResolutions(input: VideoAssemblyWorkerInput = {}) {
    this.status = "rendering";
    return this.finish(this.manager.produceMultipleOutputResolutions(input, this.config));
  }

  validateRenderingQuality(input: VideoAssemblyWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateRenderingQuality(input, this.config));
  }

  produceVideoAssemblyReport(input: VideoAssemblyWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceVideoAssemblyReport(input, this.config));
  }

  submitReport(input: VideoAssemblyWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: VideoAssemblyWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: VideoAssemblyWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
