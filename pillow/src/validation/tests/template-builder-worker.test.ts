import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  TBW_CAPABILITIES,
  TBW_INTEGRATION_TARGETS,
  TBW_METADATA_VERSION,
  TBW_PRODUCT_TYPES,
  TEMPLATE_BUILDER_REPORT_VERSION,
  buildTemplateBuilderWorkerConfiguration,
  createTemplateBuilderWorker,
  resetTemplateBuilderWorkerForTesting,
} from "../../template-builder-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(options?: Parameters<typeof createTemplateBuilderWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createTemplateBuilderWorker(bootstrap, options);
  await engine.initialize();
  engine.connect();
  return engine;
}

const researchInput = {
  researchReportId: "dpr-rsh-001",
  opportunityId: "dpr-opp-001",
  businessId: "dbiz-template-01",
  factoryMissionId: "dpf-dpm-template-01",
  productTitle: "Freelancer Client Onboarding Template Pack",
  productType: "business_templates" as const,
  targetAudience: "Solo freelancers and consultants",
  customerPainPoints: [
    "No reusable onboarding templates across clients",
    "Inconsistent contracts, forms, and planners",
  ],
  marketGap: "Affordable reusable template pack for freelancer onboarding",
  demandAssessment: "High demand for plug-and-play business templates",
  researchTopic: "Freelance client onboarding templates",
  validated: true,
};

const fullInput = {
  ...researchInput,
  productType: "business_templates" as const,
  validated: true,
};

describe("Q5-06 Template Builder Worker", () => {
  beforeEach(resetTemplateBuilderWorkerForTesting);

  test("1 locks mandatory template-builder-worker boundaries", () => {
    const c = buildTemplateBuilderWorkerConfiguration(REPO_ROOT, {
      neverBuildSalesPages: false as never,
      neverProcessPayments: false as never,
      neverDeliverProductsToCustomers: false as never,
      neverPublishProductsDirectly: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ507OrLater: false as never,
      followApprovedProductResearch: false as never,
      followApprovedProductIntent: false as never,
    });
    assert.equal(c.neverBuildSalesPages, true);
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverDeliverProductsToCustomers, true);
    assert.equal(c.neverPublishProductsDirectly, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ507OrLater, true);
    assert.equal(c.followApprovedProductResearch, true);
    assert.equal(c.followApprovedProductIntent, true);
  });

  test("2 initializes PILLOW-TBW-001 for Q5-06 with DPF + DPR integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q5-06");
    assert.equal(state.engineVersion, "PILLOW-TBW-001");
    assert.equal(state.configuration.workerId, "wkr-template-builder-01");
    for (const target of TBW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(state.configuration.integrationTargets.includes("digital_product_research_worker"));
    assert.ok(state.configuration.integrationTargets.includes("digital_products_factory_core"));
    for (const type of TBW_PRODUCT_TYPES) {
      assert.ok(state.configuration.supportedProductTypes.includes(type));
    }
    assert.ok(TBW_CAPABILITIES.includes("receive_approved_digital_product_research"));
    assert.ok(TBW_CAPABILITIES.includes("produce_machine_readable_template_builder_reports"));
  });

  test("3 receives approved digital product research", async () => {
    const report = (await build()).receiveApprovedDigitalProductResearch(researchInput);
    assert.equal(report.action, "receive_approved_digital_product_research");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestTemplateProduct!.researchReportId, "dpr-rsh-001");
    assert.equal(report.latestTemplateProduct!.opportunityId, "dpr-opp-001");
    assert.ok(report.latestTemplateProduct!.templateProductId.startsWith("tbw-tpl-"));
  });

  test("4 generates reusable templates and planners", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    const templates = engine.generateReusableTemplates(fullInput);
    assert.equal(templates.action, "generate_reusable_templates");
    assert.ok(templates.latestTemplateProduct!.templates.length >= 1);

    const planners = engine.generatePlanners(fullInput);
    assert.equal(planners.action, "generate_planners");
    assert.ok(planners.latestTemplateProduct!.planners.length >= 1);
  });

  test("5 generates spreadsheets, contracts, and multiple product types", async () => {
    assert.ok(TBW_PRODUCT_TYPES.includes("business_templates"));
    assert.ok(TBW_PRODUCT_TYPES.includes("spreadsheet_templates"));
    assert.ok(TBW_PRODUCT_TYPES.includes("contracts"));

    const packEngine = await build();
    packEngine.receiveApprovedDigitalProductResearch({
      ...researchInput,
      productType: "business_templates",
    });
    packEngine.generateReusableTemplates({ ...fullInput, productType: "business_templates" });
    packEngine.generatePlanners({ ...fullInput, productType: "business_templates" });
    const spreadsheets = packEngine.generateSpreadsheets({
      ...fullInput,
      productType: "business_templates",
    });
    assert.equal(spreadsheets.action, "generate_spreadsheets");
    assert.equal(spreadsheets.latestTemplateProduct!.productType, "business_templates");
    assert.ok(spreadsheets.latestTemplateProduct!.spreadsheets.length >= 1);

    const contracts = packEngine.generateContractsAndDocumentTemplates({
      ...fullInput,
      productType: "business_templates",
    });
    assert.equal(contracts.action, "generate_contracts_and_document_templates");
    assert.ok(contracts.latestTemplateProduct!.contracts.length >= 1);

    resetTemplateBuilderWorkerForTesting();
    const spreadsheetEngine = await build();
    const received = spreadsheetEngine.receiveApprovedDigitalProductResearch({
      researchReportId: "dpr-rsh-sheet-01",
      opportunityId: "dpr-opp-sheet-01",
      businessId: "dbiz-sheet-01",
      factoryMissionId: "dpf-dpm-sheet-01",
      productTitle: "Freelancer Spreadsheet Pack",
      productType: "spreadsheet_templates",
      targetAudience: "Solo freelancers and consultants",
      researchTopic: "Freelance spreadsheet templates",
      validated: true,
    });
    assert.equal(received.latestTemplateProduct!.productType, "spreadsheet_templates");
    spreadsheetEngine.generateReusableTemplates({
      productType: "spreadsheet_templates",
      productTitle: "Freelancer Spreadsheet Pack",
      validated: true,
    });
    const sheets = spreadsheetEngine.generateSpreadsheets({
      productType: "spreadsheet_templates",
      validated: true,
    });
    assert.equal(sheets.latestTemplateProduct!.productType, "spreadsheet_templates");
    assert.ok(sheets.latestTemplateProduct!.spreadsheets.length >= 1);
  });

  test("6 generates forms/checklists and prompt libraries", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.generateReusableTemplates(fullInput);
    engine.generatePlanners(fullInput);
    engine.generateSpreadsheets(fullInput);
    engine.generateContractsAndDocumentTemplates(fullInput);

    const forms = engine.generateBusinessFormsAndChecklists(fullInput);
    assert.equal(forms.action, "generate_business_forms_and_checklists");
    assert.ok(forms.latestTemplateProduct!.forms.length >= 1);
    assert.ok(forms.latestTemplateProduct!.checklists.length >= 1);

    const prompts = engine.generateReusablePromptLibraries(fullInput);
    assert.equal(prompts.action, "generate_reusable_prompt_libraries");
    assert.ok(prompts.latestTemplateProduct!.promptLibrary.length >= 1);
  });

  test("7 validates usability and prepares export-ready packages", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.generateReusableTemplates(fullInput);
    engine.generatePlanners(fullInput);
    engine.generateSpreadsheets(fullInput);
    engine.generateContractsAndDocumentTemplates(fullInput);
    engine.generateBusinessFormsAndChecklists(fullInput);
    engine.generateReusablePromptLibraries(fullInput);

    const usability = engine.validateUsabilityAndCompleteness(fullInput);
    assert.equal(usability.action, "validate_usability_and_completeness");
    assert.ok(usability.latestTemplateProduct!.qualityReview.length > 0);
    assert.ok(typeof usability.latestTemplateProduct!.usabilityValidated === "boolean");
    assert.ok(usability.latestTemplateProduct!.confidenceScore > 0);

    const exportReady = engine.prepareExportReadyTemplatePackages(fullInput);
    assert.equal(exportReady.action, "prepare_export_ready_template_packages");
    assert.ok(exportReady.latestTemplateProduct!.exportFormats.length >= 1);
  });

  test("8 produces Template Builder Report with all required fields", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.generateReusableTemplates(fullInput);
    engine.generatePlanners(fullInput);
    engine.generateSpreadsheets(fullInput);
    engine.generateContractsAndDocumentTemplates(fullInput);
    engine.generateBusinessFormsAndChecklists(fullInput);
    engine.generateReusablePromptLibraries(fullInput);
    engine.validateUsabilityAndCompleteness(fullInput);
    engine.prepareExportReadyTemplatePackages(fullInput);

    const report = engine.produceTemplateBuilderReport(fullInput);
    const latest = report.latestTemplateProduct!;
    assert.ok(latest.templateProductId.startsWith("tbw-tpl-"));
    assert.ok(latest.timestamp);
    assert.ok(latest.productId.startsWith("tbw-prd-") || latest.productId.length > 0);
    assert.ok(latest.productTitle.length > 0);
    assert.ok(latest.productCategory.length > 0);
    assert.ok(TBW_PRODUCT_TYPES.includes(latest.productType as (typeof TBW_PRODUCT_TYPES)[number]));
    assert.ok(Array.isArray(latest.templateTypes));
    assert.ok(latest.templateTypes.length >= 1);
    assert.ok(Array.isArray(latest.includedAssets));
    assert.ok(latest.includedAssets.length >= 1);
    assert.ok(latest.targetAudience.length > 0);
    assert.ok(Array.isArray(latest.supportedFormats));
    assert.ok(latest.supportedFormats.length >= 1);
    assert.ok(latest.qualityReview.length > 0);
    assert.ok(Array.isArray(latest.exportFormats));
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, TBW_METADATA_VERSION);
    assert.equal(latest.reportVersion, TEMPLATE_BUILDER_REPORT_VERSION);
    assert.equal(latest.neverPublishProductsDirectly, true);
    assert.equal(latest.neverBuildSalesPages, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
  });

  test("9 rejects sales-page/payment/deliver/publish/override/Q5-07 boundaries", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    for (const forbidden of [
      { buildSalesPages: true },
      { processPayments: true },
      { deliverProductsToCustomers: true },
      { publishProductsDirectly: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ507OrLater: true },
    ] as const) {
      const report = engine.produceTemplateBuilderReport({
        ...fullInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestTemplateProduct, null);
    }
  });

  test("10 lists + submits via ERR + cockpit", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createTemplateBuilderWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-tbw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.generateReusableTemplates(fullInput);
    engine.generatePlanners(fullInput);
    engine.generateSpreadsheets(fullInput);
    engine.generateContractsAndDocumentTemplates(fullInput);
    engine.generateBusinessFormsAndChecklists(fullInput);
    engine.generateReusablePromptLibraries(fullInput);
    engine.validateUsabilityAndCompleteness(fullInput);
    engine.prepareExportReadyTemplatePackages(fullInput);
    const produced = engine.produceTemplateBuilderReport(fullInput);
    const listed = engine.list();
    assert.ok(listed.templateProducts.length >= 1);
    const submitted = engine.submitReport({
      templateProductId: produced.latestTemplateProduct!.templateProductId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q5-06"]);
    assert.equal(submitted.latestTemplateProduct!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestTemplateProduct!.executiveReportId, "ert-worker-tbw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q5-06");
    assert.equal(cockpit.neverPublishProductsDirectly, true);
    assert.equal(cockpit.neverBuildSalesPages, true);
  });
});
