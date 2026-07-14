import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  assertLockedVersionImmutable,
  authorizeEmpireVersion1Lock,
  buildEmpireVersion1LockReport,
  buildEmpireVersionStatusReport,
  buildVersion1SnapshotMetadata,
  createEmpireVersion1Certification,
  EMPIRE_V1_CERTIFIED_PROGRAMMES,
  EMPIRE_V1_RELEASE_DATE,
  EMPIREAI_VERSION_1_0,
  EMPIREAI_VERSION_1_0_DISPLAY,
  EMPIREAI_WORKING_VERSION_LABEL,
  evaluateVersionLockAuthorization,
  FUTURE_VERSION_ARTIFACT_REQUIREMENTS,
  FUTURE_VERSION_EXAMPLES,
  getVersion1HistoryEntry,
  getVersionHistory,
  GRAND_KING_VERSION_LOCK_AUTHORITY,
  listVersionGovernanceEklsKinds,
  recommendFutureVersion,
  recordEmpireVersion1EklsBaseline,
  resetVersionGovernanceObservationsForTests,
  resetVersionHistoryForTests,
  resetVersionLockHarnessForTests,
  searchVersionGovernanceEklsObservations,
  validateVersionGovernancePillowGovernance,
  VERSION_GOVERNANCE_EKLS_KINDS,
  VERSION_LOCK_DOCTRINE_RULES,
} from "../../orchestration/empire-version-governance/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const REPO_ROOT = join(import.meta.dirname, "../../../..");
const ARTIFACTS = join(REPO_ROOT, "artifacts");
const CANONICAL_WORKSPACE_ID = "ws_empire_1";

function resetHarness(): void {
  resetVersionHistoryForTests();
  resetVersionLockHarnessForTests();
  resetVersionGovernanceObservationsForTests();
}

describe("EmpireAI Version 1 Lock — Version Governance", () => {
  it("certifies EmpireAI Version 1.0 as LOCKED with G0 through G8 programmes", () => {
    resetHarness();
    assert.equal(EMPIRE_V1_CERTIFIED_PROGRAMMES.length, 11);
    assert.equal(EMPIRE_V1_CERTIFIED_PROGRAMMES[10], "V1-LOCK");
    assert.equal(EMPIREAI_VERSION_1_0, "1.0.0");
    assert.equal(EMPIREAI_VERSION_1_0_DISPLAY, "EmpireAI Version 1.0");
    assert.equal(EMPIRE_V1_RELEASE_DATE, "2026-07-03");

    const certification = createEmpireVersion1Certification({
      validationSuitePass: true,
      backendTypecheckPass: true,
      frontendTypecheckPass: true,
    });

    assert.equal(certification.status, "LOCKED");
    assert.equal(certification.readinessRating, "PASS_WITH_CONDITIONS");
    assert.equal(certification.productionStatus, "ACTIVE");
    assert.equal(certification.productionEligible, true);
    assert.equal(certification.blockers.length, 0);
    assert.ok(certification.baselineHash.length > 0);
    assert.ok(certification.conditions.length > 0);
  });

  it("rejects certification when validation gates fail", () => {
    resetHarness();
    const failed = createEmpireVersion1Certification({
      validationSuitePass: false,
      backendTypecheckPass: true,
      frontendTypecheckPass: true,
    });
    assert.equal(failed.status, "NOT_CERTIFIED");
    assert.equal(failed.readinessRating, "FAIL");
    assert.equal(failed.productionEligible, false);
    assert.ok(failed.blockers.length > 0);
  });

  it("generates nine logical snapshot metadata records without repository duplication", () => {
    resetHarness();
    const certification = createEmpireVersion1Certification({
      validationSuitePass: true,
      backendTypecheckPass: true,
      frontendTypecheckPass: true,
    });
    const snapshots = buildVersion1SnapshotMetadata(certification);
    assert.equal(snapshots.length, 9);
    assert.ok(snapshots.every((s) => s.logicalOnly === true));
    assert.ok(snapshots.every((s) => s.version === EMPIREAI_VERSION_1_0));
    const kinds = snapshots.map((s) => s.kind);
    assert.ok(kinds.includes("repository"));
    assert.ok(kinds.includes("architecture"));
    assert.ok(kinds.includes("registry"));
    assert.ok(kinds.includes("brain"));
    assert.ok(kinds.includes("pillow"));
    assert.ok(kinds.includes("cockpit"));
    assert.ok(kinds.includes("ekls"));
    assert.ok(kinds.includes("production_configuration"));
    assert.ok(kinds.includes("certification"));
  });

  it("establishes Version 1 as history entry number one", () => {
    resetHarness();
    const entry = getVersion1HistoryEntry();
    assert.equal(entry.entryNumber, 1);
    assert.equal(entry.version, EMPIREAI_VERSION_1_0);
    assert.equal(entry.displayName, EMPIREAI_VERSION_1_0_DISPLAY);
    assert.equal(entry.status, "LOCKED");
    assert.equal(entry.appendOnly, true);
    assert.equal(getVersionHistory().length, 1);
  });

  it("enforces Version Lock Doctrine — only Grand King may authorize lock", () => {
    resetHarness();
    const denied = evaluateVersionLockAuthorization({
      actorId: "operator",
      ownerId: "operator",
      grandKingAuthorizes: true,
      operation: "lock_version",
    });
    assert.equal(denied.allowed, false);
    assert.match(denied.reason, /Grand King/i);

    const deniedNoAuth = evaluateVersionLockAuthorization({
      actorId: "grand-king",
      ownerId: GRAND_KING_VERSION_LOCK_AUTHORITY,
      grandKingAuthorizes: false,
      operation: "lock_version",
    });
    assert.equal(deniedNoAuth.allowed, false);

    const authorized = evaluateVersionLockAuthorization({
      actorId: "grand-king",
      ownerId: GRAND_KING_VERSION_LOCK_AUTHORITY,
      grandKingAuthorizes: true,
      operation: "lock_version",
    });
    assert.equal(authorized.allowed, true);
    assert.equal(VERSION_LOCK_DOCTRINE_RULES.length >= 5, true);
  });

  it("allows Pillow to recommend versions but never auto-create them", () => {
    resetHarness();
    const pillow = validateVersionGovernancePillowGovernance({
      actorId: "pillow",
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: GRAND_KING_VERSION_LOCK_AUTHORITY,
      operation: "recommend_version",
      pillowGovernance: true,
    });
    assert.equal(pillow.allowed, true);

    const recommendation = recommendFutureVersion({
      actorId: "pillow",
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: GRAND_KING_VERSION_LOCK_AUTHORITY,
      suggestedVersion: "1.1",
      summary: "Minor governance patch candidate",
    });
    assert.equal(recommendation.accepted, true);
    assert.equal(recommendation.recommendation?.autoCreated, false);
    assert.equal(recommendation.recommendation?.status, "pending");
    assert.equal(recommendation.recommendation?.recommendedBy, "pillow");
  });

  it("authorizes Grand King version lock and produces lock report", () => {
    resetHarness();
    const lock = authorizeEmpireVersion1Lock({
      actorId: "grand-king",
      ownerId: GRAND_KING_VERSION_LOCK_AUTHORITY,
      workspaceId: CANONICAL_WORKSPACE_ID,
      grandKingAuthorizes: true,
      validationSuitePass: true,
      backendTypecheckPass: true,
      frontendTypecheckPass: true,
    });
    assert.equal(lock.authorized, true);
    assert.equal(lock.lock?.locked, true);
    assert.equal(lock.lock?.authorizedBy, GRAND_KING_VERSION_LOCK_AUTHORITY);

    const report = buildEmpireVersion1LockReport({
      actorId: "grand-king",
      ownerId: GRAND_KING_VERSION_LOCK_AUTHORITY,
      workspaceId: CANONICAL_WORKSPACE_ID,
      grandKingAuthorizes: true,
      validationSuitePass: true,
      backendTypecheckPass: true,
      frontendTypecheckPass: true,
    });
    assert.equal(report.version, EMPIREAI_VERSION_1_0);
    assert.equal(report.doctrineEnforced, true);
    assert.equal(report.snapshots.length, 9);
    assert.equal(report.historyEntry.entryNumber, 1);
    assert.equal(report.certification.status, "LOCKED");
  });

  it("reports current version status for Pillow awareness", () => {
    resetHarness();
    const status = buildEmpireVersionStatusReport({
      validationSuitePass: true,
      backendTypecheckPass: true,
      frontendTypecheckPass: true,
    });
    assert.equal(status.currentVersion, EMPIREAI_VERSION_1_0_DISPLAY);
    assert.equal(status.status, "LOCKED");
    assert.equal(status.productionStatus, "ACTIVE");
    assert.equal(status.workingVersion, EMPIREAI_WORKING_VERSION_LABEL);
    assert.equal(status.versionHistoryCount, 1);
  });

  it("records Version 1 permanently in EKLS", () => {
    resetHarness();
    assert.equal(VERSION_GOVERNANCE_EKLS_KINDS.length, 6);
    assert.deepEqual(listVersionGovernanceEklsKinds(), [...VERSION_GOVERNANCE_EKLS_KINDS]);

    const recorded = recordEmpireVersion1EklsBaseline({
      actorId: "grand-king",
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: GRAND_KING_VERSION_LOCK_AUTHORITY,
      version: EMPIREAI_VERSION_1_0,
      releaseDate: EMPIRE_V1_RELEASE_DATE,
    });
    assert.equal(recorded.accepted, true);
    assert.equal(recorded.kindsRecorded, 6);

    const certifications = searchVersionGovernanceEklsObservations({
      kind: "version_certification",
      pillowGovernance: true,
    });
    assert.ok(certifications.length >= 1);
  });

  it("asserts locked version immutability under repository governance", () => {
    resetHarness();
    const certification = createEmpireVersion1Certification({
      validationSuitePass: true,
      backendTypecheckPass: true,
      frontendTypecheckPass: true,
    });
    const immutability = assertLockedVersionImmutable(EMPIREAI_VERSION_1_0, certification);
    assert.equal(immutability.immutable, true);
    assert.match(immutability.reason, /unreleased/i);
  });

  it("defines future version policy artifact requirements", () => {
    assert.equal(FUTURE_VERSION_ARTIFACT_REQUIREMENTS.length, 5);
    assert.ok(FUTURE_VERSION_EXAMPLES.includes("1.1"));
    assert.ok(FUTURE_VERSION_EXAMPLES.includes("2.0"));
  });

  it("confirms version governance executive artifacts are present", () => {
    assert.ok(existsSync(join(ARTIFACTS, "empire-v1-executive-audit.md")));
    assert.ok(existsSync(join(ARTIFACTS, "empire-v1-release-notes.md")));
    assert.ok(existsSync(join(ARTIFACTS, "empire-v1-certification-report.md")));
    assert.ok(existsSync(join(ARTIFACTS, "empire-v1-version-history-report.md")));
    assert.ok(existsSync(join(ARTIFACTS, "empire-v1-version-lock-report.md")));
    assert.ok(existsSync(join(ARTIFACTS, "empire-v1-activation-executive-audit.md")));
  });
});
