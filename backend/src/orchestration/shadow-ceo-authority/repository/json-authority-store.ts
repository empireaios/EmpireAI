/**
 * JSON persistence for blocked actions, approvals, loop control, and budget.
 * Lives under shadow-ceo-authority/repository as required by WS4.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function defaultDataDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "data");
}

export function resolveStorePath(baseDir?: string): string {
  const dir = baseDir ?? defaultDataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
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
  if (!existsSync(p)) return emptyAuthorityStore();
  return JSON.parse(readFileSync(p, "utf8")) as AuthorityStoreFile;
}

export function saveAuthorityStore(
  store: AuthorityStoreFile,
  baseDir?: string,
): void {
  writeFileSync(resolveStorePath(baseDir), JSON.stringify(store, null, 2), "utf8");
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
