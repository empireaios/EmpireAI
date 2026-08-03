import type { ProductListingWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type ProductListingWorkerDependencies,
} from "./integrations.js";
import { appendPlwLog } from "./plw-logging.js";
import {
  INTEGRATION_TARGETS,
  PLW_CAPABILITIES,
  PLW_METADATA_VERSION,
  PRODUCT_LISTING_WORKER_ID,
} from "./paths.js";
import { ListingBuilder } from "./listing-builder.js";
import { ListingStore } from "./listing-store.js";
import {
  HealthMonitor,
  ListingValidator,
  RecoveryManager,
} from "./listing-validator.js";
import type {
  ApprovedImageRef,
  ApprovedProductInput,
  IntegrationHandshake,
  OperationalState,
  ProductListingReport,
  ProductListingWorkerCatalog,
  ProductListingWorkerEngineRecord,
  ProductListingWorkerInput,
  ProductListingWorkerRunReport,
} from "./types.js";

export class ListingManager {
  private engineRecord: ProductListingWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: ProductListingWorkerCatalog | null = null;
  private readonly store = new ListingStore();
  private readonly builder = new ListingBuilder();
  private readonly validator = new ListingValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingProduct: ApprovedProductInput | null = null;
  private pendingImages: ApprovedImageRef | null = null;
  private pendingContext: ProductListingWorkerInput = {};

  bindIntegrations(deps: ProductListingWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ProductListingWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedListings);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getListings() {
    return this.store.list();
  }

  getLatestListingId() {
    return this.store.getLatestListingId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: ProductListingWorkerConfiguration,
  ): ProductListingWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendPlwLog({
      event: "connect",
      details: `Product Listing Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `plw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Product Listing Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: PLW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveProductInformation(
    input: ProductListingWorkerInput,
    config: ProductListingWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_product_information", input, config, started);
    }
    const enriched = this.integrations.enrichFromImages(input);
    const product = this.builder.resolveProduct(enriched);
    if (!product.productId?.trim() && !product.productName?.trim()) {
      return this.disabled(
        "receive_product_information",
        config,
        "No approved product information received — provide approvedProduct / productId / productName",
      );
    }
    this.pendingProduct = product;
    this.pendingContext = enriched;
    const validation = this.validator.finalize(
      "pass",
      [],
      [`Received approved product information for ${product.productName ?? product.productId}`],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendPlwLog({
      event: "receive_product_information",
      details: `product=${product.productId ?? product.productName}`,
    });
    return this.report(
      "receive_product_information",
      this.getCatalog(),
      [],
      null,
      { ...validation, decision: "partial" },
      started,
    );
  }

  receiveProductImages(
    input: ProductListingWorkerInput,
    config: ProductListingWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_product_images", input, config, started);
    }
    const enriched = this.integrations.enrichFromImages({
      ...this.pendingContext,
      ...input,
    });
    const images =
      this.integrations.pullApprovedImages(enriched) ??
      this.builder.resolveImages(enriched);
    if (!images || (!images.imageReportId && !images.primaryImageUri && !images.packageId)) {
      return this.disabled(
        "receive_product_images",
        config,
        "No approved product images received — provide approvedImages / imageReportId or bind Product Image Worker",
      );
    }
    this.pendingImages = images;
    this.pendingContext = enriched;
    const validation = this.validator.finalize(
      "pass",
      [],
      [`Received approved product images (${images.imageReportId ?? images.packageId ?? "uri"})`],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendPlwLog({
      event: "receive_product_images",
      details: `imageReport=${images.imageReportId ?? "n/a"}`,
    });
    return this.report(
      "receive_product_images",
      this.getCatalog(),
      [],
      null,
      { ...validation, decision: "partial" },
      started,
    );
  }

  generateTitles(input: ProductListingWorkerInput, config: ProductListingWorkerConfiguration) {
    return this.runListing("generate_titles", input, config);
  }

  generateDescriptions(
    input: ProductListingWorkerInput,
    config: ProductListingWorkerConfiguration,
  ) {
    return this.runListing("generate_descriptions", input, config);
  }

  generateBulletPoints(
    input: ProductListingWorkerInput,
    config: ProductListingWorkerConfiguration,
  ) {
    return this.runListing("generate_bullet_points", input, config);
  }

  generateAttributes(
    input: ProductListingWorkerInput,
    config: ProductListingWorkerConfiguration,
  ) {
    return this.runListing("generate_attributes", input, config);
  }

  generateVariants(input: ProductListingWorkerInput, config: ProductListingWorkerConfiguration) {
    return this.runListing("generate_variants", input, config);
  }

  generateSeoFields(input: ProductListingWorkerInput, config: ProductListingWorkerConfiguration) {
    return this.runListing("generate_seo_fields", input, config);
  }

  validateListingFields(
    input: ProductListingWorkerInput,
    config: ProductListingWorkerConfiguration,
  ) {
    return this.runListing("validate_listing_fields", input, config);
  }

  produceListingPackage(
    input: ProductListingWorkerInput,
    config: ProductListingWorkerConfiguration,
  ) {
    return this.runListing("produce_listing_package", input, config);
  }

  produceReport(input: ProductListingWorkerInput, config: ProductListingWorkerConfiguration) {
    return this.runListing("produce_report", input, config);
  }

  submitFindings(input: ProductListingWorkerInput, config: ProductListingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_findings", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_findings",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let listings = this.store.list();
    if (input.listingId) {
      const one = this.store.get(input.listingId);
      listings = one ? [one] : [];
    }
    if (!listings.length) {
      const generated = this.runListing("produce_report", input, config);
      listings = generated.listings;
      if (!listings.length || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitFindings(listings);
    if (submission.submitted && submission.executiveReportId) {
      listings = listings.map(
        (l) => this.store.markSubmitted(l.listingId, submission.executiveReportId!) ?? l,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = listings[listings.length - 1] ?? null;
    const validation = this.validator.validateListings(
      listings.length ? listings : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) validation.warnings.push(submission.details);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    appendPlwLog({
      event: "submit_findings",
      details: `listings=${listings.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_findings",
      this.getCatalog(),
      listings,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: ProductListingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const listings = this.store.list();
    const latest = listings[listings.length - 1] ?? null;
    const validation = this.validator.validateListings(
      listings.length ? listings : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), listings, latest, validation, started);
  }

  validate(input: ProductListingWorkerInput, config: ProductListingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const listings = this.store.list();
    const latest = listings[listings.length - 1] ?? null;
    const validation = this.validator.validateListings(
      listings.length ? listings : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("validate", this.getCatalog(), listings, latest, validation, started);
  }

  diagnostics(config: ProductListingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Product Listing Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendPlwLog({ event: "diagnostics", details: `listings=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runListing(
    action: ProductListingWorkerRunReport["action"],
    input: ProductListingWorkerInput,
    config: ProductListingWorkerConfiguration,
  ): ProductListingWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.listingRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Product Listing Worker is disabled"
          : "Listing rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const enriched = this.integrations.enrichFromImages({
      ...this.pendingContext,
      ...input,
      approvedProduct: input.approvedProduct ?? this.pendingProduct ?? undefined,
      approvedImages: input.approvedImages ?? this.pendingImages ?? undefined,
    });
    const product = this.builder.resolveProduct(enriched);
    if (!product.productId?.trim() && !product.productName?.trim()) {
      return this.disabled(
        action,
        config,
        "Listing requires approved product information (approvedProduct / productId / productName)",
      );
    }
    const images =
      this.integrations.pullApprovedImages(enriched) ??
      this.builder.resolveImages(enriched) ??
      this.pendingImages;
    this.pendingProduct = product;
    this.pendingImages = images;
    this.pendingContext = enriched;

    const listing = this.builder.buildListing(enriched, config, product, images);
    this.store.save(listing, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateListings(
      [listing],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      listing,
    );
    appendPlwLog({
      event: action,
      details: `listing=${listing.listingId} marketplace=${listing.marketplace} validation=${listing.listingValidationStatus}`,
    });
    return this.report(action, this.getCatalog(), [listing], listing, validation, started);
  }

  private boundaryFail(
    action: ProductListingWorkerRunReport["action"],
    input: ProductListingWorkerInput,
    config: ProductListingWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateListings(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: ProductListingWorkerRunReport["action"],
    config: ProductListingWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: ProductListingWorkerInput) {
    return (
      input.publishListings === true ||
      input.modifySupplierInformation === true ||
      input.modifyPricing === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ309OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: ProductListingWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: ProductListingReport | null = null,
  ) {
    const listing = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `plw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PRODUCT_LISTING_WORKER_ID,
      engineVersion: "PILLOW-PLW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...PLW_CAPABILITIES],
      totalListings: this.store.count(),
      lastListingValidationStatus: listing?.listingValidationStatus ?? null,
      lastListingId: listing?.listingId ?? this.store.getLatestListingId(),
      lastMarketplace: listing?.marketplace ?? null,
      lastConfidenceScore: listing?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: PLW_METADATA_VERSION,
    };
  }

  private report(
    action: ProductListingWorkerRunReport["action"],
    catalog: ProductListingWorkerCatalog | null,
    listings: ProductListingReport[],
    latestListing: ProductListingReport | null,
    validation: ProductListingWorkerRunReport["validation"],
    started: number,
  ): ProductListingWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      listingRunReportId: `plw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      listings,
      latestListing,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PLW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: ProductListingWorkerCatalog): ProductListingWorkerCatalog {
  return {
    ...catalog,
    listings: catalog.listings.map((listing) => ({
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
        neverAutoPublished: true,
      },
      supportingEvidence: listing.supportingEvidence.map((e) => ({ ...e })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
