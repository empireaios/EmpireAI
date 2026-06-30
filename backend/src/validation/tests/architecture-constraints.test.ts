import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ARCHITECTURE_CONSTRAINT_CATALOG,
  ARCHITECTURE_CONSTRAINT_MISSION_ID,
  buildArchitectureComplianceReport,
  buildArchitectureConstraintsDashboard,
  empireArchitectureConstraintsTools,
  getArchitectureConstraint,
} from "../../foundation/empire-architecture-constraints/index.js";

describe("Architecture Constraints ACD-001 → ACD-030", () => {
  it("catalog has 30 immutable constraints", () => {
    assert.equal(ARCHITECTURE_CONSTRAINT_CATALOG.length, 30);
    assert.ok(ARCHITECTURE_CONSTRAINT_CATALOG.every((c) => c.immutable));
    assert.ok(ARCHITECTURE_CONSTRAINT_CATALOG.every((c) => c.version === "1.0.0"));
    assert.equal(getArchitectureConstraint("ACD-001")?.title, "Modular Architecture");
    assert.equal(getArchitectureConstraint("ACD-030")?.title, "Validated During Empire Review");
  });

  it("dependency review covers adapter boundaries", () => {
    const report = buildArchitectureComplianceReport("ws_acd_test", "co-grand-king");
    assert.ok(report.dependencyReview.length >= 10);
    const supplierEdge = report.dependencyReview.find((d) => d.edgeId === "dep-001");
    assert.equal(supplierEdge?.acdArticle, "ACD-028");
    assert.notEqual(supplierEdge?.status, "VIOLATION");
  });

  it("compliance audit runs for Empire Review", () => {
    const report = buildArchitectureComplianceReport("ws_acd_test", "co-grand-king");
    assert.equal(report.missionId, ARCHITECTURE_CONSTRAINT_MISSION_ID);
    assert.equal(report.constraintCount, 30);
    assert.ok(report.checks.length >= 30);
    assert.equal(report.architectureComplete, true);
    assert.equal(report.reviewPassed, report.violationCount === 0);
  });

  it("brain tools registered read-only", () => {
    assert.equal(empireArchitectureConstraintsTools.length, 4);
    assert.ok(empireArchitectureConstraintsTools.every((t) => t.authorityLevel === "L0"));
  });

  it("dashboard bundles catalog, dependency review, and compliance", () => {
    const dash = buildArchitectureConstraintsDashboard("ws_acd_test", "co-grand-king");
    assert.equal(dash.catalog.length, 30);
    assert.ok(dash.dependencyReview.length >= 10);
    assert.equal(dash.immutable, true);
    assert.ok(dash.summary.includes("ACD-001"));
  });
});
