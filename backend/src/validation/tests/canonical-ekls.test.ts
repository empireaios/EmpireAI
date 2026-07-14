import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  EKLS_SUBSYSTEM_REGISTRY,
  EKLS_STORE_REGISTRY,
  enforceEklsAccess,
  loadEklsUnifiedService,
  EKLS_CONSUMER_CHANNELS,
  EKLS_CANONICAL_SPEC_REF,
} from "../../orchestration/pillow/ekls/index.js";
import { EKLS_REQUIRED_FIELDS } from "../../orchestration/pillow/ekls/contracts/knowledge-object-standard.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const REPO_ROOT = resolve(process.cwd(), "..");

describe("Canonical EKLS — Empire Knowledge & Learning System", () => {
  it("has one permanent canonical specification at repository root", () => {
    const specPath = resolve(REPO_ROOT, "CANONICAL_EKLS_SPECIFICATION.md");
    assert.ok(existsSync(specPath), "CANONICAL_EKLS_SPECIFICATION.md must exist");
    const content = readFileSync(specPath, "utf8");
    assert.ok(content.includes("PERMANENT CANONICAL SPECIFICATION"));
    assert.ok(content.includes("never be EKLS-002"));
    assert.ok(content.includes("owned, governed, supervised and evolved by Pillow"));
  });

  it("registers 28 permanent EKLS subsystems under Pillow ownership", () => {
    assert.equal(EKLS_SUBSYSTEM_REGISTRY.length, 28);
    for (const sub of EKLS_SUBSYSTEM_REGISTRY) {
      assert.equal(sub.owner, "pillow");
    }
  });

  it("rejects EKLS access without Pillow governance", () => {
    const result = enforceEklsAccess(
      {
        pillowGovernance: true,
        actorId: "pillow-host",
        workspaceId: "ws_ekls",
        consumerChannel: "brain",
        operation: "retrieve",
      },
      "ws_other",
    );
    assert.equal(result.allowed, false);
    assert.ok(result.reason.includes("workspace"));
  });

  it("delivers unified service to five consumer channels", () => {
    const view = loadEklsUnifiedService({
      pillowGovernance: true,
      actorId: "pillow-governance",
      workspaceId: "ws_ekls",
      consumerChannel: "cockpit",
      operation: "aggregate",
    });
    assert.equal(view.orchestrationPolicy, "no_business_logic");
    assert.equal(view.owner, "pillow");
    assert.equal(view.specRef, EKLS_CANONICAL_SPEC_REF);
    assert.equal(view.consumerDeliveries.length, 5);
    for (const ch of EKLS_CONSUMER_CHANNELS) {
      assert.ok(view.consumerDeliveries.some((d) => d.consumerId === ch));
    }
  });

  it("maps legacy stores through Pillow-governed registry without duplication", () => {
    assert.ok(EKLS_STORE_REGISTRY.length >= 8);
    const learning = EKLS_STORE_REGISTRY.find((b) => b.subsystemId === "learning_store");
    assert.ok(learning?.integrationPath.includes("executive-learning"));
    assert.equal(learning?.governance, "pillow-only");
  });

  it("defines knowledge object standard with required governance fields", () => {
    assert.ok(EKLS_REQUIRED_FIELDS.includes("workspaceId"));
    assert.ok(EKLS_REQUIRED_FIELDS.includes("governanceState"));
    assert.ok(EKLS_REQUIRED_FIELDS.includes("owner"));
  });

  it("marks all consumer deliveries as orchestration-only", () => {
    const view = loadEklsUnifiedService({
      pillowGovernance: true,
      actorId: "pillow-governance",
      workspaceId: "ws_ekls",
      consumerChannel: "executive-reports",
      operation: "aggregate",
    });
    for (const d of view.consumerDeliveries) {
      assert.equal(d.orchestrationOnly, true);
    }
  });
});
