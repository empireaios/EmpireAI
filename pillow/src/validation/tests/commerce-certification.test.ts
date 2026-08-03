import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CERTIFICATION_LEVELS,
  CMC_CAPABILITIES,
  CMC_METADATA_VERSION,
  COMMERCE_FACTORY_COMPONENTS,
  COMMERCE_FACTORY_VERSION,
  COMMERCE_GOVERNANCE_RULES,
  INTEGRATION_DOMAINS,
  buildCommerceCertificationConfiguration,
  createCommerceCertification,
  resetCommerceCertificationForTesting,
} from "../../commerce-certification/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createCommerceCertification>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCommerceCertification(bootstrap, config);
  await engine.initialize();
  engine.connectCommerceCertification();
  return engine;
}

const endToEndInput = {
  businessMissionId: "cmf-cbm-commerce-01",
  discoveryId: "pdw-discovery-bamboo-01",
  evaluationId: "pew-eval-bamboo-01",
  supplierDiscoveryId: "sdw-discovery-bamboo-01",
  supplierEvaluationId: "sew-eval-bamboo-01",
  negotiationId: "snw-neg-bamboo-01",
  imageReportId: "piw-img-bamboo-01",
  listingId: "plw-lst-bamboo-01",
  pricingId: "prw-prc-bamboo-01",
  inventoryReportId: "inw-inv-bamboo-01",
  orderReportId: "orw-ord-bamboo-01",
  refundCaseId: "rdw-case-bamboo-01",
  analyticsReportId: "caw-anl-bamboo-01",
  executiveReportIds: ["ert-orw-001", "ert-caw-001"],
  validated: true,
};

describe("Q3-14 Commerce Certification", () => {
  beforeEach(resetCommerceCertificationForTesting);

  test("1 locks mandatory commerce-certification boundaries", () => {
    const c = buildCommerceCertificationConfiguration(REPO_ROOT, {
      neverOperateLiveCommerceBusiness: false as never,
      neverModifyCommerceFactoryComponents: false as never,
      neverRepairFailuresAutomatically: false as never,
      neverBeginQ4Implementation: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverOperateLiveCommerceBusiness, true);
    assert.equal(c.neverModifyCommerceFactoryComponents, true);
    assert.equal(c.neverRepairFailuresAutomatically, true);
    assert.equal(c.neverBeginQ4Implementation, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-CMC-001 for Q3-14 with all Q3 components", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-14");
    assert.equal(state.engineVersion, "PILLOW-CMC-001");
    assert.equal(COMMERCE_FACTORY_COMPONENTS.length, 13);
    for (const component of COMMERCE_FACTORY_COMPONENTS) {
      assert.ok(state.configuration.commerceFactoryComponents.includes(component.id));
    }
    for (const level of CERTIFICATION_LEVELS) {
      assert.ok(state.configuration.certificationLevels.includes(level));
    }
    for (const domain of INTEGRATION_DOMAINS) {
      assert.ok(state.configuration.integrationDomains.includes(domain));
    }
    for (const rule of COMMERCE_GOVERNANCE_RULES) {
      assert.ok(state.configuration.governanceRules.includes(rule));
    }
    assert.ok(CMC_CAPABILITIES.includes("produce_unified_commerce_certification_report"));
  });

  test("3 certifies full Commerce Factory when all components pass", async () => {
    const report = (await build()).certifyFactory(endToEndInput);
    assert.equal(report.finalCertificationResult, "certified");
    assert.equal(report.q3ProductionReady, true);
    assert.equal(report.q4ReadinessConfirmed, true);
    assert.equal(report.reports[0]!.componentsTested.length, 13);
    assert.equal(report.reports[0]!.componentsFailed.length, 0);
    assert.equal(report.reports[0]!.integrationStatus, "fully_integrated");
    assert.equal(report.reports[0]!.governanceCompliance, "fully_compliant");
    assert.ok(report.reports[0]!.certificationId.startsWith("cmc-crt-"));
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

  test("5 verifies commerce governance and operational readiness", async () => {
    const engine = await build();
    const governance = engine.verifyGovernance(endToEndInput);
    assert.equal(governance.action, "verify_governance");
    assert.equal(
      governance.reports[0]!.governanceVerifications.length,
      COMMERCE_GOVERNANCE_RULES.length,
    );
    assert.ok(
      governance.reports[0]!.governanceVerifications.every((v) => v.result === "pass"),
    );

    const readiness = engine.assessReadiness(endToEndInput);
    assert.equal(readiness.q3ProductionReady, true);
    assert.ok(
      readiness.reports[0]!.operationalReadiness.includes("complete") ||
        readiness.reports[0]!.operationalReadiness.includes("ready"),
    );
  });

  test("6 verifies end-to-end commerce workflow traceability", async () => {
    const report = (await build()).verifyTraceability(endToEndInput);
    const chain = report.reports[0]!.traceabilityChain;
    assert.ok(chain.length >= 13);
    assert.equal(chain[0]!.stage, "product_discovery");
    assert.ok(chain.every((link) => !!link.artifactId));
    assert.equal(chain.at(-1)!.stage, "pillow_governance");
  });

  test("7 produces unified Commerce Certification Report", async () => {
    const report = (await build()).produceReport(endToEndInput);
    const unified = report.reports[0]!;
    assert.ok(unified.certificationId);
    assert.ok(unified.timestamp);
    assert.equal(unified.commerceFactoryVersion, COMMERCE_FACTORY_VERSION);
    assert.ok(Array.isArray(unified.componentsTested));
    assert.ok(Array.isArray(unified.componentsPassed));
    assert.ok(Array.isArray(unified.componentsFailed));
    assert.ok(unified.integrationStatus);
    assert.ok(unified.operationalReadiness);
    assert.ok(unified.governanceCompliance);
    assert.ok(Array.isArray(unified.outstandingRisks));
    assert.ok(Array.isArray(unified.recommendations));
    assert.ok(unified.finalCertificationResult);
    assert.equal(unified.metadataVersion, CMC_METADATA_VERSION);
  });

  test("8 returns final Q3 certification decision and detects failures", async () => {
    const engine = await build();
    const failed = engine.certifyFactory({
      ...endToEndInput,
      failedComponents: [
        "commerce-analytics-worker",
        "order-worker",
        "pricing-worker",
      ],
    });
    assert.equal(failed.finalCertificationResult, "failed_certification");
    assert.equal(failed.q3ProductionReady, false);
    assert.equal(failed.q4ReadinessConfirmed, false);
    assert.ok(failed.componentsFailed.includes("commerce-analytics-worker"));

    const warned = engine.certifyFactory({
      ...endToEndInput,
      warningComponents: ["product-image-worker"],
    });
    assert.equal(warned.finalCertificationResult, "certified_with_warnings");
    assert.equal(warned.q3ProductionReady, true);
  });

  test("9 rejects operate / modify / repair / Q4 / override boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { operateLiveCommerceBusiness: true },
      { modifyCommerceFactoryComponents: true },
      { repairFailuresAutomatically: true },
      { beginQ4Implementation: true },
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

  test("10 confirms Q3 production readiness and cockpit boundaries", async () => {
    const engine = await build();
    const report = engine.certifyFactory(endToEndInput);
    assert.equal(report.q3ProductionReady, true);
    assert.equal(report.q4ReadinessConfirmed, true);
    assert.ok(report.reports[0]!.neverOperateLiveCommerceBusiness);
    assert.ok(report.reports[0]!.neverBeginQ4Implementation);
    assert.equal(report.reports[0]!.liveCommerceBusinessOperated, false);
    assert.equal(report.reports[0]!.q4ImplementationBegun, false);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-14");
    assert.equal(cockpit.q3ProductionReady, true);
    assert.equal(cockpit.neverBeginQ4Implementation, true);
  });
});
