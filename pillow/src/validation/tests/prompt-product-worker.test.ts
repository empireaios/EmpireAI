import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  PPW_CAPABILITIES,
  PPW_INTEGRATION_TARGETS,
  PPW_METADATA_VERSION,
  PPW_PRODUCT_TYPES,
  PROMPT_PRODUCT_REPORT_VERSION,
  buildPromptProductWorkerConfiguration,
  createPromptProductWorker,
  resetPromptProductWorkerForTesting,
} from "../../prompt-product-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(options?: Parameters<typeof createPromptProductWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createPromptProductWorker(bootstrap, options);
  await engine.initialize();
  engine.connect();
  return engine;
}

const researchInput = {
  researchReportId: "dpr-rsh-001",
  opportunityId: "dpr-opp-001",
  businessId: "dbiz-prompt-01",
  factoryMissionId: "dpf-dpm-prompt-01",
  productTitle: "Freelancer Client Onboarding Prompt Pack",
  productType: "prompt_pack" as const,
  targetAudience: "Solo freelancers and consultants",
  targetAiPlatforms: ["chatgpt", "claude"] as const,
  customerPainPoints: [
    "Inconsistent AI prompt quality for client onboarding",
    "No reusable prompt library for kickoff workflows",
  ],
  marketGap: "Affordable structured prompt packs for freelancer onboarding",
  demandAssessment: "High demand for reusable AI onboarding prompts",
  researchTopic: "Freelance client onboarding prompt pack",
  validated: true,
};

const fullInput = {
  ...researchInput,
  productType: "prompt_pack" as const,
  validated: true,
};

describe("Q5-04 Prompt Product Worker", () => {
  beforeEach(resetPromptProductWorkerForTesting);

  test("1 locks mandatory prompt-product-worker boundaries", () => {
    const c = buildPromptProductWorkerConfiguration(REPO_ROOT, {
      neverBuildSalesPages: false as never,
      neverProcessCustomerPayments: false as never,
      neverProcessPayments: false as never,
      neverDeliverProducts: false as never,
      neverPublishProductsDirectly: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ505OrLater: false as never,
      followApprovedProductResearch: false as never,
      followApprovedProductIntent: false as never,
    });
    assert.equal(c.neverBuildSalesPages, true);
    assert.equal(c.neverProcessCustomerPayments, true);
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverDeliverProducts, true);
    assert.equal(c.neverPublishProductsDirectly, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ505OrLater, true);
    assert.equal(c.followApprovedProductResearch, true);
    assert.equal(c.followApprovedProductIntent, true);
  });

  test("2 initializes PILLOW-PPW-001 for Q5-04 with DPF + DPR integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q5-04");
    assert.equal(state.engineVersion, "PILLOW-PPW-001");
    assert.equal(state.configuration.workerId, "wkr-prompt-product-01");
    for (const target of PPW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(state.configuration.integrationTargets.includes("digital_product_research_worker"));
    assert.ok(state.configuration.integrationTargets.includes("digital_products_factory_core"));
    for (const type of PPW_PRODUCT_TYPES) {
      assert.ok(state.configuration.supportedProductTypes.includes(type));
    }
    assert.ok(PPW_CAPABILITIES.includes("receive_approved_digital_product_research"));
    assert.ok(PPW_CAPABILITIES.includes("produce_machine_readable_prompt_product_reports"));
  });

  test("3 receives approved digital product research", async () => {
    const report = (await build()).receiveApprovedDigitalProductResearch(researchInput);
    assert.equal(report.action, "receive_approved_digital_product_research");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestPromptProduct!.researchReportId, "dpr-rsh-001");
    assert.equal(report.latestPromptProduct!.opportunityId, "dpr-opp-001");
    assert.ok(report.latestPromptProduct!.promptProductId.startsWith("ppw-ppt-"));
  });

  test("4 designs prompt architecture and creates prompt libraries", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    const architecture = engine.designPromptArchitecture(fullInput);
    assert.equal(architecture.action, "design_prompt_architecture");
    assert.ok(architecture.latestPromptProduct!.promptArchitecture);
    assert.ok(architecture.latestPromptProduct!.promptArchitecture!.layers.length >= 1);

    const libraries = engine.createPromptLibraries(fullInput);
    assert.equal(libraries.action, "create_prompt_libraries");
    assert.ok(libraries.latestPromptProduct!.promptLibrary.length >= 1);
  });

  test("5 creates templates, AI workflows, and multiple product types", async () => {
    assert.ok(PPW_PRODUCT_TYPES.includes("prompt_pack"));
    assert.ok(PPW_PRODUCT_TYPES.includes("prompt_library"));
    assert.ok(PPW_PRODUCT_TYPES.includes("ai_workflow_system"));

    const packEngine = await build();
    packEngine.receiveApprovedDigitalProductResearch({
      ...researchInput,
      productType: "prompt_pack",
    });
    packEngine.designPromptArchitecture({ ...fullInput, productType: "prompt_pack" });
    packEngine.createPromptLibraries({ ...fullInput, productType: "prompt_pack" });
    const templates = packEngine.createReusablePromptTemplates({
      ...fullInput,
      productType: "prompt_pack",
    });
    assert.equal(templates.action, "create_reusable_prompt_templates");
    assert.equal(templates.latestPromptProduct!.productType, "prompt_pack");
    assert.ok(templates.latestPromptProduct!.promptLibrary.length >= 1);

    const workflows = packEngine.createAiWorkflowProducts({
      ...fullInput,
      productType: "prompt_pack",
    });
    assert.equal(workflows.action, "create_ai_workflow_products");
    assert.ok(workflows.latestPromptProduct!.workflowComponents.length >= 1);

    resetPromptProductWorkerForTesting();
    const libraryEngine = await build();
    const received = libraryEngine.receiveApprovedDigitalProductResearch({
      researchReportId: "dpr-rsh-library-01",
      opportunityId: "dpr-opp-library-01",
      businessId: "dbiz-library-01",
      factoryMissionId: "dpf-dpm-library-01",
      productTitle: "Freelancer Prompt Library",
      productType: "prompt_library",
      targetAudience: "Solo freelancers and consultants",
      researchTopic: "Freelance prompt library",
      validated: true,
    });
    assert.equal(received.latestPromptProduct!.productType, "prompt_library");
    libraryEngine.designPromptArchitecture({
      productType: "prompt_library",
      productTitle: "Freelancer Prompt Library",
      validated: true,
    });
    const library = libraryEngine.createPromptLibraries({
      productType: "prompt_library",
      validated: true,
    });
    assert.equal(library.latestPromptProduct!.productType, "prompt_library");
    assert.ok(library.latestPromptProduct!.promptLibrary.length >= 1);
  });

  test("6 organizes structured packs and generates user instructions", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.designPromptArchitecture(fullInput);
    engine.createPromptLibraries(fullInput);
    engine.createReusablePromptTemplates(fullInput);
    engine.createAiWorkflowProducts(fullInput);

    const packs = engine.organizePromptsIntoStructuredPacks(fullInput);
    assert.equal(packs.action, "organize_prompts_into_structured_packs");
    assert.ok(packs.latestPromptProduct!.structuredPacks.length >= 1);

    const instructions = engine.generateUserInstructions(fullInput);
    assert.equal(instructions.action, "generate_user_instructions");
    assert.ok(instructions.latestPromptProduct!.userInstructions.length > 0);
  });

  test("7 validates prompt consistency and packages export-ready products", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.designPromptArchitecture(fullInput);
    engine.createPromptLibraries(fullInput);
    engine.createReusablePromptTemplates(fullInput);
    engine.createAiWorkflowProducts(fullInput);
    engine.organizePromptsIntoStructuredPacks(fullInput);
    engine.generateUserInstructions(fullInput);

    const consistency = engine.validatePromptConsistency(fullInput);
    assert.equal(consistency.action, "validate_prompt_consistency");
    assert.ok(consistency.latestPromptProduct!.qualityReview.length > 0);
    assert.ok(typeof consistency.latestPromptProduct!.consistencyValidated === "boolean");
    assert.ok(consistency.latestPromptProduct!.confidenceScore > 0);

    const exportReady = engine.packageExportReadyPromptProducts(fullInput);
    assert.equal(exportReady.action, "package_export_ready_prompt_products");
    assert.ok(exportReady.latestPromptProduct!.exportFormats.length >= 1);
  });

  test("8 produces Prompt Product Report with all required fields", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.designPromptArchitecture(fullInput);
    engine.createPromptLibraries(fullInput);
    engine.createReusablePromptTemplates(fullInput);
    engine.createAiWorkflowProducts(fullInput);
    engine.organizePromptsIntoStructuredPacks(fullInput);
    engine.generateUserInstructions(fullInput);
    engine.validatePromptConsistency(fullInput);
    engine.packageExportReadyPromptProducts(fullInput);

    const report = engine.producePromptProductReport(fullInput);
    const latest = report.latestPromptProduct!;
    assert.ok(latest.promptProductId.startsWith("ppw-ppt-"));
    assert.ok(latest.timestamp);
    assert.ok(latest.productId.startsWith("ppw-prd-") || latest.productId.length > 0);
    assert.ok(latest.productTitle.length > 0);
    assert.ok(PPW_PRODUCT_TYPES.includes(latest.productType as (typeof PPW_PRODUCT_TYPES)[number]));
    assert.ok(Array.isArray(latest.targetAiPlatforms));
    assert.ok(latest.targetAiPlatforms.length >= 1);
    assert.ok(Array.isArray(latest.promptCategories));
    assert.ok(Array.isArray(latest.promptLibrary));
    assert.ok(latest.promptLibrary.length >= 1);
    assert.ok(Array.isArray(latest.workflowComponents));
    assert.ok(latest.userInstructions.length > 0);
    assert.ok(latest.qualityReview.length > 0);
    assert.ok(Array.isArray(latest.exportFormats));
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, PPW_METADATA_VERSION);
    assert.equal(latest.reportVersion, PROMPT_PRODUCT_REPORT_VERSION);
    assert.equal(latest.neverPublishProductsDirectly, true);
    assert.equal(latest.neverBuildSalesPages, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
  });

  test("9 rejects sales-page/payment/deliver/publish/override/Q5-05 boundaries", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    for (const forbidden of [
      { buildSalesPages: true },
      { processPayments: true },
      { processCustomerPayments: true },
      { deliverProducts: true },
      { publishProductsDirectly: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ505OrLater: true },
    ] as const) {
      const report = engine.producePromptProductReport({
        ...fullInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestPromptProduct, null);
    }
  });

  test("10 lists + submits via ERR + cockpit", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createPromptProductWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-ppw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.designPromptArchitecture(fullInput);
    engine.createPromptLibraries(fullInput);
    engine.createReusablePromptTemplates(fullInput);
    engine.createAiWorkflowProducts(fullInput);
    engine.organizePromptsIntoStructuredPacks(fullInput);
    engine.generateUserInstructions(fullInput);
    engine.validatePromptConsistency(fullInput);
    engine.packageExportReadyPromptProducts(fullInput);
    const produced = engine.producePromptProductReport(fullInput);
    const listed = engine.list();
    assert.ok(listed.promptProducts.length >= 1);
    const submitted = engine.submitReport({
      promptProductId: produced.latestPromptProduct!.promptProductId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q5-04"]);
    assert.equal(submitted.latestPromptProduct!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestPromptProduct!.executiveReportId, "ert-worker-ppw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q5-04");
    assert.equal(cockpit.neverPublishProductsDirectly, true);
    assert.equal(cockpit.neverBuildSalesPages, true);
  });
});
