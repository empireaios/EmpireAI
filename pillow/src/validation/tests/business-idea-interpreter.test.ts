import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  BII_CAPABILITIES,
  BUSINESS_INTENT_VERSION,
  BUSINESS_TYPES,
  buildBusinessIdeaInterpreterConfiguration,
  createBusinessIdeaInterpreter,
  resetBusinessIdeaInterpreterForTesting,
} from "../../business-idea-interpreter/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createBusinessIdeaInterpreter>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createBusinessIdeaInterpreter(bootstrap, config);
  await engine.initialize();
  engine.connectBusinessIdeaInterpreter();
  return engine;
}

describe("Q2-02 Business Idea Interpreter", () => {
  beforeEach(resetBusinessIdeaInterpreterForTesting);

  test("1 locks mandatory business-idea-interpreter boundaries", () => {
    const c = buildBusinessIdeaInterpreterConfiguration(REPO_ROOT, {
      neverGenerateBusinessModels: false as never,
      neverResearchMarkets: false as never,
      neverBuildBusinesses: false as never,
      neverAssignWorkers: false as never,
      neverExecuteAnything: false as never,
      neverImplementQ203OrLater: false as never,
    });
    assert.equal(c.neverGenerateBusinessModels, true);
    assert.equal(c.neverResearchMarkets, true);
    assert.equal(c.neverBuildBusinesses, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverExecuteAnything, true);
    assert.equal(c.neverImplementQ203OrLater, true);
  });

  test("2 initializes PILLOW-BII-001 for Q2-02", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q2-02");
    assert.equal(state.engineVersion, "PILLOW-BII-001");
    for (const type of BUSINESS_TYPES) {
      assert.ok(state.configuration.businessTypes.includes(type));
    }
  });

  test("3 accepts plain-language business commands", async () => {
    const report = (await build()).acceptBusinessCommand({
      originalCommand: "Build a media business.",
      validated: true,
    });
    assert.equal(report.action, "accept_command");
    assert.equal(report.latestIntent!.originalCommand, "Build a media business.");
    assert.equal(report.latestIntent!.businessType, "media");
    assert.equal(report.validation.decision, "pass");
  });

  test("4 produces structured business intent with confidence and missing info", async () => {
    const report = (await build()).interpretBusinessIdea({
      originalCommand: "Build a commerce business.",
      validated: true,
    });
    const intent = report.latestIntent!;
    assert.ok(intent.intentId.startsWith("bii-intent-"));
    assert.equal(intent.businessType, "commerce");
    assert.ok(intent.businessIdea.includes("commerce"));
    assert.ok(typeof intent.confidenceScore === "number");
    assert.ok(intent.confidenceScore >= 0.35);
    assert.ok(Array.isArray(intent.missingInformation));
    assert.ok(intent.missingInformation.includes("target_customer"));
    assert.equal(intent.metadataVersion, "BII-001-v1");
  });

  test("5 extracts optional fields when stated", async () => {
    const report = (await build()).interpretBusinessIdea({
      originalCommand:
        "Build a commerce business for local retailers via Shopify under $5000 to achieve first 100 orders.",
      validated: true,
    });
    const intent = report.latestIntent!;
    assert.equal(intent.businessType, "commerce");
    assert.equal(intent.targetCustomer, "local retailers");
    assert.equal(intent.channelPlatform, "Shopify");
    assert.ok(intent.constraints.some((c) => c.includes("budget_under_5000")));
    assert.ok(intent.successObjective?.includes("first 100 orders"));
    assert.ok(intent.confidenceScore > 0.7);
  });

  test("6 classifies media, local cleaning, affiliate, and digital product", async () => {
    const engine = await build();
    assert.equal(
      engine.interpretBusinessIdea({
        originalCommand: "Build a media business.",
        validated: true,
      }).latestIntent!.businessType,
      "media",
    );
    assert.equal(
      engine.interpretBusinessIdea({
        originalCommand: "Build a local cleaning business.",
        validated: true,
      }).latestIntent!.businessType,
      "local_cleaning",
    );
    assert.equal(
      engine.interpretBusinessIdea({
        originalCommand: "Build an affiliate business.",
        validated: true,
      }).latestIntent!.businessType,
      "affiliate",
    );
    assert.equal(
      engine.interpretBusinessIdea({
        originalCommand: "Build a digital product business.",
        validated: true,
      }).latestIntent!.businessType,
      "digital_product",
    );
  });

  test("7 preserves original command for traceability", async () => {
    const command = "Build an affiliate business for creators on YouTube.";
    const report = (await build()).interpretBusinessIdea({
      originalCommand: command,
      validated: true,
    });
    assert.equal(report.latestIntent!.originalCommand, command);
    assert.equal(report.latestIntent!.channelPlatform, "YouTube");
    assert.equal(report.latestIntent!.targetCustomer, "creators");
  });

  test("8 produces machine-readable intent catalog", async () => {
    const engine = await build();
    engine.interpretBusinessIdea({
      originalCommand: "Build a media business.",
      validated: true,
    });
    const report = engine.produceIntent({ validated: true });
    assert.equal(report.catalog!.intentVersion, BUSINESS_INTENT_VERSION);
    assert.ok(report.catalog!.intents.length >= 1);
    const intent = report.catalog!.intents[0]!;
    assert.ok(intent.intentId);
    assert.ok(intent.timestamp);
    assert.ok(intent.originalCommand);
    assert.ok(intent.businessType);
    assert.ok(intent.businessIdea);
    assert.ok(Array.isArray(intent.constraints));
    assert.ok(Array.isArray(intent.missingInformation));
    assert.ok(typeof intent.confidenceScore === "number");
  });

  test("9 rejects model / market / build / assign / execute / Q2-03 boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.interpretBusinessIdea({
        originalCommand: "Build a media business.",
        generateBusinessModels: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.interpretBusinessIdea({
        originalCommand: "Build a media business.",
        researchMarkets: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.interpretBusinessIdea({
        originalCommand: "Build a media business.",
        buildBusinesses: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceIntent({ assignWorkers: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateBusinessIdeaInterpreter({
        executeAnything: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.interpretBusinessIdea({
        originalCommand: "Build a media business.",
        implementQ203OrLater: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.ok(BII_CAPABILITIES.includes("produce_structured_business_intent"));
    assert.ok(BII_CAPABILITIES.includes("identify_missing_information"));
  });

  test("10 supports extensible business types", async () => {
    const engine = await build({
      configuration: {
        businessTypes: [...BUSINESS_TYPES, "subscription_box"],
      },
    });
    const report = engine.interpretBusinessIdea({
      originalCommand: "Build a subscription box business.",
      businessType: "subscription_box",
      validated: true,
    });
    assert.equal(report.latestIntent!.businessType, "subscription_box");
    assert.ok(engine.getState().configuration.businessTypes.includes("subscription_box"));
  });
});
