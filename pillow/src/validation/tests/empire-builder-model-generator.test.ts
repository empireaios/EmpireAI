import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  BUSINESS_MODEL_TYPES,
  BUSINESS_MODEL_VERSION,
  EMG_CAPABILITIES,
  buildEmpireBuilderModelGeneratorConfiguration,
  createEmpireBuilderModelGenerator,
  resetEmpireBuilderModelGeneratorForTesting,
} from "../../empire-builder-model-generator/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createEmpireBuilderModelGenerator>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createEmpireBuilderModelGenerator(bootstrap, config);
  await engine.initialize();
  engine.connectEmpireBuilderModelGenerator();
  return engine;
}

const sampleIntent = {
  intentId: "bii-intent-sample-01",
  originalCommand: "Build a commerce business for local retailers via Shopify under $5000 to achieve first 100 orders.",
  businessType: "commerce",
  businessIdea: "Build a commerce business for local retailers via Shopify",
  targetCustomer: "local retailers",
  productServiceCategory: "commerce",
  channelPlatform: "Shopify",
  constraints: ["budget_under_5000"],
  successObjective: "first 100 orders",
  confidenceScore: 0.85,
  missingInformation: [] as string[],
};

describe("Q2-03 Empire Builder Model Generator", () => {
  beforeEach(resetEmpireBuilderModelGeneratorForTesting);

  test("1 locks mandatory empire-builder-model-generator boundaries", () => {
    const c = buildEmpireBuilderModelGeneratorConfiguration(REPO_ROOT, {
      neverValidateDemand: false as never,
      neverPerformMarketResearch: false as never,
      neverBuildBranding: false as never,
      neverAssignWorkers: false as never,
      neverLaunchBusiness: false as never,
      neverImplementQ204OrLater: false as never,
    });
    assert.equal(c.neverValidateDemand, true);
    assert.equal(c.neverPerformMarketResearch, true);
    assert.equal(c.neverBuildBranding, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverLaunchBusiness, true);
    assert.equal(c.neverImplementQ204OrLater, true);
  });

  test("2 initializes PILLOW-EMG-001 for Q2-03", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q2-03");
    assert.equal(state.engineVersion, "PILLOW-EMG-001");
    for (const type of BUSINESS_MODEL_TYPES) {
      assert.ok(state.configuration.businessModelTypes.includes(type));
    }
  });

  test("3 receives structured Business Intent", async () => {
    const report = (await build()).receiveBusinessIntent({
      intent: sampleIntent,
      validated: true,
    });
    assert.equal(report.action, "receive_intent");
    assert.equal(report.latestModel!.sourceIntentId, "bii-intent-sample-01");
    assert.equal(report.latestModel!.businessType, "commerce");
    assert.equal(report.validation.decision, "pass");
  });

  test("4 generates Business Model with value proposition and revenue model", async () => {
    const report = (await build()).generateBusinessModel({
      intent: sampleIntent,
      validated: true,
    });
    const model = report.latestModel!;
    assert.ok(model.businessModelId.startsWith("emg-model-"));
    assert.equal(model.businessModelType, "commerce_retail");
    assert.ok(model.valueProposition.length > 0);
    assert.ok(model.revenueModel.includes("product_sales"));
    assert.ok(model.operatingModel.length > 0);
    assert.ok(model.productsServices.length >= 1);
    assert.ok(model.customerSegments.includes("local retailers"));
  });

  test("5 defines cost model, capabilities, integrations, and assumptions", async () => {
    const report = (await build()).generateBusinessModel({
      intent: sampleIntent,
      validated: true,
    });
    const model = report.latestModel!;
    assert.ok(model.costModel.length > 0);
    assert.ok(model.requiredCapabilities.includes("catalog_management"));
    assert.ok(model.requiredIntegrations.includes("shopify"));
    assert.ok(model.businessAssumptions.some((a) => a.includes("demand_not_validated")));
    assert.equal(model.metadataVersion, "EMG-001-v1");
  });

  test("6 maps media, local cleaning, affiliate, and digital product intents", async () => {
    const engine = await build();
    assert.equal(
      engine.generateBusinessModel({
        businessType: "media",
        businessIdea: "Build a media business.",
        validated: true,
      }).latestModel!.businessModelType,
      "media_content",
    );
    assert.equal(
      engine.generateBusinessModel({
        businessType: "local_cleaning",
        businessIdea: "Build a local cleaning business.",
        validated: true,
      }).latestModel!.businessModelType,
      "local_service",
    );
    assert.equal(
      engine.generateBusinessModel({
        businessType: "affiliate",
        businessIdea: "Build an affiliate business.",
        validated: true,
      }).latestModel!.businessModelType,
      "affiliate_referral",
    );
    assert.equal(
      engine.generateBusinessModel({
        businessType: "digital_product",
        businessIdea: "Build a digital product business.",
        validated: true,
      }).latestModel!.businessModelType,
      "digital_product",
    );
  });

  test("7 produces machine-readable Business Model catalog", async () => {
    const engine = await build();
    engine.generateBusinessModel({ intent: sampleIntent, validated: true });
    const report = engine.produceBusinessModel({ validated: true });
    assert.equal(report.catalog!.modelVersion, BUSINESS_MODEL_VERSION);
    assert.ok(report.catalog!.models.length >= 1);
    const model = report.catalog!.models[0]!;
    assert.ok(model.businessModelId);
    assert.ok(model.timestamp);
    assert.ok(model.businessType);
    assert.ok(model.valueProposition);
    assert.ok(Array.isArray(model.productsServices));
    assert.ok(Array.isArray(model.customerSegments));
    assert.ok(model.revenueModel);
    assert.ok(model.costModel);
    assert.ok(model.operatingModel);
    assert.ok(Array.isArray(model.requiredCapabilities));
    assert.ok(Array.isArray(model.requiredIntegrations));
    assert.ok(Array.isArray(model.businessAssumptions));
  });

  test("8 rejects demand / research / branding / assign / launch / Q2-04 boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.generateBusinessModel({
        intent: sampleIntent,
        validateDemand: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.generateBusinessModel({
        intent: sampleIntent,
        performMarketResearch: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.generateBusinessModel({
        intent: sampleIntent,
        buildBranding: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceBusinessModel({ assignWorkers: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateEmpireBuilderModelGenerator({
        launchBusiness: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.generateBusinessModel({
        intent: sampleIntent,
        implementQ204OrLater: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.ok(EMG_CAPABILITIES.includes("produce_machine_readable_business_model"));
    assert.ok(EMG_CAPABILITIES.includes("receive_structured_business_intent"));
  });

  test("9 supports extensible business model types", async () => {
    const engine = await build({
      configuration: {
        businessModelTypes: [...BUSINESS_MODEL_TYPES, "marketplace_hybrid"],
      },
    });
    const report = engine.generateBusinessModel({
      businessType: "commerce",
      businessIdea: "Build a marketplace.",
      businessModelType: "marketplace_hybrid",
      validated: true,
    });
    assert.equal(report.latestModel!.businessModelType, "marketplace_hybrid");
    assert.ok(engine.getState().configuration.businessModelTypes.includes("marketplace_hybrid"));
  });

  test("10 preserves intent traceability without launching or validating demand", async () => {
    const report = (await build()).generateBusinessModel({
      intent: sampleIntent,
      validated: true,
    });
    const model = report.latestModel!;
    assert.equal(model.sourceIntentId, sampleIntent.intentId);
    assert.equal(model.originalCommand, sampleIntent.originalCommand);
    assert.equal(model.neverValidateDemand, true);
    assert.equal(model.neverLaunchBusiness, true);
    assert.equal(model.preparedForDownstreamPlanning, true);
  });
});
