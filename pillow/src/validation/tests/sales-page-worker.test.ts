import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  SPW_CAPABILITIES,
  SPW_INTEGRATION_TARGETS,
  SPW_METADATA_VERSION,
  SPW_PAGE_TYPES,
  SALES_PAGE_WORKER_REPORT_VERSION,
  buildSalesPageWorkerConfiguration,
  createSalesPageWorker,
  resetSalesPageWorkerForTesting,
} from "../../sales-page-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(options?: Parameters<typeof createSalesPageWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSalesPageWorker(bootstrap, options);
  await engine.initialize();
  engine.connect();
  return engine;
}

const productInput = {
  researchReportId: "dpr-rsh-001",
  opportunityId: "dpr-opp-001",
  businessId: "dbiz-sales-01",
  factoryMissionId: "dpf-dpm-sales-01",
  productTitle: "Freelancer Client Onboarding Toolkit",
  productType: "product_landing_page" as const,
  pageType: "product_landing_page" as const,
  targetAudience: "Solo freelancers and consultants",
  validated: true,
};

const fullInput = {
  ...productInput,
  validated: true,
};

describe("Q5-08 Sales Page Worker", () => {
  beforeEach(resetSalesPageWorkerForTesting);

  test("1 locks mandatory sales-page-worker boundaries", () => {
    const c = buildSalesPageWorkerConfiguration(REPO_ROOT, {
      neverProcessPayments: false as never,
      neverDeliverProducts: false as never,
      neverPublishWebsites: false as never,
      neverPublishPagesDirectly: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ509OrLater: false as never,
      neverFabricateTestimonials: false as never,
      followApprovedProductInformation: false as never,
    });
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverDeliverProducts, true);
    assert.equal(c.neverPublishWebsites, true);
    assert.equal(c.neverPublishPagesDirectly, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ509OrLater, true);
    assert.equal(c.neverFabricateTestimonials, true);
    assert.equal(c.followApprovedProductInformation, true);
  });

  test("2 initializes PILLOW-SPW-001 for Q5-08 with DPF + Design Worker integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q5-08");
    assert.equal(state.engineVersion, "PILLOW-SPW-001");
    assert.equal(state.configuration.workerId, "wkr-sales-page-01");
    for (const target of SPW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(state.configuration.integrationTargets.includes("digital_products_factory_core"));
    assert.ok(state.configuration.integrationTargets.includes("design_worker"));
    for (const type of SPW_PAGE_TYPES) {
      assert.ok(state.configuration.supportedPageTypes.includes(type));
    }
    assert.ok(SPW_CAPABILITIES.includes("receive_approved_digital_product_information"));
    assert.ok(SPW_CAPABILITIES.includes("produce_machine_readable_sales_page_reports"));
  });

  test("3 receives approved digital product information", async () => {
    const report = (await build()).receiveApprovedDigitalProductInformation(productInput);
    assert.equal(report.action, "receive_approved_digital_product_information");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestSalesPage!.researchReportId, "dpr-rsh-001");
    assert.equal(report.latestSalesPage!.opportunityId, "dpr-opp-001");
    assert.ok(report.latestSalesPage!.salesPageId.startsWith("spw-spg-"));
  });

  test("4 generates landing page structure and headlines", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    const structure = engine.generateCompleteLandingPageStructure(fullInput);
    assert.equal(structure.action, "generate_complete_landing_page_structure");
    assert.ok(structure.latestSalesPage!.landingPageStructure.length >= 1);

    const headlines = engine.generateCompellingHeadlines(fullInput);
    assert.equal(headlines.action, "generate_compelling_headlines");
    assert.ok(headlines.latestSalesPage!.headline.length > 0);
  });

  test("5 generates benefit copy, features, pricing, and multiple page types", async () => {
    assert.ok(SPW_PAGE_TYPES.includes("product_landing_page"));
    assert.ok(SPW_PAGE_TYPES.includes("course_sales_page"));
    assert.ok(SPW_PAGE_TYPES.includes("ebook_sales_page"));

    const engine = await build();
    engine.receiveApprovedDigitalProductInformation({
      ...productInput,
      productType: "product_landing_page",
    });
    engine.generateCompleteLandingPageStructure({
      ...fullInput,
      productType: "product_landing_page",
    });
    engine.generateCompellingHeadlines({ ...fullInput, productType: "product_landing_page" });
    const benefits = engine.generateBenefitDrivenCopy({
      ...fullInput,
      productType: "product_landing_page",
    });
    assert.equal(benefits.action, "generate_benefit_driven_copy");
    assert.ok(benefits.latestSalesPage!.benefitCopy.length > 0);

    const features = engine.generateFeatureSections({
      ...fullInput,
      productType: "product_landing_page",
    });
    assert.equal(features.action, "generate_feature_sections");
    assert.ok(features.latestSalesPage!.featureSections.length >= 1);

    const pricing = engine.generatePricingPresentation({
      ...fullInput,
      productType: "product_landing_page",
    });
    assert.equal(pricing.action, "generate_pricing_presentation");
    assert.ok(pricing.latestSalesPage!.pricingPresentation);
    assert.ok(pricing.latestSalesPage!.pricingPresentation!.tiers.length >= 1);

    resetSalesPageWorkerForTesting();
    const courseEngine = await build();
    const received = courseEngine.receiveApprovedDigitalProductInformation({
      researchReportId: "dpr-rsh-course-01",
      opportunityId: "dpr-opp-course-01",
      businessId: "dbiz-course-sales-01",
      factoryMissionId: "dpf-dpm-course-sales-01",
      productTitle: "Freelancer Onboarding Course",
      productType: "course_sales_page",
      targetAudience: "Course creators and freelancers",
      validated: true,
    });
    assert.equal(received.latestSalesPage!.productType, "course_sales_page");
    courseEngine.generateCompleteLandingPageStructure({
      productType: "course_sales_page",
      productTitle: "Freelancer Onboarding Course",
      validated: true,
    });
    const courseHeadlines = courseEngine.generateCompellingHeadlines({
      productType: "course_sales_page",
      validated: true,
    });
    assert.equal(courseHeadlines.latestSalesPage!.productType, "course_sales_page");
    assert.ok(courseHeadlines.latestSalesPage!.headline.length > 0);
  });

  test("6 generates testimonials placeholders, FAQs, CTAs, and guarantees", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateCompleteLandingPageStructure(fullInput);
    engine.generateCompellingHeadlines(fullInput);
    engine.generateBenefitDrivenCopy(fullInput);
    engine.generateFeatureSections(fullInput);
    engine.generatePricingPresentation(fullInput);

    const testimonials = engine.generateTestimonialsOrPlaceholders(fullInput);
    assert.equal(testimonials.action, "generate_testimonials_or_placeholders");
    assert.ok(testimonials.latestSalesPage!.testimonials.length >= 1);
    assert.ok(
      testimonials.latestSalesPage!.testimonials.every(
        (t) => t.fabricated === false || t.approved === true || /placeholder/i.test(t.quote),
      ),
    );

    const faqs = engine.generateFaqSections(fullInput);
    assert.equal(faqs.action, "generate_faq_sections");
    assert.ok(faqs.latestSalesPage!.faqs.length >= 1);

    const ctas = engine.generateCallToActionSections(fullInput);
    assert.equal(ctas.action, "generate_call_to_action_sections");
    assert.ok(ctas.latestSalesPage!.ctas.length >= 1);
    assert.ok(ctas.latestSalesPage!.ctaSummary.length > 0);

    const guarantees = engine.generateGuaranteeSections(fullInput);
    assert.equal(guarantees.action, "generate_guarantee_sections");
    assert.ok(guarantees.latestSalesPage!.guarantees.length >= 1);
  });

  test("7 optimizes page structure for readability and conversion", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateCompleteLandingPageStructure(fullInput);
    engine.generateCompellingHeadlines(fullInput);
    engine.generateBenefitDrivenCopy(fullInput);
    engine.generateFeatureSections(fullInput);
    engine.generatePricingPresentation(fullInput);
    engine.generateTestimonialsOrPlaceholders(fullInput);
    engine.generateFaqSections(fullInput);
    engine.generateCallToActionSections(fullInput);
    engine.generateGuaranteeSections(fullInput);

    const optimized = engine.optimizePageStructureForReadabilityAndConversion(fullInput);
    assert.equal(optimized.action, "optimize_page_structure_for_readability_and_conversion");
    assert.equal(optimized.latestSalesPage!.readabilityOptimized, true);
    assert.equal(optimized.latestSalesPage!.conversionOptimized, true);
    assert.ok(optimized.latestSalesPage!.qualityReview.length > 0);
    assert.ok(optimized.latestSalesPage!.confidenceScore > 0);
  });

  test("8 produces Sales Page Report with all required fields", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateCompleteLandingPageStructure(fullInput);
    engine.generateCompellingHeadlines(fullInput);
    engine.generateBenefitDrivenCopy(fullInput);
    engine.generateFeatureSections(fullInput);
    engine.generatePricingPresentation(fullInput);
    engine.generateTestimonialsOrPlaceholders(fullInput);
    engine.generateFaqSections(fullInput);
    engine.generateCallToActionSections(fullInput);
    engine.generateGuaranteeSections(fullInput);
    engine.optimizePageStructureForReadabilityAndConversion(fullInput);

    const report = engine.produceSalesPageReport(fullInput);
    const latest = report.latestSalesPage!;
    assert.ok(latest.salesPageId.startsWith("spw-spg-"));
    assert.ok(latest.timestamp);
    assert.ok(latest.productId.startsWith("spw-prd-") || latest.productId.length > 0);
    assert.ok(latest.productTitle.length > 0);
    assert.ok(Array.isArray(latest.landingPageStructure));
    assert.ok(latest.landingPageStructure.length >= 1);
    assert.ok(latest.headline.length > 0);
    assert.ok(latest.ctaSummary.length > 0);
    assert.ok(Array.isArray(latest.sectionsGenerated));
    assert.ok(latest.sectionsGenerated.length >= 1);
    assert.ok(Array.isArray(latest.assetsReferenced));
    assert.ok(latest.complianceReview.length > 0);
    assert.ok(latest.qualityReview.length > 0);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, SPW_METADATA_VERSION);
    assert.equal(latest.reportVersion, SALES_PAGE_WORKER_REPORT_VERSION);
    assert.equal(latest.neverPublishPagesDirectly, true);
    assert.equal(latest.neverProcessPayments, true);
    assert.equal(latest.neverFabricateTestimonials, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
  });

  test("9 rejects payment/deliver/publish/override/fabricate/Q5-09 boundaries", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    for (const forbidden of [
      { processPayments: true },
      { deliverProducts: true },
      { publishWebsites: true },
      { publishPagesDirectly: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ509OrLater: true },
      { fabricateTestimonials: true },
    ] as const) {
      const report = engine.produceSalesPageReport({
        ...fullInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestSalesPage, null);
    }
  });

  test("10 lists + submits via ERR + cockpit", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createSalesPageWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-spw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateCompleteLandingPageStructure(fullInput);
    engine.generateCompellingHeadlines(fullInput);
    engine.generateBenefitDrivenCopy(fullInput);
    engine.generateFeatureSections(fullInput);
    engine.generatePricingPresentation(fullInput);
    engine.generateTestimonialsOrPlaceholders(fullInput);
    engine.generateFaqSections(fullInput);
    engine.generateCallToActionSections(fullInput);
    engine.generateGuaranteeSections(fullInput);
    engine.optimizePageStructureForReadabilityAndConversion(fullInput);
    const produced = engine.produceSalesPageReport(fullInput);
    const listed = engine.list();
    assert.ok(listed.salesPages.length >= 1);
    const submitted = engine.submitReport({
      salesPageId: produced.latestSalesPage!.salesPageId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q5-08"]);
    assert.equal(submitted.latestSalesPage!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestSalesPage!.executiveReportId, "ert-worker-spw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q5-08");
    assert.equal(cockpit.neverPublishPagesDirectly, true);
    assert.equal(cockpit.neverProcessPayments, true);
    assert.equal(cockpit.neverFabricateTestimonials, true);
  });
});
