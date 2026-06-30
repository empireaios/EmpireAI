import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { ContextBuilder } from "../../context/engine.js";
import { buildRepositoryFingerprint } from "../../context/cache.js";
import { detectContextTask } from "../../context/intent.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import {
  startPillow,
  buildPillowContext,
  requirePillowContextBuilder,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

describe("PILLOW-004 Context Builder", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Context assembled dynamically per task", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });

    const ux = await session.contextBuilder.build({
      task: "continue_ux",
    });
    const progress = await session.contextBuilder.build({
      task: "empire_progress",
    });

    assert.equal(ux.manifest.contextVersion, "PILLOW-004");
    assert.ok(ux.manifest.sliceCount > 0);
    assert.notEqual(ux.manifest.paths.join(","), progress.manifest.paths.join(","));
  });

  test("continue_ux loads relevant repository artifacts", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const ctx = await buildPillowContext({ userMessage: "Continue UX work" });

    assert.equal(ctx.manifest.task, "continue_ux");
    assert.ok(ctx.manifest.paths.includes("JOURNEY.md"));
    assert.ok(ctx.manifest.paths.includes("UX_IMPLEMENTATION_CONTRACT.md"));
    assert.ok(
      ctx.manifest.paths.includes("docs/governance/UX_ENHANCEMENT_REGISTER.md"),
    );
  });

  test("generate_cursor_mission intent detection", async () => {
    assert.equal(
      detectContextTask("Generate Cursor mission for PILLOW-005"),
      "generate_cursor_mission",
    );
  });

  test("empire_progress loads Journey, Status, Soul", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const ctx = await buildPillowContext({
      userMessage: "How is Empire progressing?",
    });

    assert.equal(ctx.manifest.task, "empire_progress");
    assert.ok(ctx.manifest.paths.includes("JOURNEY.md"));
    assert.ok(ctx.manifest.paths.includes("EMPIREAI_STATUS.md"));
    assert.ok(ctx.manifest.paths.includes("EMPIREAI_SOUL.md"));
  });

  test("general task minimizes context", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const general = await buildPillowContext({ task: "general" });
    const ux = await buildPillowContext({ task: "continue_ux" });

    assert.equal(general.manifest.sliceCount, 0);
    assert.ok(ux.manifest.sliceCount > general.manifest.sliceCount);
    assert.ok(ux.manifest.totalBytes > general.manifest.totalBytes);
  });

  test("duplicate repository paths avoided", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const ctx = await buildPillowContext({ task: "continue_ux" });
    const uniquePaths = new Set(ctx.manifest.paths);
    assert.equal(uniquePaths.size, ctx.manifest.paths.length);
  });

  test("context cache improves repeat build speed", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const builder = requirePillowContextBuilder();

    const first = await builder.build({ task: "empire_progress" });
    assert.equal(first.manifest.cached, false);

    const second = await builder.build({ task: "empire_progress" });
    assert.equal(second.manifest.cached, true);
    assert.equal(second.manifest.sliceCount, first.manifest.sliceCount);
  });

  test("cache invalidates when fingerprint refreshed", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const builder = requirePillowContextBuilder();

    await builder.build({ task: "architecture" });
    const cached = await builder.build({ task: "architecture" });
    assert.equal(cached.manifest.cached, true);

    builder.refreshFingerprint();
    const afterRefresh = await builder.build({ task: "architecture" });
    assert.equal(afterRefresh.manifest.cached, false);
  });

  test("context minimization — no full repository dump", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const ctx = await buildPillowContext({ task: "continue_ux" });

    assert.ok(ctx.manifest.estimatedTokens < 25_000);
    assert.ok(ctx.manifest.sliceCount < 30);
    for (const slice of ctx.slices) {
      assert.ok(slice.byteLength <= 12_500);
    }
  });

  test("intelligence snapshot attached", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const ctx = await buildPillowContext({ task: "empire_progress" });

    assert.ok(ctx.intelligenceSnapshot.healthScore >= 0);
    assert.ok(typeof ctx.intelligenceSnapshot.healthIssueCount === "number");
  });

  test("read-only — repository unchanged after context build", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");

    await startPillow({ repositoryRoot: REPO_ROOT });
    await buildPillowContext({ task: "continue_ux" });
    await buildPillowContext({ task: "generate_cursor_mission" });

    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("build completes within reasonable time", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const builder = new ContextBuilder(bootstrap, intelligence);

    const ctx = await builder.build({ task: "review_executive_audit" });
    assert.ok(ctx.manifest.durationMs < 3000);
  });

  test("fingerprint derived from bootstrap artifacts", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const fp = buildRepositoryFingerprint(bootstrap);
    assert.ok(fp.includes("journey") || fp.length > 10);
  });

  test("startPillow exposes ContextBuilder", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.contextBuilder);
    assert.equal(requirePillowContextBuilder(), session.contextBuilder);
  });
});
