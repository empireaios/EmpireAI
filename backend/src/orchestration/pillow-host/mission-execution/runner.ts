import { getPillowAuthority } from "../../pillow-commissioning/pillow-authority.js";
import type { AuthorityOutput, ExecutionJob, ExecutionReceipt } from "./contract.js";
import { MissionExecutionStore } from "./store.js";

export type ExecutionRunnerHooks = {
  canExecute(job: ExecutionJob): boolean;
  canPoll?(): boolean;
  beforeClaim?(): void;
  reconcile?(receipt: ExecutionReceipt): boolean | Promise<boolean>;
};
export function inspectActualAuthority(): AuthorityOutput {
  // Sole registered operation. No model, network, tool registry, spend or commerce call.
  return { kind: "actual_readonly_authority_inspection", observedAt: new Date().toISOString(), authority: getPillowAuthority() };
}
export class MissionExecutionRunner {
  private timer: ReturnType<typeof setInterval> | null = null;
  private active: Promise<void> | null = null;
  private paused = true;
  private lastError: string | null = null;
  private receiptOffset = 0;
  constructor(private readonly store: MissionExecutionStore, private readonly buildSha: string,
    private readonly hooks: ExecutionRunnerHooks, private readonly inspect: () => AuthorityOutput | Promise<AuthorityOutput> = inspectActualAuthority) {}
  start(): void {
    if (this.timer) return;
    this.paused = false;
    this.timer = setInterval(() => { void this.tick(); }, 1000);
    this.timer.unref();
    void this.tick();
  }
  pause(): void { this.paused = true; }
  async pauseAndWait(): Promise<void> { this.paused = true; await this.active; }
  resume(): void { this.paused = false; }
  async stop(): Promise<void> {
    this.paused = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    await this.active;
  }
  status() { return { running: this.timer !== null, paused: this.paused, active: this.active !== null,
    reconciliationAvailable: typeof this.hooks.reconcile === "function", lastError: this.lastError,
    operation: "authority.snapshot.v1", commerceExecution: false, certificationCredit: false }; }
  tick(): Promise<void> {
    if (this.paused) return Promise.resolve();
    if (this.active) return this.active;
    this.active = this.processOne().catch(() => { this.lastError = "EXECUTION_STORAGE_OR_RECONCILIATION_UNAVAILABLE"; })
      .finally(() => { this.active = null; });
    return this.active;
  }
  private async processOne(): Promise<void> {
    this.lastError = null;
    if (this.hooks.canPoll && !this.hooks.canPoll()) return;
    this.hooks.beforeClaim?.();
    // Completed output remains readable after a code upgrade: the receipt retains original build identity.
    if (this.hooks.reconcile) {
      const pending = this.store.pendingReceipts();
      const start = pending.length ? this.receiptOffset % pending.length : 0;
      for (let n = 0; n < Math.min(20, pending.length); n++) {
        const receipt = pending[(start + n) % pending.length]!;
        if (this.paused) return;
        if (await this.hooks.reconcile(receipt)) this.store.markReconciled(receipt);
      }
      this.receiptOffset = pending.length ? (start + 20) % pending.length : 0;
    }
    if (this.paused) return;
    const claim = this.store.claim(this.buildSha);
    if (!claim) return;
    if (this.paused || !this.hooks.canExecute(claim)) { this.store.markUnknown(claim); return; }
    let output: AuthorityOutput;
    try { output = await this.inspect(); }
    catch { this.store.markUnknown(claim); this.lastError = "AUTHORITY_INSPECTION_FAILED"; return; }
    // A storage failure after the read must not be presented as completion. The bounded,
    // side-effect-free read may be retried only after lease expiry, at most three claims.
    const receipt = this.store.complete(claim, output);
    if (this.hooks.reconcile && await this.hooks.reconcile(receipt)) this.store.markReconciled(receipt);
  }
}
