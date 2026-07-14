import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import { RepositoryMemoryEngine } from "../../memory/engine.js";
import { MissionPlannerEngine } from "../../planner/engine.js";
import { createVisionSynchronizationEngine } from "../../vision-synchronization/index.js";
import { createContextSynchronizationEngine } from "../../context-synchronization/index.js";
import {
  createCursorProtocolEngine,
  MANDATORY_PROTOCOL_SECTIONS,
  validateProtocolDocument,
} from "../../cursor-protocol/index.js";
import {
  startPillow,
  requirePillowCursorProtocol,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function createProtocolStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
  if (!isBootstrapReady(bootstrap)) assert.fail();
  const intelligence = await runRepositoryIntelligence({ bootstrap });
  const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
  memory.initialize();
  const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
  planner.initialize();
  const visionSync = createVisionSynchronizationEngine(bootstrap, memory, planner);
  await visionSync.initialize();
  const contextSync = createContextSynchronizationEngine(
    bootstrap,
    intelligence,
    memory,
    planner,
    visionSync,
  );
  await contextSync.initialize();
  const protocol = createCursorProtocolEngine(
    bootstrap,
    planner,
    visionSync,
    contextSync,
  );
  await protocol.initialize();
  planner.setVisionSynchronization(visionSync);
  planner.setContextSynchronization(contextSync);
  planner.setCursorProtocol(protocol);
  return { bootstrap, planner, protocol, visionSync, contextSync };
}

describe("P4-04 Cursor Protocol (PILLOW-CP-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Cursor Protocol Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowCursorProtocol();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CP-001");
    assert.equal(state.status, "ready");
  });

  test("Pre-mission checks run seven validations", async () => {
    const { protocol } = await createProtocolStack();
    const gate = protocol.evaluateBuilderGateSync({ missionId: "P4-04" });
    assert.equal(gate.envelope.preMissionChecks.length, 7);
    assert.ok(gate.formattedProtocol.includes("Pre-Mission Checks"));
  });

  test("Sample mission 1 — planner generated mission contains all mandatory sections", async () => {
    const { planner } = await createProtocolStack();
    const doc = planner.generateNextMission();
    if (doc) {
      const validation = validateProtocolDocument(doc.formatted);
      assert.equal(
        validation.valid,
        true,
        `Missing: ${validation.missingSections.join(", ")}`,
      );
    }
  });

  test("Sample mission 2 — protocol wrap on custom body contains all mandatory sections", async () => {
    const { protocol } = await createProtocolStack();
    const body = "## Engineering Task\nImplement sample feature per standards.";
    const wrapped = protocol.wrapMissionDocument(body, {
      missionId: "SAMPLE-02",
      missionTitle: "Sample Protocol Mission 2",
      missionPurpose: "Verify Cursor Protocol auto-wrap",
    });
    const validation = validateProtocolDocument(wrapped.document);
    assert.equal(validation.valid, true);
    assert.match(wrapped.document, /CURSOR PROTOCOL/);
    assert.match(wrapped.document, /## Implementation/);
  });

  test("Sample mission 3 — validateProtocolDocument enforces all MANDATORY_PROTOCOL_SECTIONS", async () => {
    const { protocol } = await createProtocolStack();
    const gate = protocol.applyProtocol({
      missionId: "SAMPLE-03",
      missionTitle: "Sample Protocol Mission 3",
      implementationBody: "Custom implementation body for validation.",
    });
    const validation = validateProtocolDocument(gate.formattedProtocol);
    assert.equal(
      validation.valid,
      true,
      `Missing sections: ${validation.missingSections.join(", ")}`,
    );
    assert.equal(validation.presentSections.length, MANDATORY_PROTOCOL_SECTIONS.length);
  });
});
