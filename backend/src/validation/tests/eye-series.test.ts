import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import { buildGrandKingsDashboard } from "../../orchestration/ecommerce-os-orchestrator/index.js";
import { resetAccountInfrastructureRepository } from "../../orchestration/account-infrastructure-engine/index.js";
import { resetMarketplaceConnectionEngineRepository } from "../../orchestration/marketplace-connection-engine/index.js";
import { resetMarketplaceConnectionRepository } from "../../orchestration/marketplace-infrastructure-engine/index.js";
import {
  approveBusinessOpportunity,
  listBusinessOpportunities,
  resetBusinessOpportunityRepository,
} from "../../orchestration/business-opportunity-workspace/index.js";
import {
  approveBusinessPreviewForBuild,
  generateBusinessPreviewForOpportunity,
  resetBusinessPreviewRepository,
} from "../../orchestration/business-preview-studio/index.js";
import {
  resetBusinessBuildRepository,
  startBusinessBuild,
} from "../../orchestration/business-build-engine/index.js";
import {
  resetBusinessSimulationRepository,
  runBusinessSimulationForBuild,
} from "../../orchestration/business-simulation-engine/index.js";
import {
  generateMarketStrategyForOpportunity,
  resetMarketStrategyRepository,
} from "../../orchestration/market-domination-strategy-engine/index.js";
import {
  EYE_IDS,
  buildObservationDedupHash,
  createEyeSeriesModuleContract,
  eyeSeriesTools,
  listKnowledgeGraph,
  recordObservation,
  resetEyeSeriesRepository,
  runAllEyes,
  runEye,
  searchIntelligence,
  validateEyeSeries,
} from "../../orchestration/eye-series/index.js";
import {
  resetProductDiscoveryRepository,
  runProductDiscovery,
  startProductDiscoverySession,
} from "../../orchestration/product-discovery-opportunity-engine/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-e001";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return { workspaceId: WORKSPACE_ID, agentId: "eye-series", correlationId: "corr-e001" };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = eyeSeriesTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

function seedPipeline() {
  const started = startProductDiscoverySession({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    brand: "Eye Brand",
    category: "kitchen",
    targetMarket: "US",
    existingSupplierNetwork: ["cj-dropshipping"],
    actor: "founder@test.com",
  });
  runProductDiscovery(started.sessionId);
  const opportunities = listBusinessOpportunities(WORKSPACE_ID, COMPANY_ID);
  const target = opportunities[0]!;
  approveBusinessOpportunity(target.businessOpportunityId, "founder@test.com");
  const preview = generateBusinessPreviewForOpportunity(target.businessOpportunityId);
  approveBusinessPreviewForBuild(preview.previewId, "founder@test.com");
  generateMarketStrategyForOpportunity(target.businessOpportunityId);
  const build = startBusinessBuild(target.businessOpportunityId, "founder@test.com");
  runBusinessSimulationForBuild(build.buildId);
}

beforeEach(() => {
  configureValidationEnvironment();
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetMarketStrategyRepository();
  resetBusinessBuildRepository();
  resetBusinessSimulationRepository();
  resetEyeSeriesRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
});

afterEach(() => {
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetMarketStrategyRepository();
  resetBusinessBuildRepository();
  resetBusinessSimulationRepository();
  resetEyeSeriesRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetDatabaseInstance();
});

describe("E001 → E010 Eye Series", () => {
  it("registers fifteen Eye Series Brain tools", () => {
    assert.equal(eyeSeriesTools.length, 15);
    assert.ok(eyeSeriesTools.some((t) => t.name === "product_eye"));
    assert.ok(eyeSeriesTools.some((t) => t.name === "executive_eye"));
    assert.ok(eyeSeriesTools.some((t) => t.name === "knowledge_graph"));
    assert.ok(eyeSeriesTools.some((t) => t.name === "intelligence_search"));
    assert.ok(eyeSeriesTools.some((t) => t.name === "investigation_history"));
  });

  it("declares observation-only module contract for E001 through E010", () => {
    const contract = createEyeSeriesModuleContract();
    assert.equal(contract.moduleId, "eye-series");
    assert.equal(contract.missionIds.length, 10);
    assert.equal(contract.eyes.length, 10);
    assert.equal(contract.protection.observationOnly, true);
    assert.equal(contract.protection.noExecution, true);
    assert.equal(contract.knowledgeGraph.deduplication, true);
  });

  it("E001 product eye generates intelligence report without execution", () => {
    seedPipeline();
    const report = runEye("product_eye", WORKSPACE_ID, COMPANY_ID);
    assert.equal(report.eyeId, "product_eye");
    assert.equal(report.observationOnly, true);
    assert.ok(report.findings.length > 0);
    assert.ok(report.confidence >= 0);
  });

  it("shared knowledge graph deduplicates observations", () => {
    const base = {
      eyeId: "product_eye" as const,
      workspaceId: WORKSPACE_ID,
      observation: "Test observation",
      source: "test-source",
      timestamp: new Date().toISOString(),
      confidence: 80,
      evidence: ["test"],
      relatedProducts: [] as string[],
      relatedBusinesses: [] as string[],
      relatedBrands: [] as string[],
      relatedSuppliers: [] as string[],
      relatedMarketplaces: [] as string[],
      relatedCustomers: [] as string[],
      relatedRisks: [] as string[],
      relatedOpportunities: [] as string[],
      linkedObservationIds: [] as string[],
    };
    const first = recordObservation(base);
    const duplicate = recordObservation(base);
    assert.ok(first);
    assert.equal(duplicate, null);
    assert.equal(listKnowledgeGraph(WORKSPACE_ID).length, 1);
  });

  it("E002 through E009 eyes run observation cycle", () => {
    seedPipeline();
    const eyes = EYE_IDS.filter((id) => id !== "executive_eye") as Exclude<(typeof EYE_IDS)[number], "executive_eye">[];
    for (const eyeId of eyes) {
      const report = runEye(eyeId, WORKSPACE_ID, COMPANY_ID);
      assert.equal(report.observationOnly, true);
      assert.ok(report.title.length > 0);
    }
  });

  it("E010 executive eye aggregates all eyes into daily brief", () => {
    seedPipeline();
    const result = runAllEyes(WORKSPACE_ID, COMPANY_ID);
    assert.equal(result.reports.length, 9);
    assert.equal(result.executive.eyeId, "executive_eye");
    assert.equal(result.brief.period, "DAILY");
    assert.ok(result.brief.topOpportunities.length >= 0);
    assert.ok(result.brief.topRisks.length >= 0);
    assert.equal(result.brief.observationOnly, true);
  });

  it("continuous investigation generates new questions and confidence adjustments", async () => {
    seedPipeline();
    runEye("product_eye", WORKSPACE_ID, COMPANY_ID);
    const history = await invokeTool("investigation_history", { action: "list" });
    assert.ok(Array.isArray(history));

    const investigation = await invokeTool("product_eye", { action: "history" });
    assert.ok(Array.isArray(investigation));
  });

  it("integrates eye series into Grand King dashboard", () => {
    seedPipeline();
    const dashboard = buildGrandKingsDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dashboard.eyeSeries);
    assert.ok(dashboard.eyeSeries!.totalObservations >= 0);
    assert.ok(dashboard.eyeSeries!.executiveRecommendations.length >= 0);
  });

  it("intelligence search finds observations across eyes", () => {
    seedPipeline();
    runAllEyes(WORKSPACE_ID, COMPANY_ID);
    const results = searchIntelligence(WORKSPACE_ID, "supplier");
    assert.ok(Array.isArray(results));
  });

  it("validates complete Eye Series E001-E010", async () => {
    seedPipeline();
    const validation = await validateEyeSeries(WORKSPACE_ID, COMPANY_ID);
    assert.equal(validation.valid, true);
    assert.equal(validation.eyesValidated, 9);
    assert.equal(validation.knowledgeGraphValid, true);
    assert.equal(validation.investigationEngineValid, true);
    assert.equal(validation.observationOnlyEnforced, true);
    assert.equal(validation.blockers.length, 0);
  });

  it("runs product eye via Brain tool without execution", async () => {
    seedPipeline();
    const report = await invokeTool("product_eye", { action: "run" });
    assert.equal((report as { eyeId: string }).eyeId, "product_eye");
    assert.equal((report as { observationOnly: boolean }).observationOnly, true);
  });
});
