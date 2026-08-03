import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  EFW_METADATA_VERSION,
  EMAIL_FUNNEL_REPORT_VERSION,
  buildEmailFunnelWorkerConfiguration,
  createEmailFunnelWorker,
  resetEmailFunnelWorkerForTesting,
  type EfwInput,
} from "../../email-funnel-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleOpportunity() {
  return {
    reportId: "aow-rpt-0001",
    affiliateProjectId: "afc-prj-travel-gear-01",
    affiliateBusinessId: "afc-biz-travel-gear-01",
    productCategory: "travel_gear",
    targetNiche: "travel_gear",
    opportunityScore: 78,
    products: [
      {
        productId: "prod-backpack-01",
        name: "TrailBackpack Pro",
        category: "travel_gear",
      },
    ],
  };
}

function sampleSeo() {
  return {
    reportId: "seow-rpt-0001",
    affiliateProjectId: "afc-prj-travel-gear-01",
    affiliateBusinessId: "afc-biz-travel-gear-01",
    topic: "travel_gear",
    contentPlan: {
      title: "travel_gear SEO content plan",
      pillarPage: "travel_gear ultimate guide",
      supportingArticles: ["travel_gear comparison", "travel_gear review"],
      targetKeywords: ["best travel backpack"],
    },
    articleBrief: {
      title: "TrailBackpack Pro SEO article brief",
      primaryKeyword: "best travel backpack",
      audience: "buyers evaluating evidenced recommendations",
    },
    seoArticle: {
      title: "TrailBackpack Pro SEO article",
      primaryKeyword: "best travel backpack",
      metaDescription: "Evidence-based travel gear guide",
    },
    targetKeywords: [
      { keyword: "best travel backpack", intent: "commercial", role: "primary" },
    ],
  };
}

function sampleReview() {
  return {
    reportId: "rcw-rpt-0001",
    productOrServiceReviewed: "TrailBackpack Pro",
    pros: ["Durable shell", "Comfortable harness"],
    cons: ["Premium price"],
    buyingRecommendation: {
      verdict: "buy_with_conditions",
      summary: "Buy with conditions for weekend hikers",
    },
  };
}

function sampleInput(overrides: Partial<EfwInput> = {}): EfwInput {
  return {
    affiliateBusinessId: "afc-biz-travel-gear-01",
    affiliateProjectId: "afc-prj-travel-gear-01",
    topic: "travel_gear",
    funnelName: "travel_gear email funnel",
    fixtureOpportunity: sampleOpportunity(),
    fixtureSeo: sampleSeo(),
    fixtureReview: sampleReview(),
    fixtureLeadMagnetName: "TrailBackpack Pro buyer checklist",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createEmailFunnelWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createEmailFunnelWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q8-06 Email Funnel Worker", () => {
  beforeEach(resetEmailFunnelWorkerForTesting);

  test("1 locks mandatory email-funnel-worker boundaries", () => {
    const c = buildEmailFunnelWorkerConfiguration(REPO_ROOT, {
      neverFabricateConversionOrPerformanceClaims: false as never,
      neverSendLiveMarketingEmails: false as never,
      neverManageEmailInfrastructure: false as never,
      neverReplaceAnalyticsWorker: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ807OrLater: false as never,
    });
    assert.equal(c.neverFabricateConversionOrPerformanceClaims, true);
    assert.equal(c.neverSendLiveMarketingEmails, true);
    assert.equal(c.neverManageEmailInfrastructure, true);
    assert.equal(c.neverReplaceAnalyticsWorker, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ807OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveAuditHistory, true);
  });

  test("2 initializes PILLOW-EFW-001 for Q8-06", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q8-06");
    assert.equal(state.engineVersion, "PILLOW-EFW-001");
    assert.equal(state.configuration.workerId, "wkr-email-funnel-01");
  });

  test("3 consumes opportunity + SEO reports", async () => {
    const engine = await build();
    const opp = engine.consumeAffiliateOpportunityReport(sampleInput());
    const seo = engine.consumeSeoContentReport(sampleInput());
    assert.equal(opp.validation.decision, "pass");
    assert.equal(seo.validation.decision, "pass");
    assert.match(opp.notes.join(" "), /aow-rpt-0001|Consumed/);
    assert.match(seo.notes.join(" "), /seow-rpt-0001|Consumed/);
  });

  test("4 generates lead magnet", async () => {
    const result = (await build()).generateLeadMagnet(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.leadMagnet);
    assert.equal(result.leadMagnet!.name, "TrailBackpack Pro buyer checklist");
    assert.equal(result.leadMagnet!.fabricated, false);
  });

  test("5 generates welcome sequence", async () => {
    const result = (await build()).generateWelcomeSequence(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.welcomeSequence);
    assert.equal(result.welcomeSequence!.sequenceType, "welcome");
    assert.ok(result.welcomeSequence!.emails.length >= 1);
    assert.equal(result.welcomeSequence!.fabricated, false);
  });

  test("6 generates nurture sequence", async () => {
    const result = (await build()).generateNurtureSequence(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.nurtureSequence);
    assert.ok(result.nurtureSequence!.emails.length >= 1);
    assert.equal(result.nurtureSequence!.fabricated, false);
  });

  test("7 generates call-to-action strategy", async () => {
    const result = (await build()).generateCallToActionStrategy(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.callToActionStrategy);
    assert.ok(result.callToActionStrategy!.primaryCta);
    assert.ok(result.callToActionStrategy!.conversionObjectives.length >= 1);
    assert.equal(result.callToActionStrategy!.neverFabricatePerformanceClaims, true);
  });

  test("8 defines funnel stages + capture strategy", async () => {
    const engine = await build();
    const stages = engine.defineFunnelStages(sampleInput());
    const capture = engine.generateEmailCaptureStrategy(sampleInput());
    assert.equal(stages.validation.decision, "pass");
    assert.ok(stages.funnelStages!.length >= 5);
    assert.equal(capture.validation.decision, "pass");
    assert.ok(capture.emailCaptureStrategy!.optInPageConcept);
  });

  test("9 full Email Funnel Report + consumableByQ807", async () => {
    const engine = await build();
    const input = sampleInput();
    engine.consumeAffiliateOpportunityReport(input);
    engine.consumeSeoContentReport(input);
    engine.generateLeadMagnet(input);
    engine.generateEmailCaptureStrategy(input);
    engine.defineFunnelStages(input);
    engine.generateWelcomeSequence(input);
    engine.generateNurtureSequence(input);
    engine.generateCallToActionStrategy(input);
    const produced = engine.produceEmailFunnelReport(input);
    const report = produced.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.affiliateProjectId, "afc-prj-travel-gear-01");
    assert.equal(report.funnelName, "travel_gear email funnel");
    assert.ok(report.leadMagnet);
    assert.ok(report.funnelStages.length >= 1);
    assert.ok(report.emailSequence.length >= 2);
    assert.ok(report.callToActionStrategy);
    assert.ok(report.conversionObjectives.length >= 1);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.equal(report.metadataVersion, EFW_METADATA_VERSION);
    assert.equal(report.reportVersion, EMAIL_FUNNEL_REPORT_VERSION);
    assert.equal(report.consumableByQ807, true);
    assert.equal(report.neverFabricateConversionOrPerformanceClaims, true);
    assert.equal(report.neverSendLiveMarketingEmails, true);
    assert.equal(report.neverImplementQ807OrLater, true);
    assert.ok(report.versionHistory.length >= 1);
    assert.ok(report.welcomeSequence);
    assert.ok(report.nurtureSequence);
  });

  test("10 ERR submit when injected", async () => {
    const submitted: unknown[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createEmailFunnelWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (payload) => {
            submitted.push(payload);
            return { records: [{ reportId: "err-efw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const input = sampleInput();
    engine.produceEmailFunnelReport(input);
    const result = engine.submitReport(input);
    assert.equal(result.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(result.latestReport!.executiveReportId, "err-efw-001");
    assert.equal(submitted.length, 1);
  });

  test("11 rejects Q8-07 / fabricate / send-live / manage-infra / replace-analytics / override", async () => {
    const engine = await build();
    for (const input of [
      sampleInput({ implementQ807OrLater: true }),
      sampleInput({ missionId: "Q8-07" }),
      sampleInput({ fabricateConversionOrPerformanceClaims: true }),
      sampleInput({ sendLiveMarketingEmails: true }),
      sampleInput({ manageEmailInfrastructure: true }),
      sampleInput({ replaceAnalyticsWorker: true }),
      sampleInput({ overridePillow: true }),
      sampleInput({ bypassGrandKingApproval: true }),
    ]) {
      const result = engine.generateLeadMagnet(input);
      assert.equal(result.validation.decision, "fail");
      assert.ok(result.validation.errors.length > 0);
    }
  });

  test("12 Q8-07 consumable contract + cockpit", async () => {
    const engine = await build();
    const contract = engine.getQ807ConsumableContract();
    assert.equal(contract.contractVersion, "EFW-Q807-v1");
    assert.equal(contract.consumableByQ807, true);
    assert.ok(contract.fields.includes("leadMagnet"));
    assert.ok(contract.fields.includes("emailSequence"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q8-06");
    assert.equal(cockpit.neverFabricateConversionOrPerformanceClaims, true);
    assert.equal(cockpit.neverImplementQ807OrLater, true);
    assert.equal(cockpit.consumableByQ807, true);
  });
});
