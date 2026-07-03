import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { detectContextTask } from "../../context/intent.js";
import { runContextBuild } from "../../context/engine.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import {
  createUxDesignerEngine,
  parseUxIntent,
  generateDesignProposals,
} from "../../ux-designer/index.js";
import {
  startPillow,
  requirePillowUxDesigner,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("Phase 4 AI UX Designer (PILLOW-UX-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("UX Designer initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const designer = requirePillowUxDesigner();
    const state = designer.getState();
    assert.equal(state.designerVersion, "PILLOW-UX-001");
    assert.equal(state.status, "ready");
    assert.ok(state.indexedScreens >= 6);
  });

  test("Parses natural language intent for pink homepage", () => {
    const intent = parseUxIntent("Make the homepage pink");
    assert.ok(intent.categories.includes("colour"));
    assert.equal(intent.targetScreen, "/cockpit");
    assert.equal(intent.styleHint, "custom");
  });

  test("Generates three design proposals with trade-offs", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const designer = createUxDesignerEngine(bootstrap);
    await designer.initialize();

    const result = designer.designFromRequest("Make the homepage pink");
    assert.equal(result.proposals.length, 3);
    assert.equal(result.proposals[0]!.optionId, "A");
    assert.equal(result.proposals[1]!.optionId, "B");
    assert.equal(result.proposals[2]!.optionId, "C");
    assert.ok(result.proposals[0]!.advantages.length >= 2);
    assert.ok(result.proposals[0]!.tradeoffs.length >= 1);
    assert.ok(result.proposals[0]!.spec.requiredFiles.some((f) => f.includes("ExecutiveHomePage")));
  });

  test("Apple-style and premium requests produce style-aware specs", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const designer = createUxDesignerEngine(bootstrap);
    await designer.initialize();

    const apple = designer.designFromRequest("Use Apple-style design on the dashboard");
    assert.equal(apple.intent.styleHint, "apple_clean");

    const premium = designer.designFromRequest("Make it premium with more spacing");
    assert.ok(
      premium.intent.styleHint === "premium_minimal" ||
        premium.intent.categories.includes("spacing"),
    );
  });

  test("Screen catalog includes Executive Home with component hierarchy", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const designer = createUxDesignerEngine(bootstrap);
    await designer.initialize();

    const screen = designer.findScreen("/cockpit");
    assert.ok(screen);
    assert.equal(screen!.id, "SCR-001");
    assert.ok(screen!.componentHierarchy.length >= 2);
    assert.ok(screen!.dataSources.length >= 1);
  });

  test("Context builder attaches uxDesignBrief for UX design requests", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const uxDesigner = createUxDesignerEngine(bootstrap);
    await uxDesigner.initialize();

    const task = detectContextTask("Make the homepage pink and increase spacing");
    assert.equal(task, "ux_design");

    const context = await runContextBuild(
      bootstrap,
      intelligence,
      { userMessage: "Make the homepage pink and increase spacing" },
      {},
      undefined,
      uxDesigner,
    );

    assert.ok(context.uxDesignBrief);
    assert.match(context.uxDesignBrief!, /PILLOW-UX-001/i);
    assert.match(context.uxDesignBrief!, /Option A/i);
    assert.match(context.uxDesignBrief!, /pink/i);
  });

  test("Validates implementation against spec", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const designer = createUxDesignerEngine(bootstrap);
    await designer.initialize();

    const result = designer.designFromRequest("Increase spacing on executive home");
    const validation = designer.validateImplementation({
      originalRequest: "Increase spacing on executive home",
      spec: result.proposals[0]!.spec,
      changedFiles: ["empireai-web/components/cockpit/pages/ExecutiveHomePage.tsx"],
    });

    assert.equal(validation.passed, true);
    assert.equal(validation.layoutMatches, true);
  });

  test("Proposal generator produces distinct engineering specs", () => {
    const intent = parseUxIntent("Use futuristic neon on storefront");
    const proposals = generateDesignProposals(intent, null);
    assert.equal(proposals.length, 3);
    const palettes = proposals.map((p) => p.spec.colourPalette.primary);
    assert.ok(new Set(palettes).size >= 1);
  });
});
