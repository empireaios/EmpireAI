import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  UX_IDENTITY_DOCTRINE_CATALOG,
  UX_IDENTITY_DOCTRINE_MISSION_ID,
  buildUxIdentityComplianceReport,
  buildUxIdentityDoctrineDashboard,
  empireUxIdentityDoctrineTools,
  getUxIdentityDoctrine,
  listIdentityDoctrines,
  listUxDoctrines,
} from "../../foundation/empire-ux-identity-doctrine/index.js";

describe("UX & Identity Doctrine UID-001 → UID-020", () => {
  it("catalog has 20 immutable doctrines", () => {
    assert.equal(UX_IDENTITY_DOCTRINE_CATALOG.length, 20);
    assert.ok(UX_IDENTITY_DOCTRINE_CATALOG.every((d) => d.immutable));
    assert.ok(UX_IDENTITY_DOCTRINE_CATALOG.every((d) => d.version === "1.0.0"));
    assert.equal(getUxIdentityDoctrine("UID-001")?.title, "Grand King Platform Owner");
    assert.equal(getUxIdentityDoctrine("UID-020")?.title, "SUCCESS-001 UX Goal");
  });

  it("identity and UX coverage lists", () => {
    assert.equal(listIdentityDoctrines().length, 3);
    assert.equal(listUxDoctrines().length, 17);
  });

  it("navigation review covers headquarters and auth", () => {
    const report = buildUxIdentityComplianceReport("ws_uid_test", "co-grand-king");
    assert.ok(report.navigationReview.length >= 8);
    const hq = report.navigationReview.find((n) => n.routeId === "nav-001");
    assert.ok(hq?.uidArticles.includes("UID-008"));
    const login = report.navigationReview.find((n) => n.routeId === "nav-006");
    assert.equal(login?.status, "COMPLIANT");
  });

  it("compliance audit runs for Empire Review", () => {
    const report = buildUxIdentityComplianceReport("ws_uid_test", "co-grand-king");
    assert.equal(report.missionId, UX_IDENTITY_DOCTRINE_MISSION_ID);
    assert.equal(report.doctrineCount, 20);
    assert.equal(report.checks.length, 20);
    assert.equal(report.architectureComplete, true);
    assert.equal(report.reviewPassed, report.violationCount === 0);
  });

  it("brain tools registered read-only", () => {
    assert.equal(empireUxIdentityDoctrineTools.length, 4);
    assert.ok(empireUxIdentityDoctrineTools.every((t) => t.authorityLevel === "L0"));
  });

  it("dashboard bundles identity, UX, and navigation review", () => {
    const dash = buildUxIdentityDoctrineDashboard("ws_uid_test", "co-grand-king");
    assert.equal(dash.catalog.length, 20);
    assert.equal(dash.identityCoverage.length, 3);
    assert.ok(dash.navigationReview.length >= 8);
    assert.equal(dash.immutable, true);
    assert.ok(dash.summary.includes("UID-001"));
  });
});
