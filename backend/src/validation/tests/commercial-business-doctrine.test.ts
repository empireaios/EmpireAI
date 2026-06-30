import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMMERCIAL_BUSINESS_DOCTRINE_CATALOG,
  COMMERCIAL_BUSINESS_DOCTRINE_MISSION_ID,
  buildCommercialComplianceReport,
  buildCommercialBusinessDoctrineDashboard,
  empireCommercialBusinessDoctrineTools,
  getCommercialBusinessDoctrine,
  listBusinessRuleDoctrines,
} from "../../foundation/empire-commercial-business-doctrine/index.js";

describe("Commercial Business Doctrine CBD-001 → CBD-020", () => {
  it("catalog has 20 immutable doctrines", () => {
    assert.equal(COMMERCIAL_BUSINESS_DOCTRINE_CATALOG.length, 20);
    assert.ok(COMMERCIAL_BUSINESS_DOCTRINE_CATALOG.every((d) => d.immutable));
    assert.equal(getCommercialBusinessDoctrine("CBD-001")?.title, "Manufacture Profitable Companies");
    assert.equal(getCommercialBusinessDoctrine("CBD-020")?.title, "Real Commercial Success");
  });

  it("business rule doctrines cover evaluation and ownership", () => {
    assert.ok(listBusinessRuleDoctrines().length >= 8);
    assert.ok(listBusinessRuleDoctrines().some((d) => d.doctrineId === "CBD-011"));
  });

  it("commercial integrity review covers supplier and approval boundaries", () => {
    const report = buildCommercialComplianceReport("ws_cbd_test", "co-grand-king");
    assert.ok(report.commercialIntegrityReview.length >= 10);
    const shipping = report.commercialIntegrityReview.find((i) => i.ruleId === "ci-006");
    assert.equal(shipping?.cbdArticle, "CBD-011");
    assert.equal(shipping?.status, "COMPLIANT");
  });

  it("compliance audit runs for Empire Review", () => {
    const report = buildCommercialComplianceReport("ws_cbd_test", "co-grand-king");
    assert.equal(report.missionId, COMMERCIAL_BUSINESS_DOCTRINE_MISSION_ID);
    assert.equal(report.doctrineCount, 20);
    assert.equal(report.checks.length, 20);
    assert.ok(report.businessRuleCoverage.length >= 10);
    assert.equal(report.reviewPassed, report.violationCount === 0);
  });

  it("brain tools registered read-only", () => {
    assert.equal(empireCommercialBusinessDoctrineTools.length, 4);
    assert.ok(empireCommercialBusinessDoctrineTools.every((t) => t.authorityLevel === "L0"));
  });

  it("dashboard bundles rules, integrity review, and compliance", () => {
    const dash = buildCommercialBusinessDoctrineDashboard("ws_cbd_test", "co-grand-king");
    assert.equal(dash.catalog.length, 20);
    assert.ok(dash.businessRuleCoverage.length >= 10);
    assert.ok(dash.commercialIntegrityReview.length >= 10);
    assert.equal(dash.immutable, true);
    assert.ok(dash.summary.includes("CBD-001"));
  });
});
