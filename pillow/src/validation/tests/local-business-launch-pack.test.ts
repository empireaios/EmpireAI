import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  APPROVAL_RECOMMENDATIONS,
  AUDIT_STATUSES,
  DELIVERABLE_ITEMS,
  INTEGRATION_TARGETS,
  LBLP_CAPABILITIES,
  LBLP_METADATA_VERSION,
  LOCAL_BUSINESS_LAUNCH_REPORT_VERSION,
  READINESS_STATUSES,
  buildLocalBusinessLaunchPackConfiguration,
  createLocalBusinessLaunchPack,
  resetLocalBusinessLaunchPackForTesting,
  type LblpInput,
} from "../../local-business-launch-pack/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const BUSINESS_PROJECT_ID = "lbfc-prj-cleaning-01";
const BUSINESS_NAME = "Orchard Sparkle Clean";

function fullFixtures(): Partial<LblpInput> {
  return {
    businessProjectId: BUSINESS_PROJECT_ID,
    businessName: BUSINESS_NAME,
    businessType: "residential_cleaning",
    city: "Singapore",
    area: "Orchard",
    country: "Singapore",
    fixtureLbfc: {
      businessProjectId: BUSINESS_PROJECT_ID,
      businessName: BUSINESS_NAME,
      businessCategory: "residential_cleaning",
      currentLifecycleStage: "launch_ready",
      approvalStatus: "approved",
      launchReadiness: "ready",
      confidenceScore: 0.9,
    },
    fixtureMarketResearch: {
      reportId: "lmrw-rpt-0001",
      businessProjectId: BUSINESS_PROJECT_ID,
      targetCity: "Singapore",
      targetServiceArea: "Orchard",
      serviceCategory: "residential_cleaning",
      executiveSummary: "Strong demand for premium residential cleaning in Orchard.",
      opportunityFindingsCount: 4,
      confidenceScore: 0.85,
    },
    fixtureServiceOffer: {
      reportId: "sow-rpt-0001",
      businessProjectId: BUSINESS_PROJECT_ID,
      servicePackagesCount: 3,
      pricingRecommendationsCount: 3,
      currency: "SGD",
      executiveSummary: "Three-tier cleaning packages with competitive Orchard-area pricing.",
      confidenceScore: 0.8,
    },
    fixtureBooking: {
      reportId: "bkw-rpt-0001",
      businessProjectId: BUSINESS_PROJECT_ID,
      bookingId: "bkw-booking-0001",
      bookingStatus: "confirmed",
      confidenceScore: 0.9,
    },
    fixtureCrm: {
      reportId: "crm-rpt-0001",
      businessProjectId: BUSINESS_PROJECT_ID,
      customerId: "crm-cust-0001",
      leadStatus: "qualified",
      customerLifecycleStage: "active",
      confidenceScore: 0.75,
    },
    fixtureWhatsApp: {
      reportId: "waw-rpt-0001",
      businessProjectId: BUSINESS_PROJECT_ID,
      conversationId: "waw-conv-0001",
      conversationStatus: "active",
      confidenceScore: 0.8,
    },
    fixtureLocalSeo: {
      reportId: "lseo-rpt-0001",
      businessProjectId: BUSINESS_PROJECT_ID,
      landingPagesGeneratedCount: 2,
      confidenceScore: 0.7,
    },
    fixtureLeadGeneration: {
      reportId: "lgw-rpt-0001",
      businessProjectId: BUSINESS_PROJECT_ID,
      funnelId: "lgw-funnel-0001",
      confidenceScore: 0.75,
    },
    fixtureOperations: {
      reportId: "opsw-rpt-0001",
      businessProjectId: BUSINESS_PROJECT_ID,
      workflowId: "opsw-wf-0001",
      operationalStagesCount: 9,
      confidenceScore: 0.85,
    },
  };
}

function sampleInput(overrides: Partial<LblpInput> = {}): LblpInput {
  return {
    ...fullFixtures(),
    grandKingInstructions:
      "Assemble and verify launch readiness only; never launch the business or override certification, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createLocalBusinessLaunchPack>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createLocalBusinessLaunchPack(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q7-10 Local Business Launch Pack", () => {
  beforeEach(resetLocalBusinessLaunchPackForTesting);

  test("1 locks mandatory local-business-launch-pack boundaries", () => {
    const c = buildLocalBusinessLaunchPackConfiguration(REPO_ROOT, {
      neverLaunchBusinessAutomatically: false as never,
      neverOverrideGovernance: false as never,
      neverReplaceCertification: false as never,
      neverClaimReadinessWithoutEvidence: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ711OrLater: false as never,
    });
    assert.equal(c.neverLaunchBusinessAutomatically, true);
    assert.equal(c.neverOverrideGovernance, true);
    assert.equal(c.neverReplaceCertification, true);
    assert.equal(c.neverClaimReadinessWithoutEvidence, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ711OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-LBLP-001 for Q7-10", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q7-10");
    assert.equal(state.engineVersion, "PILLOW-LBLP-001");
    assert.equal(state.configuration.workerId, "wkr-local-business-launch-pack-01");
    assert.equal(state.configuration.factory, "local-business-factory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(LBLP_CAPABILITIES.includes("collect_factory_outputs"));
    assert.ok(LBLP_CAPABILITIES.includes("verify_deliverables"));
    assert.ok(LBLP_CAPABILITIES.includes("generate_executive_launch_package"));
    for (const item of DELIVERABLE_ITEMS) {
      assert.ok(
        [
          "business_identity",
          "market_research",
          "service_offer",
          "booking_readiness",
          "crm_readiness",
          "whatsapp_readiness",
          "local_seo",
          "lead_generation",
          "operations",
        ].includes(item),
      );
    }
    for (const status of READINESS_STATUSES) {
      assert.ok(["not_ready", "partial", "ready_for_approval", "blocked", "unknown"].includes(status));
    }
    for (const status of ["draft", "outputs_collected", "verified", "package_ready", "ready_for_q711", "submitted", "rejected", "unknown"]) {
      assert.ok((AUDIT_STATUSES as readonly string[]).includes(status));
    }
  });

  test("3 collects outputs from Q7-01..Q7-09 fixtures", async () => {
    const engine = await build();
    const collected = engine.collectFactoryOutputs(sampleInput());
    assert.equal(collected.action, "collect_factory_outputs");
    assert.notEqual(collected.validation.decision, "fail");
    assert.ok(collected.latestCollection);
    const collection = collected.latestCollection!;
    assert.equal(collection.businessProjectId, BUSINESS_PROJECT_ID);
    assert.equal(collection.sourcesPresent.length, 9);
    assert.equal(collection.sourcesMissing.length, 0);
    assert.ok(collection.lbfc.present);
    assert.equal(collection.lbfc.summary!.businessName, BUSINESS_NAME);
    assert.ok(collection.marketResearch.present);
    assert.ok(collection.serviceOffer.present);
    assert.ok(collection.booking.present);
    assert.ok(collection.crm.present);
    assert.ok(collection.whatsApp.present);
    assert.ok(collection.localSeo.present);
    assert.ok(collection.leadGeneration.present);
    assert.ok(collection.operations.present);
    assert.equal(collection.neverInventMissingReports, true);

    // Missing businessProjectId with no fixtureLbfc yields an explicit error, never a fabricated collection.
    const unresolved = engine.collectFactoryOutputs({ validated: true });
    assert.equal(unresolved.validation.decision, "fail");
    assert.equal(unresolved.latestCollection, null);
  });

  test("4 verifies deliverables (pass when all present; partial when missing)", async () => {
    const engine = await build();
    const verified = engine.verifyDeliverables(sampleInput());
    assert.equal(verified.action, "verify_deliverables");
    assert.notEqual(verified.validation.decision, "fail");
    const verification = verified.latestVerification!;
    assert.equal(verification.requiredCount, 9);
    assert.equal(verification.presentCount, 9);
    assert.equal(verification.allRequiredPresent, true);
    assert.equal(verification.missingItems.length, 0);
    assert.equal(verification.criticalItemsMissing.length, 0);
    for (const item of verification.items) {
      assert.ok(item.present);
      assert.ok(item.evidenceRefs.length >= 1);
    }

    const engine2 = await build();
    const { fixtureOperations, ...withoutOperations } = sampleInput();
    const partial = engine2.verifyDeliverables(withoutOperations);
    const partialVerification = partial.latestVerification!;
    assert.equal(partialVerification.presentCount, 8);
    assert.equal(partialVerification.allRequiredPresent, false);
    assert.ok(partialVerification.missingItems.includes("operations"));
    assert.ok(!partialVerification.criticalItemsMissing.includes("operations"));
  });

  test("5 generates executive launch package with all required sections", async () => {
    const engine = await build();
    const generated = engine.generateExecutiveLaunchPackage(sampleInput());
    assert.equal(generated.action, "generate_executive_launch_package");
    assert.notEqual(generated.validation.decision, "fail");
    const pkg = generated.latestPackage!;
    assert.ok(pkg.packageId.startsWith("lblp-pkg-"));
    assert.equal(pkg.businessProjectId, BUSINESS_PROJECT_ID);
    assert.equal(pkg.businessName, BUSINESS_NAME);
    assert.equal(pkg.status, "assembled");
    assert.equal(pkg.neverLaunchBusinessAutomatically, true);
    assert.equal(pkg.neverReplaceCertification, true);
    const s = pkg.sections;
    for (const section of [
      s.businessOverview,
      s.targetMarket,
      s.serviceCatalogue,
      s.pricingSummary,
      s.bookingReadiness,
      s.crmReadiness,
      s.whatsAppReadiness,
      s.localSeoReadiness,
      s.leadGenerationReadiness,
      s.operationsReadiness,
    ]) {
      assert.equal(section.status, "evidenced");
      assert.ok(section.summary.length > 0);
      assert.ok(section.evidenceRefs.length >= 1);
    }
    assert.ok(s.executiveSummary.length > 0);
    assert.ok(Array.isArray(s.risks));
    assert.ok(Array.isArray(s.assumptions));
    assert.ok(Array.isArray(s.outstandingItems));
    assert.ok(APPROVAL_RECOMMENDATIONS.includes(s.approvalRecommendation));

    // Missing evidence must never fabricate an "evidenced" section.
    const engine2 = await build();
    const { fixtureMarketResearch, ...withoutMarketResearch } = sampleInput();
    const gapPackage = engine2.generateExecutiveLaunchPackage(withoutMarketResearch);
    assert.equal(gapPackage.latestPackage!.sections.targetMarket.status, "evidence_missing");
  });

  test("6 readiness assessment completed from evidence", async () => {
    const engine = await build();
    const verified = engine.verifyDeliverables(sampleInput());
    assert.equal(verified.latestVerification!.allRequiredPresent, true);
    const generated = engine.generateExecutiveLaunchPackage(sampleInput());
    const report = engine.produceReport(sampleInput());
    const latest = report.latestReport!;
    assert.equal(latest.readinessStatus, "ready_for_approval");
    assert.equal(latest.readinessAssessment.readinessStatus, "ready_for_approval");
    assert.equal(latest.readinessAssessment.presentCount, 9);
    assert.equal(latest.readinessAssessment.requiredCount, 9);
    assert.ok(latest.confidenceScore > 0);
    assert.ok(latest.readinessAssessment.notes.length >= 1);
    assert.ok(generated.latestPackage);

    // Empty store never fabricates a positive readiness.
    const engine2 = await build();
    const emptyReport = engine2.produceReport({
      businessProjectId: "lbfc-prj-empty-01",
      businessName: "Empty Co",
      validated: true,
    });
    assert.equal(emptyReport.latestReport!.readinessStatus, "not_ready");
    assert.equal(emptyReport.latestReport!.approvalRecommendation, "do_not_approve");
    assert.equal(emptyReport.latestReport!.confidenceScore, 0);
  });

  test("7 risks/outstanding identified when gaps exist", async () => {
    const engine = await build();
    const { fixtureLocalSeo, fixtureLeadGeneration, ...gapped } = sampleInput();
    const risks = engine.identifyRisksAndOutstandingIssues(gapped);
    assert.ok(risks.outstandingItems.some((i) => i.toLowerCase().includes("local seo")));
    assert.ok(risks.outstandingItems.some((i) => i.toLowerCase().includes("lead generation")));
    assert.ok(Array.isArray(risks.assumptions));

    const report = engine.produceReport(gapped);
    const latest = report.latestReport!;
    assert.ok(latest.outstandingIssues.length >= 2);
    assert.equal(latest.readinessStatus, "partial");
  });

  test("8 approval recommendation generated correctly", async () => {
    const engine = await build();
    const full = engine.produceReport(sampleInput());
    assert.equal(full.latestReport!.approvalRecommendation, "recommend_approval");

    const engine2 = await build();
    const { fixtureLocalSeo, ...nonCriticalGap } = sampleInput();
    const partial = engine2.produceReport(nonCriticalGap);
    assert.equal(partial.latestReport!.approvalRecommendation, "approve_with_conditions");

    const engine3 = await build();
    const { fixtureMarketResearch, ...criticalGap } = sampleInput();
    const blocked = engine3.produceReport(criticalGap);
    assert.equal(blocked.latestReport!.approvalRecommendation, "do_not_approve");
    assert.ok(blocked.latestReport!.deliverableVerification.criticalItemsMissing.includes("market_research"));
  });

  test("9 full Local Business Launch Report + consumableByQ711", async () => {
    const engine = await build();
    engine.collectFactoryOutputs(sampleInput());
    engine.verifyDeliverables(sampleInput());
    engine.generateExecutiveLaunchPackage(sampleInput());
    const report = engine.produceLocalBusinessLaunchReport(sampleInput());
    const latest = report.latestReport!;
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(latest.reportId.startsWith("lblp-rpt-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessProjectId, BUSINESS_PROJECT_ID);
    assert.equal(latest.businessName, BUSINESS_NAME);
    assert.equal(latest.businessType, "residential_cleaning");
    assert.ok(latest.executiveSummary.length > 0);
    assert.ok(latest.deliverableVerification);
    assert.equal(latest.readinessStatus, "ready_for_approval");
    assert.ok(Array.isArray(latest.riskSummary));
    assert.ok(Array.isArray(latest.outstandingIssues));
    assert.equal(latest.approvalRecommendation, "recommend_approval");
    assert.equal(latest.auditStatus, "ready_for_q711");
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, LBLP_METADATA_VERSION);
    assert.equal(latest.reportVersion, LOCAL_BUSINESS_LAUNCH_REPORT_VERSION);
    assert.equal(latest.workerId, "wkr-local-business-launch-pack-01");
    assert.ok(latest.packageId.startsWith("lblp-pkg-"));
    assert.ok(latest.launchPackage);
    assert.ok(latest.readinessAssessment);
    assert.equal(latest.consumableByQ711, true);
    assert.equal(latest.submittedToExecutiveReporting, false);
    assert.equal(latest.executiveReportId, null);
    assert.ok(latest.traceabilityRefs.length >= 1);
    assert.equal(latest.structuralSignalOnly, true);
    assert.equal(latest.maskSensitiveValues, true);
    assert.equal(latest.preserveCompleteTraceability, true);
    assert.equal(latest.preserveAuditHistory, true);
    assert.equal(latest.neverLaunchBusinessAutomatically, true);
    assert.equal(latest.neverOverrideGovernance, true);
    assert.equal(latest.neverReplaceCertification, true);
    assert.equal(latest.neverClaimReadinessWithoutEvidence, true);
    assert.equal(latest.neverOverrideApprovedArchitecture, true);
    assert.equal(latest.neverOverridePillow, true);
    assert.equal(latest.neverOverrideGrandKing, true);
    assert.equal(latest.neverBypassGrandKingApproval, true);
    assert.equal(latest.neverImplementQ711OrLater, true);
    assert.ok(
      !JSON.stringify(latest).toLowerCase().includes("business launched successfully"),
      "must never fabricate that the business was launched",
    );
  });

  test("10 ERR submit when injected", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createLocalBusinessLaunchPack(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-lblp-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const produced = engine.produceReport(sampleInput());
    const submitted = engine.submitReport({
      reportId: produced.latestReport!.reportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q7-10"]);
    assert.equal(submitted.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReport!.executiveReportId, "ert-worker-lblp-001");
  });

  test("11 rejects Q7-11 / auto-launch / claim readiness without evidence / override governance", async () => {
    const engine = await build();
    for (const forbidden of [
      { missionId: "Q7-11" },
      { implementQ711OrLater: true },
      { launchBusinessAutomatically: true },
      { overrideGovernance: true },
      { replaceCertification: true },
      { claimReadinessWithoutEvidence: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { bypassGrandKingApproval: true },
    ] as const) {
      const report = engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReport, null);
    }
  });

  test("12 Q7-11 consumable contract + cockpit", async () => {
    const engine = await build();
    engine.produceReport(sampleInput());
    const contract = engine.getQ711ConsumableContract();
    assert.equal(contract.consumableByQ711, true);
    assert.equal(contract.contractVersion, "LBLP-Q711-v1");
    assert.ok(contract.fields.includes("launchPackage"));
    assert.ok(contract.fields.includes("deliverableVerification"));
    assert.ok(contract.fields.includes("readinessAssessment"));
    assert.equal(contract.neverLaunchBusinessAutomatically, true);
    assert.equal(contract.neverOverrideGovernance, true);
    assert.equal(contract.neverReplaceCertification, true);
    assert.equal(contract.neverClaimReadinessWithoutEvidence, true);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q7-10");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.consumableByQ711, true);
    assert.equal(cockpit.neverImplementQ711OrLater, true);
    assert.equal(cockpit.neverLaunchBusinessAutomatically, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getPackages().length >= 1);
    assert.ok(engine.list().reports.length >= 1);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);
  });
});
