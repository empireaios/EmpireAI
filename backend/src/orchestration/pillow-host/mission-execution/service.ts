import fs from "node:fs";
import path from "node:path";
import type { AuthorityMissionAdapter } from "@empireai/pillow";
import { AUTHORITY_ACTION, AUTHORITY_WORKER, EMPTY_INPUT_HASH, ExecutionConflict, jobIdFor, requestIdentity, validateRequest,
  type ExecutionJob, type ExecutionReceipt, type ExecutionRequest, type ExecutionScope } from "./contract.js";
import { MissionExecutionStore } from "./store.js";
import { MissionExecutionRunner } from "./runner.js";

export type MissionExecutionHost = {
  getStatus(): { lifecycle: string };
  getMissionRuntimeHistory(): unknown;
  configureMissionAuthorityExecution?(adapter: AuthorityMissionAdapter, lifecycle: { pauseAndWait(): Promise<void>; resume(): void }, diagnostics: () => unknown): void;
  reconcileMissionAuthorityExecution?(jobId: string): boolean;
};
type History = { missions?: Array<{missionId: string; currentStatus: string; workers: string[]; highRisk: boolean}>;
  timeline?: Array<{entryId: string; label: string; state: string}>;
  checkpoints?: Array<{missionId: string; label: string; state: string; payload: {binding?: ExecutionRequest}}> };
const INTENT_LABEL = "authority.snapshot.v1:dispatch-intent";
export class MissionExecutionService {
  readonly runner: MissionExecutionRunner;
  readonly adapter: AuthorityMissionAdapter;
  private recoveryOffset = 0;
  private recoveryError: string | null = null;
  constructor(readonly store: MissionExecutionStore, readonly buildSha: string,
    private readonly host: MissionExecutionHost, reconcile?: (receipt: ExecutionReceipt) => boolean | Promise<boolean>) {
    if (!/^[a-f0-9]{40}$/.test(buildSha)) throw new Error("Verified execution build SHA required");
    this.adapter = {
      binding: (missionId, dispatchId) => ({ missionId, dispatchId, workerId: AUTHORITY_WORKER, action: AUTHORITY_ACTION,
        scope: { ...store.scope }, buildSha, inputHash: EMPTY_INPUT_HASH }),
      enqueue: binding => {
        if (binding.buildSha !== this.buildSha) throw new ExecutionConflict("Execution build differs from admission build");
        const accepted = this.enqueueBound(binding);
        return { acceptedDurably: true, jobId: accepted.job.jobId };
      },
      getReceipt: jobId => this.getTrustedReceipt(jobId),
    };
    this.runner = new MissionExecutionRunner(store, buildSha, {
      canPoll: () => this.host.getStatus().lifecycle === "running",
      beforeClaim: () => this.recoverPendingIntents(),
      canExecute: job => this.matchesMission(job),
      reconcile: reconcile ?? (host.reconcileMissionAuthorityExecution ? receipt => host.reconcileMissionAuthorityExecution!(receipt.jobId) : undefined),
    });
    host.configureMissionAuthorityExecution?.(this.adapter, {
      pauseAndWait: () => this.runner.pauseAndWait(), resume: () => this.runner.resume(),
    }, () => this.diagnostics());
  }
  private binding(history: History | null, missionId: string): ExecutionRequest | null {
    const intents = history?.checkpoints?.filter(c => c.missionId === missionId && c.label === INTENT_LABEL) ?? [];
    if (intents.length !== 1 || intents[0]!.state !== "Running") return null;
    const binding = intents[0]!.payload?.binding;
    if (!binding || binding.missionId !== missionId ||
      Object.keys(binding).sort().join() !== "action,buildSha,dispatchId,inputHash,missionId,scope,workerId") return null;
    try { validateRequest(binding); } catch { return null; }
    return binding;
  }
  private matchesMission(request: ExecutionRequest): boolean {
    if (this.host.getStatus().lifecycle !== "running") return false;
    const history = this.host.getMissionRuntimeHistory() as History | null;
    const binding = this.binding(history, request.missionId);
    const mission = history?.missions?.find(m => m.missionId === request.missionId);
    return Boolean(binding && requestIdentity(binding) === requestIdentity(request) &&
      mission && ["Running", "Waiting"].includes(mission.currentStatus) && mission.highRisk === false &&
      mission.workers?.length === 1 && mission.workers[0] === AUTHORITY_WORKER &&
      history?.timeline?.some(t => t.entryId === request.dispatchId && t.label === `dispatch:${request.missionId}` && t.state === "Running"));
  }
  private enqueueBound(request: ExecutionRequest): { job: ExecutionJob; created: boolean } {
    // An exact replay retrieves the original acknowledgement even after completion.
    // Only new work must pass the current-state admission check.
    return this.store.enqueue(request, Date.now(), () => this.matchesMission(request));
  }
  enqueue(missionId: string, dispatchId: string): { job: ExecutionJob; created: boolean } {
    const history = this.host.getMissionRuntimeHistory() as History | null;
    const binding = this.binding(history, missionId);
    if (!binding || binding.dispatchId !== dispatchId) throw new ExecutionConflict("No exact persisted execution intent");
    // Original completed receipts may be acknowledged after a code upgrade; a
    // never-admitted old intent cannot silently acquire the new build identity.
    const existing = this.store.get(jobIdFor(binding));
    if (!existing && binding.buildSha !== this.buildSha) throw new ExecutionConflict("Prior-build intent requires review");
    return this.enqueueBound(binding);
  }
  private recoverPendingIntents(): void {
    this.recoveryError = null;
    const history = this.host.getMissionRuntimeHistory() as History | null;
    const missions = history?.missions?.filter(m => ["Running", "Waiting"].includes(m.currentStatus) &&
      m.workers?.length === 1 && m.workers[0] === AUTHORITY_WORKER) ?? [];
    if (!missions.length) return;
    const start = this.recoveryOffset % missions.length;
    for (let n = 0; n < Math.min(20, missions.length); n++) {
      const mission = missions[(start + n) % missions.length]!;
      const binding = this.binding(history, mission.missionId);
      if (!binding || !this.matchesMission(binding)) { this.recoveryError = "PERSISTED_AUTHORITY_INTENT_INVALID"; continue; }
      const existing = this.store.get(jobIdFor(binding));
      if (existing) {
        if (requestIdentity(existing) !== requestIdentity(binding)) this.recoveryError = "EXECUTION_INTENT_CONFLICT";
        else if (existing.status === "unknown") this.recoveryError = existing.lastError ?? "EXECUTION_OUTCOME_UNKNOWN";
        continue;
      }
      if (binding.buildSha !== this.buildSha) { this.recoveryError = "BUILD_CHANGED_REVIEW_REQUIRED"; continue; }
      this.enqueueBound(binding);
    }
    this.recoveryOffset = (start + 20) % missions.length;
  }
  diagnostics() {
    const runner = this.runner.status();
    return { enabled: true, state: runner.lastError || this.recoveryError ? "error" :
      this.host.getStatus().lifecycle !== "running" ? "host_unavailable" : runner.running && !runner.paused ? "running" : "paused",
      executionBuildSha: this.buildSha, recoveryError: this.recoveryError, ...runner };
  }
  get(jobId: string): ExecutionJob | null { return this.store.get(jobId); }
  getTrustedReceipt(jobId: string): ExecutionReceipt | null { return this.store.get(jobId)?.receipt ?? null; }
}
export function executionDatabasePath(databasePath: string): string {
  if (!databasePath || databasePath.startsWith(":memory:")) throw new Error("Persistent execution DATABASE_PATH required");
  let value = path.resolve(databasePath);
  if (fs.existsSync(value) && fs.statSync(value).isDirectory()) value = path.join(value, "empireai-brain.db");
  return `${value}.mission-execution.sqlite`;
}
export function createMissionExecutionService(options: { databasePath: string; scope: ExecutionScope; buildSha: string;
  host: MissionExecutionHost; reconcile?: (receipt: ExecutionReceipt) => boolean | Promise<boolean> }): MissionExecutionService {
  return new MissionExecutionService(new MissionExecutionStore(executionDatabasePath(options.databasePath), options.scope),
    options.buildSha, options.host, options.reconcile);
}
