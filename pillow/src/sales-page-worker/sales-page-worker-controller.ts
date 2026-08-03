import type { SalesPageWorkerConfiguration } from "./configuration.js";
import type { SalesPageWorkerDependencies } from "./integrations.js";
import { SalesPageManager } from "./sales-page-manager.js";
import type {
  EngineStatus,
  SalesPageWorkerInput,
  SalesPageWorkerRunReport,
} from "./types.js";

export class SalesPageWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: SalesPageWorkerRunReport | null = null;

  constructor(
    private readonly manager: SalesPageManager,
    private readonly config: SalesPageWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: SalesPageWorkerDependencies = {}) {
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
      supportedPageTypes: [...this.config.supportedPageTypes],
      supportedProductTypes: [...this.config.supportedProductTypes],
      reportingLine: [...this.config.reportingLine],
      seedSalesPages: this.config.seedSalesPages.map((report) => ({
        ...report,
        landingPageStructure: report.landingPageStructure.map((s) => ({ ...s })),
        sectionsGenerated: [...report.sectionsGenerated],
        assetsReferenced: [...report.assetsReferenced],
        headlines: [...report.headlines],
        featureSections: report.featureSections.map((f) => ({ ...f })),
        pricingPresentation: report.pricingPresentation
          ? {
              ...report.pricingPresentation,
              tiers: report.pricingPresentation.tiers.map((t) => ({
                ...t,
                includes: [...t.includes],
              })),
            }
          : null,
        testimonials: report.testimonials.map((t) => ({ ...t, fabricated: false as const })),
        faqs: report.faqs.map((f) => ({ ...f })),
        ctas: report.ctas.map((c) => ({ ...c })),
        guarantees: report.guarantees.map((g) => ({ ...g })),
        exportFormats: [...report.exportFormats],
        selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
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

  receiveApprovedDigitalProductInformation(input: SalesPageWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(
      this.manager.receiveApprovedDigitalProductInformation(input, this.config),
    );
  }

  /** Alias for factory consistency — delegates to receiveApprovedDigitalProductInformation. */
  receiveApprovedDigitalProductResearch(input: SalesPageWorkerInput = {}) {
    return this.receiveApprovedDigitalProductInformation(input);
  }

  generateCompleteLandingPageStructure(input: SalesPageWorkerInput = {}) {
    this.status = "structuring";
    return this.finish(this.manager.generateCompleteLandingPageStructure(input, this.config));
  }

  generateCompellingHeadlines(input: SalesPageWorkerInput = {}) {
    this.status = "writing_headlines";
    return this.finish(this.manager.generateCompellingHeadlines(input, this.config));
  }

  generateBenefitDrivenCopy(input: SalesPageWorkerInput = {}) {
    this.status = "writing_benefits";
    return this.finish(this.manager.generateBenefitDrivenCopy(input, this.config));
  }

  generateFeatureSections(input: SalesPageWorkerInput = {}) {
    this.status = "writing_features";
    return this.finish(this.manager.generateFeatureSections(input, this.config));
  }

  generatePricingPresentation(input: SalesPageWorkerInput = {}) {
    this.status = "writing_pricing";
    return this.finish(this.manager.generatePricingPresentation(input, this.config));
  }

  generateTestimonialsOrPlaceholders(input: SalesPageWorkerInput = {}) {
    this.status = "writing_testimonials";
    return this.finish(this.manager.generateTestimonialsOrPlaceholders(input, this.config));
  }

  generateFaqSections(input: SalesPageWorkerInput = {}) {
    this.status = "writing_faqs";
    return this.finish(this.manager.generateFaqSections(input, this.config));
  }

  generateCallToActionSections(input: SalesPageWorkerInput = {}) {
    this.status = "writing_ctas";
    return this.finish(this.manager.generateCallToActionSections(input, this.config));
  }

  generateGuaranteeSections(input: SalesPageWorkerInput = {}) {
    this.status = "writing_guarantees";
    return this.finish(this.manager.generateGuaranteeSections(input, this.config));
  }

  optimizePageStructureForReadabilityAndConversion(input: SalesPageWorkerInput = {}) {
    this.status = "optimizing";
    return this.finish(
      this.manager.optimizePageStructureForReadabilityAndConversion(input, this.config),
    );
  }

  produceSalesPageReport(input: SalesPageWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceSalesPageReport(input, this.config));
  }

  submitReport(input: SalesPageWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: SalesPageWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: SalesPageWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
