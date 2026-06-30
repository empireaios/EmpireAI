import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { buildMemoryFingerprint } from "../../memory/builder.js";
import { RepositoryMemoryEngine } from "../../memory/engine.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import {
  startPillow,
  requirePillowMemory,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

describe("PILLOW-005 Repository Memory Engine", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Memory initializes after Bootstrap and Intelligence", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const memory = session.memory.getMemory();

    assert.equal(memory.memoryVersion, "PILLOW-005");
    assert.equal(memory.status, "ready");
    assert.ok(memory.repositoryFingerprint.length > 0);
  });

  test("All memory domains populated with provenance", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const memory = requirePillowMemory().getMemory();
    const integrity = requirePillowMemory().verifyIntegrity();

    assert.equal(integrity.valid, true);
    assert.ok(memory.domains.journeyPosition.provenance.sources.length > 0);
    assert.ok(memory.domains.completedMissions.value.length > 0);
    assert.ok(memory.domains.realOwners.value.length > 0);
    assert.ok(memory.domains.executiveAudits.value.length > 0);
    assert.ok(memory.domains.decisions.value.adrCount > 0);
    assert.ok(memory.domains.doctrines.value.length > 0);
    assert.ok(memory.domains.contracts.value.length > 0);
    assert.ok(memory.domains.syncState.value.repositoryFingerprint);
  });

  test("Completed and pending missions distinguished", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const memory = requirePillowMemory().getMemory();

    const completedIds = memory.domains.completedMissions.value.map((m) => m.id);
    const pendingIds = memory.domains.pendingMissions.value.map((m) => m.id);

    assert.ok(completedIds.some((id) => id.startsWith("PILLOW-002")));
    assert.ok(completedIds.some((id) => id.startsWith("UX-")));
    assert.ok(
      completedIds.some((id) => id.includes("PILLOW-019")) ||
        pendingIds.some((id) => id.startsWith("PILLOW-")),
    );
    assert.ok(!completedIds.some((id) => pendingIds.includes(id)));
  });

  test("Memory refresh detects stale fingerprint", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const engine = new RepositoryMemoryEngine(bootstrap, intelligence);
    engine.initialize();

    assert.equal(engine.isStale(), false);

    const altered = {
      ...intelligence,
      completedAt: new Date(Date.now() + 60_000).toISOString(),
    };
    assert.equal(
      engine.isStale(buildMemoryFingerprint(bootstrap, altered)),
      true,
    );

    engine.refresh(bootstrap, altered);
    assert.equal(engine.isStale(), false);
  });

  test("ensureFresh refreshes stale memory", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const engine = new RepositoryMemoryEngine(bootstrap, intelligence);
    engine.initialize();
    const first = engine.getMemory().refreshedAt;

    engine.refresh(bootstrap, {
      ...intelligence,
      completedAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const second = engine.ensureFresh().refreshedAt;
    assert.ok(second >= first);
  });

  test("Memory services available to downstream modules", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const planner = requirePillowMemory().getServiceSnapshot("mission_planner");
    const reviewer =
      requirePillowMemory().getServiceSnapshot("executive_audit_reviewer");

    assert.equal(planner.memoryVersion, "PILLOW-005");
    assert.ok(reviewer.domains.executiveAudits.value.length > 0);
  });

  test("Context Builder supported — ensureFresh before context build", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const memoryBefore = requirePillowMemory().getMemory().refreshedAt;
    await import("../../session.js").then((m) =>
      m.buildPillowContext({ task: "empire_progress" }),
    );
    const memoryAfter = requirePillowMemory().getMemory().refreshedAt;
    assert.equal(memoryBefore, memoryAfter);
  });

  test("Memory never invents — ADR count matches bootstrap", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.equal(
      session.memory.getMemory().domains.decisions.value.adrCount,
      session.bootstrap.knownDecisions.adrCount,
    );
  });

  test("Read-only — repository unchanged after memory init", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");

    await startPillow({ repositoryRoot: REPO_ROOT });
    requirePillowMemory().refresh();

    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("Memory initialization completes within reasonable time", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const engine = new RepositoryMemoryEngine(bootstrap, intelligence);
    const memory = engine.initialize();
    assert.ok(memory.durationMs < 500);
  });

  test("startPillow exposes RepositoryMemoryEngine", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.memory);
    assert.equal(requirePillowMemory(), session.memory);
  });
});
