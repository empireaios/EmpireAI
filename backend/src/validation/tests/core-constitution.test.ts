import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CORE_CONSTITUTION_CATALOG,
  CORE_CONSTITUTION_MISSION_ID,
  buildConstitutionComplianceReport,
  buildConstitutionDashboard,
  empireConstitutionTools,
  getConstitutionArticle,
} from "../../foundation/empire-constitution/index.js";

describe("Core Constitution CTD-001 → CTD-040", () => {
  it("catalog has 40 immutable articles", () => {
    assert.equal(CORE_CONSTITUTION_CATALOG.length, 40);
    assert.ok(CORE_CONSTITUTION_CATALOG.every((a) => a.immutable));
    assert.ok(CORE_CONSTITUTION_CATALOG.every((a) => a.version === "1.0.0"));
    assert.equal(getConstitutionArticle("CTD-001")?.title, "Manufacture Companies");
    assert.equal(getConstitutionArticle("CTD-040")?.title, "Constitution Supreme");
  });

  it("compliance audit runs for Empire Review", () => {
    const report = buildConstitutionComplianceReport("ws_ctd_test", "co-grand-king");
    assert.equal(report.missionId, CORE_CONSTITUTION_MISSION_ID);
    assert.equal(report.articleCount, 40);
    assert.ok(report.checks.length >= 10);
    assert.ok(report.doctrineCoverage.length >= 3);
    assert.equal(report.architectureComplete, true);
  });

  it("dashboard bundles catalog + compliance", () => {
    const dash = buildConstitutionDashboard("ws_ctd_test", "co-grand-king");
    assert.equal(dash.catalog.length, 40);
    assert.equal(dash.immutable, true);
    assert.equal(dash.authority, "supreme_over_modules");
    assert.ok(dash.summary.includes("CTD-001"));
  });

  it("brain tools registered read-only", () => {
    assert.equal(empireConstitutionTools.length, 3);
    assert.ok(empireConstitutionTools.every((t) => t.authorityLevel === "L0"));
  });
});
