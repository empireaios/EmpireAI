import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ACW_METADATA_VERSION,
  AFFILIATE_COMPLIANCE_REPORT_VERSION,
  buildAffiliateComplianceWorkerConfiguration,
  createAffiliateComplianceWorker,
  resetAffiliateComplianceWorkerForTesting,
  type AcwInput,
} from "../../affiliate-compliance-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleEvidence(overrides: Record<string, unknown> = {}) {
  return {
    disclosurePresent: true,
    disclosureText: "This post contains affiliate links. We may earn a commission.",
    disclosurePlacement: "above_fold" as const,
    requiredDisclaimerPresent: true,
    disclaimerText: "Individual results vary. Not a guarantee of earnings.",
    linkDisclosurePresent: true,
    platform: "amazon_associates",
    platformRulesAcknowledged: true,
    promotionalClaims: ["top pick for travelers"],
    prohibitedClaimsDetected: [] as string[],
    contentMentionsAffiliateRelationship: true,
    reviewHasProsCons: true,
    seoHasDisclosureSection: true,
    programmeRequirementsReferenced: true,
    ...overrides,
  };
}

function sampleInput(overrides: Partial<AcwInput> = {}): AcwInput {
  return {
    affiliateBusinessId: "afc-biz-travel-gear-01",
    affiliateProjectId: "afc-prj-travel-gear-01",
    fixtureEvidence: sampleEvidence(),
    fixtureOpportunity: {
      reportId: "aow-rpt-0001",
      affiliateProjectId: "afc-prj-travel-gear-01",
      affiliateBusinessId: "afc-biz-travel-gear-01",
      opportunityScore: 78,
      productCategory: "travel_gear",
      programmeName: "Amazon Associates",
    },
    fixtureReview: {
      reportId: "rcw-rpt-0001",
      affiliateProjectId: "afc-prj-travel-gear-01",
      title: "Best Travel Backpacks",
      disclosurePresent: true,
    },
    fixtureSeo: {
      reportId: "seow-rpt-0001",
      affiliateProjectId: "afc-prj-travel-gear-01",
      topic: "travel_gear",
      hasDisclosureSection: true,
      contentQualitySummary: { completenessScore: 0.85 },
    },
    fixtureAnalytics: {
      reportId: "anw-rpt-0001",
      affiliateProjectId: "afc-prj-travel-gear-01",
      confidenceScore: 1,
    },
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createAffiliateComplianceWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createAffiliateComplianceWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q8-08 Affiliate Compliance Worker", () => {
  beforeEach(resetAffiliateComplianceWorkerForTesting);

  test("1 locks mandatory affiliate-compliance-worker boundaries", () => {
    const c = buildAffiliateComplianceWorkerConfiguration(REPO_ROOT, {
      neverFabricateComplianceResults: false as never,
      neverProvideUnverifiedLegalConclusions: false as never,
      neverPublishAffiliateContent: false as never,
      neverReplaceLegalProfessionals: false as never,
      neverOverrideProgrammeRequirements: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ809OrLater: false as never,
    });
    assert.equal(c.neverFabricateComplianceResults, true);
    assert.equal(c.neverProvideUnverifiedLegalConclusions, true);
    assert.equal(c.neverPublishAffiliateContent, true);
    assert.equal(c.neverReplaceLegalProfessionals, true);
    assert.equal(c.neverOverrideProgrammeRequirements, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ809OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveComplianceAuditHistory, true);
  });

  test("2 initializes PILLOW-ACW-001 for Q8-08", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q8-08");
    assert.equal(state.engineVersion, "PILLOW-ACW-001");
    assert.equal(state.configuration.workerId, "wkr-affiliate-compliance-01");
  });

  test("3 consumes opportunity + review + SEO reports", async () => {
    const engine = await build();
    const input = sampleInput();
    const opp = engine.consumeAffiliateOpportunityReport(input);
    const review = engine.consumeReviewContentReport(input);
    const seo = engine.consumeSeoContentReport(input);
    assert.equal(opp.validation.decision, "pass");
    assert.equal(review.validation.decision, "pass");
    assert.equal(seo.validation.decision, "pass");
  });

  test("4 validates affiliate disclosures", async () => {
    const result = (await build()).validateAffiliateDisclosures(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.disclosureValidation!.status, "pass");
    assert.equal(result.disclosureValidation!.fabricated, false);
    assert.equal(result.disclosureValidation!.legalConclusion, "not_legal_advice");
  });

  test("5 validates platform rules", async () => {
    const result = (await build()).validatePlatformPolicyCompliance(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.platformRuleValidation!.platform, "amazon_associates");
    assert.equal(result.platformRuleValidation!.fabricated, false);
  });

  test("6 validates required disclaimers", async () => {
    const result = (await build()).validateRequiredDisclaimers(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.disclaimerValidation!.status, "pass");
    assert.equal(result.disclaimerValidation!.fabricated, false);
  });

  test("7 detects risks + recommends corrections for violations", async () => {
    const engine = await build();
    const input = sampleInput({
      fixtureEvidence: sampleEvidence({
        disclosurePresent: false,
        disclosureText: null,
        prohibitedClaimsDetected: ["guaranteed income"],
        platformRulesAcknowledged: false,
      }),
    });
    const violations = engine.detectComplianceViolations(input);
    const corrections = engine.recommendCorrectiveActions(input);
    assert.equal(violations.validation.decision, "pass");
    assert.ok((violations.policyFindings?.length ?? 0) >= 1);
    assert.ok((violations.complianceRisks?.length ?? 0) >= 1);
    assert.ok((corrections.recommendedCorrections?.length ?? 0) >= 1);
    assert.equal(corrections.recommendedCorrections![0].fabricated, false);
    assert.equal(corrections.recommendedCorrections![0].legalConclusion, "not_legal_advice");
  });

  test("8 assesses readiness and preserves history", async () => {
    const engine = await build();
    const ready = engine.assessApprovalReadiness(sampleInput());
    assert.equal(ready.validation.decision, "pass");
    assert.equal(ready.readinessAssessment!.autoApproved, false);
    assert.ok(
      ["approval_ready", "ready_for_review", "needs_remediation", "not_ready"].includes(
        ready.readinessAssessment!.status,
      ),
    );
    engine.produceAffiliateComplianceReport(sampleInput());
    engine.produceAffiliateComplianceReport(
      sampleInput({
        fixtureEvidence: sampleEvidence({ disclosurePresent: false, disclosureText: null }),
      }),
    );
    const history = engine.getHistory();
    assert.ok(history.length >= 2);
    assert.ok(history.every((h) => h.reportId && h.timestamp));
  });

  test("9 full Affiliate Compliance Report + consumableByQ809", async () => {
    const engine = await build();
    const input = sampleInput();
    engine.consumeAffiliateOpportunityReport(input);
    engine.consumeReviewContentReport(input);
    engine.consumeSeoContentReport(input);
    engine.validateAffiliateDisclosures(input);
    engine.validatePlatformPolicyCompliance(input);
    engine.validateRequiredDisclaimers(input);
    engine.detectComplianceViolations(input);
    engine.recommendCorrectiveActions(input);
    engine.assessApprovalReadiness(input);
    const produced = engine.produceAffiliateComplianceReport(input);
    const report = produced.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.affiliateProjectId, "afc-prj-travel-gear-01");
    assert.ok(report.complianceScope);
    assert.ok(report.disclosureValidation);
    assert.ok(report.platformRuleValidation);
    assert.ok(report.disclaimerValidation);
    assert.ok(Array.isArray(report.policyFindings));
    assert.ok(Array.isArray(report.complianceRisks));
    assert.ok(Array.isArray(report.recommendedCorrections));
    assert.ok(report.readinessStatus);
    assert.ok(report.readinessAssessment);
    assert.equal(report.readinessAssessment.autoApproved, false);
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.equal(report.metadataVersion, ACW_METADATA_VERSION);
    assert.equal(report.reportVersion, AFFILIATE_COMPLIANCE_REPORT_VERSION);
    assert.equal(report.consumableByQ809, true);
    assert.equal(report.legalConclusion, "not_legal_advice");
    assert.equal(report.neverFabricateComplianceResults, true);
    assert.equal(report.neverPublishAffiliateContent, true);
    assert.equal(report.neverImplementQ809OrLater, true);
  });

  test("10 ERR submit when injected", async () => {
    const submitted: unknown[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createAffiliateComplianceWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (payload) => {
            submitted.push(payload);
            return { records: [{ reportId: "err-acw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const input = sampleInput();
    engine.produceAffiliateComplianceReport(input);
    const result = engine.submitReport(input);
    assert.equal(result.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(result.latestReport!.executiveReportId, "err-acw-001");
    assert.equal(submitted.length, 1);
  });

  test("11 rejects Q8-09 / fabricate / legal-advice / publish / replace-legal / override", async () => {
    const engine = await build();
    for (const input of [
      sampleInput({ implementQ809OrLater: true }),
      sampleInput({ missionId: "Q8-09" }),
      sampleInput({ fabricateComplianceResults: true }),
      sampleInput({ provideUnverifiedLegalConclusions: true }),
      sampleInput({ publishAffiliateContent: true }),
      sampleInput({ replaceLegalProfessionals: true }),
      sampleInput({ overrideProgrammeRequirements: true }),
      sampleInput({ overridePillow: true }),
      sampleInput({ bypassGrandKingApproval: true }),
    ]) {
      const result = engine.validateAffiliateDisclosures(input);
      assert.equal(result.validation.decision, "fail");
      assert.ok(result.validation.errors.length > 0);
    }
  });

  test("12 Q8-09 consumable contract + cockpit", async () => {
    const engine = await build();
    const contract = engine.getQ809ConsumableContract();
    assert.equal(contract.contractVersion, "ACW-Q809-v1");
    assert.equal(contract.consumableByQ809, true);
    assert.ok(contract.fields.includes("disclosureValidation"));
    assert.ok(contract.fields.includes("recommendedCorrections"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q8-08");
    assert.equal(cockpit.neverFabricateComplianceResults, true);
    assert.equal(cockpit.neverImplementQ809OrLater, true);
    assert.equal(cockpit.consumableByQ809, true);
  });
});
