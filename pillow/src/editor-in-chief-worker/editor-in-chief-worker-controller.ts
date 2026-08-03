import type { EditorInChiefWorkerConfiguration } from "./configuration.js";

import type { EditorInChiefWorkerDependencies } from "./integrations.js";

import { EditorialManager } from "./editorial-manager.js";

import type {

  EngineStatus,

  EditorInChiefWorkerInput,

  EditorInChiefWorkerRunReport,

} from "./types.js";



export class EditorInChiefWorkerController {

  private status: EngineStatus = "idle";

  private latestReport: EditorInChiefWorkerRunReport | null = null;



  constructor(

    private readonly manager: EditorialManager,

    private readonly config: EditorInChiefWorkerConfiguration,

  ) {}



  initialize() {

    this.manager.ensureSeeded(this.config);

    this.status = "active";

  }



  bindIntegrations(deps: EditorInChiefWorkerDependencies = {}) {

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

      seedReports: this.config.seedReports.map((report) => ({

        ...report,

        qualityStandards: report.qualityStandards.map((s) => ({ ...s })),

        contentPriorities: [...report.contentPriorities],

        executiveRecommendations: report.executiveRecommendations.map((r) => ({ ...r })),

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



  manageEditorialDirection(input: EditorInChiefWorkerInput = {}) {

    this.status = "directing";

    return this.finish(this.manager.manageEditorialDirection(input, this.config));

  }



  defineChannelIdentity(input: EditorInChiefWorkerInput = {}) {

    this.status = "defining";

    return this.finish(this.manager.defineChannelIdentity(input, this.config));

  }



  defineTargetAudience(input: EditorInChiefWorkerInput = {}) {

    this.status = "defining";

    return this.finish(this.manager.defineTargetAudience(input, this.config));

  }



  defineEditorialTone(input: EditorInChiefWorkerInput = {}) {

    this.status = "defining";

    return this.finish(this.manager.defineEditorialTone(input, this.config));

  }



  defineContentStandards(input: EditorInChiefWorkerInput = {}) {

    this.status = "defining";

    return this.finish(this.manager.defineContentStandards(input, this.config));

  }



  definePublishingPriorities(input: EditorInChiefWorkerInput = {}) {

    this.status = "defining";

    return this.finish(this.manager.definePublishingPriorities(input, this.config));

  }



  reviewContentQuality(input: EditorInChiefWorkerInput = {}) {

    this.status = "reviewing";

    return this.finish(this.manager.reviewContentQuality(input, this.config));

  }



  ensureBrandConsistency(input: EditorInChiefWorkerInput = {}) {

    this.status = "reviewing";

    return this.finish(this.manager.ensureBrandConsistency(input, this.config));

  }



  maintainLongTermStrategy(input: EditorInChiefWorkerInput = {}) {

    this.status = "directing";

    return this.finish(this.manager.maintainLongTermStrategy(input, this.config));

  }



  approveEditorialDecisions(input: EditorInChiefWorkerInput = {}) {

    this.status = "approving";

    return this.finish(this.manager.approveEditorialDecisions(input, this.config));

  }



  produceReport(input: EditorInChiefWorkerInput = {}) {

    this.status = "reporting";

    return this.finish(this.manager.produceReport(input, this.config));

  }



  submitReport(input: EditorInChiefWorkerInput = {}) {

    this.status = "reporting";

    return this.finish(this.manager.submitReport(input, this.config));

  }



  list() {

    this.status = "active";

    return this.finish(this.manager.list(this.config));

  }



  validate(input: EditorInChiefWorkerInput = {}) {

    this.status = "validating";

    return this.finish(this.manager.validate(input, this.config));

  }



  diagnostics() {

    return this.finish(this.manager.diagnostics(this.config));

  }



  private finish(report: EditorInChiefWorkerRunReport) {

    this.latestReport = report;

    this.status = report.validation.decision === "fail" ? "failed" : "active";

    return report;

  }

}


