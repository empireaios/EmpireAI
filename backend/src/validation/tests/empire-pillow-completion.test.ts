/**
 * Pillow Completion — integration validation (Version 1).
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { moduleRoutes } from "../../agents/routes/module-routes.js";
import { g7ModuleRoutes } from "../../agents/routes/g7-module-routes.js";
import { FOUNDATION_WIRED_REGISTRY_IDS } from "../../registry/types/registry-ids.js";
import {
  IDENTITY_AUTHORIZATION_REGISTRY_IDS,
  CONNECTION_REGISTRY_REGISTRY_IDS,
} from "../../registry/types/registry-ids.js";
import { ApprovalGateEngine } from "../../orchestration/pillow-approval/approval-gate-engine.js";
import {
  listCanonicalApprovals,
  mirrorG5SubmissionToCanonicalGate,
  wireCanonicalPillowApprovalPipeline,
} from "../../orchestration/pillow-approval/canonical-pillow-approval-pipeline.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("Pillow Completion Programme", () => {
  it("STEP 1 — empireai-web connects to /api/pillow via BFF proxy and client", () => {
    const client = readFileSync(join(repoRoot, "empireai-web/lib/pillow/client.ts"), "utf8");
    assert.match(client, /\/api\/pillow\/chat/);
    assert.match(client, /\/api\/pillow\/session/);

    const proxy = readFileSync(
      join(repoRoot, "empireai-web/app/api/pillow/[...path]/route.ts"),
      "utf8",
    );
    assert.match(proxy, /\/api\/pillow\//);

    const provider = readFileSync(
      join(repoRoot, "empireai-web/lib/cockpit/global-assistant/GlobalAiAssistantProvider.tsx"),
      "utf8",
    );
    assert.match(provider, /sendPillowChat/);
    assert.match(provider, /createPillowHostSession/);
  });

  it("STEP 2 — canonical approval pipeline merges G5 and Pillow gate queues", () => {
    const gate = new ApprovalGateEngine();
    wireCanonicalPillowApprovalPipeline(gate);

    const g5Request = {
      approvalId: "appr-g5-test-001",
      workflowId: "wf-foundation-decision-orchestration",
      workflowVersion: "1.0.0",
      triggerId: "trg-foundation-decision-gate",
      workspaceId: "ws-foundation",
      approvalTier: "A2" as const,
      approvalPolicyId: "pol-foundation-default",
      approvalRegistryId: "REG-AUTOMATION-APPROVAL",
      requestedBy: "founder@test.com",
      requestedAt: new Date().toISOString(),
      correlationId: "corr-pillow-completion",
      approvalState: "awaiting_review" as const,
      notificationRegistryIds: [],
      supportingEvidence: {} as Record<string, unknown>,
      pillowGovernance: true as const,
      history: [],
    };

    mirrorG5SubmissionToCanonicalGate(g5Request);
    assert.ok(g5Request.supportingEvidence?.canonicalGateApprovalId);

    const merged = listCanonicalApprovals(gate, "ws-foundation");
    assert.ok(merged.length >= 1);
    assert.ok(
      merged.some(
        (item) =>
          item.g5ApprovalId === "appr-g5-test-001" ||
          item.proposal.metadata?.g5ApprovalId === "appr-g5-test-001",
      ),
    );
  });

  it("STEP 3 — registry metadata includes G8 identity and connection IDs", () => {
    for (const id of IDENTITY_AUTHORIZATION_REGISTRY_IDS) {
      assert.ok(
        FOUNDATION_WIRED_REGISTRY_IDS.includes(id),
        `Expected ${id} in FOUNDATION_WIRED_REGISTRY_IDS`,
      );
    }
    for (const id of CONNECTION_REGISTRY_REGISTRY_IDS) {
      assert.ok(
        FOUNDATION_WIRED_REGISTRY_IDS.includes(id),
        `Expected ${id} in FOUNDATION_WIRED_REGISTRY_IDS`,
      );
    }
  });

  it("STEP 4 — G7 Brain tools are registered in module routes", () => {
    const routeKeys = new Set(moduleRoutes.map((route) => `${route.module}:${route.action}`));

    for (const route of g7ModuleRoutes) {
      assert.ok(
        routeKeys.has(`${route.module}:${route.action}`),
        `Missing route ${route.module}:${route.action}`,
      );
    }

    assert.ok(routeKeys.has("grand-king-live-operations:overview"));
    assert.ok(routeKeys.has("business-automation:search_learning"));
  });

  it("STEP 5 — legacy GC-05 global assistant routes gated off by default", () => {
    const appSource = readFileSync(join(repoRoot, "backend/src/app.ts"), "utf8");
    assert.match(appSource, /EMPIRE_LEGACY_GC05_GLOBAL_ASSISTANT/);

    const layout = readFileSync(join(repoRoot, "frontend/src/layouts/DashboardLayout.tsx"), "utf8");
    assert.doesNotMatch(layout, /PillowCompanionIcon/);
    assert.doesNotMatch(layout, /PillowCompanionPanel/);
    assert.doesNotMatch(layout, /GlobalAssistantPanel/);
  });
});
