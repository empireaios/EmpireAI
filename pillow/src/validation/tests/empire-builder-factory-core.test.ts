import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  APPROVAL_STATUSES,
  BUSINESS_TYPES,
  BUSINESS_BUILD_MISSION_VERSION,
  EBF_CAPABILITIES,
  buildEmpireBuilderFactoryCoreConfiguration,
  createEmpireBuilderFactoryCore,
  resetEmpireBuilderFactoryCoreForTesting,
} from "../../empire-builder-factory-core/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createEmpireBuilderFactoryCore>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createEmpireBuilderFactoryCore(bootstrap, config);
  await engine.initialize();
  engine.connectEmpireBuilderFactoryCore();
  return engine;
}

describe("Q2-01 Empire Builder Factory Core", () => {
  beforeEach(resetEmpireBuilderFactoryCoreForTesting);

  test("1 locks mandatory empire-builder-factory-core boundaries", () => {
    const c = buildEmpireBuilderFactoryCoreConfiguration(REPO_ROOT, {
      neverInterpretDetailedBusinessStrategy: false as never,
      neverGenerateBusinessModels: false as never,
      neverResearchMarkets: false as never,
      neverAssignWorkers: false as never,
      neverExecuteBusinesses: false as never,
      neverLaunchBusinesses: false as never,
      neverImplementQ202OrLater: false as never,
    });
    assert.equal(c.neverInterpretDetailedBusinessStrategy, true);
    assert.equal(c.neverGenerateBusinessModels, true);
    assert.equal(c.neverResearchMarkets, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverExecuteBusinesses, true);
    assert.equal(c.neverLaunchBusinesses, true);
    assert.equal(c.neverImplementQ202OrLater, true);
  });

  test("2 initializes PILLOW-EBF-001 for Q2-01", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q2-01");
    assert.equal(state.engineVersion, "PILLOW-EBF-001");
    for (const type of BUSINESS_TYPES) {
      assert.ok(state.configuration.businessTypes.includes(type));
    }
    for (const status of APPROVAL_STATUSES) {
      assert.ok(state.configuration.approvalStatuses.includes(status));
    }
  });

  test("3 accepts a Grand King command", async () => {
    const report = (await build()).acceptGrandKingCommand({
      originalCommand: "Build a media business.",
      grandKingCommandId: "gk-cmd-media-01",
      validated: true,
    });
    assert.equal(report.action, "accept_command");
    assert.equal(report.latestMission!.originalCommand, "Build a media business.");
    assert.equal(report.latestMission!.traceabilityReference, "gk-cmd-media-01");
    assert.equal(report.validation.decision, "pass");
  });

  test("4 creates a Business Build Mission with classified type", async () => {
    const report = (await build()).createBusinessBuildMission({
      originalCommand: "Build a commerce business.",
      grandKingCommandId: "gk-cmd-commerce-01",
      validated: true,
    });
    assert.equal(report.action, "create_mission");
    assert.equal(report.latestMission!.businessType, "commerce");
    assert.ok(report.latestMission!.businessBuildMissionId.startsWith("ebf-bbm-"));
    assert.ok(report.latestMission!.missionObjective.includes("commerce"));
    assert.equal(report.latestMission!.currentStatus, "ready_for_q2_workers");
  });

  test("5 classifies local cleaning, affiliate, and digital product commands", async () => {
    const engine = await build();
    assert.equal(
      engine.classifyBusinessType({
        originalCommand: "Build a local cleaning business.",
        validated: true,
      }).latestMission!.businessType,
      "local_cleaning",
    );
    assert.equal(
      engine.classifyBusinessType({
        originalCommand: "Build an affiliate business.",
        validated: true,
      }).latestMission!.businessType,
      "affiliate",
    );
    assert.equal(
      engine.classifyBusinessType({
        originalCommand: "Build a digital product business.",
        validated: true,
      }).latestMission!.businessType,
      "digital_product",
    );
  });

  test("6 captures mission objective and approval status", async () => {
    const report = (await build()).createBusinessBuildMission({
      originalCommand: "Build a media business.",
      approvalStatus: "pending_pillow_review",
      validated: true,
    });
    assert.ok(report.latestMission!.missionObjective.length > 0);
    assert.equal(report.latestMission!.approvalStatus, "pending_pillow_review");
    assert.ok(report.latestMission!.expectedBusinessOutput.includes("media"));
  });

  test("7 prepares mission for later Q2 workers", async () => {
    const engine = await build();
    engine.acceptGrandKingCommand({
      originalCommand: "Build a saas business.",
      businessType: "saas",
      validated: true,
    });
    const report = engine.prepareMission({
      originalCommand: "Build a saas business.",
      businessType: "saas",
      validated: true,
    });
    assert.equal(report.action, "prepare_mission");
    assert.equal(report.latestMission!.preparedForQ2Workers, true);
    assert.equal(report.latestMission!.requiredNextStep, "hand_off_to_q2_02");
  });

  test("8 produces machine-readable Business Build Mission records", async () => {
    const engine = await build();
    engine.createBusinessBuildMission({
      originalCommand: "Build an affiliate business.",
      grandKingCommandId: "gk-cmd-aff-01",
      validated: true,
    });
    const report = engine.produceMission({ validated: true });
    const catalog = report.catalog!;
    assert.equal(catalog.missionVersion, BUSINESS_BUILD_MISSION_VERSION);
    assert.ok(catalog.missions.length >= 1);
    const mission = catalog.missions[catalog.missions.length - 1]!;
    assert.ok(mission.businessBuildMissionId);
    assert.ok(mission.timestamp);
    assert.ok(mission.originalCommand);
    assert.ok(mission.businessType);
    assert.ok(mission.missionObjective);
    assert.ok(mission.expectedBusinessOutput);
    assert.ok(mission.currentStatus);
    assert.ok(mission.requiredNextStep);
    assert.ok(mission.approvalStatus);
    assert.ok(mission.traceabilityReference);
    assert.equal(mission.metadataVersion, "EBF-001-v1");
  });

  test("9 rejects strategy / model / market / worker / execute / launch / Q2-02 boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.createBusinessBuildMission({
        originalCommand: "Build a media business.",
        interpretDetailedBusinessStrategy: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.createBusinessBuildMission({
        originalCommand: "Build a media business.",
        generateBusinessModels: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.classifyBusinessType({
        originalCommand: "Build a media business.",
        researchMarkets: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.prepareMission({
        originalCommand: "Build a media business.",
        assignWorkers: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceMission({
        executeBusinesses: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateEmpireBuilderFactoryCore({
        launchBusinesses: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.createBusinessBuildMission({
        originalCommand: "Build a media business.",
        implementQ202OrLater: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.ok(EBF_CAPABILITIES.includes("create_business_build_mission"));
    assert.ok(EBF_CAPABILITIES.includes("preserve_traceability_to_grand_king_command"));
  });

  test("10 supports extensible business types", async () => {
    const engine = await build({
      configuration: {
        businessTypes: [...BUSINESS_TYPES, "subscription_box"],
      },
    });
    const report = engine.createBusinessBuildMission({
      originalCommand: "Build a subscription box business.",
      businessType: "subscription_box",
      validated: true,
    });
    assert.equal(report.latestMission!.businessType, "subscription_box");
    assert.ok(engine.getState().configuration.businessTypes.includes("subscription_box"));
  });
});
