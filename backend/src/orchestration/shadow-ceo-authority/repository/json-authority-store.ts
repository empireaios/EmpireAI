/**
 * JSON persistence for blocked actions, approvals, loop control, and budget.
 * Lives under shadow-ceo-authority/repository as required by WS4.
 */

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { resolveShadowCeoAuthorityDir } from "../../shadow-ceo-integration/durable-paths.js";
import { defaultBudgetEnvelope } from "../budget.js";
import { createInitialLoopState } from "../gate.js";
import type {
  ApprovalRequest,
  BlockedActionRecord,
  BudgetEnvelope,
  OperatingLoopState,
} from "../types.js";

export type AuthorityStoreFile = {
  blocked: BlockedActionRecord[];
  approvals: ApprovalRequest[];
  loop: OperatingLoopState;
  budget: BudgetEnvelope;
};

export function resolveStorePath(baseDir?: string): string {
  const dir = baseDir ?? resolveShadowCeoAuthorityDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "authority-store.json");
}

export function emptyAuthorityStore(): AuthorityStoreFile {
  return {
    blocked: [],
    approvals: [],
    loop: createInitialLoopState(),
    budget: defaultBudgetEnvelope(),
  };
}

export function loadAuthorityStore(baseDir?: string): AuthorityStoreFile {
  const p = resolveStorePath(baseDir);
  if (!fs.existsSync(p)) return emptyAuthorityStore();
  try {
    const value: unknown = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not an authority object");
    const store = value as AuthorityStoreFile;
    if (!Array.isArray(store.blocked) || !Array.isArray(store.approvals) ||
        !store.loop || typeof store.loop.running !== "boolean" ||
        !store.budget || store.budget.source !== "deterministic_state" ||
        !store.blocked.every(row => row && row.decision === "BLOCKED") ||
        !store.approvals.every(row => row && row.source === "deterministic_store")) {
      throw new Error("invalid authority records");
    }
    return store;
  } catch (error) {
    throw new Error("SHADOW_CEO_AUTHORITY_UNREADABLE: refusing to replace existing authority state", { cause: error });
  }
}

export function saveAuthorityStore(
  store: AuthorityStoreFile,
  baseDir?: string,
): void {
  const p = resolveStorePath(baseDir);
  const temp = `${p}.tmp-${process.pid}-${randomUUID()}`;
  try {
    const fd = fs.openSync(temp, "wx", 0o600);
    try {
      fs.writeFileSync(fd, JSON.stringify(store, null, 2), "utf8");
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(temp, p);
    if (process.platform !== "win32") {
      const parent = fs.openSync(path.dirname(p), "r");
      try { fs.fsyncSync(parent); } finally { fs.closeSync(parent); }
    }
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

export function persistBlockedAction(
  blocked: BlockedActionRecord,
  baseDir?: string,
): BlockedActionRecord {
  const store = loadAuthorityStore(baseDir);
  store.blocked.push(blocked);
  saveAuthorityStore(store, baseDir);
  return blocked;
}

export function persistApprovalRequest(
  approval: ApprovalRequest,
  baseDir?: string,
): ApprovalRequest {
  const store = loadAuthorityStore(baseDir);
  store.approvals.push(approval);
  saveAuthorityStore(store, baseDir);
  return approval;
}

export function persistLoopState(
  loop: OperatingLoopState,
  baseDir?: string,
): OperatingLoopState {
  const store = loadAuthorityStore(baseDir);
  store.loop = loop;
  saveAuthorityStore(store, baseDir);
  return loop;
}

export function listBlockedActions(baseDir?: string): BlockedActionRecord[] {
  return loadAuthorityStore(baseDir).blocked;
}
