import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  GOVERNANCE_AUTHORITY_MATRIX,
  GOVERNANCE_DOCTRINE_CATALOG,
  GOVERNANCE_DOCTRINE_MISSION_ID,
  buildGovernanceComplianceReport,
  buildGovernanceDoctrineDashboard,
  empireGovernanceDoctrineTools,
  getGovernanceDoctrine,
} from "../../foundation/empire-governance-doctrine/index.js";

describe("Governance Doctrine GVD-001 → GVD-030", () => {
  it("catalog has 30 immutable doctrines", () => {
    assert.equal(GOVERNANCE_DOCTRINE_CATALOG.length, 30);
    assert.ok(GOVERNANCE_DOCTRINE_CATALOG.every((d) => d.immutable));
    assert.ok(GOVERNANCE_DOCTRINE_CATALOG.every((d) => d.version === "1.0.0"));
    assert.equal(getGovernanceDoctrine("GVD-001")?.title, "Grand King Platform Owner");
    assert.equal(getGovernanceDoctrine("GVD-030")?.title, "Protect Before Speed");
  });

  it("authority matrix defines module roles", () => {
    assert.ok(GOVERNANCE_AUTHORITY_MATRIX.length >= 11);
    const king = GOVERNANCE_AUTHORITY_MATRIX.find((e) => e.moduleId === "grand-king");
    assert.ok(king?.mayDecide);
    assert.ok(king?.mayExecute);
    const mcl = GOVERNANCE_AUTHORITY_MATRIX.find((e) => e.moduleId === "master-completion-ledger");
    assert.equal(mcl?.mayRecommend, false);
  });

  it("compliance audit runs for Empire Review", () => {
    const report = buildGovernanceComplianceReport("ws_gvd_test", "co-grand-king");
    assert.equal(report.missionId, GOVERNANCE_DOCTRINE_MISSION_ID);
    assert.equal(report.doctrineCount, 30);
    assert.ok(report.checks.length >= 16);
    assert.equal(report.architectureComplete, true);
    assert.equal(report.reviewPassed, report.violationCount === 0);
  });

  it("brain tools registered read-only", () => {
    assert.equal(empireGovernanceDoctrineTools.length, 4);
    assert.ok(empireGovernanceDoctrineTools.every((t) => t.authorityLevel === "L0"));
  });

  it("dashboard bundles catalog, matrix, and compliance", () => {
    const dash = buildGovernanceDoctrineDashboard("ws_gvd_test", "co-grand-king");
    assert.equal(dash.catalog.length, 30);
    assert.ok(dash.authorityMatrix.length >= 11);
    assert.equal(dash.immutable, true);
    assert.ok(dash.summary.includes("GVD-001"));
  });
});
