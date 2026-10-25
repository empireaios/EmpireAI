import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

/** Explicit transport contract: signal success is asynchronous for a brokered child. */
export interface RuntimeProcessHandle extends EventEmitter {
  pid?: number;
  connected: boolean;
  exitCode: number | null;
  signalCode: NodeJS.Signals | null;
  send(message: unknown, callback?: (error: Error | null) => void): boolean;
  kill(signal?: NodeJS.Signals): boolean | void;
  signal?: (signal: NodeJS.Signals) => Promise<boolean>;
}
export const signalRuntimeChild = (child: RuntimeProcessHandle, signal: NodeJS.Signals): Promise<boolean> =>
  child.signal ? child.signal(signal) : Promise.resolve(child.kill(signal) === true);

const protocol = 'work8-runtime-broker-v1';
class BrokeredBrain extends EventEmitter implements RuntimeProcessHandle {
  pid?: number;
  connected = true;
  exitCode: number | null = null;
  signalCode: NodeJS.Signals | null = null;
  private readonly handle = randomUUID();
  private readonly requests = new Map<string, {resolve: (value: boolean) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout>}>();
  private closed = false;
  constructor() {
    super();
    if (!process.connected || !process.send || process.env.WORK8_MEMBERSHIP_ROLE !== 'primary') throw new Error('CONTROLLER_BROKER_REQUIRED');
    process.on('message', this.receive);
    process.once('disconnect', this.lost);
    // Preserve synchronous return, but emit spawn only after controller admission.
    void this.request('spawn').catch(error => this.fail(error));
  }
  private readonly lost = () => this.fail(new Error('CONTROLLER_BROKER_DISCONNECTED'));
  private fail(error: Error) {
    if (this.closed) return;
    this.connected = false;
    this.emit('disconnect');
    this.emit('error', error);
    // Do not claim a child exit or reopen primary writers without a real exit receipt.
    process.kill(process.pid, 'SIGKILL');
  }
  private finish() {
    this.closed = true; this.connected = false;
    process.off('message', this.receive); process.off('disconnect', this.lost);
    for (const request of this.requests.values()) { clearTimeout(request.timer); request.reject(new Error('BROKER_MEMBER_EXITED')); }
    this.requests.clear();
  }
  private readonly receive = (raw: unknown) => {
    const value = raw as Record<string, unknown>;
    if (!value || value.protocol !== protocol || value.handle !== this.handle) return;
    if (value.action === 'ack' && typeof value.request === 'string') {
      const request = this.requests.get(value.request); if (!request) return;
      clearTimeout(request.timer); this.requests.delete(value.request);
      value.ok === true ? request.resolve(true) : request.reject(new Error(String(value.error || 'BROKER_OPERATION_REFUSED')));
    } else if (value.action === 'spawn' && Number.isSafeInteger(value.pid) && !this.pid) {
      this.pid = value.pid as number; this.emit('spawn');
    } else if (value.action === 'message') this.emit('message', value.message);
    else if (value.action === 'exit' && (value.code === null || Number.isInteger(value.code)) && (value.signal === null || typeof value.signal === 'string')) {
      this.exitCode = value.code as number | null; this.signalCode = value.signal as NodeJS.Signals | null;
      this.finish(); this.emit('exit', this.exitCode, this.signalCode);
    } else if (value.action === 'disconnect') { this.connected = false; this.emit('disconnect'); }
    else this.fail(new Error('BROKER_FRAME_REFUSED'));
  };
  private request(action: string, fields: Record<string, unknown> = {}): Promise<boolean> {
    if (this.closed || !process.connected || !process.send) return Promise.reject(new Error('BROKER_UNAVAILABLE'));
    const request = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.requests.delete(request); reject(new Error('BROKER_ACK_DEADLINE')); }, 2000);
      this.requests.set(request, {resolve, reject, timer});
      process.send!({protocol, handle: this.handle, request, action, ...fields}, error => {
        if (!error) return; clearTimeout(timer); this.requests.delete(request); reject(error);
      });
    });
  }
  send(message: unknown, callback?: (error: Error | null) => void): boolean {
    if (!this.connected) { callback?.(new Error('BROKER_DISCONNECTED')); return false; }
    void this.request('send', {message}).then(() => callback?.(null), error => callback?.(error)); return true;
  }
  signal(signal: NodeJS.Signals): Promise<boolean> { return this.request('signal', {signal}); }
  kill(signal: NodeJS.Signals = 'SIGTERM'): void { void this.signal(signal).catch(error => this.fail(error)); }
}
export function spawnAdmittedBrain(): RuntimeProcessHandle { return new BrokeredBrain(); }
