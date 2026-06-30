import assert from "node:assert/strict";
import fs from "node:fs";
import { after, before, describe, it } from "node:test";

import { buildApp } from "../../app.js";
import { resetDatabaseInstance } from "../../brain/database.js";
import { env } from "../../config/env.js";
import {
  ApprovalGateEngine,
  ApprovalGateError,
} from "../../orchestration/pillow-approval/approval-gate-engine.js";
import {
  initializePillowHost,
  resetPillowHostSingleton,
  shutdownPillowHost,
} from "../../orchestration/pillow-host/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE = "ws_pillow_approval_test";

describe("PILLOW-017 Approval Gate + Cursor Bridge", () => {
  before(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetPillowHostSingleton();
  });

  after(async () => {
    await shutdownPillowHost();
    resetPillowHostSingleton();
    resetDatabaseInstance();
  });

  it("ApprovalGateEngine registers, decides, and persists history", () => {
    const gate = new ApprovalGateEngine();
    const approval = gate.register({
      workspaceId: WORKSPACE,
      type: "repository_write",
      proposal: {
        title: "Update Journey",
        summary: "Append PILLOW-017 completion row",
        evidence: ["JOURNEY.md"],
        targetPaths: ["JOURNEY.md"],
      },
      requestedBy: env.FOUNDER_EMAIL,
      correlationId: "corr-approval-register",
    });

    assert.equal(approval.status, "Pending");
    assert.ok(approval.approvalId);

    const decided = gate.decide({
      approvalId: approval.approvalId,
      workspaceId: WORKSPACE,
      outcome: "Approved",
      actor: env.FOUNDER_EMAIL,
      correlationId: "corr-approval-decide",
    });

    assert.equal(decided.status, "Approved");
    const history = gate.listHistory(WORKSPACE);
    assert.ok(history.some((entry) => entry.action === "registered"));
    assert.ok(history.some((entry) => entry.action === "decided"));
  });

  it("Cursor bridge dispatches dry-run mission with artifact and heartbeat", async () => {
    const brain = await import("../../brain/index.js").then((m) =>
      m.createBrain({ startWorkers: false, startScheduler: false }),
    );

    try {
      const host = await initializePillowHost({
        llmRouter: brain.llmRouter,
        auditLogger: brain.auditLogger,
      });

      const bridge = host.getCursorBridge();
      const plan = host.getStatus();
      assert.equal(plan.lifecycle, "running");

      const document = host.getApprovalGate();
      assert.ok(document);

      const dispatch = bridge.dispatchMission({
        workspaceId: WORKSPACE,
        actor: env.FOUNDER_EMAIL,
        correlationId: "corr-cursor-dispatch",
        dryRun: true,
      });

      assert.ok(dispatch.record.missionId);
      assert.equal(dispatch.launched, true);
      assert.ok(dispatch.record.artifactPath);
      if (dispatch.record.artifactPath) {
        assert.ok(fs.existsSync(dispatch.record.artifactPath));
      }

      const heartbeat = bridge.recordMissionHeartbeat(
        dispatch.record.missionId,
        "validation running",
        "validation",
      );
      assert.ok(heartbeat);
      assert.equal(heartbeat!.presence, "MissionRunning");

      const completed = bridge.markMissionCompleted(
        dispatch.record.missionId,
        "Executive audit verified",
      );
      assert.equal(completed!.phase, "completed");
      assert.equal(completed!.presence, "MissionCompleted");

      const status = bridge.getStatus(WORKSPACE);
      assert.equal(status.missionId, "PILLOW-017");
      assert.ok(status.completedCount >= 1);

      const dispatchHistory = bridge.listDispatchHistory(WORKSPACE);
      assert.ok(dispatchHistory.length >= 1);
    } finally {
      await brain.shutdown();
    }
  });

  it("Approved cursor mission execution routes through approval gate", async () => {
    const brain = await import("../../brain/index.js").then((m) =>
      m.createBrain({ startWorkers: false, startScheduler: false }),
    );

    try {
      const host = await initializePillowHost({
        llmRouter: brain.llmRouter,
        auditLogger: brain.auditLogger,
      });

      const bridge = host.getCursorBridge();
      const preview = bridge.dispatchMission({
        workspaceId: WORKSPACE,
        actor: env.FOUNDER_EMAIL,
        correlationId: "corr-preview-mission",
        dryRun: true,
      });

      const gate = host.getApprovalGate();
      const pending = gate.register({
        workspaceId: WORKSPACE,
        type: "cursor_mission_execution",
        proposal: {
          title: preview.record.title,
          summary: "Dispatch approved Cursor mission",
          missionId: preview.record.missionId,
        },
        requestedBy: env.FOUNDER_EMAIL,
        correlationId: "corr-cursor-approval",
      });

      const approved = gate.decide({
        approvalId: pending.approvalId,
        workspaceId: WORKSPACE,
        outcome: "Approved",
        actor: env.FOUNDER_EMAIL,
        correlationId: "corr-cursor-approve",
      });

      assert.equal(approved.status, "Approved");
      assert.equal(approved.linkedMissionId, preview.record.missionId);
    } finally {
      await brain.shutdown();
      resetPillowHostSingleton();
    }
  });

  it("Approval and cursor API routes respond", async () => {
    const empire = await buildApp({
      startWorkers: false,
      startScheduler: false,
      pillowEnabled: true,
    });

    try {
      const login = await empire.app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {
          email: env.FOUNDER_EMAIL,
          password: env.FOUNDER_PASSWORD,
        },
      });
      assert.equal(login.statusCode, 200);
      const cookie = login.headers["set-cookie"];
      assert.ok(cookie);

      const register = await empire.app.inject({
        method: "POST",
        url: "/api/pillow/approval",
        headers: { cookie: String(cookie) },
        payload: {
          action: "register",
          type: "executive_audit_generation",
          title: "PILLOW-017 Executive Audit",
          summary: "Generate executive audit for approval gate",
          evidence: ["EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md"],
        },
      });
      assert.equal(register.statusCode, 201);

      const list = await empire.app.inject({
        method: "GET",
        url: "/api/pillow/approval?includeHistory=true",
        headers: { cookie: String(cookie) },
      });
      assert.equal(list.statusCode, 200);
      const listBody = list.json() as { pendingCount: number; history: unknown[] };
      assert.ok(listBody.pendingCount >= 0);
      assert.ok(Array.isArray(listBody.history));

      const cursorStatus = await empire.app.inject({
        method: "GET",
        url: "/api/pillow/cursor/status",
        headers: { cookie: String(cookie) },
      });
      assert.equal(cursorStatus.statusCode, 200);
      const statusBody = cursorStatus.json() as {
        status: { missionId: string; dryRunLaunch: boolean };
      };
      assert.equal(statusBody.status.missionId, "PILLOW-017");
      assert.equal(statusBody.status.dryRunLaunch, true);
    } finally {
      await empire.shutdown();
      resetPillowHostSingleton();
    }
  });

  it("PILLOW-019 objective gate blocks non-aligned cursor approvals", async () => {
    const brain = await import("../../brain/index.js").then((m) =>
      m.createBrain({ startWorkers: false, startScheduler: false }),
    );

    try {
      const host = await initializePillowHost({
        llmRouter: brain.llmRouter,
        auditLogger: brain.auditLogger,
      });

      const gate = host.getApprovalGate();
      assert.throws(
        () =>
          gate.register({
            workspaceId: WORKSPACE,
            type: "cursor_mission_execution",
            proposal: {
              title: "Commercial launch automation",
              summary: "Start commercial expansion before Version 1 completion",
              missionId: "COMM-001",
            },
            requestedBy: env.FOUNDER_EMAIL,
            correlationId: "corr-objective-block",
          }),
        (error: unknown) => error instanceof ApprovalGateError,
      );
    } finally {
      await brain.shutdown();
      resetPillowHostSingleton();
    }
  });

  it("GET /api/pillow/objective returns dashboard state", async () => {
    const empire = await buildApp({
      startWorkers: false,
      startScheduler: false,
      pillowEnabled: true,
    });

    try {
      const login = await empire.app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {
          email: env.FOUNDER_EMAIL,
          password: env.FOUNDER_PASSWORD,
        },
      });
      assert.equal(login.statusCode, 200);
      const cookie = login.headers["set-cookie"];
      assert.ok(cookie);

      const objectiveRes = await empire.app.inject({
        method: "GET",
        url: "/api/pillow/objective",
        headers: { cookie: String(cookie) },
      });
      assert.equal(objectiveRes.statusCode, 200);
      const body = objectiveRes.json() as {
        objective: {
          currentObjective: { title: string };
          activeMode: string;
          deferredImprovementCount: number;
        };
      };
      assert.equal(body.objective.currentObjective.title, "Finish EmpireAI Version 1");
      assert.equal(body.objective.activeMode, "builder");
      assert.equal(typeof body.objective.deferredImprovementCount, "number");
    } finally {
      await empire.shutdown();
      resetPillowHostSingleton();
    }
  });
});
