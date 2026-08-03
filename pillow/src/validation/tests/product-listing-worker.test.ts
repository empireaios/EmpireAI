import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  LISTING_VALIDATION_STATUSES,
  PLW_CAPABILITIES,
  PLW_INTEGRATION_TARGETS,
  PLW_METADATA_VERSION,
  PRODUCT_LISTING_REPORT_VERSION,
  buildProductListingWorkerConfiguration,
  createProductListingWorker,
  resetProductListingWorkerForTesting,
} from "../../product-listing-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createProductListingWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createProductListingWorker(bootstrap, config);
  await engine.initialize();
  engine.connectProductListingWorker();
  return engine;
}

const sampleInput = {
  marketplace: "amazon",
  approvedProduct: {
    productId: "prod-bamboo-desk-organizer",
    productName: "Bamboo Desk Organizer",
    category: "home_goods",
    brand: "EmpireAI Essentials",
    keyFeatures: [
      "Compact multi-compartment layout",
      "Natural bamboo finish",
      "Cable pass-through slot",
      "Non-slip base pads",
    ],
    materials: ["bamboo", "felt"],
    dimensions: "12 x 8 x 4 in",
    colorOptions: ["natural", "walnut"],
    sizeOptions: ["standard"],
    targetKeywords: ["bamboo desk organizer", "desktop storage"],
    searchTerms: ["office organizer", "desk tidy"],
    supplierId: "sup-shenzhen-bamboo-co",
    supplierName: "Shenzhen Bamboo Co",
    evaluationId: "sew-eval-bamboo-01",
    discoveryId: "sdw-discovery-bamboo-01",
    businessMissionId: "cmf-cbm-commerce-01",
  },
  approvedImages: {
    imageReportId: "piw-img-bamboo-01",
    packageId: "piw-pkg-bamboo-01",
    primaryImageUri: "derived://product-image/prod-bamboo-desk-organizer/src-img-primary/optimized",
    galleryImageUris: [
      "derived://product-image/prod-bamboo-desk-organizer/src-img-gallery-1/optimized",
    ],
    imageQualityStatus: "pass",
    complianceStatus: "compliant",
  },
  evidenceSources: [
    {
      source: "product_image_worker",
      claim: "Listing linked to approved Product Image Report piw-img-bamboo-01",
      kind: "fact",
      relatedTopic: "images",
    },
  ],
  validated: true,
};

describe("Q3-08 Product Listing Worker", () => {
  beforeEach(resetProductListingWorkerForTesting);

  test("1 locks mandatory product-listing-worker boundaries", () => {
    const c = buildProductListingWorkerConfiguration(REPO_ROOT, {
      neverPublishListings: false as never,
      neverModifySupplierInformation: false as never,
      neverModifyPricing: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ309OrLater: false as never,
    });
    assert.equal(c.neverPublishListings, true);
    assert.equal(c.neverModifySupplierInformation, true);
    assert.equal(c.neverModifyPricing, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ309OrLater, true);
  });

  test("2 initializes PILLOW-PLW-001 for Q3-08 with image + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-08");
    assert.equal(state.engineVersion, "PILLOW-PLW-001");
    assert.equal(state.configuration.workerId, "wkr-product-listing-01");
    for (const target of PLW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const status of LISTING_VALIDATION_STATUSES) {
      assert.ok(typeof status === "string");
    }
    assert.ok(PLW_CAPABILITIES.includes("generate_product_titles"));
  });

  test("3 receives approved product information and images", async () => {
    const engine = await build();
    const product = engine.receiveApprovedProductInformation(sampleInput);
    const images = engine.receiveApprovedProductImages(sampleInput);
    assert.equal(product.action, "receive_product_information");
    assert.equal(images.action, "receive_product_images");
  });

  test("4 generates titles, descriptions, and bullet points", async () => {
    const engine = await build();
    const titles = engine.generateProductTitles(sampleInput);
    const descriptions = engine.generateProductDescriptions(sampleInput);
    const bullets = engine.generateProductBulletPoints(sampleInput);
    assert.ok(titles.latestListing!.productTitle.includes("Bamboo Desk Organizer"));
    assert.ok(descriptions.latestListing!.productDescription.length > 40);
    assert.ok(bullets.latestListing!.bulletPoints.length >= 3);
  });

  test("5 generates attributes, variants, and SEO fields", async () => {
    const engine = await build();
    const attributes = engine.generateProductAttributes(sampleInput);
    const variants = engine.generateProductVariants(sampleInput);
    const seo = engine.generateMarketplaceSeoFields(sampleInput);
    assert.ok(attributes.latestListing!.attributes.some((a) => a.key === "brand"));
    assert.ok(variants.latestListing!.variants.length >= 1);
    assert.ok(seo.latestListing!.seoFields.metaTitle);
    assert.ok(seo.latestListing!.seoFields.searchTerms.length >= 1);
  });

  test("6 validates listing fields and produces marketplace package", async () => {
    const engine = await build();
    const validated = engine.validateRequiredListingFields(sampleInput);
    const packaged = engine.produceMarketplaceListingPackage(sampleInput);
    assert.equal(validated.latestListing!.listingValidationStatus, "pass");
    assert.ok(packaged.latestListing!.listingPackage.packageId.startsWith("plw-pkg-"));
    assert.equal(packaged.latestListing!.listingPackage.neverAutoPublished, true);
    assert.equal(packaged.latestListing!.marketplace, "amazon");
  });

  test("7 produces machine-readable Product Listing Report with required fields", async () => {
    const report = (await build()).produceProductListingReport(sampleInput);
    const latest = report.latestListing!;
    assert.ok(latest.listingId.startsWith("plw-lst-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.productId, "prod-bamboo-desk-organizer");
    assert.equal(latest.marketplace, "amazon");
    assert.ok(latest.productTitle);
    assert.ok(latest.productDescription);
    assert.ok(latest.bulletPoints.length >= 1);
    assert.ok(latest.attributes.length >= 1);
    assert.ok(latest.variants.length >= 1);
    assert.ok(latest.seoFields.metaTitle);
    assert.ok(latest.listingValidationStatus);
    assert.ok(latest.listingPackage.packageId);
    assert.equal(latest.metadataVersion, PLW_METADATA_VERSION);
    assert.equal(latest.reportVersion, PRODUCT_LISTING_REPORT_VERSION);
    assert.equal(latest.supplierId, "sup-shenzhen-bamboo-co");
    assert.equal(latest.imageReportId, "piw-img-bamboo-01");
  });

  test("8 marks incomplete listings as fail validation", async () => {
    const report = (await build()).produceProductListingReport({
      marketplace: "amazon",
      productId: "prod-incomplete",
      productName: "Incomplete Product",
      validated: true,
    });
    assert.ok(["fail", "review"].includes(report.latestListing!.listingValidationStatus));
    assert.ok(report.latestListing!.listingValidationStatus !== "pass");
  });

  test("9 rejects publish / modify-supplier / modify-pricing / override / Q3-09 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { publishListings: true },
      { modifySupplierInformation: true },
      { modifyPricing: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ309OrLater: true },
    ] as const) {
      const report = engine.produceProductListingReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestListing, null);
    }
  });

  test("10 submits findings through ERR and preserves audit / cockpit boundaries", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createProductListingWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-plw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectProductListingWorker();
    const produced = engine.produceProductListingReport(sampleInput);
    const submitted = engine.submitFindings({
      listingId: produced.latestListing!.listingId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-08"]);
    assert.equal(submitted.latestListing!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestListing!.executiveReportId, "ert-worker-plw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-08");
    assert.equal(cockpit.neverPublishListings, true);
    assert.equal(cockpit.neverModifyPricing, true);
  });
});
