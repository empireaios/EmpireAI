import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import { queryRepository } from "../../intelligence/query.js";
import {
  startPillow,
  requirePillowIntelligence,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

describe("PILLOW-003 Repository Intelligence Engine", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Intelligence requires Bootstrap output", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    assert.equal(bootstrap.status, "ready");
    if (!isBootstrapReady(bootstrap)) return;

    const intelligence = await runRepositoryIntelligence({ bootstrap });
    assert.equal(intelligence.intelligenceVersion, "PILLOW-003");
    assert.equal(intelligence.status, "ready");
    assert.ok(intelligence.entities.length > 100);
  });

  test("Repository artifacts classified successfully", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();

    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const byClass = intelligence.graphSummary.byClassification;

    assert.ok((byClass.reality_owner ?? 0) > 50);
    assert.ok((byClass.ux ?? 0) >= 20);
    assert.ok((byClass.doctrine ?? 0) >= 2);
    assert.ok((byClass.global_component ?? 0) >= 7);
    assert.ok((byClass.executive_component ?? 0) >= 5);
    assert.ok(byClass.bootstrap === 1 || byClass.bootstrap === undefined);
    assert.ok(intelligence.entities.some((e) => e.id === "PILLOW-003"));
  });

  test("Relationship graph established", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();

    const intelligence = await runRepositoryIntelligence({ bootstrap });
    assert.ok(intelligence.relationships.length > 50);

    const ux014Deps = intelligence.relationships.filter(
      (r) => r.from === "UX-014",
    );
    assert.ok(ux014Deps.length > 0);

    const pillowChain = intelligence.relationships.some(
      (r) => r.from === "PILLOW-003" && r.to === "PILLOW-002",
    );
    assert.ok(pillowChain);
  });

  test("Dependency graph generated", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();

    const intelligence = await runRepositoryIntelligence({ bootstrap });
    assert.ok(intelligence.dependencies.length > 30);

    const missionDeps = intelligence.dependencies.filter(
      (d) => d.kind === "mission",
    );
    assert.ok(missionDeps.length > 0);

    const ownerDeps = intelligence.dependencies.filter(
      (d) => d.kind === "owner",
    );
    assert.ok(ownerDeps.length > 0);
  });

  test("Repository health evaluation completed", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();

    const intelligence = await runRepositoryIntelligence({ bootstrap });
    assert.ok(intelligence.health.score >= 0);
    assert.ok(intelligence.health.score <= 100);
    assert.ok(Array.isArray(intelligence.health.issues));
    assert.ok(intelligence.health.indicators.totalEntities > 0);

    const duplicateIssue = intelligence.health.issues.find(
      (i) => i.code === "DUPLICATE_OWNERSHIP",
    );
    assert.ok(duplicateIssue, "Should detect known REAL-003/004/005 conflicts");
  });

  test("Natural query: What owns UX-014?", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const result = queryRepository(
      "What owns UX-014?",
      {
        entities: session.intelligence.entities,
        bootstrap: session.bootstrap,
      },
      session.intelligence.relationships,
      session.intelligence.dependencies,
    );

    assert.equal(result.matched, true);
    assert.ok(result.answers[0]?.answer.includes("REAL-086"));
  });

  test("Natural query: What depends on REAL-070?", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const result = queryRepository(
      "What depends on REAL-070?",
      {
        entities: session.intelligence.entities,
        bootstrap: session.bootstrap,
      },
      session.intelligence.relationships,
      session.intelligence.dependencies,
    );

    assert.equal(result.matched, true);
    assert.ok(result.answers[0]?.answer.includes("UX-017"));
  });

  test("Natural query: doctrines affecting Bootstrap", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const result = queryRepository(
      "Which doctrines affect Bootstrap?",
      {
        entities: session.intelligence.entities,
        bootstrap: session.bootstrap,
      },
      session.intelligence.relationships,
      session.intelligence.dependencies,
    );

    assert.equal(result.matched, true);
    assert.match(result.answers[0]?.answer ?? "", /doctrine|PILLOW|Repository/i);
  });

  test("Natural query: what remains before Pillow", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const result = queryRepository(
      "What remains before Pillow?",
      {
        entities: session.intelligence.entities,
        bootstrap: session.bootstrap,
      },
      session.intelligence.relationships,
      session.intelligence.dependencies,
    );

    assert.equal(result.matched, true);
    assert.ok(result.answers[0]?.answer.length ?? 0 > 10);
  });

  test("Intelligence is read-only — no repository writes", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const journeyBefore = await reader.readText("JOURNEY.md");

    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    await runRepositoryIntelligence({ bootstrap });

    const journeyAfter = await reader.readText("JOURNEY.md");
    assert.equal(journeyBefore, journeyAfter);
  });

  test("Intelligence completes within reasonable time", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();

    const intelligence = await runRepositoryIntelligence({ bootstrap });
    assert.ok(
      intelligence.durationMs < 5000,
      `Intelligence took ${intelligence.durationMs}ms`,
    );
  });

  test("startPillow chains Bootstrap then Intelligence", async () => {
    resetPillowSession();
    await startPillow({ repositoryRoot: REPO_ROOT });
    const intelligence = requirePillowIntelligence();
    assert.equal(intelligence.intelligenceVersion, "PILLOW-003");
  });
});
