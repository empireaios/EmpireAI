import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  DEFAULT_M058_IDS,
  runManufacturingPipeline,
  storeExecutionSessionStore,
  storeExecutionTools,
} from "../../agents/store-execution-bridge/index.js";
import type { ToolContext } from "../../brain/types.js";

const WORKSPACE_ID = "ws-m058-bridge";

function toolContext(workspaceId = WORKSPACE_ID): ToolContext {
  return {
    workspaceId,
    agentId: "store-builder",
    correlationId: "corr-m058",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = storeExecutionTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

describe("Mission 058 Store Execution Bridge", () => {
  beforeEach(() => {
    storeExecutionSessionStore.clear();
  });

  it("runs the manufacturing pipeline end-to-end with deterministic mock inputs", async () => {
    const session = await runManufacturingPipeline(WORKSPACE_ID, {
      deterministicIds: DEFAULT_M058_IDS,
    });
    storeExecutionSessionStore.save(session);

    assert.equal(session.status, "complete");
    assert.equal(session.stages.length, 11);
    assert.ok(session.stages.every((stage) => stage.status === "complete"));
    assert.match(session.brand.brandName, /Kitchen Blender Supply Co\./);
    assert.ok(session.portfolio.heroProducts.length >= 1);
    assert.ok(session.offer.offerTitle);
    assert.ok(session.landingBlueprint.pageTitle.length > 0);
    assert.ok(session.storePages.pages.length >= 1);
    assert.ok(session.storefront.routes.length >= 1);
    assert.ok(session.generatedCode.generatedPages.length >= 1);
    assert.ok(session.artifacts.artifacts.length >= 1);
    assert.ok(session.ids.projectId);
  });

  it("exposes store.run_manufacturing_pipeline as a Brain tool with UI-shaped output", async () => {
    const result = (await invokeTool("store.run_manufacturing_pipeline", {
      useDeterministicMocks: true,
    })) as {
      status: string;
      stages: Array<{ moduleId: string; status: string }>;
      summary: { brandName: string; artifactCount: number; projectId: string };
    };

    assert.equal(result.status, "complete");
    assert.equal(result.stages.length, 11);
    assert.match(result.summary.brandName, /Kitchen Blender Supply Co\./);
    assert.ok(result.summary.artifactCount >= 1);
    assert.ok(result.summary.projectId);
  });

  it("returns structured UI-shaped JSON from each store getter tool", async () => {
    await invokeTool("store.run_manufacturing_pipeline", { useDeterministicMocks: true });

    const brand = (await invokeTool("store.get_brand")) as { brandId: string; brandName: string };
    const portfolio = (await invokeTool("store.get_product_portfolio")) as {
      brandId: string;
      heroProducts: unknown[];
    };
    const offer = (await invokeTool("store.get_offer")) as { offerId: string; offerTitle: string };
    const landing = (await invokeTool("store.get_landing_page")) as {
      pageId: string;
      blueprint: { confidence: number };
      content: { heroCopy: string };
    };
    const blueprint = (await invokeTool("store.get_store_blueprint")) as {
      storeId: string;
      navigation: unknown;
    };
    const pages = (await invokeTool("store.get_store_pages")) as {
      pages: Array<{ route: string; pageType: string }>;
    };
    const storefront = (await invokeTool("store.get_storefront")) as {
      storefrontId: string;
      routes: unknown[];
    };
    const code = (await invokeTool("store.get_generated_code")) as {
      generatedStorefrontId: string;
      generatedPages: unknown[];
    };

    assert.ok(brand.brandId);
    assert.equal(portfolio.brandId, brand.brandId);
    assert.ok(portfolio.heroProducts.length >= 1);
    assert.equal(offer.offerId, DEFAULT_M058_IDS.offerId);
    assert.equal(landing.pageId, DEFAULT_M058_IDS.pageId);
    assert.ok(landing.content.heroCopy.length > 0);
    assert.equal(blueprint.storeId, DEFAULT_M058_IDS.storeId);
    assert.ok(pages.pages.length >= 1);
    assert.equal(storefront.storefrontId, DEFAULT_M058_IDS.storefrontId);
    assert.equal(code.generatedStorefrontId, DEFAULT_M058_IDS.generatedStorefrontId);
  });

  it("lists generated artifacts from the pipeline session", async () => {
    await invokeTool("store.run_manufacturing_pipeline", { useDeterministicMocks: true });

    const artifacts = (await invokeTool("store.list_artifacts")) as {
      totalCount: number;
      artifacts: Array<{ filePath: string; fileType: string; preview: string }>;
    };

    assert.ok(artifacts.totalCount >= 1);
    assert.equal(artifacts.artifacts.length, artifacts.totalCount);
    assert.ok(artifacts.artifacts.every((artifact) => artifact.filePath.length > 0));
    assert.ok(artifacts.artifacts.every((artifact) => artifact.preview.length > 0));
  });

  it("retrieves the materialized project from the pipeline session", async () => {
    await invokeTool("store.run_manufacturing_pipeline", { useDeterministicMocks: true });

    const project = (await invokeTool("store.get_materialized_project")) as {
      projectId: string;
      projectStructure: { files: unknown[] };
      materializedFiles: unknown[];
      buildMetadata: unknown;
    };

    assert.ok(project.projectId);
    assert.ok(Array.isArray(project.projectStructure.files));
    assert.ok(project.materializedFiles.length >= 1);
    assert.ok(project.buildMetadata);
  });

  it("registers all eleven store execution bridge tools", () => {
    const names = storeExecutionTools.map((tool) => tool.name);
    assert.deepEqual(names, [
      "store.run_manufacturing_pipeline",
      "store.get_brand",
      "store.get_product_portfolio",
      "store.get_offer",
      "store.get_landing_page",
      "store.get_store_blueprint",
      "store.get_store_pages",
      "store.get_storefront",
      "store.get_generated_code",
      "store.list_artifacts",
      "store.get_materialized_project",
    ]);
  });
});
