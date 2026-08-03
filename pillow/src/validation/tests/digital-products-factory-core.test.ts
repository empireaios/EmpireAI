import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  DPF_APPROVAL_STATUSES,
  DPF_PIPELINE_TYPES,
  DPF_PRODUCT_TYPES,
  DIGITAL_PRODUCT_BUSINESS_MISSION_VERSION,
  DIGITAL_PRODUCTS_FACTORY_REPORT_VERSION,
  buildDigitalProductsFactoryCoreConfiguration,
  createDigitalProductsFactoryCore,
  resetDigitalProductsFactoryCoreForTesting,
  type DigitalProductsFactoryCoreInput,
} from "../../digital-products-factory-core/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleMissionInput(
  overrides: Partial<DigitalProductsFactoryCoreInput> = {},
): DigitalProductsFactoryCoreInput {
  return {
    businessId: "dbiz-toolkit-01",
    businessName: "EmpireAI Toolkit Studio",
    missionObjective: "Coordinate digital toolkit product creation and fulfilment.",
    productType: "toolkit",
    pipelineType: "multi_stage",
    productPortfolio: ["starter-toolkit", "pro-toolkit"],
    activeProducts: ["starter-toolkit"],
    executiveSummary: "Digital toolkit orchestration mission.",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createDigitalProductsFactoryCore>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createDigitalProductsFactoryCore(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q5-01 Digital Products Factory Core", () => {
  beforeEach(resetDigitalProductsFactoryCoreForTesting);

  test("1 locks mandatory digital-products-factory-core boundaries", () => {
    const c = buildDigitalProductsFactoryCoreConfiguration(REPO_ROOT, {
      neverCreateEbooks: false as never,
      neverCreateCourses: false as never,
      neverBuildSalesPages: false as never,
      neverProcessPayments: false as never,
      neverBypassApproval: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ502OrLater: false as never,
    });
    assert.equal(c.neverCreateEbooks, true);
    assert.equal(c.neverCreateCourses, true);
    assert.equal(c.neverBuildSalesPages, true);
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverBypassApproval, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ502OrLater, true);
  });

  test("2 initializes PILLOW-DPF-001 for Q5-01", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q5-01");
    assert.equal(state.engineVersion, "PILLOW-DPF-001");
    for (const type of DPF_PRODUCT_TYPES) {
      assert.ok(state.configuration.productTypes.includes(type));
    }
    for (const type of DPF_PIPELINE_TYPES) {
      assert.ok(state.configuration.pipelineTypes.includes(type));
    }
    for (const status of DPF_APPROVAL_STATUSES) {
      assert.ok(state.configuration.approvalStatuses.includes(status));
    }
  });

  test("3 creates a digital product business mission", async () => {
    const report = (await build()).createDigitalProductBusinessMission(sampleMissionInput());
    assert.equal(report.action, "create_digital_product_business_mission");
    assert.equal(report.validation.decision, "pass");
    assert.ok(report.latestMission!.factoryMissionId.startsWith("dpf-dpm-"));
    assert.equal(report.latestMission!.businessId, "dbiz-toolkit-01");
    assert.equal(report.latestMission!.currentStatus, "active");
    assert.equal(report.latestMission!.metadataVersion, "DPF-001-v1");
    assert.equal(report.latestMission!.missionVersion, DIGITAL_PRODUCT_BUSINESS_MISSION_VERSION);
  });

  test("4 registers a digital product business", async () => {
    const engine = await build();
    engine.createDigitalProductBusinessMission(sampleMissionInput());
    const report = engine.registerDigitalProductBusiness({
      businessId: "dbiz-toolkit-01",
      businessName: "EmpireAI Toolkit Studio",
      productPortfolio: ["starter-toolkit", "pro-toolkit"],
      activeProducts: ["starter-toolkit"],
      validated: true,
    });
    assert.equal(report.action, "register_digital_product_business");
    assert.equal(report.validation.decision, "pass");
    assert.equal(report.latestMission!.businessId, "dbiz-toolkit-01");
    assert.equal(report.latestMission!.currentPipelineStage, "business_registered");
    assert.ok(report.latestMission!.productPortfolio.includes("starter-toolkit"));
  });

  test("5 coordinates product creation pipeline and workers", async () => {
    const engine = await build();
    engine.createDigitalProductBusinessMission(sampleMissionInput());
    engine.registerDigitalProductBusiness({
      businessId: "dbiz-toolkit-01",
      productPortfolio: ["starter-toolkit"],
      validated: true,
    });
    const creation = engine.coordinateProductCreation({
      pipelineId: "pl-product-creation",
      pipelineType: "product_creation",
      validated: true,
    });
    assert.equal(creation.action, "coordinate_product_creation");
    assert.equal(creation.validation.decision, "pass");
    assert.equal(creation.latestMission!.currentPipelineStage, "product_creation");

    const workers = engine.coordinateWorkers({
      assignedWorkers: ["wkr-product-designer-01", "wkr-fulfilment-01"],
      assignedWorkerRoles: ["product_designer", "fulfilment"],
      validated: true,
    });
    assert.equal(workers.action, "coordinate_workers");
    assert.ok(workers.latestMission!.assignedWorkers.includes("wkr-product-designer-01"));
    assert.equal(workers.latestMission!.productionStatus, "coordinating");
  });

  test("6 coordinates fulfilment and analytics workflows", async () => {
    const engine = await build();
    engine.createDigitalProductBusinessMission(sampleMissionInput());
    engine.registerDigitalProductBusiness({ businessId: "dbiz-toolkit-01", validated: true });
    engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });
    const fulfilment = engine.coordinateFulfilment({ validated: true });
    assert.equal(fulfilment.action, "coordinate_fulfilment");
    assert.equal(fulfilment.validation.decision, "pass");
    assert.equal(fulfilment.latestMission!.currentPipelineStage, "fulfilment");
    assert.ok(fulfilment.latestMission!.fulfilmentStatus);

    const analytics = engine.coordinateAnalytics({ validated: true });
    assert.equal(analytics.action, "coordinate_analytics");
    assert.equal(analytics.validation.decision, "pass");
    assert.equal(analytics.latestMission!.currentPipelineStage, "analytics");
    assert.ok(analytics.latestMission!.analyticsStatus);
  });

  test("7 rejects approval bypass and requires Grand King approval", async () => {
    const engine = await build();
    engine.createDigitalProductBusinessMission(sampleMissionInput());
    const bypass = engine.coordinateApproval({ bypassApproval: true, validated: true });
    assert.equal(bypass.validation.decision, "fail");
    assert.equal(bypass.latestMission!.approvalStatus, "blocked_bypass_attempt");

    const noGk = engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: false,
      validated: true,
    });
    assert.equal(noGk.validation.decision, "fail");

    const approved = engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });
    assert.equal(approved.validation.decision, "pass");
    assert.equal(approved.latestMission!.approvalStatus, "approved");
  });

  test("8 produces Digital Products Factory Report with all required fields", async () => {
    const engine = await build();
    engine.createDigitalProductBusinessMission(sampleMissionInput());
    engine.registerDigitalProductBusiness({
      businessId: "dbiz-toolkit-01",
      businessName: "EmpireAI Toolkit Studio",
      productPortfolio: ["starter-toolkit", "pro-toolkit"],
      activeProducts: ["starter-toolkit"],
      validated: true,
    });
    engine.coordinateProductCreation({
      pipelineId: "pl-multi-01",
      pipelineType: "multi_stage",
      validated: true,
    });
    engine.coordinateWorkers({
      assignedWorkers: ["wkr-designer-01"],
      assignedWorkerRoles: ["designer"],
      validated: true,
    });
    engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });
    engine.coordinateFulfilment({ validated: true });
    engine.coordinateAnalytics({ validated: true });
    engine.coordinateLearning({ validated: true });

    const report = engine.produceReport({ validated: true });
    assert.equal(report.action, "produce_report");
    assert.equal(report.validation.decision, "pass");
    const dfr = report.latestReport!;
    assert.ok(dfr.factoryMissionId);
    assert.ok(dfr.timestamp);
    assert.equal(dfr.businessId, "dbiz-toolkit-01");
    assert.ok(Array.isArray(dfr.productPortfolio));
    assert.ok(Array.isArray(dfr.activeProducts));
    assert.ok(dfr.currentPipelineStage);
    assert.ok(Array.isArray(dfr.assignedWorkers));
    assert.ok(dfr.fulfilmentStatus);
    assert.ok(dfr.analyticsStatus);
    assert.ok(dfr.learningStatus);
    assert.ok(dfr.executiveSummary);
    assert.equal(dfr.metadataVersion, "DPF-001-v1");
    assert.equal(dfr.reportVersion, DIGITAL_PRODUCTS_FACTORY_REPORT_VERSION);
    assert.equal(dfr.neverCreateEbooks, true);
    assert.equal(dfr.neverProcessPayments, true);
    assert.equal(dfr.neverBypassApproval, true);
  });

  test("9 rejects ebook/course/sales-page/payment and override boundaries", async () => {
    const engine = await build();
    engine.createDigitalProductBusinessMission(sampleMissionInput());
    assert.equal(
      engine.createDigitalProductBusinessMission(sampleMissionInput({ createEbooks: true }))
        .validation.decision,
      "fail",
    );
    assert.equal(
      engine.registerDigitalProductBusiness({ createCourses: true, validated: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.coordinateSalesPage({ buildSalesPages: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.coordinateCheckout({ processPayments: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ overridePillow: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ overrideGrandKing: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ implementQ502OrLater: true, validated: true }).validation.decision,
      "fail",
    );
  });

  test("10 lists missions and submits report via ERR", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({
            records: [{ reportId: `ert-dpf-test-${Date.now()}` }],
          }),
        },
      },
    });
    engine.createDigitalProductBusinessMission(sampleMissionInput());
    engine.registerDigitalProductBusiness({ businessId: "dbiz-toolkit-01", validated: true });
    engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });
    engine.produceReport({ validated: true });

    const list = engine.list();
    assert.equal(list.action, "list");
    assert.ok(list.missions.length >= 1);

    const submit = engine.submitReport({ validated: true });
    assert.equal(submit.action, "submit_report");
    assert.ok(
      submit.validation.decision === "pass" || submit.validation.decision === "partial",
    );
    assert.equal(submit.latestReport!.submittedToExecutiveReporting, true);
    assert.ok(submit.latestReport!.executiveReportId);
  });
});
