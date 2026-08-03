import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CERTIFICATION_LEVELS,
  MDC_CAPABILITIES,
  MDC_METADATA_VERSION,
  MEDIA_FACTORY_COMPONENTS,
  MEDIA_FACTORY_VERSION,
  MEDIA_GOVERNANCE_RULES,
  INTEGRATION_DOMAINS,
  buildMediaCertificationConfiguration,
  createMediaCertification,
  resetMediaCertificationForTesting,
} from "../../media-certification/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createMediaCertification>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMediaCertification(bootstrap, config);
  await engine.initialize();
  engine.connectMediaCertification();
  return engine;
}

const endToEndInput = {
  mediaBusinessId: "mfc-mbm-media-01",
  editorialStrategyId: "eic-strategy-media-01",
  trendReportId: "trw-trends-media-01",
  topicPlanId: "tpw-topics-media-01",
  scriptId: "scw-script-media-01",
  hookReportId: "hkw-hooks-media-01",
  thumbnailReportId: "thw-thumbs-media-01",
  visualResearchId: "vrw-visual-media-01",
  imageCreativeId: "icw-creative-media-01",
  voiceReportId: "vcw-voice-media-01",
  assemblyId: "vaw-assembly-media-01",
  subtitleReportId: "sbw-subs-media-01",
  musicSoundReportId: "msw-audio-media-01",
  publishingReportId: "pbw-publish-media-01",
  analyticsReportId: "maw-analytics-media-01",
  learningReportId: "mlw-learning-media-01",
  channelRecommendationId: "crw-channel-media-01",
  executiveReviewId: "mer-review-media-01",
  executiveReportIds: ["ert-mer-001", "ert-maw-001"],
  validated: true,
};

describe("Q4-19 Media Certification", () => {
  beforeEach(resetMediaCertificationForTesting);

  test("1 locks mandatory media-certification boundaries", () => {
    const c = buildMediaCertificationConfiguration(REPO_ROOT, {
      neverPublishMedia: false as never,
      neverModifyMediaFactoryComponents: false as never,
      neverRepairFailuresAutomatically: false as never,
      neverBeginQ5Implementation: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverPublishMedia, true);
    assert.equal(c.neverModifyMediaFactoryComponents, true);
    assert.equal(c.neverRepairFailuresAutomatically, true);
    assert.equal(c.neverBeginQ5Implementation, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-MDC-001 for Q4-19 with all Q4 components", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-19");
    assert.equal(state.engineVersion, "PILLOW-MDC-001");
    assert.equal(MEDIA_FACTORY_COMPONENTS.length, 18);
    for (const component of MEDIA_FACTORY_COMPONENTS) {
      assert.ok(state.configuration.mediaFactoryComponents.includes(component.id));
    }
    for (const level of CERTIFICATION_LEVELS) {
      assert.ok(state.configuration.certificationLevels.includes(level));
    }
    for (const domain of INTEGRATION_DOMAINS) {
      assert.ok(state.configuration.integrationDomains.includes(domain));
    }
    for (const rule of MEDIA_GOVERNANCE_RULES) {
      assert.ok(state.configuration.governanceRules.includes(rule));
    }
    assert.ok(MDC_CAPABILITIES.includes("produce_unified_media_certification_report"));
  });

  test("3 certifies full Media Factory when all components pass", async () => {
    const report = (await build()).certifyFactory(endToEndInput);
    assert.equal(report.finalCertificationResult, "certified");
    assert.equal(report.q4ProductionReady, true);
    assert.equal(report.q5ReadinessConfirmed, true);
    assert.equal(report.reports[0]!.componentsTested.length, 18);
    assert.equal(report.reports[0]!.componentsFailed.length, 0);
    assert.equal(report.reports[0]!.integrationStatus, "fully_integrated");
    assert.equal(report.reports[0]!.governanceCompliance, "fully_compliant");
    assert.ok(report.reports[0]!.certificationId.startsWith("mdc-crt-"));
  });

  test("4 verifies cross-worker integration domains and executive reporting", async () => {
    const report = (await build()).verifyIntegration(endToEndInput);
    assert.equal(report.action, "verify_integration");
    assert.ok(report.reports[0]!.integrationVerifications.length >= INTEGRATION_DOMAINS.length);
    assert.ok(
      report.reports[0]!.integrationVerifications.every((v) => v.result === "pass"),
    );
    assert.ok(report.reports[0]!.executiveReportingStatus.includes("executive_reporting"));
  });

  test("5 verifies media governance and operational readiness", async () => {
    const engine = await build();
    const governance = engine.verifyGovernance(endToEndInput);
    assert.equal(governance.action, "verify_governance");
    assert.equal(
      governance.reports[0]!.governanceVerifications.length,
      MEDIA_GOVERNANCE_RULES.length,
    );
    assert.ok(
      governance.reports[0]!.governanceVerifications.every((v) => v.result === "pass"),
    );

    const readiness = engine.assessReadiness(endToEndInput);
    assert.equal(readiness.q4ProductionReady, true);
    assert.ok(
      readiness.reports[0]!.autonomousOperationStatus.includes("autonomous") ||
        readiness.reports[0]!.autonomousOperationStatus.includes("verified"),
    );
  });

  test("6 verifies end-to-end media workflow traceability", async () => {
    const report = (await build()).verifyTraceability(endToEndInput);
    const chain = report.reports[0]!.traceabilityChain;
    assert.ok(chain.length >= 18);
    assert.equal(chain[0]!.stage, "editorial_strategy");
    assert.ok(chain.every((link) => !!link.artifactId));
    assert.equal(chain.at(-1)!.stage, "pillow_governance");
  });

  test("7 verifies autonomous operation and produces unified Media Certification Report", async () => {
    const engine = await build();
    const autonomous = engine.verifyAutonomousOperation(endToEndInput);
    assert.equal(autonomous.action, "verify_autonomous_operation");
    assert.ok(
      autonomous.reports[0]!.autonomousOperationStatus.includes("autonomous") ||
        autonomous.reports[0]!.autonomousOperationStatus.includes("verified"),
    );

    const report = engine.produceReport(endToEndInput);
    const unified = report.reports[0]!;
    assert.ok(unified.certificationId);
    assert.ok(unified.timestamp);
    assert.equal(unified.mediaFactoryVersion, MEDIA_FACTORY_VERSION);
    assert.ok(Array.isArray(unified.mediaBusinessesTested));
    assert.ok(Array.isArray(unified.componentsTested));
    assert.ok(Array.isArray(unified.componentsPassed));
    assert.ok(Array.isArray(unified.componentsFailed));
    assert.ok(unified.integrationStatus);
    assert.ok(unified.autonomousOperationStatus);
    assert.ok(unified.governanceCompliance);
    assert.ok(Array.isArray(unified.outstandingRisks));
    assert.ok(Array.isArray(unified.recommendations));
    assert.ok(unified.finalCertificationResult);
    assert.equal(unified.metadataVersion, MDC_METADATA_VERSION);
  });

  test("8 returns final Q4 certification decision and detects failures", async () => {
    const engine = await build();
    const failed = engine.certifyFactory({
      ...endToEndInput,
      failedComponents: [
        "media-analytics-worker",
        "publishing-worker",
        "media-executive-review-worker",
      ],
    });
    assert.equal(failed.finalCertificationResult, "failed_certification");
    assert.equal(failed.q4ProductionReady, false);
    assert.equal(failed.q5ReadinessConfirmed, false);
    assert.ok(failed.componentsFailed.includes("media-analytics-worker"));

    const warned = engine.certifyFactory({
      ...endToEndInput,
      warningComponents: ["thumbnail-worker"],
    });
    assert.equal(warned.finalCertificationResult, "certified_with_warnings");
    assert.equal(warned.q4ProductionReady, true);
  });

  test("9 rejects publish / modify / repair / Q5 / override boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { publishMedia: true },
      { modifyMediaFactoryComponents: true },
      { repairFailuresAutomatically: true },
      { beginQ5Implementation: true },
      { overridePillow: true },
      { overrideGrandKing: true },
    ] as const) {
      const report = engine.certifyFactory({
        ...endToEndInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.finalCertificationResult, null);
    }
  });

  test("10 confirms Q4 production readiness and cockpit boundaries", async () => {
    const engine = await build();
    const report = engine.certifyFactory(endToEndInput);
    assert.equal(report.q4ProductionReady, true);
    assert.equal(report.q5ReadinessConfirmed, true);
    assert.ok(report.reports[0]!.neverPublishMedia);
    assert.ok(report.reports[0]!.neverBeginQ5Implementation);
    assert.equal(report.reports[0]!.mediaPublished, false);
    assert.equal(report.reports[0]!.q5ImplementationBegun, false);
    const listed = engine.listCertificationReports();
    assert.ok(listed.reports.length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-19");
    assert.equal(cockpit.q4ProductionReady, true);
    assert.equal(cockpit.neverBeginQ5Implementation, true);
  });
});
