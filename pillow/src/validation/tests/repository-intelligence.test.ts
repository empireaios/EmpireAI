import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import { queryRepository } from "../../intelligence/query.js";
import { detectContextTask } from "../../context/intent.js";
import { runContextBuild } from "../../context/engine.js";
import {
  queryRepositoryKnowledge,
  formatRepositoryKnowledgeAnswer,
} from "../../repository-intelligence/query-engine.js";
import { resetPillowSession } from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

describe("Phase 2 Repository Intelligence (PILLOW-RI-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Knowledge model builds with architecture, modules, and flows", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();

    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const model = intelligence.knowledgeModel;

    assert.equal(model.version, "PILLOW-RI-001");
    assert.ok(model.architecture.length >= 8);
    assert.ok(model.runtimeFlows.length >= 4);
    assert.ok(model.modules.length >= 10);
    assert.ok(model.screens.length >= 3);
    assert.ok(model.dependencies.length >= 5);
    assert.ok(model.indexedPaths > 0);
  });

  test("Where is pillow-host implemented?", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });

    const result = queryRepositoryKnowledge(
      "Where is pillow-host implemented?",
      intelligence.knowledgeModel,
    );

    assert.equal(result.matched, true);
    const text = formatRepositoryKnowledgeAnswer(result) ?? "";
    assert.match(text, /pillow-host|orchestration\/pillow-host/i);
  });

  test("Who owns the Brain module?", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });

    const result = queryRepositoryKnowledge(
      "Who owns the brain module?",
      intelligence.knowledgeModel,
    );

    assert.equal(result.matched, true);
    assert.match(result.answers[0]?.answer ?? "", /Brain|brain/i);
  });

  test("Which file renders the Pillow screen?", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });

    const result = queryRepositoryKnowledge(
      "Which file renders the pillow screen?",
      intelligence.knowledgeModel,
    );

    assert.equal(result.matched, true);
    assert.match(
      result.answers[0]?.answer ?? "",
      /DevelopmentPillowExperience|cockpit\/development\/pillow/i,
    );
  });

  test("How does the Pillow chat runtime flow work?", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });

    const result = queryRepositoryKnowledge(
      "How does the pillow chat runtime flow work?",
      intelligence.knowledgeModel,
    );

    assert.equal(result.matched, true);
    assert.match(result.answers[0]?.answer ?? "", /Pillow|chat|BFF|Brain/i);
  });

  test("Intent detection routes repository engineering questions", () => {
    assert.equal(
      detectContextTask("Where is pillow-host implemented?"),
      "repository_intelligence",
    );
    assert.equal(
      detectContextTask("What depends on the brain service?"),
      "repository_intelligence",
    );
  });

  test("Context builder attaches repository knowledge answer", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });

    const context = await runContextBuild(bootstrap, intelligence, {
      userMessage: "Where is pillow-host implemented?",
    });

    assert.equal(context.manifest.task, "repository_intelligence");
    assert.ok(context.repositoryKnowledgeAnswer);
    assert.match(context.repositoryKnowledgeAnswer, /pillow-host/i);
  });

  test("queryRepository delegates to Phase 2 knowledge model", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });

    const result = queryRepository(
      "Where is the BFF proxy implemented?",
      { entities: intelligence.entities, bootstrap },
      intelligence.relationships,
      intelligence.dependencies,
      intelligence,
    );

    assert.equal(result.matched, true);
    assert.match(result.answers[0]?.answer ?? "", /bff|empireai-web/i);
  });
});
