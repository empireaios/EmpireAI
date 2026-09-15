/**
 * Permanent request owner — created before any objective/task/action.
 * Binds every downstream record to one Grand King instruction + run.
 */

import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { resolveShadowCeoDataRoot } from "./durable-paths.js";
import type { ShadowCeoActionKind } from "./action-permit.js";

export type RequestAnswerFormat = {
  expectedLineCount: number | null;
  fieldNames: string[];
  requiredToken: string | null;
  prohibitsExtraProse: boolean;
  template: "eligible_selected" | "exact_lines" | "unspecified";
};

export type RequestOwnerRecord = {
  requestId: string;
  runId: string;
  correlationId: string;
  completeInstruction: string;
  suppliedProducts: Array<{
    name: string;
    body: string;
    contributionUsd: number | null;
    stock: number | null;
    deliveryDays: number | null;
    approval: string | null;
  }>;
  eligibilityRules: Record<string, unknown>;
  requestedBusinessOperation: string;
  permittedActions: ShadowCeoActionKind[];
  prohibitedActions: ShadowCeoActionKind[];
  requestedAnswerFormat: RequestAnswerFormat;
  operatingMode: "SYNTHETIC";
  birthStatus: "NOT_BORN";
  realCommerceAuthority: "unauthorized";
  createdAt: string;
  workspaceId: string;
  /** Stable hash of normalized instruction — retry/idempotency. */
  instructionDigest: string;
};

function ownersPath(): string {
  return path.join(resolveShadowCeoDataRoot(), "shadow-ceo-request-owners.json");
}

function loadOwners(): Record<string, RequestOwnerRecord> {
  const p = ownersPath();
  if (!fs.existsSync(p)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, RequestOwnerRecord>;
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function saveOwners(map: Record<string, RequestOwnerRecord>): void {
  const p = ownersPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(map, null, 2), "utf8");
}

export function normalizeInstruction(message: string): string {
  return String(message || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

export function instructionDigest(workspaceId: string, message: string): string {
  return createHash("sha256")
    .update(`${workspaceId}\n${normalizeInstruction(message)}`)
    .digest("hex")
    .slice(0, 32);
}

export function newRequestId(): string {
  return `req_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function newRunId(digest: string): string {
  return `run_${digest.slice(0, 24)}`;
}

/** Find existing owner by instruction digest (retry-safe). */
export function findOwnerByDigest(digest: string): RequestOwnerRecord | null {
  const map = loadOwners();
  for (const rec of Object.values(map)) {
    if (rec.instructionDigest === digest) return rec;
  }
  return null;
}

export function getRequestOwner(requestId: string): RequestOwnerRecord | null {
  const map = loadOwners();
  return map[requestId] ?? null;
}

export function persistRequestOwner(record: RequestOwnerRecord): RequestOwnerRecord {
  const existing = findOwnerByDigest(record.instructionDigest);
  if (existing) {
    // Recover same request on retry — never mix with a different instruction.
    if (existing.completeInstruction !== record.completeInstruction) {
      throw new Error(
        `REQUEST_OWNER_COLLISION: digest ${record.instructionDigest} already bound to another instruction`,
      );
    }
    return existing;
  }
  const map = loadOwners();
  map[record.requestId] = record;
  saveOwners(map);
  return record;
}

export function ownershipBundle(owner: RequestOwnerRecord): Record<string, string> {
  return {
    requestId: owner.requestId,
    runId: owner.runId,
    correlationId: owner.correlationId,
  };
}

/** Fail visibly if a record's ownership does not match the episode owner. */
export function assertSameRequestOwnership(
  owner: RequestOwnerRecord,
  found: { requestId?: string; runId?: string; correlationId?: string },
  label: string,
): void {
  if (found.requestId && found.requestId !== owner.requestId) {
    throw new Error(
      `REQUEST_MIX_DETECTED: ${label} requestId=${found.requestId} ≠ owner ${owner.requestId}`,
    );
  }
  if (found.runId && found.runId !== owner.runId) {
    throw new Error(
      `REQUEST_MIX_DETECTED: ${label} runId=${found.runId} ≠ owner ${owner.runId}`,
    );
  }
  if (found.correlationId && found.correlationId !== owner.correlationId) {
    throw new Error(
      `REQUEST_MIX_DETECTED: ${label} correlationId=${found.correlationId} ≠ owner ${owner.correlationId}`,
    );
  }
}
