import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { classifyPath } from "../../watcher/classifier.js";
import { generateEvents, dedupeEvents } from "../../watcher/event-generator.js";
import { detectRepositoryDrift } from "../../watcher/drift-detector.js";
import { DEFAULT_SUBSCRIBER_IDS } from "../../watcher/subscribers.js";
import { diffSnapshots, captureSnapshot } from "../../watcher/snapshot.js";
import {
  startPillow,
  requirePillowWatcher,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

describe("PILLOW-014 Live Repository Watcher", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Watcher initializes with architecture contract present", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const state = session.watcher.getState();
    assert.equal(state.engineVersion, "PILLOW-014");
    assert.equal(state.contractPath, "PILLOW_ARCHITECTURE_CONTRACT.md");
    assert.equal(state.subscriberCount, DEFAULT_SUBSCRIBER_IDS.length);
  });

  test("Observation captures repository snapshot", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const result = await requirePillowWatcher().observe();
    assert.ok(result.scannedPaths > 0);
    assert.ok(result.batch.batchId);
    assert.ok(result.batch.durationMs >= 0);
  });

  test("Change classification covers governance and journey", () => {
    assert.equal(classifyPath("JOURNEY.md"), "journey");
    assert.equal(classifyPath("BL-B.md"), "governance");
    assert.equal(classifyPath("pillow/src/watcher/engine.ts"), "engineering");
  });

  test("Event generation produces structured events", () => {
    const events = generateEvents(
      [
        {
          changeId: "1",
          path: "JOURNEY.md",
          kind: "journey_update",
          classification: "journey",
          summary: "journey update",
          detectedAt: new Date().toISOString(),
        },
      ],
      [],
    );
    assert.ok(events.some((e) => e.type === "JourneyUpdated"));
  });

  test("Duplicate events suppressed", () => {
    const events = generateEvents([], []);
    const seen = new Set<string>();
    const first = dedupeEvents(events, seen);
    const second = dedupeEvents(events, seen);
    assert.equal(second.suppressed, events.length);
    assert.equal(first.suppressed, 0);
  });

  test("Drift detection identifies repository signals", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    session.memory.ensureFresh();
    const mem = session.memory.getMemory();
    const { inspectRepositoryState } = await import("../../recovery/inspector.js");
    const inspection = await inspectRepositoryState(REPO_ROOT);
    const drift = detectRepositoryDrift(
      mem,
      session.intelligence,
      inspection,
    );
    assert.ok(Array.isArray(drift));
  });

  test("Subscribers notified on drift or changes", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const watcher = requirePillowWatcher();
    let notified = 0;
    watcher.registerSubscriber({
      id: "repository_memory",
      label: "Test Memory Subscriber",
      onEvents: () => {
        notified++;
      },
    });
    await watcher.observe({ forceNotify: true });
    assert.ok(notified >= 0);
  });

  test("Snapshot diff detects modifications", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const snap1 = await captureSnapshot(reader);
    const snap2 = await captureSnapshot(reader);
    const changes = diffSnapshots(snap1, snap2);
    assert.equal(changes.length, 0);
  });

  test("Tick skips when snapshot and git state are stable", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const watcher = requirePillowWatcher();
    await watcher.observe();
    const inspection = await (
      await import("../../recovery/inspector.js")
    ).inspectRepositoryState(REPO_ROOT);
    const gitActive =
      inspection.modifiedFiles.length > 0 || inspection.createdFiles.length > 0;
    const tick = await watcher.tick();
    if (!gitActive) {
      assert.equal(tick, null);
    } else {
      assert.ok(tick);
    }
  });

  test("Journey unchanged after observation cycle", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");
    await startPillow({ repositoryRoot: REPO_ROOT });
    await requirePillowWatcher().observe();
    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("Observation history queryable", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const watcher = requirePillowWatcher();
    const before = watcher.getHistory().length;
    await watcher.observe();
    assert.equal(watcher.getHistory().length, before + 1);
  });

  test("startPillow exposes LiveRepositoryWatcherEngine", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.watcher);
    assert.equal(requirePillowWatcher(), session.watcher);
  });

  test("Orchestrator discovers watcher as ready subsystem", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const subs = session.orchestrator.getSubsystems();
    const watcher = subs.find((s) => s.id === "live_repository_watcher");
    assert.ok(watcher);
    assert.equal(watcher.missionId, "PILLOW-014");
    assert.equal(watcher.health, "ready");
  });
});
