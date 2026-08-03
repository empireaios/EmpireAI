import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CMF_APPROVAL_STATUSES,
  CMF_BUSINESS_TYPES,
  COMMERCE_BUILD_MISSION_VERSION,
  COMMERCE_CATEGORIES,
  buildCommerceFactoryCoreConfiguration,
  createCommerceFactoryCore,
  resetCommerceFactoryCoreForTesting,
  type CommerceFactoryCoreInput,
} from "../../commerce-factory-core/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleBlueprint(
  overrides: Partial<NonNullable<CommerceFactoryCoreInput["businessBlueprint"]>> = {},
): NonNullable<CommerceFactoryCoreInput["businessBlueprint"]> {
  return {
    blueprintId: "bbp-commerce-01",
    businessBuildMissionId: "ebf-bbm-commerce-01",
    businessType: "commerce",
    businessObjective: "Launch an online storefront for curated home goods.",
    productsServices: ["home goods", "storefront catalog"],
    customerSegments: ["urban homeowners"],
    valueProposition: "Curated e-commerce storefront with reliable fulfillment.",
    requiredIntegrations: ["shopify", "payments"],
    requiredAssets: ["product photos"],
    businessArchitecture: {
      revenueModel: "product sales",
      costModel: "cogs + ads",
      deliveryChannels: ["online store", "shopify"],
      targetMarket: "US DTC",
    },
    preservedDecisions: ["q2-06:proceed"],
    traceabilityRefs: ["q2-06:business_blueprint:bbp-commerce-01"],
    ...overrides,
  };
}

function sampleApprovalPack(
  overrides: Partial<NonNullable<CommerceFactoryCoreInput["businessApprovalPack"]>> = {},
): NonNullable<CommerceFactoryCoreInput["businessApprovalPack"]> {
  return {
    approvalPackId: "bap-commerce-01",
    businessBuildMissionId: "ebf-bbm-commerce-01",
    businessType: "commerce",
    recommendation: "Proceed",
    executiveSummary: "Commerce blueprint is ready for Q3 preparation.",
    outstandingIssues: [],
    sourceRefs: { businessBlueprintId: "bbp-commerce-01" },
    preservedDecisions: ["q2-09:proceed"],
    traceabilityRefs: ["q2-09:business_approval_pack:bap-commerce-01"],
    ...overrides,
  };
}

function approvedInput(
  overrides: Partial<CommerceFactoryCoreInput> = {},
): CommerceFactoryCoreInput {
  return {
    businessBlueprint: sampleBlueprint(),
    businessApprovalPack: sampleApprovalPack(),
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createCommerceFactoryCore>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCommerceFactoryCore(bootstrap, config);
  await engine.initialize();
  engine.connectCommerceFactoryCore();
  return engine;
}

describe("Q3-01 Commerce Factory Core", () => {
  beforeEach(resetCommerceFactoryCoreForTesting);

  test("1 locks mandatory commerce-factory-core boundaries", () => {
    const c = buildCommerceFactoryCoreConfiguration(REPO_ROOT, {
      neverBuildStores: false as never,
      neverImportProducts: false as never,
      neverConfigureMarketplaces: false as never,
      neverExecuteCommerceImplementation: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ302OrLater: false as never,
    });
    assert.equal(c.neverBuildStores, true);
    assert.equal(c.neverImportProducts, true);
    assert.equal(c.neverConfigureMarketplaces, true);
    assert.equal(c.neverExecuteCommerceImplementation, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ302OrLater, true);
  });

  test("2 initializes PILLOW-CMF-001 for Q3-01", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-01");
    assert.equal(state.engineVersion, "PILLOW-CMF-001");
    for (const type of CMF_BUSINESS_TYPES) {
      assert.ok(state.configuration.businessTypes.includes(type));
    }
    for (const category of COMMERCE_CATEGORIES) {
      assert.ok(state.configuration.commerceCategories.includes(category));
    }
    for (const status of CMF_APPROVAL_STATUSES) {
      assert.ok(state.configuration.approvalStatuses.includes(status));
    }
  });

  test("3 receives approved blueprint and approval pack", async () => {
    const engine = await build();
    const blueprintReport = engine.receiveBusinessBlueprint(approvedInput());
    assert.equal(blueprintReport.action, "receive_blueprint");
    assert.ok(
      blueprintReport.validation.decision === "pass" ||
        blueprintReport.validation.decision === "partial",
    );
    const packReport = engine.receiveBusinessApprovalPack(approvedInput());
    assert.equal(packReport.action, "receive_approval_pack");
    assert.ok(
      packReport.validation.decision === "pass" ||
        packReport.validation.decision === "partial",
    );
  });

  test("4 creates a Commerce Build Mission when Grand King approved Proceed pack", async () => {
    const report = (await build()).createCommerceBuildMission(approvedInput());
    assert.equal(report.action, "create_mission");
    assert.equal(report.validation.decision, "pass");
    assert.ok(report.latestMission!.commerceBuildMissionId.startsWith("cmf-cbm-"));
    assert.equal(report.latestMission!.businessType, "commerce");
    assert.equal(report.latestMission!.commerceCategory, "online_store");
    assert.equal(report.latestMission!.approvalStatus, "approved");
    assert.equal(report.latestMission!.grandKingApprovalVerified, true);
    assert.equal(report.latestMission!.blueprintCompletenessVerified, true);
    assert.equal(report.latestMission!.metadataVersion, "CMF-001-v1");
  });

  test("5 classifies marketplace and subscription commerce categories", async () => {
    const engine = await build();
    assert.equal(
      engine.classifyCommerceBusinessType(
        approvedInput({
          businessBlueprint: sampleBlueprint({
            businessObjective: "Sell through an Amazon marketplace channel.",
            requiredIntegrations: ["amazon", "marketplace"],
          }),
        }),
      ).latestMission!.commerceCategory,
      "marketplace",
    );
    assert.equal(
      engine.classifyCommerceBusinessType(
        approvedInput({
          businessBlueprint: sampleBlueprint({
            businessObjective: "Launch a subscription membership commerce box.",
            requiredIntegrations: ["recurring billing"],
          }),
        }),
      ).latestMission!.commerceCategory,
      "subscription_commerce",
    );
  });

  test("6 rejects incomplete blueprints", async () => {
    const report = (await build()).createCommerceBuildMission(
      approvedInput({
        businessBlueprint: sampleBlueprint({
          productsServices: [],
          valueProposition: "",
        }),
      }),
    );
    assert.equal(report.validation.decision, "fail");
    assert.equal(report.latestMission!.approvalStatus, "not_approved");
    assert.ok(
      report.latestMission!.missingPrerequisites.some((m) => m.includes("blueprint:")),
    );
  });

  test("7 rejects unapproved approval packs and missing Grand King approval", async () => {
    const engine = await build();
    assert.equal(
      engine.createCommerceBuildMission(
        approvedInput({
          businessApprovalPack: sampleApprovalPack({ recommendation: "Revise" }),
        }),
      ).validation.decision,
      "fail",
    );
    assert.equal(
      engine.createCommerceBuildMission(approvedInput({ grandKingApproved: false }))
        .validation.decision,
      "fail",
    );
  });

  test("8 produces machine-readable Commerce Build Mission records", async () => {
    const engine = await build();
    engine.createCommerceBuildMission(approvedInput());
    const report = engine.produceCommerceBuildMission({ validated: true });
    const catalog = report.catalog!;
    assert.equal(catalog.missionVersion, COMMERCE_BUILD_MISSION_VERSION);
    assert.ok(catalog.missions.length >= 1);
    const mission = catalog.missions[catalog.missions.length - 1]!;
    assert.ok(mission.commerceBuildMissionId);
    assert.ok(mission.timestamp);
    assert.ok(mission.businessBlueprintId);
    assert.ok(mission.businessApprovalPackId);
    assert.ok(mission.businessType);
    assert.ok(mission.commerceCategory);
    assert.ok(mission.missionObjective);
    assert.ok(mission.currentStatus);
    assert.ok(mission.requiredNextStep);
    assert.ok(mission.approvalStatus);
    assert.ok(mission.traceabilityReference);
    assert.equal(mission.metadataVersion, "CMF-001-v1");
    assert.equal(mission.missionVersion, "CMF-CBM-v1");
  });

  test("9 rejects store / import / marketplace / execute / override / Q3-02 boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.createCommerceBuildMission(approvedInput({ buildStores: true })).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.createCommerceBuildMission(approvedInput({ importProducts: true })).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.classifyCommerceBusinessType(
        approvedInput({ configureMarketplaces: true }),
      ).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceCommerceBuildMission({
        executeCommerceImplementation: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.createCommerceBuildMission(approvedInput({ overridePillow: true })).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.createCommerceBuildMission(approvedInput({ overrideGrandKing: true }))
        .validation.decision,
      "fail",
    );
    assert.equal(
      engine.createCommerceBuildMission(approvedInput({ implementQ302OrLater: true }))
        .validation.decision,
      "fail",
    );
  });

  test("10 registers with mission coordination and lists missions", async () => {
    const engine = await build();
    engine.createCommerceBuildMission(approvedInput());
    const register = engine.registerCommerceBuildMission({ validated: true });
    assert.equal(register.action, "register_mission");
    assert.ok(
      register.validation.decision === "pass" ||
        register.validation.decision === "partial",
    );
    const list = engine.listCommerceBuildMissions();
    assert.ok(list.missions.length >= 1);
    assert.equal(list.action, "list");
  });
});
