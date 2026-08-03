import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  INTEGRATION_TARGETS,
  LSEO_CAPABILITIES,
  LSEO_METADATA_VERSION,
  LOCAL_SEO_REPORT_VERSION,
  PAGE_TYPES,
  buildLocalSeoWorkerConfiguration,
  createLocalSeoWorker,
  resetLocalSeoWorkerForTesting,
  type LocalSeoInput,
  type ServiceOfferFixture,
} from "../../local-seo-worker/index.js";
import type { ServiceOfferReport } from "../../service-offer-worker/types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleFixtureServiceOffer(): ServiceOfferFixture {
  return {
    reportId: "sow-rpt-fixture-001",
    businessProjectId: "lbfc-prj-cleaning-01",
    businessName: "Orchard Sparkle Clean",
    serviceCategory: "cleaning",
    targetLocation: "Orchard, Singapore",
    targetCountry: "Singapore",
    targetCity: "Singapore",
    targetServiceArea: "Orchard",
    serviceCatalogue: [
      {
        serviceId: "sow-svc-001",
        name: "residential cleaning",
        description: "Apartment and condo cleaning for Orchard residents",
        category: "cleaning",
      },
      {
        serviceId: "sow-svc-002",
        name: "office cleaning",
        description: "Small office end-of-day cleaning",
        category: "cleaning",
      },
      {
        serviceId: "sow-svc-003",
        name: "move-out cleaning",
        description: "Deep move-out package",
        category: "cleaning",
      },
    ],
    servicePackages: [
      {
        packageId: "sow-pkg-001",
        name: "residential cleaning — Basic",
        packageType: "basic",
        targetCustomer: "busy homeowners",
        inclusions: ["core clean", "standard consumables"],
        geographicCoverage: "Orchard",
        recommendedPrice: { value: "SGD 98" },
      },
      {
        packageId: "sow-pkg-002",
        name: "residential cleaning — Premium",
        packageType: "premium",
        targetCustomer: "busy homeowners",
        inclusions: ["deep zones", "eco supplies"],
        geographicCoverage: "Orchard",
        recommendedPrice: { value: "SGD 148" },
      },
      {
        packageId: "sow-pkg-003",
        name: "weekly recurring clean",
        packageType: "recurring",
        targetCustomer: "busy homeowners",
        inclusions: ["scheduled weekly visit"],
        geographicCoverage: "Orchard",
        recommendedPrice: { value: "SGD 120" },
      },
    ],
    napHints: {
      name: "Orchard Sparkle Clean",
      address: "Orchard Road, Singapore",
      phone: "+65-6123-4567",
      website: "https://example.local/singapore/orchard/cleaning",
    },
    customerFacingLanguage: [
      "Friendly WhatsApp-ready reply tone for cleaning enquiries",
      "Confirm same-week availability via approved channels",
    ],
  };
}

function sampleServiceOfferReport(): ServiceOfferReport {
  const fixture = sampleFixtureServiceOffer();
  return {
    reportId: fixture.reportId!,
    timestamp: "2026-08-02T01:00:00.000Z",
    businessProjectId: fixture.businessProjectId!,
    serviceCatalogue: (fixture.serviceCatalogue ?? []).map((s, i) => ({
      serviceId: s.serviceId ?? `sow-svc-${String(i + 1).padStart(3, "0")}`,
      name: s.name,
      description: s.description ?? s.name,
      category: s.category ?? "cleaning",
      targetSegments: ["busy homeowners", "small offices"],
      geographicCoverage: "Orchard",
      evidenceClass: "estimated",
      sourceResearchRefs: ["lmrw-res-fixture-001"],
    })),
    servicePackages: (fixture.servicePackages ?? []).map((p, i) => ({
      packageId: p.packageId ?? `sow-pkg-${String(i + 1).padStart(3, "0")}`,
      name: p.name,
      targetCustomer: p.targetCustomer ?? "busy homeowners",
      pricingModel: "fixed_package",
      recommendedPrice: {
        value: p.recommendedPrice?.value ?? "SGD 100",
        evidenceClass: "estimated" as const,
        source: "research" as const,
      },
      pricingAssumptions: ["Anchored to Q7-02 findings"],
      estimatedDuration: "2-3 hours",
      estimatedOperationalCost: {
        value: "SGD 45",
        evidenceClass: "inference" as const,
        source: "assumption" as const,
      },
      estimatedGrossMargin: {
        value: "~40%",
        evidenceClass: "inference" as const,
        source: "assumption" as const,
      },
      optionalExtras: ["addon deep zone"],
      renewalOptions: ["one-off", "convert_to_recurring"],
      packageType: (p.packageType as "basic") ?? "basic",
      inclusions: [...(p.inclusions ?? ["core service"])],
      exclusions: ["after-hours surcharge coverage"],
      geographicCoverage: p.geographicCoverage ?? "Orchard",
      sourceResearchRefs: ["lmrw-res-fixture-001"],
    })),
    pricingRecommendations: [],
    packageInclusions: [],
    packageExclusions: [],
    guarantees: [],
    fulfilmentRequirements: [],
    operationalAssumptions: ["Fixture offer for Local SEO Worker tests"],
    risks: ["review_density_may_lag"],
    outstandingQuestions: ["Confirm final NAP phone with CRM"],
    confidenceScore: 0.7,
    executiveSummary: "Structural service offer for cleaning in Orchard.",
    metadataVersion: "SOW-001-v1",
    reportVersion: "SOW-RPT-v1",
    workerId: "wkr-service-offer-01",
    sourceResearchId: "lmrw-res-fixture-001",
    evidenceAssumptionNotes: ["Fixture offer"],
    consumableByQ704: true,
    neverBuildBookingSystems: true,
    neverBuildCrm: true,
    neverExecuteCustomerJobs: true,
    neverLaunchBusiness: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricatePricingEvidence: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ704OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: ["q7-03:service_offer:sow-rpt-fixture-001"],
  };
}

function sampleInput(overrides: Partial<LocalSeoInput> = {}): LocalSeoInput {
  return {
    businessProjectId: "lbfc-prj-cleaning-01",
    businessName: "Orchard Sparkle Clean",
    serviceCategory: "cleaning",
    targetLocation: "Orchard, Singapore",
    targetCountry: "Singapore",
    targetCity: "Singapore",
    targetServiceArea: "Orchard",
    grandKingInstructions: "Prepare SEO assets only; never publish or modify live GBP.",
    pillowCommandConfirmed: true,
    validated: true,
    fixtureServiceOffer: sampleFixtureServiceOffer(),
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createLocalSeoWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createLocalSeoWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q7-07 Local SEO Worker", () => {
  beforeEach(resetLocalSeoWorkerForTesting);

  test("1 locks mandatory local-seo-worker boundaries", () => {
    const c = buildLocalSeoWorkerConfiguration(REPO_ROOT, {
      neverPublishWebsites: false as never,
      neverPurchaseBacklinks: false as never,
      neverManipulateSearchRankings: false as never,
      neverModifyLiveGoogleBusinessProfilesAutomatically: false as never,
      neverModifyUnrelatedPlatformComponents: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverFabricateSeoPerformanceResults: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ708OrLater: false as never,
    });
    assert.equal(c.neverPublishWebsites, true);
    assert.equal(c.neverPurchaseBacklinks, true);
    assert.equal(c.neverManipulateSearchRankings, true);
    assert.equal(c.neverModifyLiveGoogleBusinessProfilesAutomatically, true);
    assert.equal(c.neverModifyUnrelatedPlatformComponents, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverFabricateSeoPerformanceResults, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ708OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
    assert.equal(c.neverExposeCredentials, true);
  });

  test("2 initializes PILLOW-LSEO-001 for Q7-07", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q7-07");
    assert.equal(state.engineVersion, "PILLOW-LSEO-001");
    assert.equal(state.configuration.workerId, "wkr-local-seo-01");
    assert.equal(state.configuration.factory, "local-business-factory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(LSEO_CAPABILITIES.includes("consume_service_offer"));
    for (const pageType of ["landing", "service", "city", "area"]) {
      assert.ok((PAGE_TYPES as readonly string[]).includes(pageType));
    }
  });

  test("3 consumes approved service offer from fixture and report", async () => {
    const engine = await build();
    const fromFixture = engine.consumeServiceOffer(sampleInput());
    assert.equal(fromFixture.action, "consume_service_offer");
    assert.notEqual(fromFixture.validation.decision, "fail");
    assert.ok(fromFixture.latestSession);
    assert.equal(fromFixture.latestSession!.offerSource, "fixtureServiceOffer");
    assert.equal(fromFixture.latestSession!.sourceOfferReportId, "sow-rpt-fixture-001");
    assert.equal(fromFixture.latestSession!.businessName, "Orchard Sparkle Clean");
    assert.match(fromFixture.latestSession!.targetLocation, /Orchard/);

    const fromReport = engine.consumeServiceOffer({
      validated: true,
      serviceOfferReport: sampleServiceOfferReport(),
    });
    assert.equal(fromReport.latestSession!.offerSource, "serviceOfferReport");
    assert.equal(fromReport.latestSession!.sourceOfferReportId, "sow-rpt-fixture-001");

    const viaId = await build({
      dependencies: {
        serviceOfferWorker: {
          getReports: () => [sampleServiceOfferReport()],
        },
      },
    });
    const consumed = viaId.consumeServiceOffer({
      offerReportId: "sow-rpt-fixture-001",
      validated: true,
    });
    assert.equal(consumed.latestSession!.offerSource, "offerReportId");
    assert.equal(consumed.validation.decision, "pass");
  });

  test("4 generates Google Business recommendations", async () => {
    const report = (await build()).generateGoogleBusinessRecommendations(sampleInput());
    assert.equal(report.action, "generate_google_business_recommendations");
    const gbp = report.latestSession!.googleBusinessRecommendations;
    assert.ok(gbp.length >= 1);
    assert.ok(gbp[0]!.recommendationId.startsWith("lseo-gbp-"));
    assert.ok(gbp[0]!.primaryCategorySuggestion.toLowerCase().includes("cleaning"));
    assert.equal(gbp[0]!.neverModifyLiveGbpAutomatically, true);
    assert.ok(gbp[0]!.napChecklist.length >= 1);
    assert.ok(report.latestSession!.napConsistencyRecommendations.length >= 1);
  });

  test("5 generates landing pages", async () => {
    const engine = await build();
    const landing = engine.generateLandingPages(sampleInput());
    assert.equal(landing.action, "generate_landing_pages");
    assert.ok(landing.latestSession!.landingPages.some((p) => p.pageType === "landing"));
    assert.ok(landing.latestSession!.landingPages[0]!.pageId.startsWith("lseo-page-"));
    assert.match(landing.latestSession!.landingPages[0]!.title, /Orchard|cleaning/i);

    const services = engine.generateServicePages({
      ...sampleInput(),
      seoId: landing.latestSession!.seoId,
    });
    assert.ok(services.latestSession!.landingPages.some((p) => p.pageType === "service"));

    const cityArea = engine.generateCityAreaPages({
      ...sampleInput(),
      seoId: landing.latestSession!.seoId,
    });
    assert.ok(cityArea.latestSession!.landingPages.some((p) => p.pageType === "city"));
    assert.ok(cityArea.latestSession!.landingPages.some((p) => p.pageType === "area"));
  });

  test("6 generates local keywords", async () => {
    const report = (await build()).generateLocalKeywords(sampleInput());
    const keywords = report.latestSession!.localKeywords;
    assert.ok(keywords.length >= 3);
    assert.ok(keywords.every((k) => k.keywordId.startsWith("lseo-kw-")));
    assert.ok(keywords.some((k) => k.phrase.toLowerCase().includes("cleaning")));
    assert.ok(keywords.some((k) => k.phrase.toLowerCase().includes("orchard")));
  });

  test("7 generates metadata (titles/descriptions)", async () => {
    const report = (await build()).generateSeoTitlesAndMeta(sampleInput());
    const metadata = report.latestSession!.metadata;
    assert.ok(metadata.length >= 1);
    assert.ok(metadata.every((m) => m.titleTag && m.metaDescription));
    assert.ok(metadata.every((m) => m.canonicalUrlRecommendation));
  });

  test("8 generates structured data recommendations", async () => {
    const report = (await build()).generateStructuredDataRecommendations(sampleInput());
    const schemas = report.latestSession!.structuredDataRecommendations;
    assert.ok(schemas.length >= 2);
    const types = new Set(schemas.map((s) => s.schemaType));
    assert.ok(types.has("LocalBusiness"));
    assert.ok(types.has("Service"));
    assert.ok(schemas.every((s) => s.schemaId.startsWith("lseo-schema-")));
  });

  test("9 evaluates SEO completeness from asset presence only", async () => {
    const report = (await build()).evaluateSeoCompleteness(sampleInput());
    const completeness = report.latestSession!.completeness!;
    assert.ok(completeness.evaluationId.startsWith("lseo-eval-") || completeness.checklist.length >= 1);
    assert.equal(completeness.neverClaimsLiveRankingOrTraffic, true);
    assert.ok(completeness.score >= 0.5);
    assert.ok(["complete", "partial", "incomplete"].includes(completeness.status));
    assert.ok(completeness.checklist.some((c) => c.item === "landing_pages" && c.present));
    assert.ok(
      !JSON.stringify(completeness).toLowerCase().includes("ranked #1"),
      "must never fabricate ranking claims",
    );
  });

  test("10 produces full Local SEO Report with required fields and consumableByQ708", async () => {
    const report = (await build()).produceLocalSeoReport(sampleInput());
    const latest = report.latestReport!;
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(latest.reportId.startsWith("lseo-rpt-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessProjectId, "lbfc-prj-cleaning-01");
    assert.match(latest.targetLocation, /Orchard/);
    assert.equal(latest.serviceCategory, "cleaning");
    assert.ok(latest.landingPagesGenerated.length >= 1);
    assert.ok(latest.googleBusinessRecommendations.length >= 1);
    assert.ok(latest.localKeywords.length >= 1);
    assert.ok(latest.metadata.length >= 1);
    assert.ok(latest.structuredDataRecommendations.length >= 1);
    assert.ok(latest.citationRecommendations.length >= 1);
    assert.ok(latest.seoCompletenessStatus);
    assert.ok(latest.auditStatus);
    assert.ok(Array.isArray(latest.outstandingIssues));
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, LSEO_METADATA_VERSION);
    assert.equal(latest.reportVersion, LOCAL_SEO_REPORT_VERSION);
    assert.equal(latest.workerId, "wkr-local-seo-01");
    assert.equal(latest.sourceOfferReportId, "sow-rpt-fixture-001");
    assert.ok(latest.internalLinkingRecommendations.length >= 1);
    assert.ok(latest.napConsistencyRecommendations.length >= 1);
    assert.ok(latest.faqAssets.length >= 1);
    assert.equal(latest.consumableByQ708, true);
    assert.equal(latest.neverPublishWebsites, true);
    assert.equal(latest.neverPurchaseBacklinks, true);
    assert.equal(latest.neverManipulateSearchRankings, true);
    assert.equal(latest.neverModifyLiveGoogleBusinessProfilesAutomatically, true);
    assert.equal(latest.neverFabricateSeoPerformanceResults, true);
    assert.equal(latest.neverImplementQ708OrLater, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
    assert.equal(latest.seoCompletenessStatus.neverClaimsLiveRankingOrTraffic, true);
  });

  test("11 submits report through Executive Reporting Runtime when injected", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createLocalSeoWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-lseo-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const produced = engine.produceLocalSeoReport(sampleInput());
    const submitted = engine.submitReport({
      reportId: produced.latestReport!.reportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q7-07"]);
    assert.equal(submitted.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReport!.executiveReportId, "ert-worker-lseo-001");
  });

  test("12 rejects Q7-08 / fabricate performance / publish websites / modify live GBP + Q708 contract + cockpit", async () => {
    const engine = await build();
    for (const forbidden of [
      { missionId: "Q7-08" },
      { implementQ708OrLater: true },
      { fabricateSeoPerformanceResults: true },
      { publishWebsites: true },
      { purchaseBacklinks: true },
      { manipulateSearchRankings: true },
      { modifyLiveGoogleBusinessProfilesAutomatically: true },
      { modifyUnrelatedPlatformComponents: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { bypassGrandKingApproval: true },
    ] as const) {
      const report = engine.produceLocalSeoReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReport, null);
    }

    engine.produceLocalSeoReport(sampleInput());
    const contract = engine.getQ708ConsumableContract();
    assert.equal(contract.consumableByQ708, true);
    assert.equal(contract.contractVersion, "LSEO-Q708-v1");
    assert.ok(contract.fields.includes("landingPagesGenerated"));
    assert.ok(contract.fields.includes("googleBusinessRecommendations"));
    assert.equal(contract.neverPublishWebsites, true);
    assert.equal(contract.neverFabricateSeoPerformanceResults, true);
    assert.equal(contract.neverModifyLiveGoogleBusinessProfilesAutomatically, true);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q7-07");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.consumableByQ708, true);
    assert.equal(cockpit.neverImplementQ708OrLater, true);
    assert.equal(cockpit.neverPublishWebsites, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getLandingPages().length >= 1);
    assert.ok(engine.list().reports.length >= 1);
  });
});
