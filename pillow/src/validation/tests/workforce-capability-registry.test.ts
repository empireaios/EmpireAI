import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  LOOKUP_DIMENSIONS,
  WCR_CAPABILITIES,
  buildWorkforceCapabilityRegistryConfiguration,
  createWorkforceCapabilityRegistry,
  resetWorkforceCapabilityRegistryForTesting,
} from "../../workforce-capability-registry/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkforceCapabilityRegistry(bootstrap);
  await engine.initialize();
  engine.connectWorkforceCapabilityRegistry();
  return engine;
}

describe("Q0-10 Workforce Capability Registry", () => {
  beforeEach(resetWorkforceCapabilityRegistryForTesting);

  test("1 locks mandatory workforce-capability-registry boundaries", () => {
    const c = buildWorkforceCapabilityRegistryConfiguration(REPO_ROOT, {
      neverExecuteWork: false as never,
      neverAssignWorkers: false as never,
      neverOrchestrateWorkers: false as never,
      neverApproveActions: false as never,
      neverReplacePillow: false as never,
    });
    assert.equal(c.neverExecuteWork, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverOrchestrateWorkers, true);
    assert.equal(c.neverApproveActions, true);
    assert.equal(c.neverReplacePillow, true);
  });

  test("2 initializes PILLOW-WCR-001 for Q0-10 with seeded registry", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-10");
    assert.equal(state.engineVersion, "PILLOW-WCR-001");
    assert.ok(state.health.totalWorkers >= 5);
    assert.ok(state.health.totalDepartments >= 5);
  });

  test("3 registers workers, departments, capabilities, tools, and skills", async () => {
    const engine = await build();
    const worker = engine.registerWorker({
      workerId: "wcr-wkr-marketing-99",
      workerName: "Marketing Specialist",
      department: "marketing",
      workerType: "specialist",
      capabilityList: ["message_framing", "channel_planning"],
      skillList: ["cross_team_coordination"],
      approvedTools: ["mission_planner"],
      dependencies: [],
      operatingLimits: {
        maxConcurrentMissions: 2,
        requiredApprovals: ["pillow_approval"],
        allowedTools: ["mission_planner"],
        securityRestrictions: ["no_secret_exfiltration"],
      },
      validated: true,
    }).records[0]!;
    assert.equal(worker.workerId, "wcr-wkr-marketing-99");
    assert.ok(worker.registryId.startsWith("wcr-reg-"));

    assert.equal(
      engine.registerDepartment({
        id: "dept-marketing",
        name: "marketing",
        description: "Marketing department",
        validated: true,
      }).validation.decision,
      "pass",
    );
    assert.equal(
      engine.registerCapability({
        id: "cap-message-framing",
        name: "message_framing",
        description: "Message framing capability",
        validated: true,
      }).validation.decision,
      "pass",
    );
    assert.equal(
      engine.registerTool({
        id: "tool-campaign",
        name: "campaign_builder",
        description: "Campaign builder tool",
        validated: true,
      }).validation.decision,
      "pass",
    );
    assert.equal(
      engine.registerSkill({
        id: "skill-messaging",
        name: "audience_messaging",
        description: "Audience messaging skill",
        validated: true,
      }).validation.decision,
      "pass",
    );
  });

  test("4 queries workers by capability", async () => {
    const matches = (await build()).lookup({
      dimension: "capability",
      query: "implementation_planning",
      validated: true,
    }).records;
    assert.ok(matches.length >= 1);
    assert.ok(matches.every((r) => r.capabilityList.includes("implementation_planning")));
  });

  test("5 queries workers by department", async () => {
    const matches = (await build()).lookup({
      dimension: "department",
      query: "engineering",
      validated: true,
    }).records;
    assert.ok(matches.length >= 1);
    assert.ok(matches.every((r) => r.department === "engineering"));
  });

  test("6 queries workers by tool", async () => {
    const matches = (await build()).lookup({
      dimension: "tool",
      query: "policy_checker",
      validated: true,
    }).records;
    assert.ok(matches.length >= 1);
    assert.ok(matches.every((r) => r.approvedTools.includes("policy_checker")));
  });

  test("7 produces machine-readable registry records with limits and dependencies", async () => {
    const record = (await build()).listRecords().records.find((r) => r.workerId === "wcr-wkr-engineering-01")!;
    assert.equal(record.metadataVersion, "WCR-001-v1");
    assert.ok(record.operatingLimits.maxConcurrentMissions > 0);
    assert.ok(record.operatingLimits.requiredApprovals.length > 0);
    assert.ok(record.dependencies.includes("wcr-wkr-product-01"));
    assert.equal(record.workExecuted, false);
    assert.equal(record.neverOrchestrateWorkers, true);
  });

  test("8 rejects execute / assign / orchestrate / approve / replace-Pillow boundary violations", async () => {
    const engine = await build();
    const base = {
      workerId: "wcr-wkr-x",
      workerName: "Boundary Probe",
      department: "operations",
      capabilityList: ["process_coordination"],
      validated: true as const,
    };
    assert.equal(engine.registerWorker({ ...base, executeWork: true }).validation.decision, "fail");
    assert.equal(engine.registerWorker({ ...base, assignWorkers: true }).validation.decision, "fail");
    assert.equal(engine.registerWorker({ ...base, orchestrateWorkers: true }).validation.decision, "fail");
    assert.equal(engine.registerWorker({ ...base, approveActions: true }).validation.decision, "fail");
    assert.equal(engine.registerWorker({ ...base, replacePillow: true }).validation.decision, "fail");
  });

  test("9 supports skill and status lookups plus status updates", async () => {
    const engine = await build();
    const bySkill = engine.lookup({ dimension: "skill", query: "risk_assessment", validated: true }).records;
    assert.ok(bySkill.length >= 1);
    const updated = engine.updateStatus({
      workerId: "wcr-wkr-operations-01",
      currentStatus: "busy",
      validated: true,
    }).records[0]!;
    assert.equal(updated.currentStatus, "busy");
    const byStatus = engine.lookup({ dimension: "status", query: "busy", validated: true }).records;
    assert.ok(byStatus.some((r) => r.workerId === "wcr-wkr-operations-01"));
    assert.ok(LOOKUP_DIMENSIONS.includes("status"));
    assert.ok(WCR_CAPABILITIES.includes("lookup_by_status"));
  });

  test("10 validates stored registry records", async () => {
    const engine = await build();
    const validation = engine.validateRegistry({ validated: true });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.ok(engine.getRecords().length >= 5);
    assert.equal(engine.getLatestRecord()?.neverExecuteWork, true);
  });
});
