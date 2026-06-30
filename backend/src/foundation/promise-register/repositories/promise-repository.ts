import type { KingPromise, PromiseLifecycleRecord } from "../models/king-promise.js";

export interface PromiseRepository {
  savePromise(promise: KingPromise): KingPromise;
  getPromiseById(promiseId: string): KingPromise | null;
  /** Returns every promise — no promise shall disappear from the register. */
  listPromises(workspaceId: string, status?: string): KingPromise[];

  appendLifecycle(record: PromiseLifecycleRecord): PromiseLifecycleRecord;
  listLifecycle(promiseId: string, limit?: number): PromiseLifecycleRecord[];
  listWorkspaceLifecycle(workspaceId: string, limit?: number): PromiseLifecycleRecord[];
}
