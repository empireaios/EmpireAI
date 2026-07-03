/**
 * Version lock service — Grand King authorized lock under Version Lock Doctrine.
 */

import { randomUUID } from "node:crypto";

import {
  evaluateVersionLockAuthorization,
  GRAND_KING_VERSION_LOCK_AUTHORITY,
  VERSION_LOCK_FUTURE_CHANGES_POLICY,
} from "../doctrine/version-lock-doctrine.js";
import {
  EMPIREAI_VERSION_1_0,
  type EmpireVersion1Certification,
  type EmpireVersion1LockReport,
  type VersionLockRecord,
  type VersionRecommendation,
} from "../contracts/version-governance-types.js";
import { createEmpireVersion1Certification } from "./version-1-certification-service.js";
import { buildVersion1SnapshotMetadata } from "./version-snapshot-service.js";
import { getVersion1HistoryEntry } from "./version-history-service.js";
import { validateVersionGovernancePillowGovernance } from "../governance/version-governance-pillow-governance.js";

const PENDING_RECOMMENDATIONS: VersionRecommendation[] = [];

export function authorizeEmpireVersion1Lock(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  grandKingAuthorizes: boolean;
  validationSuitePass: boolean;
  backendTypecheckPass: boolean;
  frontendTypecheckPass: boolean;
}): { authorized: boolean; reason: string; lock?: VersionLockRecord } {
  const doctrine = evaluateVersionLockAuthorization({
    actorId: input.actorId,
    ownerId: input.ownerId,
    grandKingAuthorizes: input.grandKingAuthorizes,
    operation: "lock_version",
  });

  if (!doctrine.allowed) {
    return { authorized: false, reason: doctrine.reason };
  }

  const pillow = validateVersionGovernancePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "lock_version",
    pillowGovernance: true,
  });
  if (!pillow.allowed) {
    return { authorized: false, reason: pillow.reason };
  }

  const certification = createEmpireVersion1Certification({
    validationSuitePass: input.validationSuitePass,
    backendTypecheckPass: input.backendTypecheckPass,
    frontendTypecheckPass: input.frontendTypecheckPass,
  });

  if (!certification.productionEligible) {
    return {
      authorized: false,
      reason: `Version lock blocked — certification gates failed: ${certification.blockers.join("; ")}`,
    };
  }

  const lock: VersionLockRecord = {
    version: EMPIREAI_VERSION_1_0,
    locked: true,
    lockedAt: new Date().toISOString(),
    authorizedBy: GRAND_KING_VERSION_LOCK_AUTHORITY,
    baselineHash: certification.baselineHash,
    futureChangesPolicy: VERSION_LOCK_FUTURE_CHANGES_POLICY,
    immutable: true,
  };

  return { authorized: true, reason: doctrine.reason, lock };
}

export function buildEmpireVersion1LockReport(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  grandKingAuthorizes: boolean;
  validationSuitePass: boolean;
  backendTypecheckPass: boolean;
  frontendTypecheckPass: boolean;
}): EmpireVersion1LockReport {
  const authorization = authorizeEmpireVersion1Lock(input);
  const certification = createEmpireVersion1Certification({
    validationSuitePass: input.validationSuitePass,
    backendTypecheckPass: input.backendTypecheckPass,
    frontendTypecheckPass: input.frontendTypecheckPass,
  });

  const lock: VersionLockRecord = authorization.lock ?? {
    version: EMPIREAI_VERSION_1_0,
    locked: true,
    lockedAt: certification.certifiedAt,
    authorizedBy: GRAND_KING_VERSION_LOCK_AUTHORITY,
    baselineHash: certification.baselineHash,
    futureChangesPolicy: VERSION_LOCK_FUTURE_CHANGES_POLICY,
    immutable: true,
  };

  return {
    version: EMPIREAI_VERSION_1_0,
    lock,
    certification,
    snapshots: buildVersion1SnapshotMetadata(certification),
    historyEntry: getVersion1HistoryEntry(),
    doctrineEnforced: true,
    generatedAt: new Date().toISOString(),
    correlationId: randomUUID(),
  };
}

export function recommendFutureVersion(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  suggestedVersion: string;
  summary: string;
}): { accepted: boolean; reason: string; recommendation?: VersionRecommendation } {
  const doctrine = evaluateVersionLockAuthorization({
    actorId: input.actorId,
    ownerId: input.ownerId,
    grandKingAuthorizes: false,
    operation: "recommend_version",
  });
  if (!doctrine.allowed) {
    return { accepted: false, reason: doctrine.reason };
  }

  const pillow = validateVersionGovernancePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "recommend_version",
    pillowGovernance: true,
  });
  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason };
  }

  const recommendation: VersionRecommendation = {
    recommendationId: randomUUID(),
    suggestedVersion: input.suggestedVersion,
    summary: input.summary,
    recommendedBy: "pillow",
    status: "pending",
    autoCreated: false,
    recommendedAt: new Date().toISOString(),
  };
  PENDING_RECOMMENDATIONS.push(recommendation);

  return {
    accepted: true,
    reason: "Pillow version recommendation recorded — Grand King authorization required for lock",
    recommendation,
  };
}

export function listPendingVersionRecommendations(): readonly VersionRecommendation[] {
  return [...PENDING_RECOMMENDATIONS];
}

export function resetVersionLockHarnessForTests(): void {
  PENDING_RECOMMENDATIONS.length = 0;
}

export function assertLockedVersionImmutable(
  targetVersion: string,
  certification: EmpireVersion1Certification,
): { immutable: boolean; reason: string } {
  if (targetVersion === EMPIREAI_VERSION_1_0 && certification.status === "LOCKED") {
    return {
      immutable: true,
      reason: "EmpireAI Version 1.0 is LOCKED — modifications must accumulate as unreleased changes",
    };
  }
  return { immutable: false, reason: "Version is not a locked baseline" };
}
