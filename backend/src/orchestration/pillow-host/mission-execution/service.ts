import fs from "node:fs";
import path from "node:path";
import { AUTHORITY_ACTION, AUTHORITY_WORKER, EMPTY_INPUT_HASH,
  type ExecutionJob, type ExecutionReceipt, type ExecutionRequest, type ExecutionScope } from "./contract.js";
import { MissionExecutionStore } from "./store.js";
import { MissionExecutionRunner } from "./runner.js";

export type MissionExecutionHost = {
  getStatus(): { lifecycle: string };
  getMissionRuntimeHistory(): unknown;
};
type History = { missions?: Array<{missionId: string; currentStatus: string; workers: string[]; highRisk: boolean}>;
  timeline?: Array<{entryId: string; label: string; state: string}> };
export class MissionExecutionService {
  readonly runner: MissionExecutionRunner;
  constructor(readonly store: MissionExecutionStore, readonly buildSha: string,
    private readonly host: MissionExecutionHost, reconcile?: (receipt: ExecutionReceipt) => boolean | Promise<boolean>) {
    if (!/^[a-f0-9]{40}$/.test(buildSha)) throw new Error("Verified execution build SHA required");
    this.runner = new MissionExecutionRunner(store, buildSha, { canPoll: () => this.host.getStatus().lifecycle === "running", canExecute: job => this.matchesMission(job), reconcile });
  }
  private matchesMission(request: Pick<ExecutionRequest, "missionId" | "dispatchId" | "workerId">): boolean {
    if (this.host.getStatus().lifecycle !== "running") return false;
    const history = this.host.getMissionRuntimeHistory() as History | null;
    const mission = history?.missions?.find(m => m.missionId === request.missionId);
    return Boolean(mission && ["Running", "Waiting"].includes(mission.currentStatus) && mission.highRisk === false &&
      mission.workers?.length === 1 && mission.workers[0] === AUTHORITY_WORKER && request.workerId === AUTHORITY_WORKER &&
      history?.timeline?.some(t => t.entryId === request.dispatchId && t.label === `dispatch:${request.missionId}` && t.state === "Running"));
  }
  enqueue(missionId: string, dispatchId: string): { job: ExecutionJob; created: boolean } {
    const request: ExecutionRequest = { missionId, dispatchId, workerId: AUTHORITY_WORKER, action: AUTHORITY_ACTION,
      scope: this.store.scope, buildSha: this.buildSha, inputHash: EMPTY_INPUT_HASH };
    // Exact replay is an acknowledgement lookup, including after mission completion.
    // Only a genuinely new durable job must pass current mission admission.
    return this.store.enqueue(request, Date.now(), () => this.matchesMission(request));
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
