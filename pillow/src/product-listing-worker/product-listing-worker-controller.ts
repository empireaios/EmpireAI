import type { ProductListingWorkerConfiguration } from "./configuration.js";
import type { ProductListingWorkerDependencies } from "./integrations.js";
import { ListingManager } from "./listing-manager.js";
import type {
  EngineStatus,
  ProductListingWorkerInput,
  ProductListingWorkerRunReport,
} from "./types.js";

export class ProductListingWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: ProductListingWorkerRunReport | null = null;

  constructor(
    private readonly manager: ListingManager,
    private readonly config: ProductListingWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ProductListingWorkerDependencies = {}) {
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
      marketplaceTargets: [...this.config.marketplaceTargets],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedListings: this.config.seedListings.map((listing) => ({
        ...listing,
        bulletPoints: [...listing.bulletPoints],
        attributes: listing.attributes.map((a) => ({ ...a })),
        variants: listing.variants.map((v) => ({
          ...v,
          attributes: v.attributes.map((a) => ({ ...a })),
        })),
        seoFields: {
          ...listing.seoFields,
          searchTerms: [...listing.seoFields.searchTerms],
          backendKeywords: [...listing.seoFields.backendKeywords],
        },
        listingPackage: {
          ...listing.listingPackage,
          fields: { ...listing.listingPackage.fields },
          imageRefs: [...listing.listingPackage.imageRefs],
          neverAutoPublished: true as const,
        },
        supportingEvidence: listing.supportingEvidence.map((e) => ({ ...e })),
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

  receiveProductInformation(input: ProductListingWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveProductInformation(input, this.config));
  }

  receiveProductImages(input: ProductListingWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveProductImages(input, this.config));
  }

  generateTitles(input: ProductListingWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateTitles(input, this.config));
  }

  generateDescriptions(input: ProductListingWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateDescriptions(input, this.config));
  }

  generateBulletPoints(input: ProductListingWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateBulletPoints(input, this.config));
  }

  generateAttributes(input: ProductListingWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateAttributes(input, this.config));
  }

  generateVariants(input: ProductListingWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateVariants(input, this.config));
  }

  generateSeoFields(input: ProductListingWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateSeoFields(input, this.config));
  }

  validateListingFields(input: ProductListingWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateListingFields(input, this.config));
  }

  produceListingPackage(input: ProductListingWorkerInput = {}) {
    this.status = "packaging";
    return this.finish(this.manager.produceListingPackage(input, this.config));
  }

  produceReport(input: ProductListingWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: ProductListingWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ProductListingWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ProductListingWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
